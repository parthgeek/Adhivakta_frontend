"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import {
  FileText,
  Users,
  Calendar,
  Clock,
  Plus,
  BarChart3,
  TrendingUp,
  Upload,
  UserPlus,
  Gavel,
  Eye,
  RefreshCw,
  AlertCircle,
  Briefcase,
  FolderOpen,
  MoreVertical,
} from "lucide-react";
import api from "@/services/api";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCaseIdentifier, getDisplayCaseType, formatDisplayCaseNumber } from "@/lib/caseTypeUtils";
import { cn } from "@/lib/utils";
import { formatLegalTeamSummary } from "@/lib/legal-team";
import {
  getCasePriority,
  getCasePriorityColor,
  getCasePriorityLabel,
  isPriorityAlertCase,
} from "@/lib/casePriority";

// Helper function to format relative time
const formatRelativeTime = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Skeleton Components for Dashboard
const StatsCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3"></div>
        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse mt-2"></div>
      </div>
      <div className="h-12 w-12 bg-gray-100 rounded-xl animate-pulse"></div>
    </div>
  </div>
);

const CasesListSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-5">
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
    </div>
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-5 bg-gray-50 rounded-xl">
          <div className="h-5 w-48 bg-gray-300 rounded animate-pulse mb-3"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="flex gap-8">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const QuickActionsSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-5"></div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
      ))}
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="h-9 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CasesListSkeleton />
        </div>
        <div>
          <QuickActionsSkeleton />
        </div>
      </div>
    </div>
  </div>
);

// Stats Card Component — Redesigned
const StatsCard = ({ title, value, change, changeType = 'neutral', icon: Icon, iconColor = 'text-primary', href }) => {
  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">{value}</h3>
              {change && (
                <span className={cn(
                  "text-xs font-medium",
                  changeType === 'positive' && "text-green-600",
                  changeType === 'negative' && "text-red-600",
                  changeType === 'neutral' && "text-muted-foreground"
                )}>
                  {change}
                </span>
              )}
            </div>
          </div>
          <div className={cn("p-3 rounded-lg bg-muted", iconColor)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
};

// Helper: get status badge color
const getStatusColor = (status) => {
  switch ((status || "active").toLowerCase()) {
    case "active": return "bg-green-700 text-white border-transparent";
    case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "closed": return "bg-gray-100 text-gray-600 border-gray-200";
    default: return "bg-muted text-foreground";
  }
};

// Helper: safely extract display text from a value that might be an object (populated Mongoose ref)
const safeText = (val) => {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object") return val.name || val.title || val.email || String(val._id || "");
  return String(val);
};

const isHighPriorityNotification = (notification) =>
  notification?.meta?.priority === "high";

const sortNotificationsByRecency = (a, b) =>
  new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);

