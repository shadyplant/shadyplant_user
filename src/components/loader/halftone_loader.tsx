import React, { useMemo } from "react";

/**
 * HalftoneLoader
 * A circular halftone-dot loading indicator: dots are largest at the
 * center and shrink toward the edge of a circular boundary, with a
 * soft ripple animation pulsing outward to signal "loading".
 *
 * Usage:
 *   <HalftoneLoader />
 *   <HalftoneLoader size={240} dotColor="#111827" />
 */

type HalftoneLoaderProps = {
  /** Overall width/height of the loader in px */
  size?: number;
  /** Number of columns/rows in the underlying grid (odd numbers center nicely) */
  gridSize?: number;
  /** Color of the dots */
  dotColor?: string;
  /** Optional label under the loader */
  label?: string;
  className?: string;
};

type Dot = {
  key: string;
  cx: number;
  cy: number;
  r: number;
  delay: number;
};

export default function HalftoneLoader({
  size = 200,
  gridSize = 17,
  dotColor = "#18181b",
  label,
  className = "",
}: HalftoneLoaderProps) {
  const dots = useMemo<Dot[]>(() => {
    const cells: Dot[] = [];
    const spacing = size / gridSize;
    const center = size / 2;
    const maxDist = size / 2;
    const maxRadius = spacing * 0.46;
    const minRadius = spacing * 0.06;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cx = spacing * col + spacing / 2;
        const cy = spacing * row + spacing / 2;
        const dist = Math.hypot(cx - center, cy - center);
        const normalized = dist / maxDist;

        // Outside the circular boundary entirely -> skip
        if (normalized > 1) continue;

        // Ease the falloff so the center stays big for longer,
        // then tapers toward the rim (matches the reference image).
        const falloff = Math.pow(1 - normalized, 1.6);
        const r = minRadius + (maxRadius - minRadius) * falloff;

        // Skip near-zero dots at the very rim for a cleaner edge
        if (r < minRadius * 0.9) continue;

        cells.push({
          key: `${row}-${col}`,
          cx,
          cy,
          r,
          delay: normalized * 0.9, // ripple travels outward from center
        });
      }
    }
    return cells;
  }, [size, gridSize]);

  return (
    <div className={`inline-flex flex-col items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="status"
        aria-label={label ?? "Loading"}
      >
        {dots.map((d) => (
          <circle
            key={d.key}
            cx={d.cx}
            cy={d.cy}
            r={d.r}
            fill={dotColor}
            style={{
              transformOrigin: `${d.cx}px ${d.cy}px`,
              animation: "halftone-pulse 1.8s ease-in-out infinite",
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}
      </svg>

      {label && (
        <span className="text-sm text-zinc-500 tracking-wide">{label}</span>
      )}

      <style>{`
        @keyframes halftone-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(0.35);
            opacity: 0.35;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          svg circle {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
