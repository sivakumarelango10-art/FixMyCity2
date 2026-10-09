import { describe, it, expect } from 'vitest';
import { classifyWithRules } from '@/lib/domain/classifier-rules';

describe('Phase 2: Civic Classifier & AI Rule Fallback', () => {
  it('correctly classifies pothole grievance with rule-based fallback', () => {
    const result = classifyWithRules({
      title: 'Dangerous deep pothole on outer ring road',
      description: 'Massive crater hazard causing vehicle damage and traffic jam near junction.',
    });

    expect(result.category).toBe('POTHOLES');
    expect(result.departmentCode).toBe('ROADS');
    expect(result.priority).toBe('CRITICAL');
    expect(result.source).toBe('RULES');
    expect(result.signals).toContain('pothole');
    expect(result.explanation).toContain('Suggested by rule-based classifier');
  });

  it('correctly classifies water pipeline burst with high priority', () => {
    const result = classifyWithRules({
      title: 'Pipeline burst leaking drinking water',
      description: 'Major drinking water wasted from broken underground supply main.',
    });

    expect(result.category).toBe('WATER_LEAKAGE');
    expect(result.departmentCode).toBe('WATER');
    expect(result.source).toBe('RULES');
  });

  it('correctly classifies overflowing garbage bin with sanitation department', () => {
    const result = classifyWithRules({
      title: 'Overflowing garbage bin and trash on sidewalk',
      description: 'Waste dump not collected for several days, foul smell and litter everywhere.',
    });

    expect(result.category).toBe('GARBAGE_COLLECTION');
    expect(result.departmentCode).toBe('SANITATION');
  });

  it('correctly classifies streetlight failure with lighting division', () => {
    const result = classifyWithRules({
      title: 'Streetlight not working on 5th cross',
      description: 'Pitch dark street with broken lamp post and flickering light.',
    });

    expect(result.category).toBe('STREETLIGHT_FAILURE');
    expect(result.departmentCode).toBe('LIGHTING');
  });

  it('safely falls back to OTHER and GENERAL for ambiguous text', () => {
    const result = classifyWithRules({
      title: 'Civic inquiry',
      description: 'General inquiry regarding ward council office opening hours.',
    });

    expect(result.category).toBe('OTHER');
    expect(result.departmentCode).toBe('GENERAL');
    expect(result.priority).toBe('MEDIUM');
    expect(result.source).toBe('RULES');
  });
});
