"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TourContext } from "@/components/guide/tour-context";
import { getTourById } from "@/components/guide/tour-config";
import { useTourProgress } from "@/components/guide/hooks/useTourProgress";
import TourEngine from "@/components/guide/TourEngine";

const MAX_LOOKUP_ATTEMPTS = 24;
const LOOKUP_INTERVAL_MS = 125;

const getElementRect = (element) => {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
};

export default function TourProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const progressApi = useTourProgress();
  const activeElementRef = useRef(null);
  const executedActionRef = useRef("");
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeTour, setActiveTour] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [missingStep, setMissingStep] = useState(false);
  const [resolvingStep, setResolvingStep] = useState(false);

  const activeStep = activeTour?.steps?.[activeStepIndex] || null;

  const resolveTourRoute = useCallback(
    (route) => {
      if (!route) return "";
      if (!route.startsWith("/dashboard/ai-prep-room") || route.includes("?")) {
        return route;
      }

      const caseId = searchParams.get("case");
      return caseId ? `${route}?case=${encodeURIComponent(caseId)}` : route;
    },
    [searchParams]
  );

  const getRoutePathname = useCallback((route) => {
    if (!route) return "";
    try {
      return new URL(route, window.location.origin).pathname;
    } catch {
      return route.split("?")[0];
    }
  }, []);

  const clearActiveElement = useCallback(() => {
    if (activeElementRef.current) {
      activeElementRef.current.classList.remove("tour-highlight-active");
      activeElementRef.current.removeAttribute("data-tour-active");
      activeElementRef.current = null;
    }
  }, []);

  const stopTour = useCallback(() => {
    clearActiveElement();
    setActiveTour(null);
    setActiveStepIndex(0);
    setTargetRect(null);
    setMissingStep(false);
    setResolvingStep(false);
  }, [clearActiveElement]);

  const startTour = useCallback(
    (tourId) => {
      const tour = getTourById(tourId);
      if (!tour) return;

      clearActiveElement();
      setIsGuideOpen(false);
      setActiveTour(tour);
      setActiveStepIndex(0);
      setTargetRect(null);
      setMissingStep(false);
      setResolvingStep(true);
      progressApi.markStarted(tour.id, 0);

      const firstRoute = resolveTourRoute(tour.steps?.[0]?.route || tour.route);
      if (firstRoute && getRoutePathname(firstRoute) !== pathname) {
        router.push(firstRoute);
      }
    },
    [clearActiveElement, getRoutePathname, pathname, progressApi, resolveTourRoute, router]
  );

  const goToStep = useCallback(
    (nextIndex) => {
      if (!activeTour) return;
      const boundedIndex = Math.min(Math.max(nextIndex, 0), activeTour.steps.length - 1);
      const nextStep = activeTour.steps[boundedIndex];

      clearActiveElement();
      setActiveStepIndex(boundedIndex);
      setTargetRect(null);
      setMissingStep(false);
      setResolvingStep(true);
      progressApi.markStarted(activeTour.id, boundedIndex);

      const route = resolveTourRoute(nextStep?.route || activeTour.route);
      if (route && getRoutePathname(route) !== pathname) {
        router.push(route);
      }
    },
    [activeTour, clearActiveElement, getRoutePathname, pathname, progressApi, resolveTourRoute, router]
  );

  const nextStep = useCallback(() => {
    if (!activeTour) return;
    if (activeStepIndex >= activeTour.steps.length - 1) {
      progressApi.markCompleted(activeTour.id);
      stopTour();
      setIsGuideOpen(true);
      return;
    }
    goToStep(activeStepIndex + 1);
  }, [activeStepIndex, activeTour, goToStep, progressApi, stopTour]);

  const previousStep = useCallback(() => {
    if (!activeTour) return;
    goToStep(activeStepIndex - 1);
  }, [activeStepIndex, activeTour, goToStep]);

  const finishTour = useCallback(() => {
    if (activeTour) {
      progressApi.markCompleted(activeTour.id);
    }
    stopTour();
    setIsGuideOpen(true);
  }, [activeTour, progressApi, stopTour]);

  useEffect(() => {
    if (!activeTour || !activeStep) return undefined;

    const route = resolveTourRoute(activeStep.route || activeTour.route);
    if (route && getRoutePathname(route) !== pathname) {
      setResolvingStep(true);
      router.push(route);
      return undefined;
    }

    let cancelled = false;
    let attempts = 0;
    let lookupTimer;
    const maxLookupAttempts = activeStep.lookupAttempts || MAX_LOOKUP_ATTEMPTS;
    const actionKey = `${activeTour.id}:${activeStepIndex}:${activeStep.action?.type || ""}:${activeStep.action?.selector || ""}`;

    const activateElement = (element) => {
      if (cancelled || !element) return;

      clearActiveElement();
      activeElementRef.current = element;
      element.classList.add("tour-highlight-active");
      element.setAttribute("data-tour-active", "true");
      element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

      window.setTimeout(() => {
        if (cancelled) return;
        setTargetRect(getElementRect(element));
        setMissingStep(false);
        setResolvingStep(false);
      }, 260);
    };

    const lookup = () => {
      if (cancelled) return;
      attempts += 1;
      const element = document.querySelector(activeStep.selector);

      if (element) {
        activateElement(element);
        return;
      }

      if (attempts >= maxLookupAttempts) {
        const fallbackElement = activeStep.fallbackSelector
          ? document.querySelector(activeStep.fallbackSelector)
          : null;

        if (fallbackElement) {
          activateElement(fallbackElement);
          return;
        }

        clearActiveElement();
        setTargetRect(null);
        setMissingStep(true);
        setResolvingStep(false);
        return;
      }

      lookupTimer = window.setTimeout(lookup, LOOKUP_INTERVAL_MS);
    };

    setResolvingStep(true);
    if (
      activeStep.action?.type === "click" &&
      activeStep.action?.selector &&
      executedActionRef.current !== actionKey
    ) {
      executedActionRef.current = actionKey;
      window.setTimeout(() => {
        if (cancelled) return;
        const actionElement = document.querySelector(activeStep.action.selector);
        actionElement?.click?.();
      }, activeStep.action.delayMs || 120);
    }

    lookupTimer = window.setTimeout(lookup, activeStep.action ? 420 : 80);

    return () => {
      cancelled = true;
      window.clearTimeout(lookupTimer);
    };
  }, [
    activeStep,
    activeStepIndex,
    activeTour,
    clearActiveElement,
    getRoutePathname,
    pathname,
    resolveTourRoute,
    router,
  ]);

  useEffect(() => {
    if (!activeTour || !activeElementRef.current) return undefined;

    const updateRect = () => {
      if (activeElementRef.current) {
        setTargetRect(getElementRect(activeElementRef.current));
      }
    };

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [activeTour]);

  useEffect(() => {
    if (!activeTour) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        stopTour();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        nextStep();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousStep();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTour, nextStep, previousStep, stopTour]);

  useEffect(() => () => clearActiveElement(), [clearActiveElement]);

  const contextValue = useMemo(
    () => ({
      isGuideOpen,
      setIsGuideOpen,
      openGuide: () => setIsGuideOpen(true),
      closeGuide: () => setIsGuideOpen(false),
      activeTour,
      activeStep,
      activeStepIndex,
      startTour,
      stopTour,
      nextStep,
      previousStep,
      finishTour,
      ...progressApi,
    }),
    [
      activeStep,
      activeStepIndex,
      activeTour,
      finishTour,
      isGuideOpen,
      nextStep,
      previousStep,
      progressApi,
      startTour,
      stopTour,
    ]
  );

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      <TourEngine
        tour={activeTour}
        step={activeStep}
        stepIndex={activeStepIndex}
        totalSteps={activeTour?.steps?.length || 0}
        targetRect={targetRect}
        missing={missingStep}
        resolving={resolvingStep}
        onPrevious={previousStep}
        onNext={nextStep}
        onSkip={stopTour}
        onFinish={finishTour}
      />
    </TourContext.Provider>
  );
}
