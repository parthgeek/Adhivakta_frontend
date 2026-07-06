"use client";

import { cn } from "@/lib/utils";

const PADDING = 10;

export default function TourOverlay({ rect, missing }) {
  if (missing || !rect) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[70] bg-slate-950/65 backdrop-blur-[2px] transition-opacity duration-200"
      />
    );
  }

  if (typeof window === "undefined") return null;

  const top = Math.max(rect.top - PADDING, 0);
  const left = Math.max(rect.left - PADDING, 0);
  const width = Math.min(rect.width + PADDING * 2, window.innerWidth - left);
  const height = Math.min(rect.height + PADDING * 2, window.innerHeight - top);
  const right = Math.max(window.innerWidth - left - width, 0);
  const bottom = Math.max(window.innerHeight - top - height, 0);

  return (
    <>
      <div aria-hidden="true" className="fixed left-0 top-0 z-[70] w-full bg-slate-950/65 backdrop-blur-[2px]" style={{ height: top }} />
      <div aria-hidden="true" className="fixed left-0 z-[70] bg-slate-950/65 backdrop-blur-[2px]" style={{ top, width: left, height }} />
      <div aria-hidden="true" className="fixed z-[70] bg-slate-950/65 backdrop-blur-[2px]" style={{ top, right: 0, width: right, height }} />
      <div aria-hidden="true" className="fixed bottom-0 left-0 z-[70] w-full bg-slate-950/65 backdrop-blur-[2px]" style={{ height: bottom }} />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed z-[85] rounded-lg border border-amber-300/80 shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_16px_44px_-20px_rgba(3,35,75,0.65)] transition-all duration-200",
          "tour-spotlight-frame"
        )}
        style={{
          transform: `translate3d(${left}px, ${top}px, 0)`,
          width,
          height,
        }}
      />
    </>
  );
}
