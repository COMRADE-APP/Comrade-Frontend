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

export const formatTimeAgo = (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
};

export const formatTime = (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'HH:mm');
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
