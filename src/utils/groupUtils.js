/**
 * Group Tier Tagging Utility
 * Maps group member count to tier labels based on the Qomrade model.
 * Uses Lucide icon identifiers instead of emojis.
 */

const GROUP_TIERS = [
    { min: 0, max: 3, label: 'Micro', color: 'bg-sky-100 text-sky-700', gradient: 'from-sky-500 to-cyan-500', icon: 'Diamond' },
    { min: 4, max: 8, label: 'Squad', color: 'bg-emerald-100 text-emerald-700', gradient: 'from-emerald-500 to-teal-500', icon: 'Shield' },
    { min: 9, max: 20, label: 'Circle', color: 'bg-violet-100 text-violet-700', gradient: 'from-violet-500 to-purple-500', icon: 'Circle' },
    { min: 21, max: 50, label: 'Coalition', color: 'bg-amber-100 text-amber-700', gradient: 'from-amber-500 to-orange-500', icon: 'Landmark' },
    { min: 51, max: Infinity, label: 'Federation', color: 'bg-rose-100 text-rose-700', gradient: 'from-rose-500 to-red-500', icon: 'Globe' },
];

/**
 * Get the group tier based on member count.
 * @param {number} memberCount - Number of members in the group
 * @returns {{ label: string, color: string, gradient: string, icon: string }}
 */
export const getGroupTier = (memberCount = 0) => {
    const count = Math.max(0, Number(memberCount) || 0);
    return GROUP_TIERS.find(t => count >= t.min && count <= t.max) || GROUP_TIERS[0];
};

/**
 * Renders a tier badge string for display.
 * @param {number} memberCount
 * @returns {string} e.g., "Squad"
 */
export const getGroupTierLabel = (memberCount = 0) => {
    const tier = getGroupTier(memberCount);
    return tier.label;
};

export default GROUP_TIERS;
