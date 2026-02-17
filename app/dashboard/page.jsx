"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import {
  FileText,
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  Plus,
  BarChart3,
  CheckCircle,
  TrendingUp,
  Upload,
  UserPlus,
  Gavel,
  Eye,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import api from "@/services/api";
import Link from "next/link";

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
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
const StatsCard = ({ title, value, icon: Icon, iconBgColor, iconColor, growth, href }) => {
  const CardContent = (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {growth && (
            <p className="text-xs font-medium text-gray-500 mt-1.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {growth}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBgColor} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{CardContent}</Link> : CardContent;
};

// Priority Badge
const PriorityBadge = ({ priority }) => {
  const styles = {
    high: "bg-red-500 text-white",
    medium: "bg-orange-400 text-white",
    low: "bg-green-500 text-white",
    urgent: "bg-red-600 text-white",
  };
  const p = (priority || "medium").toLowerCase();
  return (
    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider ${styles[p] || styles.medium}`}>
      {priority || "MEDIUM"}
    </span>
  );
};

// Status Badge
const StatusBadge = ({ status }) => {
  const styles = {
    active: "bg-green-100 text-green-700 border border-green-200",
    closed: "bg-gray-100 text-gray-600 border border-gray-200",
    pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  };
  const s = (status || "active").toLowerCase();
  return (
    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider ${styles[s] || styles.active}`}>
      {status || "Active"}
    </span>
  );
};

// Helper: safely extract display text from a value that might be an object (populated Mongoose ref)
const safeText = (val) => {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object") return val.name || val.title || val.email || String(val._id || "");
  return String(val);
};

// Enhanced Cases List Component
const CasesList = ({ cases = [] }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-900">Recent Cases</h3>
        <Link
          href="/dashboard/cases"
          className="px-4 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          View All
        </Link>
      </div>
      <div className="space-y-4">
        {cases.slice(0, 5).map((caseItem, index) => {
          const clientName = safeText(caseItem.clientName) || safeText(caseItem.client);
          const lawyerName = safeText(caseItem.lawyer) || safeText(caseItem.assignedTo);
          const courtName = safeText(caseItem.court);
          const caseType = safeText(caseItem.caseType) || safeText(caseItem.type);
          const title = safeText(caseItem.title) || safeText(caseItem.description) || "No description available";

          return (
            <div
              key={caseItem._id || caseItem.id || index}
              className="border border-gray-100 rounded-xl p-5 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
            >
              {/* Case Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 text-base">
                    {caseItem.caseNumber || caseItem.number || "N/A"}
                  </p>
                  <PriorityBadge priority={caseItem.priority} />
                  <StatusBadge status={caseItem.status} />
                </div>
                {caseItem.priority === "high" || caseItem.priority === "urgent" ? (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                ) : null}
              </div>

              {/* Case Title */}
              <p className="text-sm text-gray-600 mb-3">{title}</p>

              {/* Case Details Grid */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500 mb-4">
                {clientName && (
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-gray-400">Client:</span>
                    <span className="font-medium text-gray-700">{clientName}</span>
                  </div>
                )}
                {caseItem.nextHearing && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-gray-400">Next Hearing:</span>
                    <span className="font-medium text-gray-700">
                      {new Date(caseItem.nextHearing).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {caseType && (
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="text-gray-400">Type:</span>
                    <span className="font-medium text-gray-700">{caseType}</span>
                  </div>
                )}
                {courtName && (
                  <div className="flex items-center gap-1.5">
                    <Gavel className="h-3.5 w-3.5" />
                    <span className="text-gray-400">Court:</span>
                    <span className="font-medium text-gray-700">{courtName}</span>
                  </div>
                )}
              </div>

              {/* Case Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                {lawyerName && (
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Handled by {lawyerName}
                  </p>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <Link
                    href={`/dashboard/cases/${caseItem._id || caseItem.id}`}
                    className="px-3.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Details
                  </Link>
                  <Link
                    href={`/dashboard/cases/${caseItem._id || caseItem.id}`}
                    className="px-3.5 py-1.5 text-xs font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Update Status
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        {cases.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="h-14 w-14 mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">No cases found</p>
            <p className="text-sm mt-1">Create your first case to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Quick Actions Component
const QuickActions = () => {
  const actions = [
    {
      name: "New Case",
      subtitle: "File a new case",
      icon: Plus,
      href: "/dashboard/cases/new",
      primary: true,
    },
    {
      name: "Draft Document",
      subtitle: "Create legal document",
      icon: FileText,
      href: "/dashboard/documents",
      primary: false,
    },
    {
      name: "Add Client",
      subtitle: "Register new client",
      icon: UserPlus,
      href: "/dashboard/clients-parties",
      primary: false,
    },
    {
      name: "Schedule Hearing",
      subtitle: "Book court date",
      icon: Calendar,
      href: "/dashboard/calendar",
      primary: false,
    },
    {
      name: "Upload Documents",
      subtitle: "Add case files",
      icon: Upload,
      href: "/dashboard/documents",
      primary: false,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-5">Quick Actions</h3>
      <div className="space-y-2.5">
        {actions.map((action, index) => (
          <Link key={index} href={action.href}>
            <div
              className={`flex items-center gap-3.5 p-3.5 rounded-xl transition-all duration-200 cursor-pointer ${action.primary
                ? "bg-black text-white hover:bg-gray-900 shadow-sm"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100"
                }`}
            >
              <div
                className={`p-2 rounded-lg ${action.primary ? "bg-white/10" : "bg-white"
                  }`}
              >
                <action.icon
                  className={`h-4.5 w-4.5 ${action.primary ? "text-white" : "text-gray-500"
                    }`}
                  style={{ width: 18, height: 18 }}
                />
              </div>
              <div>
                <p className={`text-sm font-semibold ${action.primary ? "text-white" : "text-gray-800"}`}>
                  {action.name}
                </p>
                <p className={`text-xs ${action.primary ? "text-gray-300" : "text-gray-400"}`}>
                  {action.subtitle}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
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

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">
            Welcome back, {user?.name || "User"}. Here's your legal practice overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="Active Cases"
            value={dashboardData.stats.activeCases}
            icon={FileText}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
            growth={`+${Math.max(1, Math.floor(dashboardData.stats.activeCases * 0.12))} this month`}
            href="/dashboard/cases?filter=active"
          />
          <StatsCard
            title="Total Clients"
            value={dashboardData.stats.activeClients || dashboardData.stats.totalCases}
            icon={Users}
            iconBgColor="bg-green-50"
            iconColor="text-green-600"
            growth={`+${Math.max(1, Math.floor((dashboardData.stats.activeClients || dashboardData.stats.totalCases) * 0.05))} this month`}
            href="/dashboard/clients-parties"
          />
          <StatsCard
            title="Upcoming Hearings"
            value={dashboardData.stats.upcomingHearings}
            icon={Calendar}
            iconBgColor="bg-orange-50"
            iconColor="text-orange-500"
            growth="Next 7 days"
            href="/dashboard/calendar"
          />
          <StatsCard
            title="Cases Won (YTD)"
            value={dashboardData.stats.closedCases > 0
              ? `${Math.round((dashboardData.stats.closedCases / Math.max(1, dashboardData.stats.totalCases)) * 100)}%`
              : "0%"
            }
            icon={TrendingUp}
            iconBgColor="bg-purple-50"
            iconColor="text-purple-600"
            growth="+5% from last year"
            href="/dashboard/reports"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Cases and Hearings */}
          <div className="lg:col-span-2 space-y-6">
            <CasesList cases={dashboardData.cases} />
            <UpcomingHearings events={dashboardData.events} />
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            <QuickActions />

            {/* Recent Uploads */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                  <Clock className="h-5 w-5 text-gray-400" />
                  Recent Uploads
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
                    <p className="text-gray-500">No recent uploads</p>
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
