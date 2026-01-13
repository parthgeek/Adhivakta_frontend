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
  <div className="bg-white rounded-lg border p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mt-2"></div>
      </div>
      <div className="p-3 rounded-full bg-gray-100">
        <div className="h-6 w-6 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

const CasesListSkeleton = () => (
  <div className="bg-white rounded-lg border p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
    </div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-5 w-48 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-32 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="h-6 w-16 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const UpcomingHearingsSkeleton = () => (
  <div className="bg-white rounded-lg border p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
    </div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-5 w-40 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-48 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="h-6 w-20 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const QuickActionsSkeleton = () => (
  <div className="bg-white rounded-lg border p-6 shadow-sm">
    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-12 bg-gray-100 rounded-lg animate-pulse"
        ></div>
      ))}
    </div>
  </div>
);

const PriorityAlertsSkeleton = () => (
  <div className="bg-white rounded-lg border p-6 shadow-sm">
    <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mb-4"></div>
    <div className="space-y-3">
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="h-5 w-48 bg-gray-300 rounded animate-pulse mb-1"></div>
        <div className="h-4 w-40 bg-gray-300 rounded animate-pulse"></div>
      </div>
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="h-5 w-40 bg-gray-300 rounded animate-pulse mb-1"></div>
        <div className="h-4 w-36 bg-gray-300 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
);

const RecentActivitySkeleton = () => (
  <div className="bg-white rounded-lg border p-6 shadow-sm">
    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex justify-between items-start">
          <div>
            <div className="h-5 w-36 bg-gray-300 rounded animate-pulse mb-1"></div>
            <div className="h-4 w-48 bg-gray-300 rounded animate-pulse"></div>
          </div>
          <div className="h-4 w-16 bg-gray-300 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  </div>
);

// Full Dashboard Skeleton
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Section Skeleton */}
      <div className="space-y-2">
        <div className="h-9 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <CasesListSkeleton />
          <UpcomingHearingsSkeleton />
        </div>

        {/* Right Column Skeleton */}
        <div className="space-y-6">
          <PriorityAlertsSkeleton />
          <QuickActionsSkeleton />
          <RecentActivitySkeleton />
        </div>
      </div>
    </div>
  </div>
);

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, iconColor, href }) => {
  const CardContent = (
    <div className="bg-white rounded-lg border p-6 shadow-sm hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${iconColor} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{CardContent}</Link> : CardContent;
};

// Cases List Component
const CasesList = ({ cases = [] }) => {
  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Cases</h3>
        <Link
          href="/dashboard/cases"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {cases.slice(0, 5).map((caseItem, index) => (
          <Link
            key={index}
            href={`/dashboard/cases/${caseItem._id || caseItem.id}`}
          >
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">
                  {caseItem.title || caseItem.caseNumber}
                </p>
                <p className="text-sm text-gray-600">
                  {caseItem.caseNumber || caseItem.number}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${caseItem.status === "active"
                  ? "bg-green-100 text-green-800"
                  : caseItem.status === "closed"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-blue-100 text-blue-800"
                  }`}
              >
                {caseItem.status || "Active"}
              </span>
            </div>
          </Link>
        ))}
        {cases.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No cases found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Upcoming Hearings Component
const UpcomingHearings = ({ events = [] }) => {
  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Upcoming Hearings
        </h3>
        <Link
          href="/dashboard/calendar"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {events.slice(0, 5).map((event, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900">{event.title}</p>
              <p className="text-sm text-gray-600">
                {new Date(event.start).toLocaleDateString()} at{" "}
                {new Date(event.start).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              {event.type || "Hearing"}
            </span>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No upcoming hearings</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Quick Actions Component
const QuickActions = () => {
  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/cases/new">
          <button className="flex items-center justify-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors w-full">
            <Plus className="h-5 w-5 mr-2" />
            New Case
          </button>
        </Link>
        <Link href="/dashboard/documents">
          <button className="flex items-center justify-center p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors w-full">
            <FileText className="h-5 w-5 mr-2" />
            Upload Doc
          </button>
        </Link>
        <Link href="/dashboard/calendar">
          <button className="flex items-center justify-center p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors w-full">
            <Calendar className="h-5 w-5 mr-2" />
            Schedule
          </button>
        </Link>
        <Link href="/dashboard/clients">
          <button className="flex items-center justify-center p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors w-full">
            <Users className="h-5 w-5 mr-2" />
            Add Client
          </button>
        </Link>
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.name || "User"}. Here's your legal practice
            overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Active Cases"
            value={dashboardData.stats.activeCases}
            icon={FileText}
            iconColor="text-blue-600"
            href="/dashboard/cases?filter=active"
          />
          <StatsCard
            title="Total Cases"
            value={dashboardData.stats.totalCases}
            icon={BarChart3}
            iconColor="text-green-600"
            href="/dashboard/cases"
          />
          <StatsCard
            title="Closed Cases"
            value={dashboardData.stats.closedCases}
            icon={CheckCircle}
            iconColor="text-purple-600"
            href="/dashboard/cases?filter=closed"
          />
          <StatsCard
            title="Upcoming Hearings"
            value={dashboardData.stats.upcomingHearings}
            icon={Calendar}
            iconColor="text-orange-600"
            href="/dashboard/calendar"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Cases and Hearings */}
          <div className="lg:col-span-2 space-y-6">
            <CasesList cases={dashboardData.cases} />
            <UpcomingHearings events={dashboardData.events} />
          </div>

          {/* Right Column - Priority Alerts and Quick Actions */}
          <div className="space-y-6">
            {/* Priority Alerts */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Priority Alerts
                </h3>
                <Link
                  href="/dashboard/notifications"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3 text-sm">
                {dashboardData.notifications.slice(0, 3).map((notification, index) => (
                  <div
                    key={notification._id || index}
                    className={`p-3 rounded-lg ${!notification.read
                      ? "bg-red-50 border border-red-200"
                      : "bg-yellow-50 border border-yellow-200"
                      }`}
                  >
                    <p className={`font-medium ${!notification.read ? "text-red-800" : "text-yellow-800"}`}>
                      {notification.title || notification.type || "Notification"}
                    </p>
                    <p className={!notification.read ? "text-red-600" : "text-yellow-600"}>
                      {notification.message || "No details available"}
                    </p>
                  </div>
                ))}
                {dashboardData.notifications.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No priority alerts</p>
                  </div>
                )}
              </div>
            </div>

            <QuickActions />

            {/* Recent Uploads */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <Clock className="h-5 w-5" />
                  Recent Uploads
                </h3>
                <Link
                  href="/dashboard/documents"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3 text-sm">
                {dashboardData.documents.slice(0, 5).map((doc, index) => (
                  <div key={doc._id || index} className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{doc.name || doc.title || "Untitled Document"}</p>
                      <p className="text-gray-600">
                        {doc.caseNumber || doc.case?.caseNumber || "No case linked"}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {doc.createdAt
                        ? formatRelativeTime(new Date(doc.createdAt))
                        : "Unknown"}
                    </span>
                  </div>
                ))}
                {dashboardData.documents.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No recent uploads</p>
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
