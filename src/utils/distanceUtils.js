const EARTH_RADIUS_METERS = 6371000;

export const calculateHaversineDistance = (point1, point2) => {
    if (!point1 || !point2) return 0;

    const lat1 = toRadians(point1.latitude);
    const lat2 = toRadians(point2.latitude);
    const deltaLat = toRadians(point2.latitude - point1.latitude);
    const deltaLng = toRadians(point2.longitude - point1.longitude);

    const a = Math.sin(deltaLat / 2) ** 2 +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

    const c = 2 * Math.asin(Math.sqrt(a));

    return EARTH_RADIUS_METERS * c;
};

export const calculate3DDistance = (point1, point2) => {
    if (!point1 || !point2) return 0;

    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;

    return Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
};

export const calculateDistance = (point1, point2, options = {}) => {
    const { useHaversine = true } = options;

    if (useHaversine) {
        return calculateHaversineDistance(point1, point2);
    }
    return calculate3DDistance(point1, point2);
};

const toRadians = (degrees) => degrees * (Math.PI / 180);

export default {
    calculateHaversineDistance,
    calculate3DDistance,
    calculateDistance,
    EARTH_RADIUS_METERS,
};