"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import api from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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

const getTypeColor = (type) => {
  switch (type) {
    case "hearing":
      return "bg-[#03234b]/20 text-[#03234b] border border-[#03234b]/30";
    case "argument":
      return "bg-purple-100 text-purple-800 border border-purple-200";
    case "judgment":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    case "case_management":
      return "bg-green-100 text-green-800 border border-green-200";
    default:
      return "bg-muted text-foreground";
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "scheduled":
      return "bg-primary text-primary-foreground";
    case "completed":
      return "bg-green-600 text-white";
    case "postponed":
      return "bg-amber-500 text-white";
    case "cancelled":
      return "bg-red-600 text-white";
    default:
      return "bg-muted text-foreground";
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
  const [showProceedingsDialog, setShowProceedingsDialog] = useState(false);
  const [showViewProceedingsDialog, setShowViewProceedingsDialog] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [proceedingsValue, setProceedingsValue] = useState("");
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

  const handleViewProceedings = (hearing) => {
    setSelectedHearing(hearing);
    setShowViewProceedingsDialog(true);
  };

  const handleEditProceedings = (hearing) => {
    setSelectedHearing(hearing);
    setProceedingsValue(hearing.outcome || "");
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
      const payload = {
        title: selectedHearing.eventTitle || `Hearing for ${selectedHearing.caseName}`,
        start: hearingStart.toISOString(),
        end:
          selectedHearing.end ||
          new Date(hearingStart.getTime() + 60 * 60 * 1000).toISOString(),
        type: "hearing",
        case: selectedHearing.caseId,
        location: selectedHearing.location || selectedHearing.court || "Courtroom",
        description: selectedHearing.description || selectedHearing.notes || "Recorded from hearings page",
        outcome: proceedingsValue,
        status: selectedHearing.status || "completed",
      };

      if (selectedHearing.sourceId) {
        await api.events.update(selectedHearing.sourceId, payload);
      } else {
        await api.events.create(payload);
      }

      setShowProceedingsDialog(false);
      setSelectedHearing(null);
      setProceedingsValue("");
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
            onClick={() => router.push("/dashboard/calendar")}
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

      <div className="grid gap-4">
        {displayedHearings.map((hearing) => (
          <Card key={hearing.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Case Name</p>
                    <h3 className="text-lg font-semibold text-foreground leading-snug">
                      {hearing.caseName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-muted-foreground">Priority:</span>
                      <Badge className={getCasePriorityColor(hearing.priority)}>
                        {getCasePriorityLabel(hearing.priority)}
                      </Badge>
                      {isPriorityAlertCase(hearing.priority) && (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Filing Number</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatDisplayCaseNumber({ caseNumber: hearing.caseNumber }) || hearing.caseNumber}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-1 flex-wrap">
                      <Badge className={getTypeColor(hearing.type)}>
                        {hearing.type.replace("_", " ").toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(hearing.status)}>
                        {hearing.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Date & Time</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold">
                        {toDate(hearing.date)
                          ? toDate(hearing.date).toLocaleDateString()
                          : "TBD"}
                      </p>
                      <p className="text-muted-foreground">{hearing.time}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Venue</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold">{hearing.court}</p>
                      <p className="text-muted-foreground">{hearing.courtroom}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Advocate:</span>
                    <span className="font-medium">{hearing.advocate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Client:</span>
                    <span className="font-medium">{hearing.client}</span>
                  </div>
                </div>

                {hearing.notes && (
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">Notes:</p>
                    <p className="text-sm text-muted-foreground">{hearing.notes}</p>
                  </div>
                )}

                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-sm font-medium text-foreground mb-1">Proceedings</p>
                  <p className="text-sm text-muted-foreground">
                    {hearing.outcome
                      ? `${hearing.outcome.slice(0, 120)}${hearing.outcome.length > 120 ? "..." : ""}`
                      : "No proceedings recorded yet."}
                  </p>
                </div>

                {hearing.documentsRequired.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Documents Required:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {hearing.documentsRequired.map((doc, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {doc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-xs text-muted-foreground">
                    Last updated:{" "}
                    {toDate(hearing.updatedAt)
                      ? toDate(hearing.updatedAt).toLocaleDateString()
                      : new Date().toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
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
                        variant="outline"
                        size="sm"
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
                      onClick={(event) => {
                        event.stopPropagation();
                        if (hearing.caseId) {
                          router.push(`/dashboard/cases/${hearing.caseId}`);
                          return;
                        }
                        toast({
                          title: "Edit Hearing",
                          description: `Editing ${hearing.caseNumber} hearing.`,
                        });
                      }}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={sendingReminderFor === hearing.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSendReminder(hearing);
                      }}
                    >
                      {sendingReminderFor === hearing.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
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
        ))}
      </div>

      {displayedHearings.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No hearings found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setFilterType("all");
                  setFilterCase("all");
                  setActiveQuickFilter(null);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showProceedingsDialog} onOpenChange={setShowProceedingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedHearing?.outcome ? "Edit Proceeding" : "Add Proceeding"}
            </DialogTitle>
            <DialogDescription>
              Record what happened during this hearing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              rows={6}
              placeholder="Describe what happened during this hearing..."
              value={proceedingsValue}
              onChange={(event) => setProceedingsValue(event.target.value)}
            />
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
            <DialogTitle>Proceedings</DialogTitle>
            <DialogDescription>
              {selectedHearing?.caseName || "Hearing details"}
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">
            {selectedHearing?.outcome || "No proceedings recorded for this hearing."}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
