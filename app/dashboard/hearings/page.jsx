"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import api from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Calendar,
    Clock,
    MapPin,
    Search,
    Plus,
    Filter,
    Gavel,
    User,
    Users,
    FileText,
    Bell,
    Edit3,
    CalendarPlus,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Loader2,
    Mail,
} from "lucide-react";

export default function HearingsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [hearings, setHearings] = useState([]);
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [sendingNotification, setSendingNotification] = useState(null);

    const isLawyer = user?.role === "lawyer" || user?.role === "admin";

    useEffect(() => {
        fetchHearings();
        fetchCases();
    }, []);

    const fetchHearings = async () => {
        try {
            setLoading(true);
            const data = await api.events.getAll({ type: "hearing" });
            setHearings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching hearings:", err);
            toast({ title: "Error", description: "Failed to load hearings", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchCases = async () => {
        try {
            const data = await api.cases.getAll();
            setCases(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching cases:", err);
        }
    };

    const handleSendNotification = async (hearingId) => {
        try {
            setSendingNotification(hearingId);
            const result = await api.events.sendNotification(hearingId);
            toast({
                title: "Notification Sent",
                description: result.message || `Email sent to ${result.emailsSent || 0} recipient(s)`,
            });
        } catch (err) {
            console.error("Error sending notification:", err);
            toast({ title: "Error", description: "Failed to send notification", variant: "destructive" });
        } finally {
            setSendingNotification(null);
        }
    };

    const handleUpdateStatus = async (hearingId, newStatus) => {
        try {
            await api.events.update(hearingId, { status: newStatus });
            toast({ title: "Status Updated", description: `Hearing marked as ${newStatus}` });
            fetchHearings();
        } catch (err) {
            console.error("Error updating hearing:", err);
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    // Build hearings from events + cases (nextHearingDate)
    const allHearings = [...hearings];

    // Also create hearing entries from cases that have nextHearingDate but no event
    cases.forEach((c) => {
        const nextHearing = c.nextHearingDate || c.hearingDate;
        if (!nextHearing) return;

        // Check if an event already exists for this case
        const existingEvent = hearings.find(
            (h) => (h.case?._id || h.case) === (c._id || c.id)
        );
        if (existingEvent) return;

        allHearings.push({
            _id: `case-${c._id || c.id}`,
            isCaseHearing: true,
            title: c.title || "Hearing",
            start: nextHearing,
            end: nextHearing,
            type: "hearing",
            status: new Date(nextHearing) < new Date() ? "completed" : "scheduled",
            priority: c.priority || "medium",
            location: c.court || "",
            case: { _id: c._id || c.id, title: c.title, caseNumber: c.caseNumber || c.number },
            caseTitle: c.title,
            caseNumber: c.caseNumber || c.number,
            description: "",
            caseData: c,
        });
    });

    // Stats
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const todayCount = allHearings.filter((h) => {
        const d = new Date(h.start);
        return d >= todayStart && d < todayEnd;
    }).length;

    const upcomingCount = allHearings.filter((h) => {
        const d = new Date(h.start);
        return d > now && h.status !== "completed" && h.status !== "cancelled";
    }).length;

    const thisMonthCount = allHearings.filter((h) => {
        const d = new Date(h.start);
        return d >= monthStart && d <= monthEnd;
    }).length;

    const completedCount = allHearings.filter(
        (h) => h.status === "completed"
    ).length;

    // Filter
    const filteredHearings = allHearings.filter((h) => {
        const matchesSearch =
            !searchTerm ||
            (h.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (h.caseNumber || h.case?.caseNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (h.caseTitle || h.case?.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (h.location || "").toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || h.status === statusFilter;
        const matchesType = typeFilter === "all" || h.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    // Sort by date ascending
    filteredHearings.sort((a, b) => new Date(a.start) - new Date(b.start));

    // Helpers
    const formatDate = (dateStr) => {
        if (!dateStr) return "TBD";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "scheduled": return "bg-blue-600 text-white";
            case "confirmed": return "bg-green-600 text-white";
            case "completed": return "bg-gray-500 text-white";
            case "adjourned": return "bg-yellow-500 text-white";
            case "cancelled": return "bg-red-500 text-white";
            default: return "bg-gray-400 text-white";
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "critical": return "bg-red-600 text-white";
            case "high": return "bg-red-500 text-white";
            case "medium": return "bg-yellow-500 text-white";
            case "low": return "bg-green-500 text-white";
            default: return "bg-gray-400 text-white";
        }
    };

    const getTypeLabel = (type) => {
        const labels = {
            hearing: "HEARING",
            case_filing: "FILING",
            evidence_submission: "EVIDENCE",
            client_meeting: "MEETING",
            court_visit: "COURT VISIT",
            mediation: "MEDIATION",
            arbitration: "ARBITRATION",
            judgment: "JUDGMENT",
            appeal: "APPEAL",
        };
        return labels[type] || type?.toUpperCase() || "HEARING";
    };

    const getTypeColor = (type) => {
        switch (type) {
            case "hearing": return "bg-emerald-100 text-emerald-700 border border-emerald-200";
            case "judgment": return "bg-purple-100 text-purple-700 border border-purple-200";
            case "appeal": return "bg-orange-100 text-orange-700 border border-orange-200";
            case "mediation": return "bg-blue-100 text-blue-700 border border-blue-200";
            case "evidence_submission": return "bg-cyan-100 text-cyan-700 border border-cyan-200";
            default: return "bg-gray-100 text-gray-700 border border-gray-200";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 font-medium">Loading hearings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Hearings</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage court hearings and schedules</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/calendar">
                        <Button variant="outline" className="gap-2">
                            <Calendar className="h-4 w-4" />
                            Calendar View
                        </Button>
                    </Link>
                    {isLawyer && (
                        <Link href="/dashboard/calendar">
                            <Button className="bg-[#1a2332] hover:bg-[#253345] gap-2">
                                <Plus className="h-4 w-4" />
                                Schedule Hearing
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Today's Hearings</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{todayCount}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Upcoming</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{upcomingCount}</p>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-xl">
                                <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">This Month</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{thisMonthCount}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl">
                                <Calendar className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Completed</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{completedCount}</p>
                            </div>
                            <div className="p-3 bg-gray-100 rounded-xl">
                                <CheckCircle className="h-6 w-6 text-gray-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Section */}
            <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Filter Hearings</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="search"
                                placeholder="Search hearings..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="adjourned">Adjourned</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="hearing">Hearing</SelectItem>
                                <SelectItem value="judgment">Judgment</SelectItem>
                                <SelectItem value="appeal">Appeal</SelectItem>
                                <SelectItem value="mediation">Mediation</SelectItem>
                                <SelectItem value="evidence_submission">Evidence Submission</SelectItem>
                                <SelectItem value="arbitration">Arbitration</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("all");
                                setTypeFilter("all");
                            }}
                        >
                            <Filter className="h-4 w-4" />
                            Reset Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Hearing Cards */}
            <div className="space-y-5">
                {filteredHearings.length > 0 ? (
                    filteredHearings.map((hearing) => {
                        const caseNumber = hearing.caseNumber || hearing.case?.caseNumber || "N/A";
                        const caseTitle = hearing.caseTitle || hearing.case?.title || hearing.title || "";
                        const caseId = hearing.case?._id || hearing.case;
                        const caseObj = hearing.caseData || cases.find((c) => (c._id || c.id) === caseId);

                        // Get lawyers and clients from the case
                        const lawyers = caseObj?.lawyers || [];
                        const clients = caseObj?.clients || [];
                        const petitioners = caseObj?.parties?.petitioner || [];
                        const respondents = caseObj?.parties?.respondent || [];

                        const primaryLawyer = lawyers.find((l) => l.isPrimary || l.isLead)?.name || lawyers[0]?.name || "";
                        const primaryClient = clients[0]?.name || "";

                        const courtName = hearing.location || caseObj?.court || "";
                        const courtHall = caseObj?.courtHall || "";

                        // Build a display title (parties)
                        const pet = petitioners[0]?.name || primaryClient || "";
                        const resp = respondents[0]?.name || "";
                        const partiesTitle = pet && resp ? `${pet} vs. ${resp}` : caseTitle;

                        return (
                            <Card
                                key={hearing._id}
                                className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                                <CardContent className="p-6">
                                    {/* Case Header */}
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <p className="font-bold text-gray-900 text-lg">{caseNumber}</p>
                                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider ${getTypeColor(hearing.type)}`}>
                                            {getTypeLabel(hearing.type)}
                                        </span>
                                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider ${getStatusColor(hearing.status)}`}>
                                            {hearing.status}
                                        </span>
                                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider ${getPriorityColor(hearing.priority)}`}>
                                            {hearing.priority}
                                        </span>
                                        {(hearing.priority === "high" || hearing.priority === "critical") && (
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                        )}
                                    </div>

                                    {/* Case Title / Parties */}
                                    <p className="text-gray-600 mb-4">{partiesTitle}</p>

                                    {/* Date & Time + Venue */}
                                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span className="font-medium">Date & Time</span>
                                                </div>
                                                <p className="font-semibold text-gray-900">{formatDate(hearing.start)}</p>
                                                {formatTime(hearing.start) && (
                                                    <p className="text-sm text-gray-500">{formatTime(hearing.start)}</p>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                                    <MapPin className="h-4 w-4" />
                                                    <span className="font-medium">Venue</span>
                                                </div>
                                                <p className="font-semibold text-gray-900">{courtName || "Not specified"}</p>
                                                {courtHall && <p className="text-sm text-gray-500">Court Room {courtHall}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Judge, Advocate, Client */}
                                    <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm mb-4">
                                        {primaryLawyer && (
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-500">Advocate:</span>
                                                <span className="font-medium text-gray-900">{primaryLawyer}</span>
                                            </div>
                                        )}
                                        {primaryClient && (
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-500">Client:</span>
                                                <span className="font-medium text-gray-900">{primaryClient}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    {hearing.description && (
                                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
                                            <p className="text-sm font-semibold text-gray-800 mb-1">Notes:</p>
                                            <p className="text-sm text-gray-600">{hearing.description}</p>
                                        </div>
                                    )}

                                    {/* Last Updated + Action Buttons */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <p className="text-xs text-gray-400">
                                            {hearing.updatedAt
                                                ? `Last updated: ${formatDate(hearing.updatedAt)}`
                                                : ""}
                                        </p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {isLawyer && !hearing.isCaseHearing && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs gap-1.5"
                                                    onClick={() => handleSendNotification(hearing._id)}
                                                    disabled={sendingNotification === hearing._id}
                                                >
                                                    {sendingNotification === hearing._id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Mail className="h-3.5 w-3.5" />
                                                    )}
                                                    Send Notification
                                                </Button>
                                            )}
                                            {caseId && (
                                                <Link href={`/dashboard/cases/${caseId}`}>
                                                    <Button variant="outline" size="sm" className="text-xs gap-1.5">
                                                        <Edit3 className="h-3.5 w-3.5" />
                                                        View Case
                                                    </Button>
                                                </Link>
                                            )}
                                            <Link href="/dashboard/calendar">
                                                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                                                    <CalendarPlus className="h-3.5 w-3.5" />
                                                    Add to Calendar
                                                </Button>
                                            </Link>
                                            {isLawyer && !hearing.isCaseHearing && hearing.status !== "completed" && (
                                                <Button
                                                    size="sm"
                                                    className="text-xs gap-1.5 bg-[#1a2332] hover:bg-[#253345]"
                                                    onClick={() => handleUpdateStatus(hearing._id, "completed")}
                                                >
                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                    Update Status
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <Card className="border border-gray-200 shadow-sm">
                        <CardContent className="p-12 text-center">
                            <Gavel className="h-14 w-14 mx-auto mb-3 text-gray-200" />
                            <p className="font-medium text-gray-500">No hearings found</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                                    ? "Try adjusting your filters"
                                    : "Schedule a hearing to get started"}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
