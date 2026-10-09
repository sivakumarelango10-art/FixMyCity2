/**
 * Geographic domain utilities for FixMyCity
 * Includes Haversine distance calculations, bounding box generation for efficient SQL pre-filtering,
 * 150m duplicate detection, coordinate bounds validation, and privacy-safe coordinate rounding.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates the great-circle distance between two points on the Earth
 * using the Haversine formula (returns distance in meters).
 */
export function calculateHaversineDistanceMeters(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const lat1Rad = toRadians(coord1.latitude);
  const lat2Rad = toRadians(coord2.latitude);
  const deltaLat = toRadians(coord2.latitude - coord1.latitude);
  const deltaLng = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Creates a geographic bounding box around a center point for a given radius in meters.
 * Used for fast indexed DB queries before computing precise Haversine distance.
 */
export function getBoundingBox(
  center: Coordinates,
  radiusMeters: number
): BoundingBox {
  const latDelta = (radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const lngDelta =
    ((radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI)) /
    Math.cos((center.latitude * Math.PI) / 180);

  return {
    minLat: center.latitude - latDelta,
    maxLat: center.latitude + latDelta,
    minLng: center.longitude - lngDelta,
    maxLng: center.longitude + lngDelta,
  };
}

/**
 * Validates coordinate ranges (Latitude: [-90, 90], Longitude: [-180, 180]).
 */
export function isValidCoordinate(coord: Coordinates): boolean {
  if (
    typeof coord.latitude !== 'number' ||
    typeof coord.longitude !== 'number' ||
    Number.isNaN(coord.latitude) ||
    Number.isNaN(coord.longitude)
  ) {
    return false;
  }
  return (
    coord.latitude >= -90 &&
    coord.latitude <= 90 &&
    coord.longitude >= -180 &&
    coord.longitude <= 180
  );
}

/**
 * Duplicate alert threshold specified in Section 7: 150 meters.
 */
export const DUPLICATE_DETECTION_RADIUS_METERS = 150;

/**
 * Rounds coordinates to 3 decimal places (~110 meters) for public privacy-safe maps.
 * Never exposes exact raw coordinates for private issues.
 */
export function roundCoordinatesForPrivacy(coord: Coordinates): Coordinates {
  return {
    latitude: Math.round(coord.latitude * 1000) / 1000,
    longitude: Math.round(coord.longitude * 1000) / 1000,
  };
}

/**
 * Default map center for Bengaluru demo city
 */
export const DEFAULT_BENGALURU_COORDINATES: Coordinates = {
  latitude: 12.9716,
  longitude: 77.5946,
};
