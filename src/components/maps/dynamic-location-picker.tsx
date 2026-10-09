'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Coordinates, DEFAULT_BENGALURU_COORDINATES } from '@/lib/domain/geo';

const LocationPickerMap = dynamic(
  () => import('./location-picker-map'),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 sm:h-80 w-full rounded-xl bg-[var(--surface-hover)] flex items-center justify-center border border-[var(--border)] text-xs text-[var(--text-muted)] animate-pulse">
        Initializing map coordinates...
      </div>
    ),
  }
);

interface DynamicLocationPickerProps {
  initialCoordinates?: Coordinates;
  onChange: (coords: Coordinates) => void;
}

export function DynamicLocationPicker({
  initialCoordinates = DEFAULT_BENGALURU_COORDINATES,
  onChange,
}: DynamicLocationPickerProps) {
  return (
    <LocationPickerMap
      initialCoordinates={initialCoordinates}
      onChange={onChange}
    />
  );
}
