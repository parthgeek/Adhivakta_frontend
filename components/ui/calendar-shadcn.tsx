"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function getYearsRange(start: number, end: number) {
  const years = [];
  for (let y = start; y <= end; y++) years.push(y);
  return years;
}

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const [month, setMonth] = React.useState(() => props.month || new Date());
  const years = getYearsRange(1950, new Date().getFullYear() + 10);
  const currentYear = month.getFullYear();
  const currentMonth = month.getMonth();

  return (
    <div className={cn("relative", className)}>
      <div className="flex justify-between items-center mb-2 px-2">
        <button
          type="button"
          aria-label="Previous Month"
          onClick={() => setMonth(new Date(currentYear, currentMonth - 1, 1))}
          className="rounded-full p-1 hover:bg-muted focus:outline-none border border-black dark:border-white"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <select
          value={currentYear}
          onChange={e => setMonth(new Date(Number(e.target.value), currentMonth, 1))}
          className="mx-2 rounded border border-black dark:border-white bg-background text-foreground px-2 py-1"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button
          type="button"
          aria-label="Next Month"
          onClick={() => setMonth(new Date(currentYear, currentMonth + 1, 1))}
          className="rounded-full p-1 hover:bg-muted focus:outline-none border border-black dark:border-white"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
        </button>
      </div>
      <DayPicker
        {...props}
        month={month}
        onMonthChange={setMonth}
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "hidden", // hide default nav
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative",
          day: cn(
            "h-9 w-9 p-0 font-normal transition-colors duration-150",
            "rounded-full border-2 border-transparent",
            "hover:bg-black hover:text-white hover:border-black dark:hover:bg-white dark:hover:text-black dark:hover:border-white",
            "focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white",
            "[&[aria-selected='true']]:bg-black [&[aria-selected='true']]:text-white [&[aria-selected='true']]:border-black dark:[&[aria-selected='true']]:bg-white dark:[&[aria-selected='true']]:text-black dark:[&[aria-selected='true']]:border-white"
          ),
          day_selected:
            "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white rounded-full",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
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