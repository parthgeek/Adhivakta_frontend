"use client";

import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import GuidePanel from "@/components/guide/GuidePanel";
import { useTour } from "@/components/guide/hooks/useTour";

export default function GuideButton() {
  const { openGuide, completedCount } = useTour();
  const hasCompletedTour = completedCount > 0;

  return (
    <>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Guide. Need help? Learn how to use Adhivakta"
              onClick={openGuide}
              data-tour="guide-center"
            >
              {!hasCompletedTour ? (
                <span className="absolute inset-2 rounded-full bg-amber-200/60 guide-button-pulse" aria-hidden="true" />
              ) : null}
              <Lightbulb className="relative h-5 w-5 text-[#03234b]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent align="end" side="bottom" className="max-w-64 p-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Guide</p>
              <p className="text-xs text-muted-foreground">
                Need help? Learn how to use Adhivakta
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <GuidePanel />
    </>
  );
}
