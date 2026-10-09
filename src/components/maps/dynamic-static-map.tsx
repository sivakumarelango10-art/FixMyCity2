'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Coordinates } from '@/lib/domain/geo';

const StaticLocationMap = dynamic(
  () => import('./static-location-map'),
  {
    ssr: false,
    loading: () => (
      <div className="h-52 w-full rounded-xl bg-[var(--surface-hover)] flex items-center justify-center border border-[var(--border)] text-xs text-[var(--text-muted)] animate-pulse">
        Loading map preview...
      </div>
    ),
  }
);

export function DynamicStaticMap({
  coordinates,
  className,
}: {
  coordinates: Coordinates;
  className?: string;
}) {
  return <StaticLocationMap coordinates={coordinates} className={className} />;
}
