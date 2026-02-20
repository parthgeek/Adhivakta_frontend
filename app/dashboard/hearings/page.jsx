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

const normalizePriority = (priority) => {
  switch (priority) {
    case "critical":
    case "high":
      return "high";
    case "low":
      return "low";
    default:
      return "medium";
  }
};

const getTypeColor = (type) => {
  switch (type) {
    case "hearing":
      return "bg-blue-100 text-blue-800 border border-blue-200";
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

const getPriorityColor = (priority) => {
  switch (priority) {
    case "high":
      return "bg-red-600 text-white";
    case "medium":
      return "bg-amber-400 text-black";
    case "low":
      return "bg-green-600 text-white";
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

export default function HearingsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [hearings, setHearings] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

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
  }, []);

  const normalizedHearings = useMemo(() => {
    const items = [];
    const caseMap = new Map(
      cases.map((caseItem) => [toKey(caseItem._id || caseItem.id), caseItem])
    );
    const eventCaseIds = new Set();

    hearings.forEach((event) => {
      const caseId = toKey(event.case?._id || event.case);
      if (caseId) {
        eventCaseIds.add(caseId);
      }

      const caseObj = caseMap.get(caseId);
      const startDate = toDate(event.start);
      const lawyers = caseObj?.lawyers || [];
      const clients = caseObj?.clients || [];

      const advocate =
        lawyers.find((lawyer) => lawyer.isPrimary || lawyer.isLead)?.name ||
        lawyers[0]?.name ||
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
        priority: normalizePriority(event.priority),
        status: normalizeStatus(event.status),
        advocate,
        client,
        notes: event.description || "",
        documentsRequired: [],
        updatedAt: event.updatedAt || event.createdAt || event.start,
      });
    });

    cases.forEach((caseItem) => {
      const caseId = toKey(caseItem._id || caseItem.id);
      const nextHearing = caseItem.nextHearingDate || caseItem.hearingDate;
      if (!caseId || !nextHearing || eventCaseIds.has(caseId)) {
        return;
      }

      const startDate = toDate(nextHearing);
      const lawyers = caseItem.lawyers || [];
      const clients = caseItem.clients || [];

      const advocate =
        lawyers.find((lawyer) => lawyer.isPrimary || lawyer.isLead)?.name ||
        lawyers[0]?.name ||
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
        priority: normalizePriority(caseItem.priority),
        status:
          startDate && startDate < new Date()
            ? "completed"
            : "scheduled",
        advocate,
        client,
        notes: "Hearing scheduled from case timeline.",
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

  const filteredHearings = useMemo(() => {
    return normalizedHearings.filter((hearing) => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch =
        hearing.caseName.toLowerCase().includes(lowerSearchTerm) ||
        hearing.caseNumber.toLowerCase().includes(lowerSearchTerm) ||
        hearing.court.toLowerCase().includes(lowerSearchTerm) ||
        hearing.judge.toLowerCase().includes(lowerSearchTerm);

      const matchesStatus =
        filterStatus === "all" || hearing.status === filterStatus;
      const matchesType = filterType === "all" || hearing.type === filterType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [normalizedHearings, searchTerm, filterStatus, filterType]);

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

  const handleUpdateStatus = async (hearing) => {
    if (!isLawyer) {
      toast({
        title: "Permission Denied",
        description: "Only lawyers can update hearing status.",
        variant: "destructive",
      });
      return;
    }

    if (hearing.isCaseHearing || !hearing.sourceId) {
      toast({
        title: "Status Update",
        description: `${hearing.caseNumber} is case-derived. Update via case details.`,
      });
      return;
    }

    try {
      await api.events.update(hearing.sourceId, { status: "completed" });
      toast({
        title: "Status Updated",
        description: `${hearing.caseNumber} status has been updated.`,
      });
      fetchHearingsAndCases();
    } catch (error) {
      console.error("Error updating hearing status:", error);
      toast({
        title: "Error",
        description: "Failed to update hearing status.",
        variant: "destructive",
      });
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
        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      <div className="grid gap-4">
        {filteredHearings.map((hearing) => (
          <Card key={hearing.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-foreground">
                        {hearing.caseNumber}
                      </h3>
                      <Badge className={getTypeColor(hearing.type)}>
                        {hearing.type.replace("_", " ").toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(hearing.status)}>
                        {hearing.status.toUpperCase()}
                      </Badge>
                      <Badge className={getPriorityColor(hearing.priority)}>
                        {hearing.priority.toUpperCase()}
                      </Badge>
                      {hearing.priority === "high" && (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-base text-muted-foreground">{hearing.caseName}</p>
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
                    <span className="text-muted-foreground">Judge:</span>
                    <span className="font-medium">{hearing.judge}</span>
                  </div>
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
                      onClick={(event) => {
                        event.stopPropagation();
                        toast({
                          title: "Added to Calendar",
                          description: `${hearing.caseNumber} hearing added to calendar.`,
                        });
                      }}
                    >
                      Add to Calendar
                    </Button>

                    <Button
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleUpdateStatus(hearing);
                      }}
                    >
                      Update Status
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredHearings.length === 0 && (
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
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
