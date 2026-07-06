"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GUIDE_TOURS, TOUR_STORAGE_KEY } from "@/components/guide/tour-config";

const readProgress = () => {
  if (typeof window === "undefined") return {};

  try {
    const stored = window.localStorage.getItem(TOUR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const writeProgress = (progress) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(progress));
};

export function useTourProgress() {
  const [progress, setProgress] = useState({});

  useEffect(() => {
    setProgress(readProgress());
  }, []);

  const markCompleted = useCallback((tourId) => {
    setProgress((current) => {
      const next = {
        ...current,
        [tourId]: {
          ...(current[tourId] || {}),
          completed: true,
          completedAt: new Date().toISOString(),
        },
      };
      writeProgress(next);
      return next;
    });
  }, []);

  const markStarted = useCallback((tourId, stepIndex = 0) => {
    setProgress((current) => {
      const next = {
        ...current,
        [tourId]: {
          ...(current[tourId] || {}),
          currentStep: stepIndex,
          lastStartedAt: new Date().toISOString(),
        },
      };
      writeProgress(next);
      return next;
    });
  }, []);

  const resetTour = useCallback((tourId) => {
    setProgress((current) => {
      const next = { ...current };
      delete next[tourId];
      writeProgress(next);
      return next;
    });
  }, []);

  const isCompleted = useCallback(
    (tourId) => Boolean(progress?.[tourId]?.completed),
    [progress]
  );

  const completedCount = useMemo(
    () => GUIDE_TOURS.filter((tour) => progress?.[tour.id]?.completed).length,
    [progress]
  );

  return {
    progress,
    completedCount,
    totalCount: GUIDE_TOURS.length,
    markCompleted,
    markStarted,
    resetTour,
    isCompleted,
  };
}
