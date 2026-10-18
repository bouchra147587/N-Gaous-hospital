"use client";

import { useEffect, useRef, useState, ReactNode, ElementType } from "react";

type RevealVariant = "up" | "left" | "right" | "scale";

type Props = {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  as?: ElementType;
  className?: string;
  once?: boolean;
};

const VARIANT_CLASS: Record<RevealVariant, string> = {
  up: "reveal",
  left: "reveal-left",
  right: "reveal-right",
  scale: "reveal-scale",
};

/**
 * Wraps children with the site's existing scroll-reveal CSS system
 * (see globals.css ".reveal" / ".reveal.is-visible") and toggles the
 * "is-visible" class via IntersectionObserver as the element enters
 * the viewport.
 */
export default function Reveal({
  children,
  variant = "up",
  delay = 0,
  as: Tag = "div",
  className = "",
  once = true,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof window !== "undefined" && "matchMedia" in window) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setVisible(true);
        return;
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  const Component = Tag as ElementType;

  return (
    <Component
      ref={ref}
      className={`${VARIANT_CLASS[variant]} ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Component>
  );
}
