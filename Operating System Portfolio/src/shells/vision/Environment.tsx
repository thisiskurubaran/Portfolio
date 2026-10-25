"use client";

import { useEffect, useRef } from "react";

// The room folioVision floats in: a calm lakeside at golden hour, drawn as
// layered SVG so it costs no image download. Far layers drift less than near
// ones as the pointer moves, which adds depth behind the panels.
export function Environment({ reduced }: { reduced: boolean }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      const px = e.clientX / window.innerWidth - 0.5;
      const py = e.clientY / window.innerHeight - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        ref.current?.querySelectorAll<SVGGElement>("[data-depth]").forEach((g) => {
          const d = Number(g.dataset.depth);
          g.style.transform = `translate(${-px * d}px, ${-py * d * 0.5}px)`;
        });
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  return (
    <svg ref={ref} aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="fv-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5d7fb8" />
          <stop offset="0.45" stopColor="#b9b4d4" />
          <stop offset="0.62" stopColor="#f3c9a8" />
          <stop offset="0.7" stopColor="#ffd9a8" />
        </linearGradient>
        <radialGradient id="fv-sun" cx="0.5" cy="0.62" r="0.35">
          <stop offset="0" stopColor="#fff3d6" stopOpacity="0.95" />
          <stop offset="0.25" stopColor="#ffd59a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffd59a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fv-lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9b49c" />
          <stop offset="0.35" stopColor="#7d7fa6" />
          <stop offset="1" stopColor="#2d3550" />
        </linearGradient>
        <linearGradient id="fv-shore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3a52" />
          <stop offset="1" stopColor="#1b1d2b" />
        </linearGradient>
        <filter id="fv-haze">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width="1600" height="1000" fill="url(#fv-sky)" />
      <rect width="1600" height="1000" fill="url(#fv-sun)" />
      <g data-depth="8" filter="url(#fv-haze)">
        <path d="M-100 640 L120 560 L260 600 L430 520 L600 590 L760 540 L900 600 L1080 510 L1250 580 L1420 530 L1700 610 L1700 680 L-100 680 Z" fill="#9b8fb5" opacity="0.75" />
      </g>
      <g data-depth="18">
        <path d="M-100 660 L80 600 L230 640 L380 580 L520 645 L700 600 L840 650 L1010 590 L1180 650 L1330 600 L1500 640 L1700 610 L1700 690 L-100 690 Z" fill="#6d6890" />
      </g>
      <g data-depth="26">
        <rect x="-100" y="680" width="1800" height="400" fill="url(#fv-lake)" />
        <ellipse cx="800" cy="690" rx="260" ry="10" fill="#fff1d6" opacity="0.55" />
        <ellipse cx="800" cy="720" rx="150" ry="5" fill="#fff1d6" opacity="0.35" />
        <ellipse cx="800" cy="760" rx="90" ry="4" fill="#fff1d6" opacity="0.2" />
      </g>
      <g data-depth="44">
        <path d="M-100 1000 L-100 860 C 200 830 420 900 640 920 C 900 945 1200 880 1700 870 L1700 1000 Z" fill="url(#fv-shore)" />
      </g>
    </svg>
  );
}
