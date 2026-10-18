"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CarouselImage = {
  src: string;
  alt: string;
};

type Props = {
  images: CarouselImage[];
  isRTL?: boolean;
  intervalMs?: number;
};

export default function HeroCarousel({ images, isRTL = false, intervalMs = 6000 }: Props) {
  const [index, setIndex] = useState(0);

  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % images.length) + images.length) % images.length);
    },
    [images.length]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Auto-advance, paused implicitly if the user is actively switching (interval
  // just resets on every manual click since it depends on `index`).
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [images.length, intervalMs]);

  if (images.length === 0) return null;

  return (
    <div className="hero-carousel" aria-roledescription="carousel">
      {images.map((img, i) => (
        <div
          key={img.src}
          className={`hero-carousel-slide ${i === index ? "is-active" : ""}`}
          aria-hidden={i !== index}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            quality={95}
            className="hero-image"
          />
        </div>
      ))}

      <div className="hero-overlay" />
      <div className="hero-accent" />

      {images.length > 1 && (
        <>
          <button
            type="button"
            className={`hero-carousel-arrow hero-carousel-arrow-prev ${isRTL ? "is-rtl" : ""}`}
            onClick={isRTL ? next : prev}
            aria-label={isRTL ? "الصورة التالية" : "Previous image"}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className={`hero-carousel-arrow hero-carousel-arrow-next ${isRTL ? "is-rtl" : ""}`}
            onClick={isRTL ? prev : next}
            aria-label={isRTL ? "الصورة السابقة" : "Next image"}
          >
            <ChevronRight size={20} />
          </button>

          <div className="hero-carousel-dots" role="tablist" aria-label="Hero image selector">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${isRTL ? "صورة" : "Image"} ${i + 1}`}
                className={`hero-carousel-dot ${i === index ? "is-active" : ""}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
