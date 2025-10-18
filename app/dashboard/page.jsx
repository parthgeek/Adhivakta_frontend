"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, FileTextIcon, BarChart3Icon, ClockIcon, AlertCircleIcon, FolderOpen, Users, Eye, Plus, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DashboardStats from "@/components/dashboard/DashboardStats";
import CaseStatisticsChart from "@/components/dashboard/CaseStatisticsChart";

export default function DashboardPage() {
  const { user } = useAuth();
  const isLawyer = user?.role === "lawyer";
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // Fetch all dashboard data in parallel
      const [summary, recentCases, upcomingEvents] = await Promise.all([
        api.dashboard.getSummary(),
        api.dashboard.getRecentCases(),
        api.dashboard.getUpcomingEvents(),
      ]);
      setDashboardData({
        summary,
        recentCases: recentCases || [],
        upcomingEvents: upcomingEvents || [],
      });
      setIsNewUser(recentCases && recentCases.length === 0);
    } catch (error) {
      setIsNewUser(true);
      setDashboardData({
        summary: {
          activeCases: 0,
          urgentCases: 0,
          upcomingHearings: 0,
          successRate: "0%",
          documents: 0,
          totalCases: 0,
        },
        recentCases: [],
        upcomingEvents: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isNewUser) {
    return <NewUserDashboard isLawyer={isLawyer} user={user} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.name || "User"}. Here's your legal practice overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Active Cases"
            value={dashboardData?.summary?.activeCases || 0}
            change="+3 this month"
            changeType="positive"
            icon={FileTextIcon}
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Total Cases"
            value={dashboardData?.summary?.totalCases || 0}
            change="+8 this month"
            changeType="positive"
            icon={BarChart3Icon}
            iconColor="text-green-600"
          />
          <StatsCard
            title="Upcoming Hearings"
            value={dashboardData?.summary?.upcomingHearings || 0}
            change="Next 7 days"
            changeType="neutral"
            icon={CalendarIcon}
            iconColor="text-orange-600"
          />
          <StatsCard
            title="Success Rate"
            value={dashboardData?.summary?.successRate || "0%"}
            change="+5% from last year"
            changeType="positive"
            icon={TrendingUp}
            iconColor="text-purple-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Cases and Hearings */}
          <div className="lg:col-span-2 space-y-6">
            <CasesList cases={dashboardData?.recentCases || []} />
            <UpcomingHearings events={dashboardData?.upcomingEvents || []} />
          </div>

          {/* Right Column - Quick Actions and Alerts */}
          <div className="space-y-6">
            <QuickActions />
            
            {/* Recent Activity */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                <ClockIcon className="h-5 w-5" />
                Recent Activity
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Document uploaded</p>
                    <p className="text-gray-600">OS/123/2024 - Evidence file</p>
                  </div>
                  <span className="text-xs text-gray-500">2h ago</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Hearing scheduled</p>
                    <p className="text-gray-600">WP/456/2024 - Jan 18, 2024</p>
                  </div>
                  <span className="text-xs text-gray-500">4h ago</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Client meeting</p>
                    <p className="text-gray-600">Kumar Family consultation</p>
                  </div>
                  <span className="text-xs text-gray-500">1d ago</span>
                </div>
              </div>
            </div>

            {/* Priority Alerts */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                <AlertCircleIcon className="h-5 w-5 text-red-600" />
                Priority Alerts
              </h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-red-800">Document deadline approaching</p>
                  <p className="text-red-600">OS/123/2024 - Response due in 2 days</p>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="font-medium text-yellow-800">Fee payment pending</p>
                  <p className="text-yellow-600">3 clients have pending payments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
const StatsCard = ({ title, value, change, changeType, icon: Icon, iconColor }) => {
  const getChangeColor = (type) => {
    switch (type) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className={`text-sm ${getChangeColor(changeType)}`}>{change}</p>
        </div>
        <div className={`p-3 rounded-full ${iconColor} bg-opacity-10`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

// Cases List Component
const CasesList = ({ cases = [] }) => {
  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Cases</h3>
        <Link href="/dashboard/cases" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {cases.slice(0, 5).map((caseItem, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{caseItem.title || caseItem.caseNumber}</p>
              <p className="text-sm text-gray-600">{caseItem.caseNumber || caseItem.number}</p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              caseItem.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {caseItem.status || 'Active'}
            </span>
          </div>
        ))}
        {cases.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
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
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Hearings</h3>
        <Link href="/dashboard/calendar" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {events.slice(0, 5).map((event, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{event.title}</p>
              <p className="text-sm text-gray-600">
                {new Date(event.start).toLocaleDateString()} at {new Date(event.start).toLocaleTimeString()}
              </p>
            </div>
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              {event.type || 'Hearing'}
            </span>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
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
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/cases/new">
          <button className="flex items-center justify-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors w-full">
            <Plus className="h-5 w-5 mr-2" />
            New Case
          </button>
        </Link>
        <Link href="/dashboard/documents">
          <button className="flex items-center justify-center p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors w-full">
            <FileTextIcon className="h-5 w-5 mr-2" />
            Upload Doc
          </button>
        </Link>
        <Link href="/dashboard/calendar">
          <button className="flex items-center justify-center p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors w-full">
            <CalendarIcon className="h-5 w-5 mr-2" />
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

function NewUserDashboard({ isLawyer, user }) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Adhivakta!</h1>
          <div className="text-sm text-gray-600">Hello, {user?.name || "User"}</div>
        </div>

        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Welcome to your legal case management dashboard. Here are some steps to get started:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                <div className="bg-blue-100 p-3 rounded-full mb-3">
                  <FileTextIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium mb-2">Create Your First Case</h3>
                <p className="text-sm text-gray-600 mb-4">Start by adding your first legal case to the system.</p>
                <Link href="/dashboard/cases/new" className="mt-auto">
                  <Button>Add Case</Button>
                </Link>
              </div>

              <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                <div className="bg-blue-100 p-3 rounded-full mb-3">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium mb-2">Upload Documents</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Organize and store your case-related documents securely.
                </p>
                <Link href="/dashboard/documents" className="mt-auto">
                  <Button>Manage Documents</Button>
                </Link>
              </div>

              <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                <div className="bg-blue-100 p-3 rounded-full mb-3">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium mb-2">Schedule Events</h3>
                <p className="text-sm text-gray-600 mb-4">Add important dates and hearings to your calendar.</p>
                <Link href="/dashboard/calendar" className="mt-auto">
                  <Button>Open Calendar</Button>
                </Link>
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg mt-6">
              <h3 className="font-medium mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600">
                Check out our user guides or contact our support team if you have any questions.
              </p>
              <div className="flex gap-3 mt-3">
                <Link href="/dashboard/help">
                  <Button variant="outline">View Help Center</Button>
                </Link>
                <Link href="/dashboard/settings">
                  <Button variant="outline">Configure Settings</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLawyer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Practice Management Tips</CardTitle>
                <CardDescription>Useful advice for legal professionals</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <ClockIcon className="mr-2 h-5 w-5 text-blue-600" />
                    <span>Set up regular case review reminders to stay on top of deadlines</span>
                  </li>
                  <li className="flex items-start">
                    <FileTextIcon className="mr-2 h-5 w-5 text-blue-600" />
                    <span>Create case templates for common legal matters to save time</span>
                  </li>
                  <li className="flex items-start">
                    <CalendarIcon className="mr-2 h-5 w-5 text-blue-600" />
                    <span>Schedule client updates to maintain good communication</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <div className="relative h-[250px] rounded-lg overflow-hidden">
              <Image
                src="/images/law-library.jpg"
                alt="Legal workspace"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-xl font-bold text-white">Ready to elevate your practice?</h3>
                <p className="text-sm text-white/90 mb-4">Explore our full range of features</p>
                <Button variant="secondary">Take a Tour</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}