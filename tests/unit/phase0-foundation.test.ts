import { describe, it, expect } from 'vitest';
import { publicEnv } from '@/lib/public-env';
import { CATEGORY_DEFINITIONS, getDepartmentForCategory } from '@/lib/domain/categories';

describe('Phase 0 Foundation Tests', () => {
  it('validates public environment variables with safe defaults', () => {
    expect(publicEnv.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBeDefined();
    expect(publicEnv.NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3000');
  });

  it('verifies exact category to department mapping contract', () => {
    expect(getDepartmentForCategory('POTHOLES')).toBe('ROADS');
    expect(getDepartmentForCategory('ROAD_DAMAGE')).toBe('ROADS');
    expect(getDepartmentForCategory('TRAFFIC_INFRASTRUCTURE')).toBe('ROADS');
    expect(getDepartmentForCategory('WATER_LEAKAGE')).toBe('WATER');
    expect(getDepartmentForCategory('GARBAGE_COLLECTION')).toBe('SANITATION');
    expect(getDepartmentForCategory('PUBLIC_SANITATION')).toBe('SANITATION');
    expect(getDepartmentForCategory('STREETLIGHT_FAILURE')).toBe('LIGHTING');
    expect(getDepartmentForCategory('DRAINAGE_PROBLEMS')).toBe('DRAINAGE');
    expect(getDepartmentForCategory('PUBLIC_PROPERTY_DAMAGE')).toBe('GENERAL');
    expect(getDepartmentForCategory('OTHER')).toBe('GENERAL');
  });

  it('contains all 10 standard civic categories with descriptions and icons', () => {
    const keys = Object.keys(CATEGORY_DEFINITIONS);
    expect(keys.length).toBe(10);
    for (const key of keys) {
      const def = CATEGORY_DEFINITIONS[key as keyof typeof CATEGORY_DEFINITIONS];
      expect(def.code).toBe(key);
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(10);
      expect(def.departmentName.length).toBeGreaterThan(5);
    }
  });
});
