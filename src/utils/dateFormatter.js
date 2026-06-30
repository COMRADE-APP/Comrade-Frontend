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

export const getTemporalStatus = (event) => {
    if (!event || !event.event_date) return 'upcoming';
    try {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let eventDate = new Date(event.event_date);
        if (isNaN(eventDate.getTime())) return 'upcoming';
        eventDate.setHours(0, 0, 0, 0);

        let startDT = new Date(event.event_date);
        let endDT = new Date(event.event_date);
        if (event.start_time && /^\d{2}:\d{2}/.test(event.start_time)) {
            const [h, m] = event.start_time.split(':');
            startDT.setHours(parseInt(h, 10), parseInt(m, 10), 0);
        } else { startDT.setHours(0, 0, 0); }
        if (event.end_time && /^\d{2}:\d{2}/.test(event.end_time)) {
            const [h, m] = event.end_time.split(':');
            endDT.setHours(parseInt(h, 10), parseInt(m, 10), 0);
        } else { endDT.setHours(23, 59, 59); }

        const now = new Date();
        if (endDT < now) return 'past';
        if (startDT <= now && endDT >= now) return 'happening_now';
        return 'upcoming';
    } catch {
        return 'upcoming';
    }
};
