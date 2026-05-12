import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import '../components/common/Toast.css';

const ToastContext = createContext(null);

let toastIdCounter = 0;

const TOAST_ICONS = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const TOAST_DEFAULTS = {
    duration: 4000,
    position: 'bottom-right',
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef({});

    const removeToast = useCallback((id) => {
        // Start exit animation
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        // Remove after animation completes
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            if (timersRef.current[id]) {
                clearTimeout(timersRef.current[id]);
                delete timersRef.current[id];
            }
        }, 300);
    }, []);

    const showToast = useCallback((message, type = 'info', options = {}) => {
        const id = ++toastIdCounter;
        const duration = options.duration ?? TOAST_DEFAULTS.duration;

        const toast = {
            id,
            message,
            type,
            exiting: false,
            title: options.title || null,
        };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            timersRef.current[id] = setTimeout(() => removeToast(id), duration);
        }

        return id;
    }, [removeToast]);

    const toast = useCallback({
        success: (message, options) => showToast(message, 'success', options),
        error: (message, options) => showToast(message, 'error', options),
        warning: (message, options) => showToast(message, 'warning', options),
        info: (message, options) => showToast(message, 'info', options),
    }, [showToast]);

    // Build the toast object with methods
    const toastApi = {
        show: showToast,
        success: (msg, opts) => showToast(msg, 'success', opts),
        error: (msg, opts) => showToast(msg, 'error', opts),
        warning: (msg, opts) => showToast(msg, 'warning', opts),
        info: (msg, opts) => showToast(msg, 'info', opts),
        dismiss: removeToast,
    };

    return (
        <ToastContext.Provider value={toastApi}>
            {children}
            {/* Toast Container */}
            <div className="qomrade-toast-container" aria-live="polite" aria-atomic="true">
                {toasts.map((t) => {
                    const IconComponent = TOAST_ICONS[t.type] || Info;
                    return (
                        <div
                            key={t.id}
                            className={`qomrade-toast qomrade-toast--${t.type} ${t.exiting ? 'qomrade-toast--exit' : ''}`}
                            role="alert"
                        >
                            <div className="qomrade-toast__icon">
                                <IconComponent />
                            </div>
                            <div className="qomrade-toast__body">
                                {t.title && <div className="qomrade-toast__title">{t.title}</div>}
                                <div className="qomrade-toast__message">{t.message}</div>
                            </div>
                            <button
                                className="qomrade-toast__close"
                                onClick={() => removeToast(t.id)}
                                aria-label="Dismiss notification"
                            >
                                <X />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastContext;
