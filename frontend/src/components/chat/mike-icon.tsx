"use client";

import React, { useId } from "react";

const STOP_TRANSITION = "stop-color 220ms ease, stop-opacity 220ms ease";
const FLOOD_TRANSITION = "flood-color 220ms ease, flood-opacity 220ms ease";

type IconPalette = {
  shadowColor: string;
  shadowOpacity: number;
  fillStops: [string, string, string, string];
  fillOpacities: [number, number, number, number];
  specularStops: [number, number, number, number];
  borderStops: [string, string, string];
  borderOpacities: [number, number, number];
  innerStops: [string, string, string, string];
  innerOpacities: [number, number, number, number];
};

const DEFAULT_PALETTE: IconPalette = {
  shadowColor: "#0f172a",
  shadowOpacity: 0.24,
  fillStops: ["#223477", "#314aa0", "#16265f", "#2c3f87"],
  fillOpacities: [0.98, 0.9, 0.95, 0.98],
  specularStops: [0.38, 0.16, 0.03, 0],
  borderStops: ["#ffffff", "#6475b7", "#ffffff"],
  borderOpacities: [0.28, 0.12, 0.18],
  innerStops: ["#ffffff", "#9aa8df", "#17265c", "#ffffff"],
  innerOpacities: [0, 0.12, 0.08, 0],
};

const DONE_PALETTE: IconPalette = {
  shadowColor: "#166534",
  shadowOpacity: 0.18,
  fillStops: ["#4ade80", "#86efac", "#22c55e", "#bbf7d0"],
  fillOpacities: [0.95, 0.88, 0.9, 0.94],
  specularStops: [0.68, 0.32, 0.03, 0],
  borderStops: ["#f0fdf4", "#86efac", "#dcfce7"],
  borderOpacities: [0.42, 0.24, 0.3],
  innerStops: ["#ffffff", "#dcfce7", "#4ade80", "#ffffff"],
  innerOpacities: [0, 0.16, 0.08, 0],
};

const ERROR_PALETTE: IconPalette = {
  shadowColor: "#991b1b",
  shadowOpacity: 0.18,
  fillStops: ["#f87171", "#fca5a5", "#ef4444", "#fecaca"],
  fillOpacities: [0.95, 0.88, 0.9, 0.94],
  specularStops: [0.68, 0.32, 0.03, 0],
  borderStops: ["#fef2f2", "#fca5a5", "#fee2e2"],
  borderOpacities: [0.42, 0.24, 0.3],
  innerStops: ["#ffffff", "#fee2e2", "#f87171", "#ffffff"],
  innerOpacities: [0, 0.16, 0.08, 0],
};

const LOGO_PATHS = [
  "M76 0H0V76C41.9731 76 76 41.9731 76 0Z",
  "M152 0H76V76C117.973 76 152 41.9731 152 0Z",
  "M152 152V76H76C76 117.973 110.027 152 152 152Z",
  "M76 152V76H0C0 117.973 34.0269 152 76 152Z",
];

function LogoParts({ ids }: { ids: Record<string, string> }) {
  return (
    <g filter={`url(#${ids.shadow})`}>
      {LOGO_PATHS.map((d, index) => (
        <g key={index}>
          <path d={d} fill={`url(#${ids.glassFill})`} />
          <path d={d} fill={`url(#${ids.innerLight})`} />
          <path
            d={d}
            fill={`url(#${ids.specular})`}
            clipPath={`url(#${ids.topClip})`}
          />
          <path
            d={d}
            fill="none"
            stroke={`url(#${ids.glassBorder})`}
            strokeWidth="1"
          />
        </g>
      ))}
    </g>
  );
}

