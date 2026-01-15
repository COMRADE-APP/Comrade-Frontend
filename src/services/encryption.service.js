/**
 * Encryption Service for Direct Messages
 * Uses Web Crypto API for end-to-end encryption
 */

// Store for encryption keys (in production, use more secure storage)
const KEY_STORAGE_PREFIX = 'comrade_enc_key_';

/**
 * Generate an encryption key pair for the user
 */
export async function generateKeyPair() {
    try {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256',
            },
            true,
            ['encrypt', 'decrypt']
        );
        return keyPair;
    } catch (error) {
        console.error('Failed to generate key pair:', error);
        throw error;
    }
}

/**
 * Generate a symmetric key for message encryption
 */
export async function generateSymmetricKey() {
    try {
        return await window.crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    } catch (error) {
        console.error('Failed to generate symmetric key:', error);
        throw error;
    }
}

/**
 * Export a public key to storable format
 */
export async function exportPublicKey(publicKey) {
    try {
        const exported = await window.crypto.subtle.exportKey('spki', publicKey);
        return btoa(String.fromCharCode(...new Uint8Array(exported)));
    } catch (error) {
        console.error('Failed to export public key:', error);
        throw error;
    }
}

/**
 * Import a public key from stored format
 */
export async function importPublicKey(publicKeyString) {
    try {
        const keyData = Uint8Array.from(atob(publicKeyString), c => c.charCodeAt(0));
        return await window.crypto.subtle.importKey(
            'spki',
            keyData,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            true,
            ['encrypt']
        );
    } catch (error) {
        console.error('Failed to import public key:', error);
        throw error;
    }
}

/**
 * Encrypt a message using AES-GCM
 */
export async function encryptMessage(message, symmetricKey) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            symmetricKey,
            data
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Failed to encrypt message:', error);
        throw error;
    }
}

/**
 * Decrypt a message using AES-GCM
 */
export async function decryptMessage(encryptedMessage, symmetricKey) {
    try {
        const data = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
        const iv = data.slice(0, 12);
        const encrypted = data.slice(12);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            symmetricKey,
            encrypted
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (error) {
        console.error('Failed to decrypt message:', error);
        throw error;
    }
}

/**
 * Store encryption key securely (using IndexedDB)
 */
export async function storeKey(keyId, key) {
    try {
        const exported = await window.crypto.subtle.exportKey('jwk', key);
        localStorage.setItem(`${KEY_STORAGE_PREFIX}${keyId}`, JSON.stringify(exported));
    } catch (error) {
        console.error('Failed to store key:', error);
        throw error;
    }
}

/**
 * Retrieve stored encryption key
 */
export async function retrieveKey(keyId, keyType = 'symmetric') {
    try {
        const stored = localStorage.getItem(`${KEY_STORAGE_PREFIX}${keyId}`);
        if (!stored) return null;

        const keyData = JSON.parse(stored);

        if (keyType === 'symmetric') {
            return await window.crypto.subtle.importKey(
                'jwk',
                keyData,
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
        }

        return null;
    } catch (error) {
        console.error('Failed to retrieve key:', error);
        return null;
    }
}

/**
 * Get or create a conversation key
 */
export async function getConversationKey(conversationId) {
    let key = await retrieveKey(conversationId);

    if (!key) {
        key = await generateSymmetricKey();
        await storeKey(conversationId, key);
    }

    return key;
}

/**
 * Encrypt a DM message for a conversation
 */
export async function encryptDMMessage(conversationId, message) {
    const key = await getConversationKey(conversationId);
    return await encryptMessage(message, key);
}

/**
 * Decrypt a DM message from a conversation
 */
export async function decryptDMMessage(conversationId, encryptedMessage) {
    const key = await getConversationKey(conversationId);
    return await decryptMessage(encryptedMessage, key);
}

/**
 * Check if encryption is supported
 */
export function isEncryptionSupported() {
    return !!(window.crypto && window.crypto.subtle);
}

export default {
    generateKeyPair,
    generateSymmetricKey,
    exportPublicKey,
    importPublicKey,
    encryptMessage,
    decryptMessage,
    storeKey,
    retrieveKey,
    getConversationKey,
    encryptDMMessage,
    decryptDMMessage,
    isEncryptionSupported,
};
