"use client"
import { Calendar as ShadCalendar } from "./calendar-shadcn"

export function Calendar({ className, ...props }) {
  return (
    <ShadCalendar
      mode="single"
      className={"rounded-lg border " + (className || "")}
      {...props}
    />
  )
}