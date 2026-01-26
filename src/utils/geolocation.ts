// Office location coordinates for Forge India Connect, Krishnagiri
// No 10-I KNT Manickam Road, New bus stand, Krishnagiri-635001
// Google Maps: https://maps.app.goo.gl/b8pwZxvPLGAezuEu7
export const OFFICE_LOCATION = {
  latitude: 12.527334,
  longitude: 78.214152,
  // Radius in meters - 1km radius around office for reliable GPS matching
  radiusMeters: 1000,
  address: 'No 10-I KNT Manickam Road, New bus stand, Krishnagiri-635001'
};

export interface LocationResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  error?: string;
  isWithinOffice?: boolean;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Check if the given coordinates are within office premises
 * Returns both the boolean result and the calculated distance
 */
export const isWithinOfficePremises = (latitude: number, longitude: number): boolean => {
  const distance = calculateDistance(
    latitude,
    longitude,
    OFFICE_LOCATION.latitude,
    OFFICE_LOCATION.longitude
  );
  console.log(`[GPS Debug] User location: ${latitude}, ${longitude}`);
  console.log(`[GPS Debug] Office location: ${OFFICE_LOCATION.latitude}, ${OFFICE_LOCATION.longitude}`);
  console.log(`[GPS Debug] Distance from office: ${Math.round(distance)}m (allowed: ${OFFICE_LOCATION.radiusMeters}m)`);
  return distance <= OFFICE_LOCATION.radiusMeters;
};

/**
 * Get the distance from office in meters
 */
export const getDistanceFromOffice = (latitude: number, longitude: number): number => {
  return calculateDistance(
    latitude,
    longitude,
    OFFICE_LOCATION.latitude,
    OFFICE_LOCATION.longitude
  );
};

/**
 * Get current user location
 */
export const getCurrentLocation = (): Promise<LocationResult> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: 'Geolocation is not supported by your browser'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const isWithinOffice = isWithinOfficePremises(latitude, longitude);
        
        resolve({
          success: true,
          latitude,
          longitude,
          isWithinOffice
        });
      },
      (error) => {
        let errorMessage: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access to mark attendance.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting location.';
        }
        resolve({
          success: false,
          error: errorMessage
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};
