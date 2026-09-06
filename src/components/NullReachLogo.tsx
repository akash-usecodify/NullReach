import React from 'react';

interface NullReachLogoProps {
  className?: string;
  size?: number;
}

export const NullReachLogo: React.FC<NullReachLogoProps> = ({ 
  className = 'w-10 h-10', 
  size 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512" 
      fill="none"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="NullReach Logo"
    >
      <defs>
        <clipPath id="nr-logo-clip">
          <path d="
            M 140 100
            C 95 100 76 135 76 185
            L 76 365
            C 76 415 95 440 145 440
            L 365 440
            C 415 440 436 415 436 365
            L 436 240
            C 436 195 400 185 365 195
            C 330 205 295 240 256 265
            C 218 220 185 125 155 105
            C 150 102 145 100 140 100
            Z"
          />
        </clipPath>
      </defs>

      {/* Top Right Yellow Sun / Dot */}
      <circle cx="312" cy="128" r="48" fill="#FBBF46" />

      {/* Tri-Color Geometric Mountain / Landscape */}
      <g clipPath="url(#nr-logo-clip)">
        {/* Left Lavender / Periwinkle Wing */}
        <polygon points="50,60 280,60 258,268 50,375" fill="#807FC7" />

        {/* Bottom Plum / Violet Segment */}
        <polygon points="50,375 258,268 375,455 50,455" fill="#8E4E86" />

        {/* Right Coral / Crimson Wing */}
        <polygon points="258,268 455,160 455,455 375,455" fill="#EE3258" />
      </g>
    </svg>
  );
};
