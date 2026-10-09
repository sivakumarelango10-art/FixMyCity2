'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Coordinates } from '@/lib/domain/geo';

const tealMarkerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 32 42">
  <path fill="#176B68" stroke="#0E3D3B" stroke-width="1.5" d="M16 0C7.16 0 0 7.16 0 16c0 11.2 14.4 24.6 15.02 25.17a1.43 1.43 0 0 0 1.96 0C17.6 40.6 32 27.2 32 16c0-8.84-7.16-16-16-16z"/>
  <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
</svg>
`;

const customPinIcon = L.divIcon({
  className: 'custom-teal-pin-static',
  html: tealMarkerSvg,
  iconSize: [28, 38],
  iconAnchor: [14, 38],
  popupAnchor: [0, -35],
});

export default function StaticLocationMap({
  coordinates,
  className = 'h-52 w-full',
}: {
  coordinates: Coordinates;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`${className} rounded-xl bg-[var(--surface-hover)] flex items-center justify-center border border-[var(--border)] text-xs text-[var(--text-muted)]`}>
        Loading map preview...
      </div>
    );
  }

  return (
    <div className={`relative ${className} rounded-xl overflow-hidden border border-[var(--border)] shadow-xs`}>
      <MapContainer
        center={[coordinates.latitude, coordinates.longitude]}
        zoom={14}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[coordinates.latitude, coordinates.longitude]}
          icon={customPinIcon}
        />
      </MapContainer>
    </div>
  );
}