export function BolexLogoIcon({
  spin = false,
  done = false,
  error = false,
  size = 24,
  style,
  mike: _mike,
}: {
  spin?: boolean;
  done?: boolean;
  error?: boolean;
  size?: number;
  style?: React.CSSProperties;
  mike?: boolean;
}) {
  const id = useId().replace(/:/g, "");

  const palette = error
    ? ERROR_PALETTE
    : done
      ? DONE_PALETTE
      : DEFAULT_PALETTE;

  const ids = {
    shadow: `${id}-b-shadow`,
    glassFill: `${id}-b-glassFill`,
    specular: `${id}-b-specular`,
    glassBorder: `${id}-b-glassBorder`,
    innerLight: `${id}-b-innerLight`,
    topClip: `${id}-b-topClip`,
  };

  return (
    <span
      className="shrink-0 inline-block animate-[spin_3s_linear_infinite]"
      style={{
        animationPlayState: spin ? "running" : "paused",
        ...style,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 152 152"
        width={size}
        height={size}
        fill="none"
        style={{ display: "block" }}
      >
        <defs>
          <filter
            id={ids.shadow}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feDropShadow
              dx="0"
              dy="1.5"
              stdDeviation="3"
              floodColor={palette.shadowColor}
              floodOpacity={palette.shadowOpacity}
              style={{ transition: FLOOD_TRANSITION }}
            />
          </filter>

          <linearGradient
            id={ids.glassFill}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              style={{
                stopColor: palette.fillStops[0],
                stopOpacity: palette.fillOpacities[0],
                transition: STOP_TRANSITION,
              }}
            />
            <stop
              offset="30%"
              style={{
                stopColor: palette.fillStops[1],
                stopOpacity: palette.fillOpacities[1],
                transition: STOP_TRANSITION,
              }}
            />
            <stop
              offset="70%"
              style={{
                stopColor: palette.fillStops[2],
                stopOpacity: palette.fillOpacities[2],
                transition: STOP_TRANSITION,
              }}
            />
            <stop
              offset="100%"
              style={{
                stopColor: palette.fillStops[3],
                stopOpacity: palette.fillOpacities[3],
                transition: STOP_TRANSITION,
              }}
            />
          </linearGradient>

          <linearGradient
            id={ids.specular}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              style={{
                stopColor: "#ffffff",
                stopOpacity: palette.specularStops[0],
                transition: STOP_TRANSITION,
              }}
            />
            <stop
              offset="18%"
              style={{
                stopColor: "#ffffff",
                stopOpacity: palette.specularStops[1],
                transition: STOP_TRANSITION,
              }}
            />
            <stop
              offset="42%"
              style={{
                stopColor: "#ffffff",
                stopOpacity: palette.specularStops[2],
                transition: STOP_TRANSITION,
              }}
            />
            <stop
              offset="100%"
              style={{
                stopColor: "#ffffff",
                stopOpacity: palette.specularStops[3],
                transition: STOP_TRANSITION,
              }}
            />
          </linearGradient>

          <linearGradient
            id={ids.glassBorder}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              style={{
                stopColor: palette.borderStops[0],
                stopOpacity: palette.borderOpacities[0],
                transition: STOP_TRANSITION,
              }}
            />
            <stop
              offset="50%"
              style={{
                stopColor: palette.borderStops[1],
                stopOpacity: palette.borderOpacities[1],
                transition: STOP_TRANSITION,
              }}
            />
            <stop
              offset="100%"
              style={{
                stopColor: palette.borderStops[2],
                stopOpacity: palette.borderOpacities[2],
                transition: STOP_TRANSITION,
              }}
            />
          </linearGradient>

          <linearGradient
            id={ids.innerLight}
            x1="100%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              style={{
                stopColor: palette.innerStops[0],
                stopOpacity: palette.innerOpacities[0],
                transition: STOP_TRANSITION,
              }}
            />
            <stop
              offset="40%"
              style={{
                stopColor: palette.innerStops[1],
                stopOpacity: palette.innerOpacities[1],
                transition: STOP_TRANSITION,
              }}
            />
            <stop
              offset="60%"
              style={{
                stopColor: palette.innerStops[2],
                stopOpacity: palette.innerOpacities[2],
                transition: STOP_TRANSITION,
              }}
            />
            <stop
              offset="100%"
              style={{
                stopColor: palette.innerStops[3],
                stopOpacity: palette.innerOpacities[3],
                transition: STOP_TRANSITION,
              }}
            />
          </linearGradient>

          <clipPath id={ids.topClip}>
            <rect x="0" y="0" width="152" height="58" />
          </clipPath>
        </defs>

        <LogoParts ids={ids} />
      </svg>
    </span>
  );
}

export const MikeIcon = BolexLogoIcon;
