import { describe, it, expect } from 'vitest';
import {
  CATEGORY_DEFINITIONS,
  CATEGORY_OPTIONS,
  getDepartmentForCategory,
} from '@/lib/domain/categories';

describe('Phase 2: Civic Categories and Department Routing', () => {
  it('maps all 10 required civic categories to the correct departments', () => {
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

  it('contains complete metadata for each category', () => {
    expect(CATEGORY_OPTIONS.length).toBe(10);
    for (const opt of CATEGORY_OPTIONS) {
      expect(opt.code).toBeDefined();
      expect(opt.label).toBeDefined();
      expect(opt.departmentCode).toBeDefined();
      expect(opt.departmentName).toBeDefined();
      expect(opt.description).toBeDefined();
    }
  });

  it('falls back to GENERAL for unknown categories safely', () => {
    // @ts-expect-error testing unknown enum fallback
    expect(getDepartmentForCategory('NON_EXISTENT')).toBe('GENERAL');
  });
});
