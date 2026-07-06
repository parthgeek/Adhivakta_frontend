"use client";

import TourOverlay from "@/components/guide/TourOverlay";
import TourTooltip from "@/components/guide/TourTooltip";

export default function TourEngine({
  tour,
  step,
  stepIndex,
  totalSteps,
  targetRect,
  missing,
  resolving,
  onPrevious,
  onNext,
  onSkip,
  onFinish,
}) {
  if (!tour || !step) return null;

  return (
    <>
      <TourOverlay
        rect={targetRect}
        missing={missing}
      />
      <TourTooltip
        tour={tour}
        step={step}
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        rect={targetRect}
        missing={missing}
        resolving={resolving}
        onPrevious={onPrevious}
        onNext={onNext}
        onSkip={onSkip}
        onFinish={onFinish}
      />
    </>
  );
}
