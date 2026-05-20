"use client"
import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function DatePicker({ selected, onSelect, className, ...props }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "h-11 w-full justify-start rounded-xl border-slate-200 bg-white text-left font-normal text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900",
            !selected && "text-muted-foreground",
            className
          )}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
          {selected ? format(selected, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto border-none bg-transparent p-0 shadow-none" align="start">
        <Calendar
          variant="mobile"
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onSelect(date)
            setOpen(false)
          }}
          className="min-w-[320px]"
        />
      </PopoverContent>
    </Popover>
  )
}
