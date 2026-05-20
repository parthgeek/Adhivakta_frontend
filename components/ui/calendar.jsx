"use client"
import { Calendar as ShadCalendar } from "./calendar-shadcn"

export function Calendar({ className, variant = "mobile", ...props }) {
  return (
    <ShadCalendar
      mode="single"
      variant={variant}
      className={className}
      {...props}
    />
  )
}
