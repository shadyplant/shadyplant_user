"use client";

import React, { ButtonHTMLAttributes, ReactNode } from "react";

interface MovingBorderButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  duration?: string;
  className?: string;
}

export default function MovingBorderButton({
  children,
  borderColor = "#7DD3FC",
  borderRadius = "12px",
  borderWidth = "2px",
  duration = "4s",
  className = "",
  style,
  ...props
}: MovingBorderButtonProps) {
  return (
    <div
      className="moving-border-wrap"
      style={{
        borderRadius,
        "--mb-color": borderColor,
        "--mb-width": borderWidth,
        "--mb-duration": duration,
      } as React.CSSProperties}
    >
      <div className="moving-border-glow" />

      <button
        className={`moving-border-btn ${className}`}
        style={{ borderRadius, ...style }}
        {...props}
      >
        {children}
      </button>

      <style>{`
        .moving-border-wrap {
          position: relative;
          display: inline-block;
          isolation: isolate;
          background: #ffffff;
          padding: var(--mb-width);
          border-radius: inherit;
        }

        .moving-border-glow {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          overflow: hidden;
          z-index: 0;
        }

        .moving-border-glow::before {
          content: "";
          position: absolute;
          width: 140%;
          height: 140%;
          top: -20%;
          left: -20%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            transparent 270deg,
            var(--mb-color) 320deg,
            #ffffff 340deg,
            var(--mb-color) 360deg
          );
          animation: mb-spin var(--mb-duration) linear infinite;
        }

        @keyframes mb-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .moving-border-btn {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          color: #333333;
          border: none;
          padding: 12px 28px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          width: 100%;
          height: 100%;
          border-radius: calc(${borderRadius} - var(--mb-width));
          transition: background 0.2s ease;
        }

        .moving-border-btn:hover {
          background: #fafafa;
        }
      `}</style>
    </div>
  );
}