import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatDate = (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM dd, yyyy');
};

export const formatDateTime = (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM dd, yyyy HH:mm');
};

/**
 * Returns "May 30, 2026, 2:45 PM" — date and 12-hour time together.
 * Used on transaction history cards.
 */
export const formatDateTimeAmPm = (date) => {
    if (!date) return '';
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return format(dateObj, 'MMM dd, yyyy, h:mm a');
    } catch {
        return '';
    }
};

export const formatTimeAgo = (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
};

export const formatTime = (date) => {
    if (!date) return '';
    // Handle bare time strings like "09:00" or "09:00:00" from Django TimeField
    if (typeof date === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(date)) {
        const [h, m] = date.split(':');
        const d = new Date();
        d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
        return format(d, 'h:mm a');
    }
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (isNaN(dateObj.getTime())) return typeof date === 'string' ? date : '';
        return format(dateObj, 'h:mm a');
    } catch {
        return typeof date === 'string' ? date : '';
    }
};

/**
 * Format time for chat messages - shows HH:mm in browser's local timezone
 * For today shows just time, for other days shows date + time
 */
export const formatLocalTime = (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const isToday = dateObj.toDateString() === now.toDateString();

    if (isToday) {
        return format(dateObj, 'h:mm a'); // e.g., "10:35 AM"
    }
    return format(dateObj, 'MMM d, h:mm a'); // e.g., "Jan 29, 10:35 AM"
};
