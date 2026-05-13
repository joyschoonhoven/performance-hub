"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealOnScrollProps {
  children: ReactNode;
  /** Delay before reveal starts (ms). */
  delay?: number;
  /** Vertical translate distance in px. */
  distance?: number;
  /** Z-depth offset before reveal. */
  depth?: number;
  /** Threshold for intersection observer. */
  threshold?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Fade-in + slide-up + 3D depth on scroll into view.
 * Uses IntersectionObserver. Plays only once.
 */
export function RevealOnScroll({
  children,
  delay = 0,
  distance = 28,
  depth = 40,
  threshold = 0.12,
  className,
  style,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.setTimeout(() => setVisible(true), delay);
          obs.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [delay, threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translate3d(0, 0, 0) scale(1)"
          : `translate3d(0, ${distance}px, -${depth}px) scale(0.97)`,
        transition: "opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        transformStyle: "preserve-3d",
        willChange: visible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
