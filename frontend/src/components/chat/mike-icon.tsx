"use client";

import React, { useId } from "react";

type LogoPalette = {
  fill: string;
  shadowColor: string;
  shadowOpacity: number;
};

type LogoIconProps = {
  spin?: boolean;
  loading?: boolean;
  done?: boolean;
  error?: boolean;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
};

const DEFAULT_PALETTE: LogoPalette = {
  fill: "#1f1f1f",
  shadowColor: "#1f1f1f",
  shadowOpacity: 0.12,
};

const DONE_PALETTE: LogoPalette = {
  fill: "#16834a",
  shadowColor: "#166534",
  shadowOpacity: 0.14,
};

const ERROR_PALETTE: LogoPalette = {
  fill: "#dc2626",
  shadowColor: "#991b1b",
  shadowOpacity: 0.14,
};

const LOGO_PATHS = [
  "M76 0H0V76C41.9731 76 76 41.9731 76 0Z",
  "M152 0H76V76C117.973 76 152 41.9731 152 0Z",
  "M152 152V76H76C76 117.973 110.027 152 152 152Z",
  "M76 152V76H0C0 117.973 34.0269 152 76 152Z",
];

function LogoParts({
  fillId,
  shadowId,
}: {
  fillId: string;
  shadowId: string;
}) {
  return (
    <g filter={`url(#${shadowId})`}>
      {LOGO_PATHS.map((d, index) => (
        <path key={index} d={d} fill={`url(#${fillId})`} />
      ))}
    </g>
  );
}

function PulseLoader({
  size = 24,
  style,
  className,
}: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <span
      className={["relative inline-grid shrink-0 place-items-center", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: size,
        height: size,
        ...style,
      }}
    >
      <span
        className="absolute rounded-full bg-[#1f1f1f] animate-[bolexPulse_1.8s_ease-in-out_infinite]"
        style={{
          width: size * 0.68,
          height: size * 0.68,
          boxShadow: "0 14px 34px rgba(31, 31, 31, 0.18)",
        }}
      />

      <span
        className="absolute rounded-full border border-[#1f1f1f]/15 animate-[bolexPulseRing_1.8s_ease-in-out_infinite]"
        style={{
          width: size * 0.68,
          height: size * 0.68,
        }}
      />

      <style jsx>{`
        @keyframes bolexPulse {
          0%,
          100% {
            transform: scale(0.8);
            opacity: 0.9;
            box-shadow: 0 10px 24px rgba(31, 31, 31, 0.12);
          }

          50% {
            transform: scale(1);
            opacity: 1;
            box-shadow: 0 18px 42px rgba(31, 31, 31, 0.22);
          }
        }

        @keyframes bolexPulseRing {
          0% {
            transform: scale(0.8);
            opacity: 0.34;
          }

          55% {
            transform: scale(1.22);
            opacity: 0;
          }

          100% {
            transform: scale(1.22);
            opacity: 0;
          }
        }
      `}</style>
    </span>
  );
}

export function BolexLogoIcon({
  spin = false,
  loading = false,
  done = false,
  error = false,
  size = 24,
  style,
  className,
}: LogoIconProps) {
  const id = useId().replace(/:/g, "");

  if (loading || spin) {
    return <PulseLoader size={size} style={style} className={className} />;
  }

  const palette = error
    ? ERROR_PALETTE
    : done
      ? DONE_PALETTE
      : DEFAULT_PALETTE;

  const fillId = `${id}-bolex-fill`;
  const shadowId = `${id}-bolex-shadow`;

  return (
    <span
      className={["shrink-0 inline-block", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 152 152"
        width={size}
        height={size}
        fill="none"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient
            id={fillId}
            x1="18"
            y1="0"
            x2="134"
            y2="152"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={palette.fill} />
            <stop offset="1" stopColor={palette.fill} />
          </linearGradient>

          <filter
            id={shadowId}
            x="-12"
            y="-10"
            width="176"
            height="176"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="10"
              floodColor={palette.shadowColor}
              floodOpacity={palette.shadowOpacity}
            />
          </filter>
        </defs>

        <LogoParts fillId={fillId} shadowId={shadowId} />
      </svg>
    </span>
  );
}

type MikeIconProps = LogoIconProps & {
  mike?: boolean;
};

export function MikeIcon({ mike: _mike, ...props }: MikeIconProps) {
  return <BolexLogoIcon {...props} />;
}
