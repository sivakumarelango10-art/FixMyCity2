import React from 'react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function Logo({ className = '', size = 'md', showTagline = false }: LogoProps) {
  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 42,
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 font-bold transition-opacity hover:opacity-90 ${className}`}
      aria-label="FixMyCity Home"
    >
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#176B68] to-[#125452] text-white shadow-sm"
        style={{
          width: iconSizes[size],
          height: iconSizes[size],
        }}
      >
        {/* Civic location & skyline emblem */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4"
        >
          {/* Map pin beacon */}
          <path
            d="M16 3C10.477 3 6 7.477 6 13C6 19.5 16 29 16 29C16 29 26 19.5 26 13C26 7.477 21.523 3 16 3Z"
            fill="currentColor"
            fillOpacity="0.25"
          />
          {/* City skyline silhouettes */}
          <rect x="10" y="12" width="3" height="8" rx="0.5" fill="white" />
          <rect x="14.5" y="9" width="3" height="11" rx="0.5" fill="white" />
          <rect x="19" y="13" width="3" height="7" rx="0.5" fill="white" />
          {/* Active civic checkmark / spark */}
          <circle cx="16" cy="6.5" r="1.5" fill="#38EF7D" />
        </svg>
      </div>

      <div className="flex flex-col">
        <span className={`tracking-tight font-extrabold ${textSizes[size]}`}>
          <span className="text-[#176B68] dark:text-[#288E8A]">FixMy</span>
          <span className="text-[#172322] dark:text-[#F1F5F4]">City</span>
        </span>
        {showTagline && (
          <span className="text-[10px] uppercase font-semibold tracking-wider text-[#4F5D5B] dark:text-[#A4B4B1]">
            One City. One Platform.
          </span>
        )}
      </div>
    </Link>
  );
}
