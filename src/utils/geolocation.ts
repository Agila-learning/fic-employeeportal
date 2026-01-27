// Office locations for multi-branch attendance
export type WorkLocation = 'krishnagiri' | 'chennai' | 'bangalore' | 'wfh';

export interface GeoPoint {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address: string;
}

export interface OfficeLocation {
  id: WorkLocation;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address: string;
  requiresGPS: boolean;
  // Multiple GPS points for locations with multiple offices
  geoPoints?: GeoPoint[];
}

// Krishnagiri has two office locations - employee can be at either
const KRISHNAGIRI_GEO_POINTS: GeoPoint[] = [
  {
    latitude: 12.527334,
    longitude: 78.214152,
    radiusMeters: 1000,
    address: 'No 10-I KNT Manickam Road, New bus stand, Krishnagiri-635001',
  },
  {
    latitude: 12.5273,
    longitude: 78.2130,
    radiusMeters: 1000,
    address: 'RK Towers, Opposite HP Petrol Bunk, Wahab Nagar, Krishnagiri',
  },
];

// All office locations - GPS only required for Krishnagiri
export const OFFICE_LOCATIONS: Record<WorkLocation, OfficeLocation> = {
  krishnagiri: {
    id: 'krishnagiri',
    name: 'Krishnagiri Office',
    latitude: 12.527334,
    longitude: 78.214152,
    radiusMeters: 1000,
    address: 'Krishnagiri (2 locations)',
    requiresGPS: true,
    geoPoints: KRISHNAGIRI_GEO_POINTS,
  },
  chennai: {
    id: 'chennai',
    name: 'Chennai Office',
    latitude: 13.0827,
    longitude: 80.2707,
    radiusMeters: 1000,
    address: 'Chennai, Tamil Nadu',
    requiresGPS: false,
  },
  bangalore: {
    id: 'bangalore',
    name: 'Bangalore Office',
    latitude: 12.9716,
    longitude: 77.5946,
    radiusMeters: 1000,
    address: 'Bangalore, Karnataka',
    requiresGPS: false,
  },
  wfh: {
    id: 'wfh',
    name: 'Work From Home',
    latitude: 0,
    longitude: 0,
    radiusMeters: 0,
    address: 'Remote',
    requiresGPS: false,
  },
};

// Backward compatibility - default office location (Krishnagiri)
export const OFFICE_LOCATION = OFFICE_LOCATIONS.krishnagiri;

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
 * Check if the given coordinates are within a specific office premises
 * For locations with multiple geo-points (like Krishnagiri), checks if within ANY of the points
 */
export const isWithinLocation = (
  latitude: number, 
  longitude: number, 
  location: OfficeLocation
): boolean => {
  if (!location.requiresGPS) return true;
  
  console.log(`[GPS Debug] User location: ${latitude}, ${longitude}`);
  
  // If location has multiple geo-points, check against all of them
  if (location.geoPoints && location.geoPoints.length > 0) {
    for (const point of location.geoPoints) {
      const distance = calculateDistance(
        latitude,
        longitude,
        point.latitude,
        point.longitude
      );
      console.log(`[GPS Debug] Distance from ${point.address}: ${Math.round(distance)}m (allowed: ${point.radiusMeters}m)`);
      
      if (distance <= point.radiusMeters) {
        console.log(`[GPS Debug] ✓ Within range of: ${point.address}`);
        return true;
      }
    }
    console.log(`[GPS Debug] ✗ Not within range of any ${location.name} locations`);
    return false;
  }
  
  // Fallback for single-point locations
  const distance = calculateDistance(
    latitude,
    longitude,
    location.latitude,
    location.longitude
  );
  console.log(`[GPS Debug] Office location: ${location.latitude}, ${location.longitude}`);
  console.log(`[GPS Debug] Distance from ${location.name}: ${Math.round(distance)}m (allowed: ${location.radiusMeters}m)`);
  return distance <= location.radiusMeters;
};

/**
 * Check if the given coordinates are within office premises (backward compatibility)
 */
export const isWithinOfficePremises = (latitude: number, longitude: number): boolean => {
  return isWithinLocation(latitude, longitude, OFFICE_LOCATION);
};

/**
 * Get the distance from a specific office in meters
 */
export const getDistanceFromLocation = (
  latitude: number, 
  longitude: number, 
  location: OfficeLocation
): number => {
  return calculateDistance(
    latitude,
    longitude,
    location.latitude,
    location.longitude
  );
};

/**
 * Get the distance from Krishnagiri office in meters (backward compatibility)
 */
export const getDistanceFromOffice = (latitude: number, longitude: number): number => {
  return getDistanceFromLocation(latitude, longitude, OFFICE_LOCATION);
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

/**
 * Get location name for display
 */
export const getLocationDisplayName = (location: WorkLocation | null | undefined): string => {
  if (!location) return 'Unknown';
  return OFFICE_LOCATIONS[location]?.name || location;
};
