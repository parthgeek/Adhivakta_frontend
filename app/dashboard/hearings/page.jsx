"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import api from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  User,
  Filter,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatLegalTeamSummary } from "@/lib/legal-team";
import {
  getCasePriority,
  getCasePriorityColor,
  getCasePriorityLabel,
  isPriorityAlertCase,
} from "@/lib/casePriority";
import { formatDisplayCaseNumber } from "@/lib/caseTypeUtils";

const normalizeStatus = (status) => {
  switch (status) {
    case "confirmed":
      return "scheduled";
    case "adjourned":
      return "postponed";
    default:
      return status || "scheduled";
  }
};

const normalizeType = (type) => {
  switch (type) {
    case "hearing":
      return "hearing";
    case "judgment":
      return "judgment";
    case "client_meeting":
    case "court_visit":
      return "case_management";
    case "case_filing":
    case "evidence_submission":
    case "mediation":
    case "arbitration":
    case "appeal":
      return "argument";
    default:
      return "hearing";
  }
};

const EVENT_TYPES = [
  { value: "hearing", label: "Court Hearing" },
  { value: "client_meeting", label: "Client Meeting" },
  { value: "case_filing", label: "Case Filing" },
  { value: "evidence_submission", label: "Evidence Submission" },
  { value: "court_visit", label: "Court Visit" },
  { value: "mediation", label: "Mediation" },
  { value: "arbitration", label: "Arbitration" },
  { value: "judgment", label: "Judgment" },
  { value: "appeal", label: "Appeal" },
];

const createScheduleEventForm = () => ({
  title: "",
  date: new Date(),
  time: "",
  type: "hearing",
  case: "",
  location: "",
  description: "",
});

const getTypeColor = (type) => {
  switch (type) {
    case "hearing":
      return "bg-[#03234b]/10 text-[#03234b] border border-[#03234b]/20 hover:bg-[#03234b]/10";
    case "argument":
      return "bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-100";
    case "judgment":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-100";
    case "case_management":
      return "bg-green-100 text-green-800 border border-green-200 hover:bg-green-100";
    default:
      return "bg-muted text-foreground hover:bg-muted";
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "scheduled":
      return "bg-[#03234b]/10 text-[#03234b] border border-[#03234b]/20 hover:bg-[#03234b]/10";
    case "completed":
      return "bg-green-100 text-green-800 border border-green-200 hover:bg-green-100";
    case "postponed":
      return "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-100";
    case "cancelled":
      return "bg-red-100 text-red-800 border border-red-200 hover:bg-red-100";
    default:
      return "bg-muted text-foreground hover:bg-muted";
  }
};

const toDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toKey = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
};

const toDayKey = (value) => {
  const date = toDate(value);
  if (!date) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

const isFutureHearing = (value) => {
  const date = toDate(value);
  return Boolean(date && date.getTime() > Date.now());
};

const toDateInputValue = (value) => {
  const date = toDate(value);
  if (!date) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const proceedingFormFromHearing = (hearing) => ({
  judge: hearing?.judge || "",
  businessDate: toDateInputValue(hearing?.businessDate || hearing?.start || hearing?.date),
  purpose: hearing?.purpose || hearing?.description || "",
  outcome: hearing?.outcome || "",
  nextPurpose: hearing?.nextPurpose || "",
  nextHearingDate: toDateInputValue(hearing?.nextHearingDate),
});

const isValidEventTime = (timeStr) => {
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
  return timeRegex.test(timeStr.trim());
};

const combineEventDateAndTime = (date, timeStr) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error("Invalid date provided");
  }

  if (!timeStr || !isValidEventTime(timeStr)) {
    throw new Error("Invalid time format. Use HH:MM AM/PM (e.g., 10:30 AM)");
  }

  const result = new Date(date);
  const [timePart, ampm] = timeStr.trim().split(" ");
  const [hours, minutes] = timePart.split(":").map(Number);

  if (ampm.toUpperCase() === "PM" && hours < 12) {
    result.setHours(hours + 12, minutes, 0, 0);
  } else if (ampm.toUpperCase() === "AM" && hours === 12) {
    result.setHours(0, minutes, 0, 0);
  } else {
    result.setHours(hours, minutes, 0, 0);
  }

  return result;
};