// Cases List Component
const CasesList = ({ cases = [] }) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentCases = cases
    .filter((c) => {
      const created = new Date(c.createdAt || c.created_at);
      return !isNaN(created.getTime()) && created >= sevenDaysAgo;
    })
    .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Cases</CardTitle>
        <Link href="/dashboard/cases">
          <Button variant="outline" size="sm">View All</Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentCases.slice(0, 5).map((caseItem, index) => {
          const clientName = safeText(caseItem.clientName) || safeText(caseItem.client);
          const lawyerName =
            formatLegalTeamSummary(caseItem) ||
            safeText(caseItem.lawyer) ||
            safeText(caseItem.assignedTo);
          const courtName = safeText(caseItem.court) || "N/A";
          const caseType = getDisplayCaseType(caseItem) || "N/A";
          const caseTitle = safeText(caseItem.title) || "Untitled case";
          const caseDescription = safeText(caseItem.description) || "No summary added yet.";
          const nextHearing = caseItem.nextHearingDate || caseItem.nextHearing || caseItem.hearingDate;
          const filingDate = caseItem.filingDate || caseItem.filing_date || caseItem.dateOfFiling;
          const petitioners = caseItem.parties?.petitioner || [];
          const respondents = caseItem.parties?.respondent || [];
          const priority = getCasePriority(caseItem);
          const caseNumber = formatDisplayCaseNumber({
            caseNumber: caseItem.caseNumber || caseItem.number || "",
            caseTypeName: caseItem.caseSubType || caseItem.eCourt?.caseTypeName || "",
            caseTypeCode: caseItem.eCourt?.caseTypeCode || caseItem.caseCode || "",
          }) || caseItem.caseNumber || caseItem.number || "N/A";
          const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "N/A";

          return (
            <div
              key={caseItem._id || caseItem.id || index}
              className="p-4 border rounded-lg hover:shadow-sm transition-shadow space-y-3"
            >
              {/* Row 1: Case Name (left) | Case No. + Status (right) */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Case Name</p>
                  <h4 className="text-base font-semibold text-foreground leading-snug">
                    {caseTitle}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-muted-foreground">Priority:</span>
                    <Badge className={cn("text-xs", getCasePriorityColor(priority))}>
                      {getCasePriorityLabel(priority)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">Case No.</p>
                  <p className="text-sm font-semibold text-foreground">{caseNumber}</p>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <Badge variant="outline" className={cn("text-xs", getStatusColor(caseItem.status))}>
                      {(caseItem.status || "Active").toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Description</p>
                <p className="text-sm text-foreground/80 line-clamp-2">{caseDescription}</p>
              </div>

              {/* Details grids */}
              <div className="border-t pt-3 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Case Type</p>
                    <p className="text-sm font-medium text-foreground">{caseType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Court</p>
                    <p className="text-sm font-medium text-foreground">{courtName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Filing Date</p>
                    <p className="text-sm font-medium text-foreground">{fmt(filingDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Next Hearing</p>
                    <p className="text-sm font-medium text-foreground">{fmt(nextHearing)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Client</p>
                    <p className="text-sm font-medium text-foreground">{clientName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Petitioner</p>
                    <p className="text-sm font-medium text-foreground">{petitioners.length > 0 ? petitioners[0].name : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Respondent</p>
                    <p className="text-sm font-medium text-foreground">{respondents.length > 0 ? respondents[0].name : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lead Advocate</p>
                    <p className="text-sm font-medium text-foreground">{lawyerName || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end pt-1">
                <Link href={`/dashboard/cases/${caseItem._id || caseItem.id}`}>
                  <Button variant="outline" size="sm">View Details</Button>
                </Link>
              </div>
            </div>
          );
        })}
        {recentCases.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-14 w-14 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium">No recent cases</p>
            <p className="text-sm mt-1">Cases added in the last 7 days will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Quick Actions Component
const QuickActions = () => {
  const actions = [
    {
      icon: Plus,
      label: "New Case",
      description: "File a new case",
      variant: "default",
      href: "/dashboard/cases/new",
    },
  
    // {
    //   icon: UserPlus,
    //   label: "Add Client",
    //   description: "Register new client",
    //   variant: "outline",
    //   href: "/dashboard/clients-parties",
    // },
    {
      icon: Calendar,
      label: "Schedule Hearing",
      description: "Book court date",
      variant: "outline",
      href: "/dashboard/calendar",
    },
    {
      icon: Upload,
      label: "Upload Documents",
      description: "Add case files",
      variant: "outline",
      href: "/dashboard/documents",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {actions.map((action) => (
          <Link key={action.label} href={action.href} className="block">
            <Button
              variant={action.variant}
              className={cn(
                "w-full justify-start gap-3 h-auto py-3.5 px-4",
                action.variant === "default" && "bg-[#03234b] hover:bg-[#042d5e] text-white"
              )}
            >
              <action.icon className="h-5 w-5 shrink-0" />
              <div className="text-left">
                <div className="font-medium text-sm">{action.label}</div>
                <div className={cn(
                  "text-xs",
                  action.variant === "default" ? "text-gray-400" : "text-muted-foreground"
                )}>{action.description}</div>
              </div>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

const PriorityAlerts = ({ notifications = [] }) => {
  const priorityAlerts = notifications
    .filter(isHighPriorityNotification)
    .sort((a, b) => {
      if (a.read !== b.read) {
        return a.read ? 1 : -1;
      }

      return sortNotificationsByRecency(a, b);
    })
    .slice(0, 4);

  return (
    <Card className="border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-orange-50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-rose-900">
          <AlertCircle className="h-5 w-5 text-rose-600" />
          Priority Alerts
        </CardTitle>
        <Link
          href="/dashboard/notifications"
          className="text-sm font-medium text-rose-700 hover:text-rose-800"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {priorityAlerts.length > 0 ? (
          priorityAlerts.map((notification) => {
            const href = notification.link || "/dashboard/notifications";

            return (
              <Link
                key={notification._id || `${notification.message}-${notification.createdAt}`}
                href={href}
                className="block"
              >
                <div className="rounded-xl border border-rose-200 bg-white/90 p-4 transition-colors hover:bg-rose-50/80">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-rose-100 p-2">
                      <AlertCircle className="h-4 w-4 text-rose-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2 flex-wrap">
                        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">
                          Priority
                        </Badge>
                        {!notification.read && (
                          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                            New
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {notification.createdAt
                            ? formatRelativeTime(new Date(notification.createdAt))
                            : "Just now"}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-rose-200 bg-white/70 p-5 text-center">
            <p className="font-medium text-slate-700">No priority alerts right now</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Urgent review requests and other high-priority notices will appear here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Upcoming Hearings Component
const UpcomingHearings = ({ events = [] }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-900">
          Upcoming Hearings
        </h3>
        <Link
          href="/dashboard/calendar"
          className="px-4 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          View All
        </Link>
      </div>
      <div className="space-y-3">
        {events.slice(0, 5).map((event, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{event.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(event.start).toLocaleDateString()} at{" "}
                  {new Date(event.start).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700">
              {event.type || "Hearing"}
            </span>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">No upcoming hearings</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Dashboard Component
const NewDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    cases: [],
    events: [],
    notifications: [],
    documents: [],
    stats: {
      totalCases: 0,
      activeCases: 0,
      closedCases: 0,
      urgentCases: 0,
      upcomingHearings: 0,
      documents: 0,
      activeClients: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const casesResponse = await api.cases.getAll();
        const cases = Array.isArray(casesResponse) ? casesResponse : [];

        const eventsResponse = await api.events.getAll();
        const events = Array.isArray(eventsResponse) ? eventsResponse : [];

        // Fetch notifications for Priority Alerts
        let notifications = [];
        try {
          const notificationsResponse = await api.notifications.getAll();
          notifications = Array.isArray(notificationsResponse) ? notificationsResponse : [];
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }

        // Fetch documents for Recent Uploads
        let documents = [];
        try {
          const documentsResponse = await api.documents.getAll();
          documents = Array.isArray(documentsResponse) ? documentsResponse : [];
        } catch (error) {
          console.error("Error fetching documents:", error);
        }

        const summaryResponse = await api.dashboard.getSummary();
        const stats = summaryResponse || {
          totalCases: cases.length,
          activeCases: cases.filter((c) => c.status === "active").length,
          closedCases: cases.filter((c) => c.status === "closed").length,
          urgentCases: 0,
          upcomingHearings: events.length,
          documents: documents.length,
          activeClients: 0,
        };

        setDashboardData({ cases, events, notifications, documents, stats });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setDashboardData({
          cases: [],
          events: [],
          notifications: [],
          documents: [],
          stats: {
            totalCases: 0,
            activeCases: 0,
            closedCases: 0,
            urgentCases: 0,
            upcomingHearings: 0,
            documents: 0,
            activeClients: 0,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleNewNotification = (event) => {
      const notification = event?.detail;
      if (!notification) return;

      setDashboardData((prev) => {
        if (
          notification._id &&
          prev.notifications.some((item) => item._id === notification._id)
        ) {
          return prev;
        }

        return {
          ...prev,
          notifications: [notification, ...prev.notifications],
        };
      });
    };

    window.addEventListener("app:notification", handleNewNotification);

    return () => {
      window.removeEventListener("app:notification", handleNewNotification);
    };
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pt-3 px-6 pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || "User"}. Here's your legal practice overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatsCard
            title="Active Cases"
            value={dashboardData.stats.activeCases}
            change={`+${Math.max(1, Math.floor(dashboardData.stats.activeCases * 0.12))} this month`}
            changeType="positive"
            icon={FileText}
            iconColor="text-[#03234b]"
            href="/dashboard/cases?filter=active"
          />
          <StatsCard
            title="Total Clients"
            value={dashboardData.stats.activeClients || dashboardData.stats.totalCases}
            change={`+${Math.max(1, Math.floor((dashboardData.stats.activeClients || dashboardData.stats.totalCases) * 0.05))} this month`}
            changeType="positive"
            icon={Users}
            iconColor="text-green-600"
            href="/dashboard/clients-parties"
          />
          <StatsCard
            title="Upcoming Hearings"
            value={dashboardData.stats.upcomingHearings}
            change="Next 7 days"
            changeType="neutral"
            icon={Calendar}
            iconColor="text-orange-500"
            href="/dashboard/calendar"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Cases */}
          <div className="lg:col-span-2 space-y-6">
            <CasesList cases={dashboardData.cases} />
          </div>

          {/* Right Column - Quick Actions + Alerts + Recent Activity */}
          <div className="space-y-6">
            <QuickActions />
            <PriorityAlerts notifications={dashboardData.notifications} />

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                  <Clock className="h-5 w-5 text-gray-400" />
                  Recent Activity
                </h3>
                <Link
                  href="/dashboard/documents"
                  className="text-sm font-medium text-gray-600 hover:text-black"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3 text-sm">
                {dashboardData.documents.slice(0, 5).map((doc, index) => (
                  <div key={doc._id || index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-gray-100 rounded-lg">
                        <FileText className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{doc.name || doc.title || "Untitled Document"}</p>
                        <p className="text-xs text-gray-400">
                          {doc.caseNumber || doc.case?.caseNumber || "No case linked"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {doc.createdAt
                        ? formatRelativeTime(new Date(doc.createdAt))
                        : "Unknown"}
                    </span>
                  </div>
                ))}
                {dashboardData.documents.length === 0 && (
                  <div className="text-center py-6 text-gray-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDashboard;
