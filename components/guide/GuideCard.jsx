"use client";

import { CheckCircle2, Clock3, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getGuideIcon } from "@/components/guide/guide-icons";
import { cn } from "@/lib/utils";

export default function GuideCard({ guide, onStart }) {
  const Icon = getGuideIcon(guide.icon);

  return (
    <article className="group rounded-xl border border-slate-200 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(3,35,75,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#03234b]/30 hover:shadow-[0_24px_60px_-38px_rgba(3,35,75,0.45)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[#03234b]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-6 text-slate-950">
              {guide.title}
            </h3>
            {guide.completed ? (
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Completed
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
            {guide.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
              <Clock3 className="h-3 w-3" />
              {guide.estimatedTime}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-1",
                guide.difficulty === "Beginner"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-amber-50 text-amber-700"
              )}
            >
              {guide.difficulty}
            </span>
          </div>
        </div>
      </div>
      <Button
        type="button"
        className="mt-4 w-full bg-[#03234b] hover:bg-[#0b315f]"
        onClick={() => onStart(guide.id)}
      >
        {guide.completed ? <RotateCcw className="h-4 w-4" /> : null}
        {guide.completed ? "Replay" : "Start"}
      </Button>
    </article>
  );
}
