"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Plus, CalendarIcon, Clock, MapPin, Users, Edit, User } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { api, fetchCases } from "@/lib/api"
import { cn } from "@/lib/utils"

// Skeleton Components for Calendar
const CalendarSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="flex items-center justify-between">
      <div className="h-9 w-48 bg-gray-200 rounded animate-pulse"></div>
      <div className="flex items-center space-x-2">
        <div className="h-10 w-[120px] bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>

    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-9 w-9 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-9 w-9 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {[...Array(7)].map((_, i) => (
            <div key={i} className="text-center py-2">
              <div className="h-5 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
            </div>
          ))}
          {/* Calendar cells */}
          {[...Array(42)].map((_, i) => (
            <div key={i} className="min-h-[100px] border rounded-md p-1 bg-gray-50">
              <div className="flex justify-between items-center p-1">
                <div className="h-6 w-6 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
              </div>
              <div className="space-y-1 mt-2">
                {[...Array(Math.floor(Math.random() * 2) + 1)].map((_, j) => (
                  <div key={j} className="h-6 bg-gray-300 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
)

const EventDialogSkeleton = () => (
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
      <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <div className="h-5 w-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid gap-2">
          <div className="h-5 w-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid gap-2">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="grid gap-2">
        <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="grid gap-2">
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
    <DialogFooter>
      <div className="flex space-x-2">
        <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </DialogFooter>
  </DialogContent>
)

const formatDateKey = (date) => {
  if (!(date instanceof Date) || isNaN(date)) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Event types aligned with backend EventSchema
const EVENT_TYPES = [
  { value: "hearing", label: "Court Hearing", color: "bg-[#edf4ff] text-[#03234b] border-[#c8dcf7]" },
  { value: "client_meeting", label: "Client Meeting", color: "bg-[#eefbf4] text-[#16633f] border-[#bde8d0]" },
  { value: "case_filing", label: "Case Filing", color: "bg-[#fff1f0] text-[#b42318] border-[#ffd0cc]" },
  { value: "evidence_submission", label: "Evidence Submission", color: "bg-[#f6f1ff] text-[#6241a6] border-[#ddd0ff]" },
  { value: "court_visit", label: "Court Visit", color: "bg-[#fff8e6] text-[#8a5b0a] border-[#f4daa3]" },
  { value: "mediation", label: "Mediation", color: "bg-[#f4f5f7] text-[#3f4652] border-[#d9dee7]" },
  { value: "arbitration", label: "Arbitration", color: "bg-[#f4f5f7] text-[#3f4652] border-[#d9dee7]" },
  { value: "judgment", label: "Judgment", color: "bg-[#f4f5f7] text-[#3f4652] border-[#d9dee7]" },
  { value: "appeal", label: "Appeal", color: "bg-[#f4f5f7] text-[#3f4652] border-[#d9dee7]" },
]

export default function CalendarPage() {
  const { user } = useAuth()
  const [isLawyer, setIsLawyer] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [viewMode, setViewMode] = useState("month")
  const [cases, setCases] = useState([])
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date(),
    time: "",
    type: "hearing",
    location: "",
    description: "",
    case: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [detailEvent, setDetailEvent] = useState(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  useEffect(() => {
    if (user) {
      setIsLawyer(user.role === "lawyer")
    }
  }, [user])

  // Fetch cases and events in parallel for faster load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [fetchedCases, eventsResponse] = await Promise.all([
          fetchCases(),
          api.events.getAll(),
        ]);
        setCases(fetchedCases);
        const formattedEvents = [];
        const eventCaseIds = new Set();
        if (Array.isArray(eventsResponse)) {
          eventsResponse.forEach((event) => {
            formattedEvents.push({
              id: event._id || event.id,
              title: event.title,
              date: event.start ? formatDateKey(new Date(event.start)) : null,
              time: event.start
                ? new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : null,
              type: event.type || "hearing",
              location: event.location || "",
              description: event.description || "",
              case: event.case?.title || "",
              caseId: event.case?._id || "",
              status: event.status || "scheduled",
              priority: event.priority || "medium",
              participants: event.participants || [],
              createdByName: event.createdBy?.name || "",
            });
            if (event.case?._id) eventCaseIds.add(event.case._id);
          });
        }
        // Merge hearing dates from cases that have nextHearingDate but no matching event
        if (Array.isArray(fetchedCases)) {
          fetchedCases.forEach((c) => {
            const hearingDate = c.nextHearingDate || c.hearingDate;
            if (!hearingDate) return;
            const caseId = c._id || c.id;
            if (eventCaseIds.has(caseId)) return;
            const dt = new Date(hearingDate);
            formattedEvents.push({
              id: `case-hearing-${caseId}`,
              title: `Hearing: ${c.title || 'Untitled Case'}`,
              date: formatDateKey(dt),
              time: dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              type: "hearing",
              location: c.court || "",
              description: `Next hearing for case ${c.caseNumber || c.number || ''}`.trim(),
              case: c.title || "",
              caseId: caseId,
              isCaseHearing: true,
            });
          });
        }
        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching cases or events:", error);
        toast({
          title: "Error fetching data",
          description: "Failed to load cases or events. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false)
      }
    };
    fetchData();
  }, []);

  // Get current month and year
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  // Get first day of month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  // Generate calendar days
  const calendarDays = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({ day: null, date: null })
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day)
    const dateString = formatDateKey(date)
    const dayEvents = events.filter((event) => event.date === dateString)

    calendarDays.push({
      day,
      date,
      dateString,
      events: dayEvents,
    })
  }

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  // Handle new event form changes
  const handleNewEventChange = (field, value) => {
    setNewEvent((prev) => ({ ...prev, [field]: value }))
  }

  // Handle date selection for new event
  const handleDateSelect = (date) => {
    setNewEvent((prev) => ({ ...prev, date }))
  }

  const fetchEvents = async () => {
    try {
      const response = await api.events.getAll();
      console.log('Raw events response:', response);

      const formattedEvents = [];
      const eventCaseIds = new Set();

      if (Array.isArray(response)) {
        const eventMap = new Map();
        response.forEach(event => {
          const id = event._id || event.id;
          if (id && !eventMap.has(id)) {
            eventMap.set(id, event);
          }
        });

        const uniqueEvents = Array.from(eventMap.values());
        uniqueEvents.forEach((event) => {
          formattedEvents.push({
            id: event._id || event.id,
            title: event.title,
            date: event.start ? formatDateKey(new Date(event.start)) : null,
            time: event.start
              ? new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : null,
            type: event.type || "hearing",
            location: event.location || "",
            description: event.description || "",
            case: event.case?.title || "",
            caseId: event.case?._id || "",
            status: event.status || "scheduled",
            priority: event.priority || "medium",
            participants: event.participants || [],
            createdByName: event.createdBy?.name || "",
          });
          if (event.case?._id) eventCaseIds.add(event.case._id);
        });
      }

      // Merge hearing dates from cases
      if (Array.isArray(cases) && cases.length > 0) {
        cases.forEach((c) => {
          const hearingDate = c.nextHearingDate || c.hearingDate;
          if (!hearingDate) return;
          const caseId = c._id || c.id;
          if (eventCaseIds.has(caseId)) return;
          const dt = new Date(hearingDate);
          formattedEvents.push({
            id: `case-hearing-${caseId}`,
            title: `Hearing: ${c.title || 'Untitled Case'}`,
            date: formatDateKey(dt),
            time: dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            type: "hearing",
            location: c.court || "",
            description: `Next hearing for case ${c.caseNumber || c.number || ''}`.trim(),
            case: c.title || "",
            caseId: caseId,
            isCaseHearing: true,
          });
        });
      }

      setEvents(formattedEvents);
      console.log('Total events (incl. case hearings):', formattedEvents.length);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  useEffect(() => {
    fetchEvents()
  }, [])

  // Validate time format (e.g., "10:30 AM")
  const isValidTime = (timeStr) => {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i
    return timeRegex.test(timeStr.trim())
  }

  // Add new event
  const addEvent = async () => {
    try {
      // Validate inputs
      if (!newEvent.title) {
        toast({
          title: "Missing title",
          description: "Please provide a title for the event.",
          variant: "destructive",
        })
        return
      }

      if (!(newEvent.date instanceof Date) || isNaN(newEvent.date)) {
        toast({
          title: "Invalid date",
          description: "Please select a valid date.",
          variant: "destructive",
        })
        return
      }

      if (!newEvent.time || !isValidTime(newEvent.time)) {
        toast({
          title: "Invalid time",
          description: "Please provide a valid time (e.g., 10:30 AM).",
          variant: "destructive",
        })
        return
      }

      if (newEvent.type !== "client_meeting" && (!newEvent.case || newEvent.case === "none")) {
        toast({
          title: "Missing case",
          description: "Please select a case for this event type.",
          variant: "destructive",
        })
        return
      }

      const startTime = combineDateAndTime(newEvent.date, newEvent.time)
      const now = new Date()
      if (startTime <= now) {
        toast({
          title: "Invalid start time",
          description: "Event start time must be in the future.",
          variant: "destructive",
        })
        return
      }

      const apiEvent = {
        title: newEvent.title,
        case: newEvent.case === "none" ? undefined : newEvent.case,
        start: startTime.toISOString(),
        end: new Date(startTime.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        type: newEvent.type,
        location: newEvent.location,
        description: newEvent.description,
      }

      console.log("Sending event payload:", apiEvent)
      console.log('Creating event with payload:', apiEvent);
      const response = await api.events.create(apiEvent)
      console.log('Backend response after create:', response);
      const dateString = formatDateKey(newEvent.date)
      const newEventObj = {
        id: response._id || response.id || `event-${Date.now()}`,
        ...newEvent,
        date: dateString,
        caseId: newEvent.case,
        case: newEvent.case === "none" ? "" : cases.find((c) => c._id === newEvent.case)?.title || "",
      }

      setNewEvent({
        title: "",
        date: new Date(),
        time: "",
        type: "hearing",
        location: "",
        description: "",
        case: "",
      })
      setIsDialogOpen(false)
      await fetchEvents()
      if (events.length === 0) {
        console.error("No events returned from backend after add. Check backend filtering or save.")
      }
      toast({
        title: "Event created",
        description: "Your event has been added to the calendar.",
      })
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Error creating event",
        description: error.message || "There was an error creating the event. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Helper function to combine date and time
  const combineDateAndTime = (date, timeStr) => {
    if (!(date instanceof Date) || isNaN(date)) {
      throw new Error("Invalid date provided")
    }

    const result = new Date(date)
    if (!timeStr || !isValidTime(timeStr)) {
      throw new Error("Invalid time format. Use HH:MM AM/PM (e.g., 10:30 AM)")
    }

    const [timePart, ampm] = timeStr.trim().split(" ")
    const [hours, minutes] = timePart.split(":").map(Number)

    if (ampm.toUpperCase() === "PM" && hours < 12) {
      result.setHours(hours + 12, minutes, 0, 0)
    } else if (ampm.toUpperCase() === "AM" && hours === 12) {
      result.setHours(0, minutes, 0, 0)
    } else {
      result.setHours(hours, minutes, 0, 0)
    }

    return result
  }

  // Update event
  const updateEvent = async () => {
    if (!selectedEvent) return
    try {
      // Validate inputs
      if (!newEvent.title) {
        toast({
          title: "Missing title",
          description: "Please provide a title for the event.",
          variant: "destructive",
        })
        return
      }

      if (!(newEvent.date instanceof Date) || isNaN(newEvent.date)) {
        toast({
          title: "Invalid date",
          description: "Please select a valid date.",
          variant: "destructive",
        })
        return
      }

      if (!newEvent.time || !isValidTime(newEvent.time)) {
        toast({
          title: "Invalid time",
          description: "Please provide a valid time (e.g., 10:30 AM).",
          variant: "destructive",
        })
        return
      }

      if (newEvent.type !== "client_meeting" && (!newEvent.case || newEvent.case === "none")) {
        toast({
          title: "Missing case",
          description: "Please select a case for this event type.",
          variant: "destructive",
        })
        return
      }

      const startTime = combineDateAndTime(newEvent.date, newEvent.time)
      const now = new Date()
      if (startTime <= now) {
        toast({
          title: "Invalid start time",
          description: "Event start time must be in the future.",
          variant: "destructive",
        })
        return
      }

      const apiEvent = {
        title: newEvent.title,
        case: newEvent.case === "none" ? undefined : newEvent.case,
        start: startTime.toISOString(),
        end: new Date(startTime.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        type: newEvent.type,
        location: newEvent.location,
        description: newEvent.description,
      }

      console.log("Updating event payload:", apiEvent)
      await api.events.update(selectedEvent.id, apiEvent)
      const dateString = formatDateKey(newEvent.date)
      const updatedEvent = {
        ...selectedEvent,
        ...newEvent,
        date: dateString,
        caseId: newEvent.case,
        case: newEvent.case === "none" ? "" : cases.find((c) => c._id === newEvent.case)?.title || "",
      }

      setSelectedEvent(null)
      setNewEvent({
        title: "",
        date: new Date(),
        time: "",
        type: "hearing",
        location: "",
        description: "",
        case: "",
      })
      setIsDialogOpen(false)
      setIsEditMode(false)
      await fetchEvents()
      if (events.length === 0) {
        console.error("No events returned from backend after update. Check backend filtering or save.")
      }
      toast({
        title: "Event updated",
        description: "Your event has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating event:", error)
      toast({
        title: "Error updating event",
        description: "There was an error updating the event. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Delete event
  const deleteEvent = async () => {
    if (!selectedEvent) return
    try {
      await api.events.delete(selectedEvent.id)
      setSelectedEvent(null)
      setShowDeleteDialog(false)
      await fetchEvents()
      if (events.length === 0) {
        console.error("No events returned from backend after delete. Check backend filtering or save.")
      }
      toast({
        title: "Event deleted",
        description: "Your event has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error deleting event",
        description: "There was an error deleting the event. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Edit event
  const editEvent = (event) => {
    setSelectedEvent(event)
    setNewEvent({
      title: event.title,
      date: new Date(event.date),
      time: event.time || "",
      type: event.type || "hearing",
      location: event.location || "",
      description: event.description || "",
      case: event.caseId || "",
    })
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  // Get month name
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Get day names
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Get event color based on type
  const getEventColor = (type) => {
    const eventType = EVENT_TYPES.find((t) => t.value === type)
    return eventType ? eventType.color : "bg-gray-100 text-gray-800 border-gray-300"
  }

  // Add useEffect to re-fetch events when viewMode changes
  useEffect(() => {
    fetchEvents()
  }, [viewMode])

  // Auto-refresh when window regains focus or tab becomes visible
  useEffect(() => {
    const handleFocus = () => fetchEvents()
    const handleVisibility = () => { if (document.visibilityState === "visible") fetchEvents() }
    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  // Open event detail dialog
  const viewEventDetail = (event) => {
    setDetailEvent(event)
    setShowDetailDialog(true)
  }

  const todayKey = formatDateKey(new Date())
  const todaysEventsCount = events.filter((event) => event.date === todayKey).length

  const renderEventChip = (event) => (
    <button
      key={event.id}
      type="button"
      className={cn(
        "block w-full truncate rounded-[10px] border px-2 py-1.5 text-left text-[11px] font-medium leading-none shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03234b]/30",
        getEventColor(event.type)
      )}
      title={event.title}
      onClick={() => viewEventDetail(event)}
    >
      {event.time && <span className="mr-1 font-semibold tabular-nums opacity-75">{event.time}</span>}
      {event.title}
    </button>
  )

  const renderDayCell = (day, index, options = {}) => {
    const isEmpty = day.day === null
    const isToday = day.dateString === todayKey
    const isWeekend = day.date && (day.date.getDay() === 0 || day.date.getDay() === 6)
    const hasEvents = day.events && day.events.length > 0

    if (isEmpty) {
      return (
        <div
          key={index}
          aria-hidden="true"
          className={cn(
            "min-h-[138px] border-b border-r border-[#e8ebf0] bg-white",
            options.compact && "min-h-[188px]"
          )}
        />
      )
    }

    return (
      <div
        key={index}
        className={cn(
          "group relative min-h-[138px] border-b border-r border-[#e8ebf0] bg-white p-2.5 transition duration-300 hover:z-10 hover:bg-white hover:shadow-[0_18px_45px_rgba(15,23,42,0.09)]",
          options.compact && "min-h-[188px]",
          isWeekend && "bg-white",
          isToday && "bg-white shadow-[inset_0_0_0_1px_rgba(255,59,48,0.22)]"
        )}
      >
        <div className="mb-2 flex items-center justify-between">
          <div
            className={cn(
              "flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-semibold tabular-nums text-[#33363d] transition duration-200",
              isToday && "bg-[#ff3b30] text-white shadow-[0_8px_20px_rgba(255,59,48,0.24)]",
              !isToday && isWeekend && "text-[#8d939f]"
            )}
          >
            {day.day}
          </div>
          {isLawyer && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-[#596273] opacity-0 transition duration-200 hover:bg-[#f1f4f8] hover:text-[#03234b] group-hover:opacity-100 focus-visible:opacity-100"
              onClick={() => {
                setNewEvent((prev) => ({
                  ...prev,
                  date: day.date,
                }))
                setIsDialogOpen(true)
              }}
              aria-label={`Add event on ${day.day}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="space-y-1.5">
          {hasEvents ? day.events.slice(0, 3).map(renderEventChip) : null}
          {day.events && day.events.length > 3 && (
            <button
              type="button"
              className="text-[11px] font-medium text-[#5d6572] transition hover:text-[#03234b]"
              onClick={() => viewEventDetail(day.events[3])}
            >
              +{day.events.length - 3} more
            </button>
          )}
        </div>
      </div>
    )
  }

  // Show skeleton while loading
  if (loading) {
    return <CalendarSkeleton />
  }

  return (
    <div
      className="-m-4 min-h-[calc(100vh-4rem)] bg-white p-4 md:-m-6 md:p-6"
      data-tour="calendar-page"
    >
      <div className="mx-auto flex max-w-[1480px] flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center rounded-full border border-[#e8ebf0] bg-white px-3 py-1 text-xs font-medium text-[#5d6572] shadow-sm">
              {todaysEventsCount === 1 ? "1 event today" : `${todaysEventsCount} events today`}
            </div>
            <h1 className="text-4xl font-semibold tracking-normal text-[#1d1d1f]">Calendar</h1>
            <p className="mt-1 text-sm text-[#6b7280]">
              {monthNames[currentMonth]} {currentYear}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-[#e8ebf0] bg-white p-1 shadow-sm">
              {["month", "week"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium capitalize text-[#606875] transition duration-200 hover:text-[#1d1d1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03234b]/30",
                    viewMode === mode && "bg-[#1d1d1f] text-white shadow-[0_8px_22px_rgba(15,23,42,0.18)] hover:text-white"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="rounded-full bg-[#03234b] px-5 shadow-[0_12px_26px_rgba(3,35,75,0.18)] transition duration-200 hover:bg-[#061f3f] active:translate-y-px"
                data-tour="calendar-events"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Edit Event" : "Add New Event"}</DialogTitle>
                <DialogDescription>
                  {isEditMode ? "Update the event details" : "Create a new event on your calendar"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => handleNewEventChange("title", e.target.value)}
                    placeholder="Enter event title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <DatePicker id="date" selected={newEvent.date} onSelect={handleDateSelect} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      value={newEvent.time}
                      onChange={(e) => handleNewEventChange("time", e.target.value)}
                      placeholder="e.g. 10:30 AM"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Event Type</Label>
                    <Select value={newEvent.type} onValueChange={(value) => handleNewEventChange("type", value)}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="case">Related Case</Label>
                    <Select value={newEvent.case} onValueChange={(value) => handleNewEventChange("case", value)}>
                      <SelectTrigger id="case">
                        <SelectValue placeholder="Select case" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" disabled={newEvent.type !== "client_meeting"}>
                          None
                        </SelectItem>
                        {cases.map((caseItem) => (
                          <SelectItem key={caseItem._id} value={caseItem._id}>
                            {caseItem.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) => handleNewEventChange("location", e.target.value)}
                    placeholder="Enter location"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => handleNewEventChange("description", e.target.value)}
                    placeholder="Enter event description"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                {isEditMode && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowDeleteDialog(true)
                      setIsDialogOpen(false)
                    }}
                    className="mr-auto"
                  >
                    Delete
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setIsEditMode(false)
                    setSelectedEvent(null)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={isEditMode ? updateEvent : addEvent} disabled={!newEvent.title || !newEvent.date}>
                  {isEditMode ? "Update Event" : "Add Event"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

        <Card className="overflow-hidden rounded-[32px] border border-[#e8ebf0] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.10)]" data-tour="calendar-events">
          <CardHeader className="border-b border-[#e8ebf0] bg-white px-4 py-4 md:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-[#e8ebf0] bg-white shadow-sm transition duration-200 hover:-translate-x-0.5 hover:bg-white active:translate-y-px"
                  onClick={goToPreviousMonth}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[190px] text-center">
                  <h2 className="text-2xl font-semibold tracking-normal text-[#1d1d1f]">
                    {monthNames[currentMonth]} {currentYear}
                  </h2>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-[#e8ebf0] bg-white shadow-sm transition duration-200 hover:translate-x-0.5 hover:bg-white active:translate-y-px"
                  onClick={goToNextMonth}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                className="rounded-full border-[#e8ebf0] bg-white px-5 text-[#1d1d1f] shadow-sm transition duration-200 hover:bg-white active:translate-y-px"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-7 border-b border-[#e8ebf0] bg-white">
                  {dayNames.map((day) => (
                    <div
                      key={day}
                      className="border-r border-[#e8ebf0] px-3 py-3 text-center text-xs font-semibold text-[#747b88]"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 bg-white">
                  {viewMode === "month"
                    ? calendarDays.map((day, index) => renderDayCell(day, index))
                    : (() => {
                        const focusedDate = new Date(currentYear, currentMonth, currentDate.getDate())
                        const weekStart = new Date(focusedDate)
                        weekStart.setDate(focusedDate.getDate() - focusedDate.getDay())
                        const weekDays = []
                        for (let i = 0; i < 7; i++) {
                          const date = new Date(weekStart)
                          date.setDate(weekStart.getDate() + i)
                          const dateString = formatDateKey(date)
                          const dayEvents = events.filter((event) => event.date === dateString)
                          weekDays.push({
                            day: date.getDate(),
                            date,
                            dateString,
                            events: dayEvents,
                          })
                        }
                        return weekDays.map((day, index) => renderDayCell(day, index, { compact: true }))
                      })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Event Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          {detailEvent && (() => {
            const detailCase = cases.find(c => (c._id || c.id) === detailEvent.caseId)
            const lawyers = detailCase?.lawyers || []
            const clients = detailCase?.clients || []
            const eventType = EVENT_TYPES.find(t => t.value === detailEvent.type)
            return (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <DialogTitle className="text-xl">{detailEvent.title}</DialogTitle>
                      {eventType && (
                        <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border font-medium ${eventType.color}`}>
                          {eventType.label}
                        </span>
                      )}
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {/* Date & Time */}
                  <div className="flex items-center gap-3 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">
                      {detailEvent.date ? new Date(detailEvent.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Date TBD"}
                      {detailEvent.time ? ` · ${detailEvent.time}` : ""}
                    </span>
                  </div>

                  {/* Location */}
                  {detailEvent.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{detailEvent.location}</span>
                    </div>
                  )}

                  {/* Status & Priority */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      detailEvent.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                      detailEvent.status === "completed" ? "bg-green-100 text-green-800" :
                      detailEvent.status === "cancelled" ? "bg-red-100 text-red-800" :
                      "bg-amber-100 text-amber-800"
                    }`}>
                      {detailEvent.status?.charAt(0).toUpperCase() + detailEvent.status?.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      detailEvent.priority === "critical" || detailEvent.priority === "high" ? "bg-red-100 text-red-800" :
                      detailEvent.priority === "low" ? "bg-gray-100 text-gray-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {detailEvent.priority?.charAt(0).toUpperCase() + detailEvent.priority?.slice(1)} priority
                    </span>
                  </div>

                  {/* Related Case */}
                  {(detailEvent.case || detailCase) && (
                    <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Related Case</p>
                      <p className="text-sm font-semibold">{detailEvent.case || detailCase?.title || "—"}</p>
                      {(detailCase?.caseNumber || detailCase?.number) && (
                        <p className="text-xs text-muted-foreground">{detailCase.caseNumber || detailCase.number}</p>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {detailEvent.description && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Notes</p>
                      <p className="text-sm text-foreground">{detailEvent.description}</p>
                    </div>
                  )}

                  {/* Users Involved */}
                  {(lawyers.length > 0 || clients.length > 0 || detailEvent.createdByName) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">People Involved</p>
                      </div>
                      <div className="space-y-2 pl-1">
                        {lawyers.map((l, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <div className="h-7 w-7 rounded-full bg-[#03234b]/10 flex items-center justify-center shrink-0">
                              <User className="h-3.5 w-3.5 text-[#03234b]" />
                            </div>
                            <div>
                              <span className="font-medium">{l.name || l.user?.name || "—"}</span>
                              <span className="ml-2 text-xs text-muted-foreground">Advocate{l.isLead ? " (Lead)" : ""}</span>
                            </div>
                          </div>
                        ))}
                        {clients.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                              <User className="h-3.5 w-3.5 text-green-700" />
                            </div>
                            <div>
                              <span className="font-medium">{c.name || c.user?.name || "—"}</span>
                              <span className="ml-2 text-xs text-muted-foreground">Client{c.isPrimary ? " (Primary)" : ""}</span>
                            </div>
                          </div>
                        ))}
                        {lawyers.length === 0 && clients.length === 0 && detailEvent.createdByName && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div>
                              <span className="font-medium">{detailEvent.createdByName}</span>
                              <span className="ml-2 text-xs text-muted-foreground">Created by</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
                  {isLawyer && !detailEvent.isCaseHearing && (
                    <Button onClick={() => { setShowDetailDialog(false); editEvent(detailEvent) }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Event
                    </Button>
                  )}
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedEvent && (
              <div className={`p-3 rounded-lg border ${getEventColor(selectedEvent.type)}`}>
                <h3 className="font-medium">{selectedEvent.title}</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex items-center">
                    <CalendarIcon className="h-3 w-3 mr-2" />
                    <span>{new Date(selectedEvent.date).toLocaleDateString()}</span>
                  </div>
                  {selectedEvent.time && (
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-2" />
                      <span>{selectedEvent.time}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteEvent}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  )
}
