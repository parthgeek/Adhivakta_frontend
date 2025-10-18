"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { 
  FileText, 
  Users, 
  Calendar, 
  TrendingUp,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import api from '@/services/api';

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
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View all
        </button>
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
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Hearings</h3>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View all
        </button>
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
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
          <Plus className="h-5 w-5 mr-2" />
          New Case
        </button>
        <button className="flex items-center justify-center p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
          <FileText className="h-5 w-5 mr-2" />
          Upload Doc
        </button>
        <button className="flex items-center justify-center p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
          <Calendar className="h-5 w-5 mr-2" />
          Schedule
        </button>
        <button className="flex items-center justify-center p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
          <Users className="h-5 w-5 mr-2" />
          Add Client
        </button>
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
    stats: {
      totalCases: 0,
      activeCases: 0,
      closedCases: 0,
      urgentCases: 0,
      upcomingHearings: 0,
      documents: 0,
      successRate: "0%",
      activeClients: 0,
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch cases
        const casesResponse = await api.cases.getAll();
        const cases = Array.isArray(casesResponse) ? casesResponse : [];
        
        // Fetch events
        const eventsResponse = await api.events.getAll();
        const events = Array.isArray(eventsResponse) ? eventsResponse : [];
        
        // Fetch dashboard summary
        const summaryResponse = await api.dashboard.getSummary();
        const stats = summaryResponse || {
          totalCases: cases.length,
          activeCases: cases.filter(c => c.status === 'active').length,
          closedCases: cases.filter(c => c.status === 'closed').length,
          urgentCases: 0,
          upcomingHearings: events.length,
          documents: 0,
          successRate: "0%",
          activeClients: 0,
        };

        setDashboardData({ cases, events, stats });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set default data if API fails
        setDashboardData({
          cases: [],
          events: [],
          stats: {
            totalCases: 0,
            activeCases: 0,
            closedCases: 0,
            urgentCases: 0,
            upcomingHearings: 0,
            documents: 0,
            successRate: "0%",
            activeClients: 0,
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.name || 'User'}. Here's your legal practice overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Active Cases"
            value={dashboardData.stats.activeCases}
            change="+3 this month"
            changeType="positive"
            icon={FileText}
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Total Clients"
            value={dashboardData.stats.activeClients}
            change="+8 this month"
            changeType="positive"
            icon={Users}
            iconColor="text-green-600"
          />
          <StatsCard
            title="Upcoming Hearings"
            value={dashboardData.stats.upcomingHearings}
            change="Next 7 days"
            changeType="neutral"
            icon={Calendar}
            iconColor="text-orange-600"
          />
          <StatsCard
            title="Cases Won (YTD)"
            value={dashboardData.stats.successRate}
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
            <CasesList cases={dashboardData.cases} />
            <UpcomingHearings events={dashboardData.events} />
          </div>

          {/* Right Column - Quick Actions and Alerts */}
          <div className="space-y-6">
            <QuickActions />
            
            {/* Recent Activity */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                <Clock className="h-5 w-5" />
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
                <AlertTriangle className="h-5 w-5 text-red-600" />
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
};

export default NewDashboard;
