import React from "react";

export interface LogoProps extends React.SVGAttributes<SVGElement> {
  size?: number | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "mark" | "full" | "icon" | "icon-light";
  color?: string;
  className?: string;
  withGlow?: boolean;
}

const sizeMap = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
  "2xl": 96,
};

// Precise calibrated vector path for Duesora Mark (viewBox 0 0 1000 1000)
export const DUESORA_MARK_PATH =
  "M 460 93 Q 500 72 540 93 L 869 284 Q 900 302 900 339 L 900 661 Q 900 698 869 716 L 540 907 Q 500 928 460 907 L 131 716 Q 100 698 100 661 L 100 339 Q 100 302 131 284 Z M 377 303 Q 386 310 386 327 L 386 659 Q 386 679 372 697 L 355 737 Q 348 747 338 739 L 251 666 Q 243 658 243 642 L 243 370 Q 243 355 257 343 L 363 299 Q 370 295 377 303 Z M 465 280 Q 465 268 478 268 L 566 268 Q 585 268 602 282 C 716 365 766 439 766 517 C 766 595 716 668 602 751 Q 585 766 566 766 L 478 766 Q 465 766 465 753 L 465 650 Q 465 639 475 629 A 170 170 0 0 0 475 404 Q 465 394 465 383 Z";

export function Logo({
  size = "md",
  variant = "mark",
  color = "#0F766E",
  className = "",
  withGlow: _withGlow = false,
  ...props
}: LogoProps) {
  const pixelSize = typeof size === "number" ? size : sizeMap[size] || 32;

  if (variant === "full") {
    const height = pixelSize;
    return (
      <div className={`inline-flex items-center gap-2.5 font-sans select-none ${className}`}>
        <div className="relative flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1000 1000"
            width={height}
            height={height}
            fill="none"
            aria-hidden="true"
            focusable="false"
            {...props}
          >
            <path d={DUESORA_MARK_PATH} fill={color} fillRule="evenodd" />
          </svg>
        </div>
        <span
          className="font-bold tracking-tight text-foreground leading-none"
          style={{ fontSize: `${height * 0.72}px`, letterSpacing: "-0.03em" }}
        >
          Duesora
        </span>
      </div>
    );
  }

  if (variant === "icon" || variant === "icon-light") {
    const isDark = variant === "icon";
    const bgColor = isDark ? "#18181B" : "#FAF9F6";
    const markColor = isDark ? "#0F766E" : "#18181B";

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1000 1000"
          width={pixelSize}
          height={pixelSize}
          className={className}
          aria-label="Duesora App Icon"
          {...props}
        >
          <rect width="1000" height="1000" rx="160" fill={bgColor} />
          <g transform="translate(120, 120) scale(0.76)">
            <path d={DUESORA_MARK_PATH} fill={markColor} fillRule="evenodd" />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 1000"
        width={pixelSize}
        height={pixelSize}
        className={className}
        fill="none"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        <path d={DUESORA_MARK_PATH} fill={color} fillRule="evenodd" />
      </svg>
    </div>
  );
}

export default Logo;