const getNumericOrdinal = (value) => {
  const lastTwoDigits = value % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${value}th`;
  }

  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
};

const formatHearingAutoTitle = (serialNumber) =>
  `${getNumericOrdinal(serialNumber)} Hearing`;

const formatHearingDateParts = (value) => {
  const date = toDate(value);

  if (!date) {
    return {
      day: "TBD",
      month: "",
      weekday: "Date not set",
      year: "",
    };
  }

  return {
    day: date.toLocaleDateString("en-IN", { day: "2-digit" }),
    month: date.toLocaleDateString("en-IN", { month: "short" }),
    weekday: date.toLocaleDateString("en-IN", { weekday: "short" }),
    year: date.toLocaleDateString("en-IN", { year: "numeric" }),
  };
};

const getHearingCardTone = (hearing, index) => {
  if (hearing.status === "cancelled") {
    return {
      card: "border-red-200/80 bg-red-50/30",
      rail: "bg-red-700 text-white",
      side: "bg-red-50/60",
      chip: "bg-white/15 text-white",
      icon: "text-red-700",
    };
  }

  if (hearing.status === "postponed") {
    return {
      card: "border-amber-200/80 bg-amber-50/30",
      rail: "bg-amber-700 text-white",
      side: "bg-amber-50/60",
      chip: "bg-white/15 text-white",
      icon: "text-amber-700",
    };
  }

  if (hearing.status === "completed") {
    return {
      card: "border-emerald-200/80 bg-emerald-50/25",
      rail: "bg-emerald-700 text-white",
      side: "bg-emerald-50/50",
      chip: "bg-white/15 text-white",
      icon: "text-emerald-700",
    };
  }

  if (isPriorityAlertCase(hearing.priority)) {
    return {
      card: "border-red-200/80 bg-white",
      rail: "bg-[#03234b] text-white",
      side: "bg-red-50/50",
      chip: "bg-red-500/20 text-white",
      icon: "text-red-700",
    };
  }

  return {
    card: index % 2 === 0 ? "border-slate-200/80 bg-white" : "border-slate-200/80 bg-slate-50/45",
    rail: index % 2 === 0 ? "bg-[#03234b] text-white" : "bg-slate-800 text-white",
    side: index % 2 === 0 ? "bg-slate-50/70" : "bg-white/80",
    chip: "bg-white/15 text-white",
    icon: "text-[#03234b]",
  };
};

export default function HearingsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [hearings, setHearings] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("scheduled");
  const [filterType, setFilterType] = useState("all");
  const [filterCase, setFilterCase] = useState("all");
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);
  const [sendingReminderFor, setSendingReminderFor] = useState(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showProceedingsDialog, setShowProceedingsDialog] = useState(false);
  const [showViewProceedingsDialog, setShowViewProceedingsDialog] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [scheduleEventForm, setScheduleEventForm] = useState(() =>
    createScheduleEventForm()
  );
  const [schedulingEvent, setSchedulingEvent] = useState(false);
  const [proceedingForm, setProceedingForm] = useState(() =>
    proceedingFormFromHearing(null)
  );
  const [savingProceedings, setSavingProceedings] = useState(false);

  const isLawyer = user?.role === "lawyer" || user?.role === "admin";

  const fetchHearingsAndCases = async () => {
    try {
      setLoading(true);
      const [eventsData, casesData] = await Promise.all([
        api.events.getAll(),
        api.cases.getAll(),
      ]);

      setHearings(Array.isArray(eventsData) ? eventsData : []);
      setCases(Array.isArray(casesData) ? casesData : []);
    } catch (error) {
      console.error("Error loading hearings page data:", error);
      toast({
        title: "Error",
        description: "Failed to load hearings data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHearingsAndCases();

    const handleWindowFocus = () => {
      fetchHearingsAndCases();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchHearingsAndCases();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const normalizedHearings = useMemo(() => {
    const items = [];
    const caseMap = new Map(
      cases.map((caseItem) => [toKey(caseItem._id || caseItem.id), caseItem])
    );
    const hearingEventKeys = new Set();

    hearings.forEach((event) => {
      const caseId = toKey(event.case?._id || event.case);
      const caseObj = caseMap.get(caseId);
      const startDate = toDate(event.start);
      const eventDayKey = toDayKey(startDate);
      const clients = caseObj?.clients || [];

      if (caseId && eventDayKey && normalizeType(event.type) === "hearing") {
        hearingEventKeys.add(`${caseId}:${eventDayKey}`);
      }

      const advocate =
        formatLegalTeamSummary(caseObj, { withPrefix: true }) ||
        "Not assigned";
      const client =
        clients.find((person) => person.isPrimary)?.name ||
        clients[0]?.name ||
        "Not assigned";

      const petitioner = caseObj?.parties?.petitioner?.[0]?.name;
      const respondent = caseObj?.parties?.respondent?.[0]?.name;
      const defaultCaseName =
        petitioner && respondent
          ? `${petitioner} vs. ${respondent}`
          : caseObj?.title || event.caseTitle || event.title || "Untitled Case";

      items.push({
        id: event._id || event.id,
        sourceId: event._id || event.id,
        caseId,
        cnrNumber: caseObj?.cnrNumber || "",
        isCaseHearing: false,
        caseNumber: event.caseNumber || caseObj?.caseNumber || caseObj?.number || "N/A",
        caseName: defaultCaseName,
        date: event.start,
        time: startDate
          ? startDate.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "TBD",
        court: event.location || caseObj?.court || "Court not specified",
        courtroom: caseObj?.courtHall ? `Court Room ${caseObj.courtHall}` : "Court Room TBD",
        judge: caseObj?.judge || caseObj?.assignedJudge || "Not assigned",
        type: normalizeType(event.type),
        priority: getCasePriority(caseObj || {}, { hearingDate: event.start }),
        status: normalizeStatus(event.status),
        advocate,
        client,
        notes: event.description || "",
        purpose: event.purpose || event.description || "",
        businessDate: event.businessDate || event.start,
        nextPurpose: event.nextPurpose || "",
        nextHearingDate: event.nextHearingDate || null,
        description: event.description || "",
        outcome: event.outcome || "",
        start: event.start,
        end: event.end,
        location: event.location || caseObj?.court || "Courtroom",
        eventTitle: event.title,
        documentsRequired: [],
        updatedAt: event.updatedAt || event.createdAt || event.start,
      });
    });

    cases.forEach((caseItem) => {
      const caseId = toKey(caseItem._id || caseItem.id);
      const nextHearing = caseItem.nextHearingDate || caseItem.hearingDate;
      const nextHearingDayKey = toDayKey(nextHearing);
      const nextHearingKey =
        caseId && nextHearingDayKey ? `${caseId}:${nextHearingDayKey}` : null;

      if (
        !caseId ||
        !nextHearing ||
        (nextHearingKey && hearingEventKeys.has(nextHearingKey))
      ) {
        return;
      }

      const startDate = toDate(nextHearing);
      const clients = caseItem.clients || [];

      const advocate =
        formatLegalTeamSummary(caseItem, { withPrefix: true }) ||
        "Not assigned";
      const client =
        clients.find((person) => person.isPrimary)?.name ||
        clients[0]?.name ||
        "Not assigned";
      const petitioner = caseItem?.parties?.petitioner?.[0]?.name;
      const respondent = caseItem?.parties?.respondent?.[0]?.name;

      items.push({
        id: `case-${caseId}`,
        sourceId: null,
        caseId,
        cnrNumber: caseItem.cnrNumber || "",
        isCaseHearing: true,
        caseNumber: caseItem.caseNumber || caseItem.number || "N/A",
        caseName:
          petitioner && respondent
            ? `${petitioner} vs. ${respondent}`
            : caseItem.title || "Untitled Case",
        date: nextHearing,
        time: startDate
          ? startDate.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "TBD",
        court: caseItem.court || "Court not specified",
        courtroom: caseItem.courtHall ? `Court Room ${caseItem.courtHall}` : "Court Room TBD",
        judge: caseItem.judge || caseItem.assignedJudge || "Not assigned",
        type: "hearing",
        priority: getCasePriority(caseItem),
        status:
          startDate && startDate < new Date()
            ? "completed"
            : "scheduled",
        advocate,
        client,
        notes: "Hearing scheduled from case timeline.",
        purpose: "Hearing scheduled from case timeline.",
        businessDate: nextHearing,
        nextPurpose: "",
        nextHearingDate: null,
        description: "Hearing scheduled from case timeline.",
        outcome: "",
        start: nextHearing,
        end: startDate
          ? new Date(startDate.getTime() + 60 * 60 * 1000).toISOString()
          : null,
        location: caseItem.court || "Courtroom",
        eventTitle: `Hearing for ${caseItem.title || caseItem.caseNumber || "Case"}`,
        documentsRequired: [],
        updatedAt: caseItem.updatedAt || caseItem.createdAt || nextHearing,
      });
    });

    return items.sort((a, b) => {
      const aTime = toDate(a.date)?.getTime() || Number.MAX_SAFE_INTEGER;
      const bTime = toDate(b.date)?.getTime() || Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  }, [hearings, cases]);

  const caseFilterOptions = useMemo(() => {
    const options = normalizedHearings
      .filter((hearing) => hearing.caseId)
      .map((hearing) => ({
        value: hearing.caseId,
        label:
          formatDisplayCaseNumber({ caseNumber: hearing.caseNumber }) ||
          hearing.caseNumber ||
          hearing.caseName,
        secondaryLabel: hearing.caseName,
      }));

    return Array.from(
      new Map(options.map((option) => [option.value, option])).values()
    ).sort((a, b) => {
      const labelCompare = a.label.localeCompare(b.label, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      if (labelCompare !== 0) {
        return labelCompare;
      }

      return a.secondaryLabel.localeCompare(b.secondaryLabel, undefined, {
        sensitivity: "base",
      });
    });
  }, [normalizedHearings]);

  const todayHearings = useMemo(() => {
    const today = new Date().toDateString();
    return normalizedHearings.filter((hearing) => {
      const hearingDate = toDate(hearing.date);
      return (
        hearing.status === "scheduled" &&
        hearingDate &&
        hearingDate.toDateString() === today
      );
    });
  }, [normalizedHearings]);

  const upcomingHearings = useMemo(() => {
    const now = new Date();
    return normalizedHearings.filter((hearing) => {
      const hearingDate = toDate(hearing.date);
      return hearing.status === "scheduled" && hearingDate && hearingDate >= now;
    });
  }, [normalizedHearings]);

  const thisMonthHearings = useMemo(() => {
    const now = new Date();
    return normalizedHearings.filter((hearing) => {
      const hearingDate = toDate(hearing.date);
      return (
        hearingDate &&
        hearingDate.getMonth() === now.getMonth() &&
        hearingDate.getFullYear() === now.getFullYear()
      );
    });
  }, [normalizedHearings]);

  const completedHearings = useMemo(() => {
    return normalizedHearings.filter((hearing) => hearing.status === "completed");
  }, [normalizedHearings]);

  const displayedHearings = useMemo(() => {
    let base;
    switch (activeQuickFilter) {
      case "today": base = todayHearings; break;
      case "upcoming": base = upcomingHearings; break;
      case "thisMonth": base = thisMonthHearings; break;
      case "completed": base = completedHearings; break;
      default: base = normalizedHearings;
    }
    const lower = searchTerm.toLowerCase();
    return base.filter((hearing) => {
      const matchesSearch = !searchTerm ||
        hearing.caseName.toLowerCase().includes(lower) ||
        hearing.caseNumber.toLowerCase().includes(lower) ||
        hearing.court.toLowerCase().includes(lower) ||
        hearing.judge.toLowerCase().includes(lower);
      const matchesType = filterType === "all" || hearing.type === filterType;
      const matchesCase = filterCase === "all" || hearing.caseId === filterCase;
      const matchesStatus = activeQuickFilter
        ? true
        : filterStatus === "all" || hearing.status === filterStatus;
      return matchesSearch && matchesType && matchesCase && matchesStatus;
    });
  }, [activeQuickFilter, todayHearings, upcomingHearings, thisMonthHearings, completedHearings, normalizedHearings, searchTerm, filterType, filterCase, filterStatus]);

  const handleQuickFilter = (key) => {
    setActiveQuickFilter((prev) => (prev === key ? null : key));
  };

  const handleSendReminder = async (hearing) => {
    if (!hearing.caseId) {
      toast({
        title: "Error",
        description: "No case associated with this hearing.",
        variant: "destructive",
      });
      return;
    }
    setSendingReminderFor(hearing.id);
    try {
      const result = await api.cases.sendReminder(hearing.caseId);
      toast({
        title: "Reminder Sent",
        description: result?.message || "Reminder emails sent to all case participants.",
      });
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder.",
        variant: "destructive",
      });
    } finally {
      setSendingReminderFor(null);
    }
  };

  const handleOpenScheduleDialog = () => {
    setScheduleEventForm(createScheduleEventForm());
    setShowScheduleDialog(true);
  };

  const handleScheduleEventChange = (field, value) => {
    setScheduleEventForm((prev) => {
      if (field === "case") {
        if (value === "none") {
          return { ...prev, case: value };
        }

        const selectedCase = cases.find(
          (caseItem) => (caseItem._id || caseItem.id) === value
        );
        const nextHearingNumber =
          normalizedHearings.filter((hearing) => hearing.caseId === value)
            .length + 1;

        return {
          ...prev,
          case: value,
          title: formatHearingAutoTitle(nextHearingNumber),
          location: prev.location || selectedCase?.court || "",
        };
      }

      return { ...prev, [field]: value };
    });
  };

  const handleCreateScheduleEvent = async () => {
    if (!scheduleEventForm.title.trim()) {
      toast({
        title: "Missing title",
        description: "Please provide a title for the hearing.",
        variant: "destructive",
      });
      return;
    }

    if (
      !(scheduleEventForm.date instanceof Date) ||
      Number.isNaN(scheduleEventForm.date.getTime())
    ) {
      toast({
        title: "Invalid date",
        description: "Please select a valid hearing date.",
        variant: "destructive",
      });
      return;
    }

    if (
      !scheduleEventForm.time ||
      !isValidEventTime(scheduleEventForm.time)
    ) {
      toast({
        title: "Invalid time",
        description: "Please provide a valid time (e.g., 10:30 AM).",
        variant: "destructive",
      });
      return;
    }

    if (
      scheduleEventForm.type !== "client_meeting" &&
      (!scheduleEventForm.case || scheduleEventForm.case === "none")
    ) {
      toast({
        title: "Missing case",
        description: "Please select a case for this hearing.",
        variant: "destructive",
      });
      return;
    }

    const startTime = combineEventDateAndTime(
      scheduleEventForm.date,
      scheduleEventForm.time
    );

    if (startTime <= new Date()) {
      toast({
        title: "Invalid start time",
        description: "Hearing start time must be in the future.",
        variant: "destructive",
      });
      return;
    }

    setSchedulingEvent(true);

    try {
      await api.events.create({
        title: scheduleEventForm.title.trim(),
        case:
          scheduleEventForm.case === "none"
            ? undefined
            : scheduleEventForm.case,
        start: startTime.toISOString(),
        end: new Date(startTime.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        type: scheduleEventForm.type,
        location: scheduleEventForm.location.trim(),
        description: scheduleEventForm.description.trim(),
      });

      setScheduleEventForm(createScheduleEventForm());
      setShowScheduleDialog(false);
      await fetchHearingsAndCases();
      toast({
        title: "Hearing scheduled",
        description: "The hearing has been added to your calendar.",
      });
    } catch (error) {
      console.error("Error scheduling hearing:", error);
      toast({
        title: "Error scheduling hearing",
        description:
          error.message || "There was an error creating the hearing.",
        variant: "destructive",
      });
    } finally {
      setSchedulingEvent(false);
    }
  };

  const handleViewProceedings = (hearing) => {
    setSelectedHearing(hearing);
    setShowViewProceedingsDialog(true);
  };

  const handleEditProceedings = (hearing) => {
    setSelectedHearing(hearing);
    setProceedingForm(proceedingFormFromHearing(hearing));
    setShowProceedingsDialog(true);
  };

  const handleSaveProceedings = async () => {
    if (!selectedHearing?.caseId) {
      toast({
        title: "Error",
        description: "This hearing is not linked to a case.",
        variant: "destructive",
      });
      return;
    }

    const hearingStart = toDate(selectedHearing.start || selectedHearing.date);
    if (!hearingStart) {
      toast({
        title: "Error",
        description: "Hearing date is invalid.",
        variant: "destructive",
      });
      return;
    }

    setSavingProceedings(true);

    try {
      const nextHearingDate = proceedingForm.nextHearingDate
        ? new Date(`${proceedingForm.nextHearingDate}T00:00:00`)
        : null;
      const payload = {
        title: selectedHearing.eventTitle || `Hearing for ${selectedHearing.caseName}`,
        start: hearingStart.toISOString(),
        end:
          selectedHearing.end ||
          new Date(hearingStart.getTime() + 60 * 60 * 1000).toISOString(),
        type: "hearing",
        case: selectedHearing.caseId,
        location: selectedHearing.location || selectedHearing.court || "Courtroom",
        description:
          proceedingForm.purpose.trim() ||
          selectedHearing.description ||
          selectedHearing.notes ||
          "Recorded from hearings page",
        outcome: proceedingForm.outcome,
        judge: proceedingForm.judge.trim(),
        businessDate: proceedingForm.businessDate
          ? new Date(`${proceedingForm.businessDate}T00:00:00`).toISOString()
          : null,
        purpose: proceedingForm.purpose.trim(),
        nextPurpose: proceedingForm.nextPurpose.trim(),
        nextHearingDate: nextHearingDate ? nextHearingDate.toISOString() : null,
        status: selectedHearing.status || "completed",
      };

      if (selectedHearing.sourceId) {
        await api.events.update(selectedHearing.sourceId, payload);
      } else {
        await api.events.create(payload);
      }

      setShowProceedingsDialog(false);
      setSelectedHearing(null);
      setProceedingForm(proceedingFormFromHearing(null));
      await fetchHearingsAndCases();
      toast({
        title: "Success",
        description: "Proceedings saved successfully.",
      });
    } catch (error) {
      console.error("Error saving proceedings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save proceedings.",
        variant: "destructive",
      });
    } finally {
      setSavingProceedings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground font-medium">Loading hearings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hearings</h1>
          <p className="text-muted-foreground">Manage court hearings and schedules</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.push("/dashboard/calendar")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={handleOpenScheduleDialog}
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Hearing
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer transition-all ${activeQuickFilter === "today" ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"}`}
          onClick={() => handleQuickFilter("today")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Hearings</p>
                <p className="text-2xl font-bold">{todayHearings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${activeQuickFilter === "upcoming" ? "ring-2 ring-amber-500 bg-amber-50" : "hover:shadow-md"}`}
          onClick={() => handleQuickFilter("upcoming")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingHearings.length}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${activeQuickFilter === "thisMonth" ? "ring-2 ring-green-600 bg-green-50" : "hover:shadow-md"}`}
          onClick={() => handleQuickFilter("thisMonth")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{thisMonthHearings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${activeQuickFilter === "completed" ? "ring-2 ring-gray-500 bg-gray-50" : "hover:shadow-md"}`}
          onClick={() => handleQuickFilter("completed")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedHearings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Hearings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search hearings..."
                className="pl-10"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="postponed">Postponed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hearing">Hearing</SelectItem>
                <SelectItem value="argument">Argument</SelectItem>
                <SelectItem value="judgment">Judgment</SelectItem>
                <SelectItem value="case_management">Case Management</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCase} onValueChange={setFilterCase}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Case" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cases</SelectItem>
                {caseFilterOptions.map((caseOption) => (
                  <SelectItem key={caseOption.value} value={caseOption.value}>
                    {caseOption.label} {caseOption.secondaryLabel ? `- ${caseOption.secondaryLabel}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                toast({
                  title: "Advanced Filters",
                  description: "Advanced filter options coming soon.",
                })
              }
            >
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeQuickFilter && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Showing: <span className="font-medium text-foreground capitalize">{activeQuickFilter === "thisMonth" ? "This Month" : activeQuickFilter === "today" ? "Today's Hearings" : activeQuickFilter.charAt(0).toUpperCase() + activeQuickFilter.slice(1)}</span></span>
          <button className="underline text-primary ml-1" onClick={() => setActiveQuickFilter(null)}>Clear</button>
        </div>
      )}

      <div className="grid gap-3">
        {displayedHearings.map((hearing, index) => {
          const dateParts = formatHearingDateParts(hearing.date);
          const tone = getHearingCardTone(hearing, index);
          const displayCaseNumber =
            formatDisplayCaseNumber({ caseNumber: hearing.caseNumber }) ||
            hearing.caseNumber;

          return (
            <Card
              key={hearing.id}
              className={`group overflow-hidden shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${tone.card}`}
            >
              <CardContent className="p-0">
                <div className="grid gap-0 md:grid-cols-[7rem_minmax(0,1fr)] lg:grid-cols-[7rem_minmax(0,1fr)_12rem]">
                  <div className={`flex items-center gap-3 p-3 md:flex-col md:items-start md:justify-between ${tone.rail}`}>
                    <div className="min-w-0">
                      <div className="flex items-end gap-1 md:block">
                        <p className="text-2xl font-semibold leading-none tracking-normal">{dateParts.day}</p>
                        <p className="text-xs font-semibold uppercase tracking-normal md:mt-0.5">{dateParts.month}</p>
                      </div>
                      <p className="mt-0.5 text-[11px] text-white/75">
                        {dateParts.weekday}{dateParts.year ? `, ${dateParts.year}` : ""}
                      </p>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold md:ml-0">
                      <Clock className="h-3 w-3" />
                      <span>{hearing.time}</span>
                    </div>
                    <div className={`hidden rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-normal md:block ${tone.chip}`}>
                      {hearing.status}
                    </div>
                  </div>

                  <div className="min-w-0 space-y-3 p-3 sm:p-4">
                    <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md border bg-white/70 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {displayCaseNumber}
                          </span>
                          <Badge className={getTypeColor(hearing.type)}>
                            {hearing.type.replace("_", " ").toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(hearing.status)}>
                            {hearing.status.toUpperCase()}
                          </Badge>
                        </div>
                        <h3 className="line-clamp-1 text-base font-semibold leading-snug text-foreground">
                          {hearing.caseName}
                        </h3>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5 rounded-md border bg-white/75 px-2 py-1">
                        <span className="text-[11px] text-muted-foreground">Priority</span>
                        <Badge className={getCasePriorityColor(hearing.priority)}>
                          {getCasePriorityLabel(hearing.priority)}
                        </Badge>
                        {isPriorityAlertCase(hearing.priority) && (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
                      <div className="min-w-0 rounded-md border bg-white/70 p-2">
                        <div className="mb-0.5 flex items-center gap-1.5 font-medium text-muted-foreground">
                          <MapPin className={`h-3 w-3 ${tone.icon}`} />
                          Venue
                        </div>
                        <p className="truncate text-sm font-medium text-foreground">{hearing.court}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{hearing.courtroom}</p>
                      </div>
                      <div className="min-w-0 rounded-md border bg-white/70 p-2">
                        <div className="mb-0.5 flex items-center gap-1.5 font-medium text-muted-foreground">
                          <User className={`h-3 w-3 ${tone.icon}`} />
                          Advocate
                        </div>
                        <p className="truncate text-sm font-medium text-foreground">{hearing.advocate}</p>
                      </div>
                      <div className="min-w-0 rounded-md border bg-white/70 p-2">
                        <div className="mb-0.5 flex items-center gap-1.5 font-medium text-muted-foreground">
                          <User className={`h-3 w-3 ${tone.icon}`} />
                          Client
                        </div>
                        <p className="truncate text-sm font-medium text-foreground">{hearing.client}</p>
                      </div>
                      <div className="min-w-0 rounded-md border bg-white/70 p-2">
                        <div className="mb-0.5 flex items-center gap-1.5 font-medium text-muted-foreground">
                          <Calendar className={`h-3 w-3 ${tone.icon}`} />
                          Updated
                        </div>
                        <p className="truncate text-sm font-medium text-foreground">
                          {toDate(hearing.updatedAt)
                            ? toDate(hearing.updatedAt).toLocaleDateString()
                            : new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className={`grid gap-2 text-xs ${hearing.notes ? "lg:grid-cols-2" : ""}`}>
                      {hearing.notes && (
                        <div className="min-w-0 rounded-md border border-[#03234b]/15 bg-[#03234b]/5 px-2 py-1.5">
                          <span className="mr-1 font-semibold uppercase tracking-normal text-[#03234b]">Notes</span>
                          <span className="line-clamp-1 text-muted-foreground">{hearing.notes}</span>
                        </div>
                      )}
                      <div className="min-w-0 rounded-md border bg-white/75 px-2 py-1.5">
                        <span className="mr-1 font-semibold uppercase tracking-normal text-foreground">Proceedings</span>
                        <span className="line-clamp-1 text-muted-foreground">
                          {hearing.outcome
                            ? `${hearing.outcome.slice(0, 120)}${hearing.outcome.length > 120 ? "..." : ""}`
                            : "No proceedings recorded yet."}
                        </span>
                      </div>
                    </div>

                    {hearing.documentsRequired.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Documents</span>
                        {hearing.documentsRequired.map((doc, docIndex) => (
                          <Badge key={docIndex} variant="outline" className="text-xs">
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={`flex flex-col justify-between gap-2 border-t p-3 lg:border-l lg:border-t-0 ${tone.side}`}>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-medium uppercase tracking-normal text-muted-foreground">Actions</p>
                      <p className="line-clamp-1 text-[11px] text-muted-foreground">
                        {isFutureHearing(hearing.date)
                          ? "Proceedings unlock after hearing date."
                          : hearing.outcome
                            ? "Proceedings available."
                            : "Proceedings not recorded."}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 justify-center bg-white/80 px-2 text-[11px]"
                        disabled={isFutureHearing(hearing.date)}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleViewProceedings(hearing);
                        }}
                      >
                        View Proceeding
                      </Button>

                      {isLawyer && (
                        <Button
                          variant={hearing.outcome ? "outline" : "secondary"}
                          size="sm"
                          className="h-7 justify-center px-2 text-[11px]"
                          disabled={isFutureHearing(hearing.date)}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditProceedings(hearing);
                          }}
                        >
                          {hearing.outcome ? "Edit Proceeding" : "Add Proceeding"}
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 justify-center bg-white/80 px-2 text-[11px]"
                        disabled={!hearing.caseId}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (hearing.caseId) {
                            router.push(`/dashboard/cases/${hearing.caseId}`);
                            return;
                          }
                          toast({
                            title: "Case Unavailable",
                            description: "This hearing is not linked to a case.",
                          });
                        }}
                      >
                        View Case
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 justify-center bg-white/80 px-2 text-[11px]"
                        disabled={sendingReminderFor === hearing.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleSendReminder(hearing);
                        }}
                      >
                        {sendingReminderFor === hearing.id ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Reminder"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {displayedHearings.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hearings found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or schedule a new hearing.
            </p>
            <Button onClick={handleOpenScheduleDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Hearing
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new event on your calendar
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="schedule-event-title">Event Title</Label>
              <Input
                id="schedule-event-title"
                value={scheduleEventForm.title}
                onChange={(event) =>
                  handleScheduleEventChange("title", event.target.value)
                }
                placeholder="Enter event title"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="schedule-event-date">Date</Label>
                <DatePicker
                  id="schedule-event-date"
                  selected={scheduleEventForm.date}
                  onSelect={(date) =>
                    handleScheduleEventChange("date", date || new Date())
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="schedule-event-time">Time</Label>
                <Input
                  id="schedule-event-time"
                  value={scheduleEventForm.time}
                  onChange={(event) =>
                    handleScheduleEventChange("time", event.target.value)
                  }
                  placeholder="e.g. 10:30 AM"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="schedule-event-type">Event Type</Label>
                <Select
                  value={scheduleEventForm.type}
                  onValueChange={(value) =>
                    handleScheduleEventChange("type", value)
                  }
                >
                  <SelectTrigger id="schedule-event-type">
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
                <Label htmlFor="schedule-event-case">Related Case</Label>
                <Select
                  value={scheduleEventForm.case}
                  onValueChange={(value) =>
                    handleScheduleEventChange("case", value)
                  }
                >
                  <SelectTrigger id="schedule-event-case">
                    <SelectValue placeholder="Select case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="none"
                      disabled={scheduleEventForm.type !== "client_meeting"}
                    >
                      None
                    </SelectItem>
                    {cases.map((caseItem) => {
                      const caseId = caseItem._id || caseItem.id;
                      return (
                        <SelectItem key={caseId} value={caseId}>
                          {caseItem.title ||
                            formatDisplayCaseNumber({
                              caseNumber: caseItem.caseNumber || caseItem.number,
                            }) ||
                            "Untitled Case"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="schedule-event-location">Location</Label>
              <Input
                id="schedule-event-location"
                value={scheduleEventForm.location}
                onChange={(event) =>
                  handleScheduleEventChange("location", event.target.value)
                }
                placeholder="Enter location"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="schedule-event-description">Description</Label>
              <Textarea
                id="schedule-event-description"
                value={scheduleEventForm.description}
                onChange={(event) =>
                  handleScheduleEventChange("description", event.target.value)
                }
                placeholder="Enter event description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowScheduleDialog(false);
                setScheduleEventForm(createScheduleEventForm());
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateScheduleEvent}
              disabled={
                schedulingEvent ||
                !scheduleEventForm.title ||
                !scheduleEventForm.date
              }
            >
              {schedulingEvent ? "Adding..." : "Add Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProceedingsDialog} onOpenChange={setShowProceedingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedHearing?.outcome ? "Edit Proceeding" : "Add Proceeding"}
            </DialogTitle>
            <DialogDescription>
              Capture the judge, business date, purpose, business, and next listing details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hearing-proceeding-judge">Judge</Label>
                <Input
                  id="hearing-proceeding-judge"
                  value={proceedingForm.judge}
                  onChange={(event) =>
                    setProceedingForm((prev) => ({ ...prev, judge: event.target.value }))
                  }
                  placeholder="Enter judge name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hearing-proceeding-business-date">Business on Date</Label>
                <Input
                  id="hearing-proceeding-business-date"
                  type="date"
                  value={proceedingForm.businessDate}
                  onChange={(event) =>
                    setProceedingForm((prev) => ({ ...prev, businessDate: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hearing-proceeding-purpose">Purpose of Hearing</Label>
              <Input
                id="hearing-proceeding-purpose"
                value={proceedingForm.purpose}
                onChange={(event) =>
                  setProceedingForm((prev) => ({ ...prev, purpose: event.target.value }))
                }
                placeholder="Enter purpose of hearing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hearing-proceeding-business">Business</Label>
              <Textarea
                id="hearing-proceeding-business"
                rows={6}
                placeholder="Describe what happened during this hearing..."
                value={proceedingForm.outcome}
                onChange={(event) =>
                  setProceedingForm((prev) => ({ ...prev, outcome: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hearing-proceeding-next-purpose">Next Purpose</Label>
                <Input
                  id="hearing-proceeding-next-purpose"
                  value={proceedingForm.nextPurpose}
                  onChange={(event) =>
                    setProceedingForm((prev) => ({ ...prev, nextPurpose: event.target.value }))
                  }
                  placeholder="Enter next purpose"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hearing-proceeding-next-hearing-date">Next Hearing Date</Label>
                <Input
                  id="hearing-proceeding-next-hearing-date"
                  type="date"
                  value={proceedingForm.nextHearingDate}
                  onChange={(event) =>
                    setProceedingForm((prev) => ({ ...prev, nextHearingDate: event.target.value }))
                  }
                />
              </div>
            </div>
            <Button onClick={handleSaveProceedings} disabled={savingProceedings}>
              {savingProceedings ? "Saving..." : "Save Proceedings"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showViewProceedingsDialog}
        onOpenChange={setShowViewProceedingsDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daily Status</DialogTitle>
            <DialogDescription>
              {selectedHearing?.caseName || "Hearing details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-foreground">
            <div>
              <p className="font-medium">{selectedHearing?.court || "Court details not available"}</p>
              <p className="text-muted-foreground">In the court of: {selectedHearing?.judge || "Not available"}</p>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <p>CNR Number: {selectedHearing?.cnrNumber || "Not available"}</p>
              <p>Case Number: {formatDisplayCaseNumber({ caseNumber: selectedHearing?.caseNumber }) || selectedHearing?.caseNumber || "Not available"}</p>
              <p>Date: {selectedHearing?.businessDate ? new Date(selectedHearing.businessDate).toLocaleDateString() : "Not available"}</p>
              <p>Hearing Date: {selectedHearing?.date ? new Date(selectedHearing.date).toLocaleDateString() : "Not available"}</p>
            </div>
            <div>
              <p className="font-medium">Purpose</p>
              <p className="text-muted-foreground">{selectedHearing?.purpose || "Not specified"}</p>
            </div>
            <div>
              <p className="font-medium">Business</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {selectedHearing?.outcome || "No proceedings recorded for this hearing."}
              </p>
            </div>
            <div>
              <p className="font-medium">Next Purpose</p>
              <p className="text-muted-foreground">{selectedHearing?.nextPurpose || "Not specified"}</p>
            </div>
            <div>
              <p className="font-medium">Next Hearing Date</p>
              <p className="text-muted-foreground">
                {selectedHearing?.nextHearingDate
                  ? new Date(selectedHearing.nextHearingDate).toLocaleDateString()
                  : "Not available"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
