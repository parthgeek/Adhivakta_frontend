"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  variant?: "default" | "mobile";
};

function getYearsRange(start: number, end: number) {
  const years = [];
  for (let y = start; y <= end; y++) years.push(y);
  return years;
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  variant = "default",
  selected,
  month: controlledMonth,
  ...props
}: CalendarProps) {
  const [month, setMonth] = React.useState(() => {
    if (controlledMonth) return controlledMonth;
    if (selected instanceof Date) return selected;
    return new Date();
  });

  React.useEffect(() => {
    if (controlledMonth) {
      setMonth(controlledMonth);
      return;
    }

    if (selected instanceof Date && !Number.isNaN(selected.getTime())) {
      setMonth(selected);
    }
  }, [controlledMonth, selected]);

  const years = getYearsRange(1950, new Date().getFullYear() + 10);
  const currentYear = month.getFullYear();
  const currentMonth = month.getMonth();
  const isMobileVariant = variant === "mobile";

  const containerClasses = isMobileVariant
    ? "rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] sm:p-5"
    : "";

  const navigationButtonClasses = isMobileVariant
    ? "flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition-all duration-300 ease-out hover:-translate-y-px hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
    : "rounded-full p-1 hover:bg-muted focus:outline-none border border-black dark:border-white";

  const navigationIconColor = isMobileVariant ? "currentColor" : "black";
  const yearSelectClasses = isMobileVariant
    ? "h-11 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
    : "mx-2 rounded border border-black dark:border-white bg-background text-foreground px-2 py-1";
  const captionLabel = month.toLocaleDateString("en-US", {
    month: isMobileVariant ? "long" : "long",
    year: isMobileVariant ? undefined : "numeric",
  });

  return (
    <div className={cn("relative", containerClasses, className)}>
      <div className={cn("mb-3 flex items-center justify-between gap-3", isMobileVariant ? "px-1" : "px-2")}>
        <button
          type="button"
          aria-label="Previous Month"
          onClick={() => setMonth(new Date(currentYear, currentMonth - 1, 1))}
          className={navigationButtonClasses}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={navigationIconColor} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className={cn("flex items-center gap-3", isMobileVariant && "min-w-0 flex-1 justify-center")}>
          <div className={cn(
            "font-semibold tracking-tight",
            isMobileVariant ? "text-[1.35rem] text-slate-900" : "text-sm text-foreground"
          )}>
            {captionLabel}
          </div>
          <select
            value={currentYear}
            onChange={e => setMonth(new Date(Number(e.target.value), currentMonth, 1))}
            className={yearSelectClasses}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          aria-label="Next Month"
          onClick={() => setMonth(new Date(currentYear, currentMonth + 1, 1))}
          className={navigationButtonClasses}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={navigationIconColor} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      </div>
      <DayPicker
        {...props}
        month={month}
        onMonthChange={setMonth}
        selected={selected}
        showOutsideDays={showOutsideDays}
        className={cn(isMobileVariant ? "p-1" : "p-3")}
        classNames={{
          months: "flex flex-col",
          month: isMobileVariant ? "space-y-4" : "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "hidden", // hide default nav
          table: "w-full border-collapse",
          head_row: cn("flex w-full", isMobileVariant && "mb-2"),
          head_cell: cn(
            "text-muted-foreground rounded-md font-normal",
            isMobileVariant
              ? "w-11 text-center text-[0.72rem] uppercase tracking-[0.24em] text-slate-400"
              : "w-9 text-[0.8rem]"
          ),
          row: cn("flex w-full", isMobileVariant ? "mt-2.5" : "mt-2"),
          cell: cn(
            "text-center text-sm p-0 relative",
            isMobileVariant ? "h-11 w-11" : "h-9 w-9"
          ),
          day: cn(
            "font-normal transition-all duration-300 ease-out",
            isMobileVariant
              ? [
                  "h-11 w-11 rounded-full border border-transparent text-[0.98rem] text-slate-700",
                  "hover:-translate-y-px hover:bg-slate-100 hover:text-slate-950",
                  "focus:outline-none focus:ring-2 focus:ring-slate-300",
                  "[&[aria-selected='true']]:bg-slate-900 [&[aria-selected='true']]:text-white [&[aria-selected='true']]:shadow-[0_12px_30px_-18px_rgba(15,23,42,0.95)]",
                ]
              : [
                  "h-9 w-9 rounded-full border-2 border-transparent",
                  "hover:bg-black hover:text-white hover:border-black dark:hover:bg-white dark:hover:text-black dark:hover:border-white",
                  "focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white",
                  "[&[aria-selected='true']]:bg-black [&[aria-selected='true']]:text-white [&[aria-selected='true']]:border-black dark:[&[aria-selected='true']]:bg-white dark:[&[aria-selected='true']]:text-black dark:[&[aria-selected='true']]:border-white",
                ]
          ),
          day_selected: isMobileVariant
            ? "rounded-full bg-slate-900 text-white"
            : "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white rounded-full",
          day_today: isMobileVariant
            ? "rounded-full border border-slate-300 bg-slate-100 font-semibold text-slate-950"
            : "bg-accent text-accent-foreground",
          day_outside: isMobileVariant
            ? "text-slate-300 opacity-100"
            : "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
      />
      <style jsx global>{`
        .rdp-day_selected, .rdp-day[aria-selected='true'] {
          box-shadow: none !important;
          outline: none !important;
        }
        .rdp-day:focus {
          outline: none !important;
        }
      `}</style>
    </div>
  );
} 
