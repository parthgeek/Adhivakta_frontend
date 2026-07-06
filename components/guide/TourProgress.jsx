"use client";

import { CheckCircle2 } from "lucide-react";

export default function TourProgress({ completedCount, totalCount }) {
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">Tour progress</p>
          <p className="text-xs text-slate-500">
            {completedCount} of {totalCount} completed
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#03234b] shadow-sm">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-[#03234b] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
