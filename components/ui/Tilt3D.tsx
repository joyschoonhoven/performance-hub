"use client";

import { useRef, useState, useEffect, type ReactNode, type MouseEvent } from "react";

interface Tilt3DProps {
  children: ReactNode;
  /** Max tilt angle in degrees. */
  max?: number;
  /** Hover scale. */
  scale?: number;
  /** Perspective in pixels. */
  perspective?: number;
  /** Show specular glare following the cursor. */
  glare?: boolean;
  /** Intensity of the float-on-hover lift in pixels (translateZ). */
  lift?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wraps any element with mouse-following 3D tilt.
 * Disabled on touch devices and when prefers-reduced-motion is set.
 */
export function Tilt3D({
  children,
  max = 10,
  scale = 1.015,
  perspective = 1000,
  glare = true,
  lift = 8,
  className,
  style,
}: Tilt3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [hovering, setHovering] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Disable for touch / reduced-motion users
    const isTouch =
      typeof window !== "undefined" &&
      (window.matchMedia("(pointer: coarse)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setEnabled(!isTouch);
  }, []);

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * max * 2;
    const rotateX = -(y - 0.5) * max * 2;
    setTransform(
      `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(${lift}px) scale(${scale})`
    );
    setGlarePos({ x: x * 100, y: y * 100 });
  }

  function handleEnter() { setHovering(true); }
  function handleLeave() {
    setHovering(false);
    setTransform("");
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={className}
      style={{
        ...style,
        transform: transform || "perspective(1000px)",
        transformStyle: "preserve-3d",
        transition: hovering
          ? "transform 0.08s cubic-bezier(0.4, 0, 0.2, 1)"
          : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "transform",
        position: "relative",
      }}
    >
      {children}
      {glare && hovering && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 30%, transparent 60%)`,
            borderRadius: "inherit",
            pointerEvents: "none",
            mixBlendMode: "overlay",
            zIndex: 1,
          }}
        />
      )}
    </div>
  );
}
