"use client";

import { useEffect, useMemo, useRef } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TourStep from "@/components/guide/TourStep";

const TOOLTIP_WIDTH = 360;
const GAP = 16;

const getPosition = (rect, missing) => {
  if (typeof window === "undefined" || missing || !rect) {
    return {
      left: "50%",
      top: "50%",
      transform: "translate3d(-50%, -50%, 0)",
      maxWidth: "calc(100vw - 32px)",
    };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(TOOLTIP_WIDTH, vw - 32);
  const fitsRight = rect.right + GAP + width < vw;
  const fitsLeft = rect.left - GAP - width > 0;
  const fitsBottom = rect.bottom + GAP + 220 < vh;
  const fitsTop = rect.top - GAP - 220 > 0;

  if (vw < 640) {
    return {
      left: 16,
      right: 16,
      bottom: 16,
      transform: "translate3d(0, 0, 0)",
      maxWidth: "none",
    };
  }

  if (fitsRight) {
    return {
      left: rect.right + GAP,
      top: Math.min(Math.max(rect.top, 16), vh - 240),
      width,
      transform: "translate3d(0, 0, 0)",
    };
  }

  if (fitsLeft) {
    return {
      left: rect.left - GAP - width,
      top: Math.min(Math.max(rect.top, 16), vh - 240),
      width,
      transform: "translate3d(0, 0, 0)",
    };
  }

  if (fitsBottom) {
    return {
      left: Math.min(Math.max(rect.left, 16), vw - width - 16),
      top: rect.bottom + GAP,
      width,
      transform: "translate3d(0, 0, 0)",
    };
  }

  if (fitsTop) {
    return {
      left: Math.min(Math.max(rect.left, 16), vw - width - 16),
      top: rect.top - GAP - 220,
      width,
      transform: "translate3d(0, 0, 0)",
    };
  }

  return {
    left: Math.min(Math.max(rect.left, 16), vw - width - 16),
    top: Math.min(Math.max(rect.bottom + GAP, 16), vh - 240),
    width,
    transform: "translate3d(0, 0, 0)",
  };
};

export default function TourTooltip({
  tour,
  step,
  stepIndex,
  totalSteps,
  rect,
  missing,
  resolving,
  onPrevious,
  onNext,
  onSkip,
  onFinish,
}) {
  const tooltipRef = useRef(null);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;
  const position = useMemo(() => getPosition(rect, missing), [rect, missing]);

  useEffect(() => {
    const firstButton = tooltipRef.current?.querySelector("button:not([disabled])");
    firstButton?.focus({ preventScroll: true });
  }, [stepIndex]);

  const handleKeyDown = (event) => {
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      tooltipRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) || []
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <section
      ref={tooltipRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-tooltip-title"
      aria-describedby="tour-tooltip-content"
      className={cn(
        "fixed z-[90] rounded-xl border border-slate-200 bg-white p-4 text-slate-950 shadow-[0_28px_80px_-32px_rgba(3,35,75,0.5)] outline-none transition-all duration-200",
        "tour-tooltip-enter"
      )}
      style={position}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <TourStep index={stepIndex} total={totalSteps} />
          <h2 id="tour-tooltip-title" className="mt-1 text-lg font-semibold leading-tight text-slate-950">
            {missing ? "Step not visible" : step?.title}
          </h2>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onSkip} aria-label="Skip tour">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div id="tour-tooltip-content" className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
        {missing ? (
          <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              This part of {tour.title} is not visible right now. It may appear after data loads or on a different page.
            </p>
          </div>
        ) : resolving ? (
          <p>Looking for this part of the interface...</p>
        ) : (
          <>
            <p>{step?.content}</p>
            {step?.detail ? <p className="text-slate-500">{step.detail}</p> : null}
          </>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" onClick={onSkip} className="justify-center text-slate-600">
          Skip Tour
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onPrevious} disabled={isFirstStep}>
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          {isLastStep ? (
            <Button size="sm" onClick={onFinish} className="bg-[#03234b] hover:bg-[#0b315f]">
              <Check className="h-4 w-4" />
              Finish
            </Button>
          ) : (
            <Button size="sm" onClick={onNext} className="bg-[#03234b] hover:bg-[#0b315f]">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
