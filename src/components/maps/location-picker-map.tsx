'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Coordinates, DEFAULT_BENGALURU_COORDINATES } from '@/lib/domain/geo';

// Civic Teal SVG marker
const tealMarkerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
  <path fill="#176B68" stroke="#0E3D3B" stroke-width="1.5" d="M16 0C7.16 0 0 7.16 0 16c0 11.2 14.4 24.6 15.02 25.17a1.43 1.43 0 0 0 1.96 0C17.6 40.6 32 27.2 32 16c0-8.84-7.16-16-16-16z"/>
  <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
</svg>
`;

const customPinIcon = L.divIcon({
  className: 'custom-teal-pin',
  html: tealMarkerSvg,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -38],
});

interface LocationPickerProps {
  initialCoordinates?: Coordinates;
  onChange: (coords: Coordinates) => void;
}

function MapClickHandler({ onSelect }: { onSelect: (coords: Coordinates) => void }) {
  useMapEvents({
    click(e) {
      onSelect({
        latitude: Math.round(e.latlng.lat * 100000) / 100000,
        longitude: Math.round(e.latlng.lng * 100000) / 100000,
      });
    },
  });
  return null;
}

export default function LocationPickerMap({
  initialCoordinates = DEFAULT_BENGALURU_COORDINATES,
  onChange,
}: LocationPickerProps) {
  const [position, setPosition] = useState<Coordinates>(initialCoordinates);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelect = (coords: Coordinates) => {
    setPosition(coords);
    onChange(coords);
  };

  if (!mounted) {
    return (
      <div className="h-64 sm:h-80 w-full rounded-xl bg-[var(--surface-hover)] flex items-center justify-center border border-[var(--border)] text-xs text-[var(--text-muted)]">
        Loading map interface...
      </div>
    );
  }

  return (
    <div className="relative h-64 sm:h-80 w-full rounded-xl overflow-hidden border border-[var(--border)] shadow-xs">
      <MapContainer
        center={[position.latitude, position.longitude]}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[position.latitude, position.longitude]}
          icon={customPinIcon}
          draggable={true}
          eventHandlers={{
            dragend(e) {
              const marker = e.target;
              const pos = marker.getLatLng();
              handleSelect({
                latitude: Math.round(pos.lat * 100000) / 100000,
                longitude: Math.round(pos.lng * 100000) / 100000,
              });
            },
          }}
        />
        <MapClickHandler onSelect={handleSelect} />
      </MapContainer>

      {/* Floating help hint */}
      <div className="absolute top-2 right-2 z-[400] rounded-md bg-[var(--surface)]/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-[var(--foreground)] border border-[var(--border)] shadow-xs">
        Click or drag pin to position
      </div>
    </div>
  );
}
