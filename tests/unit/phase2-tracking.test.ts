import { describe, it, expect } from 'vitest';
import { formatTrackingNumber } from '@/lib/domain/tracking';

describe('Phase 2: Tracking Identifier Contract', () => {
  it('formats tracking number matching FMC-YYYY-NNNNNN exactly', () => {
    expect(formatTrackingNumber(1, 2026)).toBe('FMC-2026-000001');
    expect(formatTrackingNumber(42, 2026)).toBe('FMC-2026-000042');
    expect(formatTrackingNumber(100523, 2026)).toBe('FMC-2026-100523');
  });

  it('pads sequence to at least six digits', () => {
    const formatted = formatTrackingNumber(99, 2026);
    expect(formatted.length).toBe(15); // FMC-2026-000099
    expect(formatted).toMatch(/^FMC-\d{4}-\d{6}$/);
  });
});
