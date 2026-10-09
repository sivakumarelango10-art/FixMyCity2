import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistanceMeters,
  getBoundingBox,
  isValidCoordinate,
  roundCoordinatesForPrivacy,
  DUPLICATE_DETECTION_RADIUS_METERS,
} from '@/lib/domain/geo';

describe('Phase 2: Geographic Domain and 150m Duplicate Detection', () => {
  it('correctly calculates Haversine distance between two Bengaluru coordinates', () => {
    // MG Road (12.9756, 77.6066) to Brigade Road Junction (12.9745, 77.6074) ~ 150 meters
    const mgRoad = { latitude: 12.9756, longitude: 77.6066 };
    const brigadeRoad = { latitude: 12.9745, longitude: 77.6074 };

    const distance = calculateHaversineDistanceMeters(mgRoad, brigadeRoad);
    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(200);
  });

  it('calculates zero distance for identical coordinates', () => {
    const point = { latitude: 12.9716, longitude: 77.5946 };
    expect(calculateHaversineDistanceMeters(point, point)).toBe(0);
  });

  it('enforces DUPLICATE_DETECTION_RADIUS_METERS = 150m exactly', () => {
    expect(DUPLICATE_DETECTION_RADIUS_METERS).toBe(150);
  });

  it('computes valid bounding box for 150m radius', () => {
    const center = { latitude: 12.9716, longitude: 77.5946 };
    const box = getBoundingBox(center, 150);

    expect(box.minLat).toBeLessThan(center.latitude);
    expect(box.maxLat).toBeGreaterThan(center.latitude);
    expect(box.minLng).toBeLessThan(center.longitude);
    expect(box.maxLng).toBeGreaterThan(center.longitude);
  });

  it('validates coordinate boundaries accurately', () => {
    expect(isValidCoordinate({ latitude: 12.9716, longitude: 77.5946 })).toBe(true);
    expect(isValidCoordinate({ latitude: 91, longitude: 77.5946 })).toBe(false);
    expect(isValidCoordinate({ latitude: -95, longitude: 77.5946 })).toBe(false);
    expect(isValidCoordinate({ latitude: 12, longitude: 185 })).toBe(false);
    expect(isValidCoordinate({ latitude: NaN, longitude: 77 })).toBe(false);
  });

  it('rounds coordinates to 3 decimal places for public privacy', () => {
    const precise = { latitude: 12.9715894, longitude: 77.5946123 };
    const rounded = roundCoordinatesForPrivacy(precise);

    expect(rounded.latitude).toBe(12.972);
    expect(rounded.longitude).toBe(77.595);
  });
});
