"use client";

import { Lightbulb, PlayCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import GuideCard from "@/components/guide/GuideCard";
import GuideSearch from "@/components/guide/GuideSearch";
import TourProgress from "@/components/guide/TourProgress";
import { useGuide } from "@/components/guide/hooks/useGuide";
import { useTour } from "@/components/guide/hooks/useTour";

export default function GuidePanel() {
  const {
    isGuideOpen,
    setIsGuideOpen,
    startTour,
    progress,
    completedCount,
    totalCount,
  } = useTour();
  const { searchQuery, setSearchQuery, filteredCategories, hasResults } = useGuide(progress);

  return (
    <Sheet open={isGuideOpen} onOpenChange={setIsGuideOpen}>
      <SheetContent className="flex w-full flex-col overflow-hidden border-l-slate-200 bg-slate-50 p-0 sm:max-w-xl">
        <div className="border-b border-slate-200 bg-white px-5 py-5">
          <SheetHeader className="space-y-1 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#03234b] text-white shadow-sm">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-xl">Guide Center</SheetTitle>
                <SheetDescription>
                  Need help? Learn how to use Adhivakta.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            <div className="rounded-xl border border-[#03234b]/10 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Start Interactive Tour</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    New to Adhivakta? Take the one-minute application overview.
                  </p>
                </div>
                <Button
                  type="button"
                  className="shrink-0 bg-[#03234b] hover:bg-[#0b315f]"
                  onClick={() => startTour("application-overview")}
                >
                  <PlayCircle className="h-4 w-4" />
                  Start
                </Button>
              </div>
            </div>

            <TourProgress completedCount={completedCount} totalCount={totalCount} />
            <GuideSearch value={searchQuery} onChange={setSearchQuery} />

            {!hasResults ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <Lightbulb className="h-9 w-9 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-950">No guides found.</p>
                <p className="mt-1 text-sm text-slate-500">Try searching for cases, clients, AI, or settings.</p>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <section key={category.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {category.title}
                    </h2>
                    <span className="text-xs text-slate-400">{category.guides.length}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {category.guides.map((guide) => (
                      <GuideCard key={guide.id} guide={guide} onStart={startTour} />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
