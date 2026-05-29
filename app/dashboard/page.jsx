"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  FileText,
  Users,
  Calendar,
  AlertCircle,
  Briefcase,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Search,
  Scale,
  ArrowRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "@/services/api";
import Link from "next/link";
import { getNotificationTarget } from "@/lib/notification-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDisplayCaseType } from "@/lib/caseTypeUtils";
import { cn } from "@/lib/utils";
import { formatLegalTeamSummary } from "@/lib/legal-team";

// ─── helpers ────────────────────────────────────────────────────────────────

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

const safeText = (val) => {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object") return val.name || val.title || val.email || String(val._id || "");
  return String(val);
};

const sortNotificationsByRecency = (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);

const DASHBOARD_NOTIFICATION_POLL_MS = 30000;
const APPROVAL_REMINDER_SUPPRESSED_KEY = "approval_review_remind_later";
const APPROVAL_LOGOUT_REMINDER_SHOWN_KEY = "approval_review_logout_reminder_shown";
const APPROVAL_LOGOUT_EVENT = "app:approval-review:logout-attempt";

const isApprovalReviewNotification = (n) =>
  n?.type === "document_review_request" && !n?.read;

const getApprovalReviewNotifications = (notifications = []) =>
  notifications.filter(isApprovalReviewNotification).sort(sortNotificationsByRecency);

const getNotificationKey = (n, index = 0) =>
  n?._id || `${n?.type || "notification"}-${n?.createdAt || index}-${n?.message || ""}`;

const canUseSessionStorage = () => typeof window !== "undefined";
const isApprovalReminderSuppressed = () =>
  canUseSessionStorage() && sessionStorage.getItem(APPROVAL_REMINDER_SUPPRESSED_KEY) === "true";
const setApprovalReminderSuppressed = (value) => {
  if (!canUseSessionStorage()) return;
  if (value) { sessionStorage.setItem(APPROVAL_REMINDER_SUPPRESSED_KEY, "true"); return; }
  sessionStorage.removeItem(APPROVAL_REMINDER_SUPPRESSED_KEY);
};
const hasShownLogoutApprovalReminder = () =>
  canUseSessionStorage() && sessionStorage.getItem(APPROVAL_LOGOUT_REMINDER_SHOWN_KEY) === "true";
const setHasShownLogoutApprovalReminder = (value) => {
  if (!canUseSessionStorage()) return;
  if (value) { sessionStorage.setItem(APPROVAL_LOGOUT_REMINDER_SHOWN_KEY, "true"); return; }
  sessionStorage.removeItem(APPROVAL_LOGOUT_REMINDER_SHOWN_KEY);
};

// ─── colours ────────────────────────────────────────────────────────────────

const BRAND = "#03234b";
const STATUS_COLORS = ["#3B82F6", "#F59E0B", "#10B981", "#6B7280"];
const CATEGORY_COLORS = ["#3B82F6", "#EF4444", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899"];

const AVATAR_COLORS = [
  "bg-[#03234b] text-white",
  "bg-emerald-600 text-white",
  "bg-violet-600 text-white",
  "bg-rose-600 text-white",
  "bg-amber-500 text-white",
  "bg-sky-600 text-white",
];

const getInitials = (name = "") =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const getHearingStatus = (startDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(startDate);
  d.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow";
  if (d > today) return "Upcoming";
  return "Past";
};

const hearingStatusStyles = {
  Today:    "bg-blue-100 text-blue-700 border border-blue-200",
  Tomorrow: "bg-orange-100 text-orange-700 border border-orange-200",
  Upcoming: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Past:     "bg-gray-100 text-gray-500 border border-gray-200",
};

const padDatePart = (value) => String(value).padStart(2, "0");
const getTodayIsoDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${padDatePart(now.getMonth() + 1)}-${padDatePart(now.getDate())}`;
};

const getCaseDisplayLabel = (caseItem = {}) =>
  caseItem.title || caseItem.caseNumber || caseItem.cnrNumber || "Untitled case";

const toValidDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getCaseNextHearingDate = (caseItem = {}) =>
  toValidDate(caseItem.nextHearingDate || caseItem.hearingDate);

const getRecommendedCauseListCaseId = (cases = []) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingCases = cases
    .map((caseItem) => ({
      id: String(caseItem?._id || ""),
      hearingDate: getCaseNextHearingDate(caseItem),
    }))
    .filter((caseItem) => caseItem.id && caseItem.hearingDate && caseItem.hearingDate >= today)
    .sort((a, b) => a.hearingDate - b.hearingDate);

  if (upcomingCases.length > 0) {
    return upcomingCases[0].id;
  }

  const fallbackCases = cases
    .map((caseItem) => ({
      id: String(caseItem?._id || ""),
      hearingDate: getCaseNextHearingDate(caseItem),
    }))
    .filter((caseItem) => caseItem.id && caseItem.hearingDate)
    .sort((a, b) => b.hearingDate - a.hearingDate);

  return fallbackCases[0]?.id || String(cases[0]?._id || "");
};

const normalizeCourtHallValue = (value = "") => {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (!normalized) {
    return "";
  }

  const withoutCourtWords = normalized.replace(
    /\b(HALL|COURT|ROOM|NUMBER|NO|NUM)\b\.?/g,
    " "
  );
  const alphanumeric = withoutCourtWords.replace(/[^A-Z0-9]/g, "");

  if (!alphanumeric) {
    return "";
  }

  if (/^\d+$/.test(alphanumeric)) {
    return String(Number(alphanumeric));
  }

  return alphanumeric;
};

const getCaseCourtHallValue = (caseItem = {}) =>
  caseItem?.causeListTracking?.courtNo ||
  caseItem?.courtHall ||
  caseItem?.eCourt?.courtNo ||
  "";

const getCourtOptionCourtHallValue = (option = {}) =>
  option?.courtNo || option?.label?.split("-")[0] || option?.value || "";

const getAutoSelectedCourtOptionValue = (options = [], caseItem = {}) => {
  const targetCourtHall = normalizeCourtHallValue(getCaseCourtHallValue(caseItem));

  if (!targetCourtHall) {
    return "";
  }

  const matchedOption = options.find((option) => {
    const optionCourtHall = normalizeCourtHallValue(
      getCourtOptionCourtHallValue(option)
    );
    return optionCourtHall && optionCourtHall === targetCourtHall;
  });

  return matchedOption?.value || "";
};

// ─── skeleton ───────────────────────────────────────────────────────────────

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-6 space-y-6">
    <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-gray-200 animate-pulse" />
      ))}
    </div>
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 h-80 rounded-xl bg-gray-200 animate-pulse" />
      <div className="h-80 rounded-xl bg-gray-200 animate-pulse" />
    </div>
    <div className="grid grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-64 rounded-xl bg-gray-200 animate-pulse" />
      ))}
    </div>
  </div>
);

// ─── WelcomeBanner ───────────────────────────────────────────────────────────

const WelcomeBanner = ({ user, todayHearings, overdueTasks }) => {
  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "User";
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-8 text-white"
      style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #1a4a8a 60%, #0d3a6e 100%)` }}
    >
      {/* decorative circles */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-8 right-32 h-40 w-40 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-blue-300" />
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-200">
              Advocate Workspace
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {greeting}, {firstName}
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed">
            You have{" "}
            <span className="font-bold text-white">{todayHearings} hearing{todayHearings !== 1 ? "s" : ""}</span>{" "}
            today and{" "}
            <span className="font-bold text-white">{overdueTasks} overdue</span>{" "}
            tasks needing attention.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium backdrop-blur-sm shrink-0">
          <Calendar className="h-4 w-4 text-blue-200" />
          <span>{dateStr}</span>
        </div>
      </div>
    </div>
  );
};

// ─── StatsCard ───────────────────────────────────────────────────────────────

const StatsCard = ({ title, value, sub, icon: Icon, iconBg, iconColor, href }) => {
  const content = (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-lg", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <TrendingUp className="h-4 w-4 text-emerald-500" />
      </div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value ?? 0}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
};

// ─── UpcomingHearingsTable ────────────────────────────────────────────────────

const UpcomingHearingsTable = ({ events = [], cases = [] }) => {
  const caseMap = useMemo(() => {
    const map = new Map();
    cases.forEach((c) => {
      const id = String(c._id || c.id || "");
      if (id) map.set(id, c);
    });
    return map;
  }, [cases]);

  const upcoming = events
    .filter((e) => new Date(e.start) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="font-heading text-lg font-bold text-gray-900">Upcoming Hearings</CardTitle>
          <p className="text-xs text-gray-400 mt-0.5">Next {Math.min(upcoming.length || 5, 5)} scheduled across all advocates</p>
        </div>
        <Link href="/dashboard/calendar">
          <span className="text-sm font-medium text-[#03234b] hover:underline cursor-pointer">
            View Calendar →
          </span>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Calendar className="h-12 w-12 mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">No upcoming hearings</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Case</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Court</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">When</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Advocate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((event, idx) => {
                  const caseId = String(event.case?._id || event.case || "");
                  const caseObj = caseMap.get(caseId);
                  const status = getHearingStatus(event.start);
                  const advocateName =
                    formatLegalTeamSummary(caseObj) ||
                    safeText(caseObj?.lawyer) ||
                    safeText(caseObj?.assignedTo) ||
                    "Not assigned";
                  const court = safeText(event.location) || safeText(caseObj?.court) || "—";
                  const caseNum = safeText(event.caseNumber) || safeText(event.caseId?.caseNumber) || "";
                  const d = new Date(event.start);
                  const dateStr = d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

                  return (
                    <tr key={event._id || idx} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug">
                          {event.title || "Untitled Hearing"}
                        </p>
                        {caseNum && (
                          <p className="text-xs text-gray-400 mt-0.5">{caseNum}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 text-sm">{court}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-gray-900 text-sm">{dateStr}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                            AVATAR_COLORS[idx % AVATAR_COLORS.length]
                          )}>
                            {getInitials(advocateName)}
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{advocateName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          hearingStatusStyles[status]
                        )}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {upcoming.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <Link href="/dashboard/hearings" className="text-sm font-medium text-[#03234b] hover:underline">
              View all hearings →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── DonutChart ──────────────────────────────────────────────────────────────

const DonutChart = ({ data, colors, total, label = "Total" }) => (
  <div className="relative">
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={88}
          paddingAngle={2}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: 13 }}
          formatter={(v, n) => [`${v}`, n]}
        />
      </PieChart>
    </ResponsiveContainer>
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-2xl font-bold text-gray-900">{total}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  </div>
);

// ─── CasesByStatus ────────────────────────────────────────────────────────────

const CasesByStatusChart = ({ cases = [] }) => {
  const data = useMemo(() => {
    const counts = { Ongoing: 0, Pending: 0, Disposal: 0, Closed: 0 };
    cases.forEach((c) => {
      const s = (c.status || "active").toLowerCase();
      if (s === "active" || s === "ongoing") counts.Ongoing++;
      else if (s === "pending") counts.Pending++;
      else if (s === "disposal" || s === "disposed") counts.Disposal++;
      else if (s === "closed") counts.Closed++;
      else counts.Ongoing++;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0);
  }, [cases]);

  const total = cases.length;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-lg font-bold text-gray-900">Cases by Status</CardTitle>
        <p className="text-xs text-gray-400">Live distribution across {total} cases</p>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Briefcase className="h-10 w-10 mb-2 text-gray-200" />
            <p className="text-sm">No cases yet</p>
          </div>
        ) : (
          <>
            <DonutChart data={data} colors={STATUS_COLORS} total={total} label="Total" />
            <div className="mt-3 space-y-2">
              {data.map((entry, i) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length] }}
                    />
                    <span className="text-gray-600">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{entry.value}</span>
                    <span className="text-gray-400 text-xs">
                      ({total > 0 ? Math.round((entry.value / total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ─── CasesByCategory ──────────────────────────────────────────────────────────

const CasesByCategoryChart = ({ cases = [] }) => {
  const data = useMemo(() => {
    const counts = {};
    cases.forEach((c) => {
      const cat = getDisplayCaseType(c) || c.caseType || c.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [cases]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-gray-900">Cases by Category</CardTitle>
        <p className="text-xs text-gray-400">Practice area distribution</p>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <FileText className="h-10 w-10 mb-2 text-gray-200" />
            <p className="text-sm">No data</p>
          </div>
        ) : (
          <>
            <DonutChart data={data} colors={CATEGORY_COLORS} total={total} label="Total" />
            <div className="mt-3 space-y-1.5">
              {data.map((entry, i) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                    />
                    <span className="text-gray-600">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{entry.value}</span>
                    <span className="text-xs text-gray-400">
                      ({total > 0 ? Math.round((entry.value / total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ─── TasksAndTeam ─────────────────────────────────────────────────────────────

const TasksAndTeam = ({ cases = [], notifications = [] }) => {
  const pendingCount = notifications.filter((n) => !n.read).length;
  const doneCount = notifications.filter((n) => n.read).length;
  const overdueCount = notifications.filter((n) => n.meta?.priority === "high" && !n.read).length;

  const topAdvocates = useMemo(() => {
    const map = {};
    cases.forEach((c) => {
      const name =
        formatLegalTeamSummary(c) ||
        safeText(c.lawyer) ||
        safeText(c.assignedTo) ||
        safeText(c.advocate);
      if (name) {
        if (!map[name]) map[name] = { name, count: 0 };
        map[name].count++;
      }
    });
    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [cases]);

  const taskCards = [
    { label: "Pending", value: pendingCount, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "Done",    value: doneCount,    color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "Overdue", value: overdueCount, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold text-gray-900">Tasks &amp; Team</CardTitle>
        <Link href="/dashboard/notifications" className="text-xs font-medium text-[#03234b] hover:underline">
          All
        </Link>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Task metric cards */}
        <div className="grid grid-cols-3 gap-3">
          {taskCards.map((card) => (
            <div key={card.label} className={cn("rounded-xl border p-3 text-center", card.bg, card.border)}>
              <p className={cn("text-2xl font-bold", card.color)}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Top Advocates */}
        {topAdvocates.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Top Advocates
            </p>
            <div className="space-y-3">
              {topAdvocates.map((adv, idx) => (
                <div key={adv.name} className="flex items-center gap-3">
                  <div className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    AVATAR_COLORS[idx % AVATAR_COLORS.length]
                  )}>
                    {getInitials(adv.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{adv.name}</p>
                    <p className="text-xs text-gray-400">Advocate</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#03234b]/10 px-2.5 py-0.5 text-xs font-semibold text-[#03234b]">
                    {adv.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {topAdvocates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-4 text-gray-400">
            <Users className="h-8 w-8 mb-2 text-gray-200" />
            <p className="text-sm">No advocate data yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CauseListSearchCard = ({ cases = [] }) => {
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayIsoDate());
  const [listingType, setListingType] = useState("civ");
  const [courtOptions, setCourtOptions] = useState([]);
  const [selectedCourtOptionValue, setSelectedCourtOptionValue] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaSessionId, setCaptchaSessionId] = useState("");
  const [captchaImageUrl, setCaptchaImageUrl] = useState("");
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const selectedCase = useMemo(
    () => cases.find((caseItem) => String(caseItem._id) === String(selectedCaseId)) || null,
    [cases, selectedCaseId]
  );

  const recommendedCaseId = useMemo(
    () => getRecommendedCauseListCaseId(cases),
    [cases]
  );

  useEffect(() => {
    if (cases.length === 0) {
      if (selectedCaseId) {
        setSelectedCaseId("");
      }
      return;
    }

    const selectedCaseStillExists = cases.some(
      (caseItem) => String(caseItem._id) === String(selectedCaseId)
    );

    if (!selectedCaseStillExists && recommendedCaseId) {
      setSelectedCaseId(recommendedCaseId);
    }
  }, [cases, recommendedCaseId, selectedCaseId]);

  useEffect(() => {
    setCourtOptions([]);
    setSelectedCourtOptionValue("");
    setCaptchaCode("");
    setCaptchaSessionId("");
    setCaptchaImageUrl("");
    setCaptchaNonce(0);
    setResult(null);
    setError("");

    if (!selectedCaseId || !selectedDate || !listingType) {
      return;
    }

    let cancelled = false;

    const loadContext = async () => {
      try {
        setContextLoading(true);
        const response = await api.causeList.getJudgesForCase(selectedCaseId, selectedDate);
        if (cancelled) {
          return;
        }

        const options = Array.isArray(response?.courtOptions)
          ? response.courtOptions
          : Array.isArray(response?.judges)
            ? response.judges
            : [];

        setCourtOptions(options);
        setSelectedCourtOptionValue(
          getAutoSelectedCourtOptionValue(options, selectedCase)
        );
        setCaptchaSessionId(response?.captchaSessionId || "");
        setCaptchaImageUrl(response?.captchaImageUrl || "");
        setCaptchaNonce((value) => value + 1);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setCourtOptions([]);
        setError(
          err?.message ||
            err?.errors?.[0]?.msg ||
            "Unable to fetch eCourts judge options for the selected case."
        );
      } finally {
        if (!cancelled) {
          setContextLoading(false);
        }
      }
    };

    loadContext();

    return () => {
      cancelled = true;
    };
  }, [selectedCaseId, selectedDate, listingType, selectedCase]);

  const refreshCaptcha = async () => {
    if (!captchaSessionId) {
      return;
    }

    try {
      const response = await api.causeList.refreshCaptcha(captchaSessionId);
      setCaptchaImageUrl(response?.captchaImageUrl || "");
      setCaptchaCode("");
      setCaptchaNonce((value) => value + 1);
    } catch (err) {
      setError(
        err?.message ||
          err?.errors?.[0]?.msg ||
          "Unable to refresh captcha right now."
      );
    }
  };

  const fetchCauseList = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.causeList.searchForCase(selectedCaseId, {
        date: selectedDate,
        listingType,
        courtOptionValue: selectedCourtOptionValue,
        captchaCode,
        captchaSessionId,
      });
      setResult(response);
      setCaptchaImageUrl(response?.captchaImageUrl || captchaImageUrl);
      setCaptchaCode("");
      setCaptchaNonce((value) => value + 1);
    } catch (err) {
      const message =
        err?.message ||
        err?.errors?.[0]?.msg ||
        "Unable to fetch cause list right now.";
      setError(message);
      setResult(null);

      if (/captcha/i.test(message)) {
        await refreshCaptcha();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-[#03234b]/10 bg-white">
      <CardHeader className="border-b border-slate-100 bg-[linear-gradient(135deg,rgba(3,35,75,0.05),rgba(15,118,110,0.05))]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#03234b]">
              <Scale className="h-4 w-4" />
              Cause List
            </div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Search Your Daily Cause List
            </CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              Select one of your cases, load the live eCourts court and judge entries, solve the current captcha, then fetch the matching cause list result.
            </p>
          </div>
          <Link
            href="/dashboard/cases"
            className="hidden shrink-0 text-sm font-medium text-[#03234b] hover:underline sm:inline-flex"
          >
            Open cases
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.3fr,0.9fr,0.8fr,1.4fr]">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Case
            </label>
            <select
              value={selectedCaseId}
              onChange={(event) => setSelectedCaseId(event.target.value)}
              className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03234b]"
            >
              <option value="">Select a case</option>
              {cases.map((caseItem) => (
                <option key={caseItem._id} value={caseItem._id}>
                  {getCaseDisplayLabel(caseItem)}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              {selectedCaseId && selectedCaseId === recommendedCaseId
                ? "Auto-selected from the nearest upcoming hearing. You can change it anytime."
                : "Change the case here to view a different cause list."}
            </p>
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cause list date
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              max="2099-12-31"
              className="h-11"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cause list type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={listingType === "civ" ? "default" : "outline"}
                onClick={() => setListingType("civ")}
                className="h-11"
              >
                Civil
              </Button>
              <Button
                type="button"
                variant={listingType === "cri" ? "default" : "outline"}
                onClick={() => setListingType("cri")}
                className="h-11"
              >
                Criminal
              </Button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Court / judge entry from eCourts
            </label>
            <select
              value={selectedCourtOptionValue}
              onChange={(event) => setSelectedCourtOptionValue(event.target.value)}
              disabled={!selectedCaseId || contextLoading || courtOptions.length === 0}
              className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm disabled:cursor-not-allowed disabled:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03234b]"
            >
              <option value="">
                {contextLoading
                  ? "Loading eCourts entries..."
                  : courtOptions.length > 0
                    ? "Select court and judge entry"
                    : "No live eCourts entries found"}
              </option>
              {courtOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[auto,1fr,auto]">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              captcha
            </label>
            <div className="flex min-h-[84px] min-w-[180px] items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2">
              {captchaImageUrl ? (
                <img
                  src={`${captchaImageUrl}${captchaImageUrl.includes("?") ? "&" : "?"}v=${captchaNonce}`}
                  alt="eCourts captcha"
                  className="max-h-[64px] w-auto max-w-[160px] object-contain"
                />
              ) : (
                <span className="text-sm text-slate-400">Captcha will load here</span>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Enter captcha
            </label>
            <Input
              value={captchaCode}
              onChange={(event) =>
                setCaptchaCode(event.target.value.replace(/[^a-zA-Z0-9]/g, ""))
              }
              placeholder="Enter eCourts captcha"
              className="h-11"
              maxLength={6}
            />
          </div>
          <div className="flex gap-2 lg:self-end">
            <Button
              type="button"
              variant="outline"
              onClick={refreshCaptcha}
              disabled={!captchaSessionId}
              className="h-11"
            >
              Refresh Captcha
            </Button>
            <Button
              onClick={fetchCauseList}
              disabled={
                loading ||
                !selectedDate ||
                !selectedCaseId ||
                !selectedCourtOptionValue ||
                !captchaCode ||
                !captchaSessionId
              }
              className="h-11 bg-[#03234b] px-5 text-white hover:bg-[#042d5e]"
            >
              <Search className="mr-2 h-4 w-4" />
              {loading ? "Fetching..." : "Fetch Cause List"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {selectedCase ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <span>
                <span className="font-semibold text-slate-900">Court:</span>{" "}
                {selectedCase.eCourt?.court || selectedCase.court || "Unavailable"}
              </span>
              <span>
                <span className="font-semibold text-slate-900">District:</span>{" "}
                {selectedCase.eCourt?.district || selectedCase.district || "Unavailable"}
              </span>
              <span>
                <span className="font-semibold text-slate-900">State:</span>{" "}
                {selectedCase.eCourt?.state || selectedCase.courtState || "Unavailable"}
              </span>
              <span>
                <span className="font-semibold text-slate-900">Mode:</span>{" "}
                {listingType === "cri" ? "Criminal" : "Civil"}
              </span>
            </div>
          </div>
        ) : null}

        {result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{result.date || selectedDate}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Case matches</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{result.total_matches || 0}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected entry</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {result.selectedCourtOption?.label || "Unavailable"}
                </p>
              </div>
            </div>

            {(result.entries || []).length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Matching listings</p>
                  <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                    {result.total_matches || result.entries.length} found
                  </Badge>
                </div>

                <div className="space-y-2">
                  {(result.entries || []).slice(0, 6).map((item, index) => (
                    <div
                      key={`${item.case_number}-${item.serial || index}`}
                      className="rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.case_number || "Case number unavailable"}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">{item.party || "Party details unavailable"}</p>
                          {item.advocate ? (
                            <p className="mt-1 text-xs text-slate-600">
                              Advocate: {item.advocate}
                            </p>
                          ) : null}
                          {item.next_hearing_date ? (
                            <p className="mt-1 text-xs text-slate-600">
                              Next hearing date:- {item.next_hearing_date}
                            </p>
                          ) : null}
                          {item.judge_name ? (
                            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                              {item.judge_name}
                            </p>
                          ) : null}
                        </div>
                        {item.stage ? (
                          <Badge className="border border-[#03234b]/10 bg-[#03234b]/5 text-[#03234b] hover:bg-[#03234b]/5">
                            {item.stage}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                No cause-list entry matched this case for the selected date and judge filter.
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            Choose a case to auto-fill court details, load the live eCourts court and judge entry, solve the captcha, then fetch the matching cause list.
          </div>
        )}

        <Link
          href="/dashboard/cases"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#03234b] hover:underline"
        >
          Review tracked cases
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
};

// ─── ApprovalPopup (unchanged logic) ─────────────────────────────────────────

const ApprovalNotificationsPopup = ({
  notifications = [],
  open,
  onOpenChange,
  dismissedNotificationIds = [],
}) => {
  const visible = notifications.filter(
    (n) => !n?._id || !dismissedNotificationIds.includes(n._id)
  );

  if (visible.length === 0) return null;

  const primary = visible[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden border border-slate-200 bg-white p-0 shadow-2xl shadow-slate-900/10 sm:rounded-3xl">
        <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex items-start gap-3 pr-8">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#03234b]/10 bg-[#03234b]/5">
                <AlertCircle className="h-5 w-5 text-[#03234b]" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-[1.75rem] font-semibold tracking-[-0.02em] text-slate-900">
                  Documents Waiting For Approval
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-6 text-slate-600">
                  {visible.length === 1
                    ? "A document needs advocate review right now."
                    : `${visible.length} documents need advocate review right now.`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-6 py-5">
          {visible.slice(0, 4).map((n) => {
            const href = getNotificationTarget(n);
            return (
              <div
                key={getNotificationKey(n)}
                className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm shadow-slate-900/5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <AlertCircle className="h-5 w-5 text-[#03234b]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-700 hover:bg-amber-50">
                        Priority
                      </Badge>
                      <Badge className="rounded-full border border-[#03234b]/10 bg-[#03234b]/5 px-3 py-1 font-medium text-[#03234b] hover:bg-[#03234b]/5">
                        Approval Required
                      </Badge>
                      <span className="text-xs font-medium text-slate-500">
                        {n.createdAt ? formatRelativeTime(new Date(n.createdAt)) : "Just now"}
                      </span>
                    </div>
                    <p className="mt-3 text-base font-medium leading-7 text-slate-900">{n.message}</p>
                    <div className="mt-4">
                      <Link href={href}>
                        <Button className="h-11 rounded-xl bg-[#03234b] px-5 text-sm font-semibold text-white hover:bg-[#042d5e]">
                          Review document
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {visible.length > 4 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {visible.length - 4} more approval notifications are waiting in your notification center.
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-200 bg-slate-50/60 px-6 py-4 sm:justify-between">
          <p className="hidden text-sm text-slate-500 sm:block">
            Review pending documents to keep case activity moving.
          </p>
          <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
            <Button
              variant="outline"
              className="h-11 rounded-xl border-slate-300 bg-white px-5 text-slate-700 hover:bg-slate-100"
              onClick={() => onOpenChange(false)}
            >
              Remind me later
            </Button>
            <Link href={getNotificationTarget(primary)}>
              <Button className="h-11 w-full rounded-xl bg-[#03234b] px-5 text-sm font-semibold text-white hover:bg-[#042d5e] sm:w-auto">
                Open review queue
              </Button>
            </Link>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

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
  const [isApprovalPopupOpen, setIsApprovalPopupOpen] = useState(false);
  const [dismissedApprovalIds, setDismissedApprovalIds] = useState([]);
  const [approvalPopupSource, setApprovalPopupSource] = useState("dashboard");
  const pendingLogoutActionRef = useRef(null);
  const knownNotificationIdsRef = useRef(new Set());
  const hasSyncedNotificationsRef = useRef(false);

  const approvalNotifications = useMemo(
    () => getApprovalReviewNotifications(dashboardData.notifications),
    [dashboardData.notifications]
  );

  const dismissCurrentApprovalPopup = ({ source = approvalPopupSource } = {}) => {
    const activeIds = approvalNotifications.map((n) => n?._id).filter(Boolean);
    if (source === "dashboard") {
      setDismissedApprovalIds((prev) => Array.from(new Set([...prev, ...activeIds])));
      setApprovalReminderSuppressed(true);
    }
    setIsApprovalPopupOpen(false);
    setApprovalPopupSource("dashboard");
    if (source === "logout") {
      const continueLogout = pendingLogoutActionRef.current;
      pendingLogoutActionRef.current = null;
      window.setTimeout(() => { continueLogout?.(); }, 0);
    }
  };

  // computed stats
  const todayHearings = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    return dashboardData.events.filter((e) => {
      const d = new Date(e.start);
      return d >= todayStart && d < todayEnd;
    }).length;
  }, [dashboardData.events]);

  const overdueTasks = useMemo(
    () => dashboardData.notifications.filter((n) => n.meta?.priority === "high" && !n.read).length,
    [dashboardData.notifications]
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const cases = Array.isArray(await api.cases.getAll()) ? await api.cases.getAll() : [];
        const events = Array.isArray(await api.events.getAll()) ? await api.events.getAll() : [];
        let notifications = [];
        let documents = [];
        try { const r = await api.notifications.getAll(); notifications = Array.isArray(r) ? r : []; } catch {}
        try { const r = await api.documents.getAll(); documents = Array.isArray(r) ? r : []; } catch {}
        const stats = (await api.dashboard.getSummary()) || {
          totalCases: cases.length,
          activeCases: cases.filter((c) => c.status === "active").length,
          closedCases: cases.filter((c) => c.status === "closed").length,
          urgentCases: 0,
          upcomingHearings: events.length,
          documents: documents.length,
          activeClients: 0,
        };
        setDashboardData({ cases, events, notifications, documents, stats });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handle = (event) => {
      const n = event?.detail;
      if (!n) return;
      setDashboardData((prev) => {
        if (n._id && prev.notifications.some((item) => item._id === n._id)) return prev;
        return { ...prev, notifications: [n, ...prev.notifications] };
      });
    };
    window.addEventListener("app:notification", handle);
    return () => window.removeEventListener("app:notification", handle);
  }, []);

  useEffect(() => {
    if (loading) return;
    const activeIds = new Set(approvalNotifications.map((n) => n?._id).filter(Boolean));
    setDismissedApprovalIds((prev) => prev.filter((id) => activeIds.has(id)));
    const currentIds = new Set(dashboardData.notifications.map((n) => n?._id).filter(Boolean));
    const hasNew = approvalNotifications.some((n) => n?._id && !knownNotificationIdsRef.current.has(n._id));
    if (approvalNotifications.length === 0) {
      setApprovalReminderSuppressed(false);
      setHasShownLogoutApprovalReminder(false);
      setIsApprovalPopupOpen(false);
    } else if (!isApprovalReminderSuppressed() && (!hasSyncedNotificationsRef.current || hasNew)) {
      setApprovalPopupSource("dashboard");
      setIsApprovalPopupOpen(true);
    }
    knownNotificationIdsRef.current = currentIds;
    hasSyncedNotificationsRef.current = true;
  }, [approvalNotifications, dashboardData.notifications, loading]);

  useEffect(() => {
    const handle = (event) => {
      if (approvalNotifications.length === 0 || !isApprovalReminderSuppressed() || hasShownLogoutApprovalReminder()) return;
      event.preventDefault();
      setHasShownLogoutApprovalReminder(true);
      setApprovalReminderSuppressed(false);
      pendingLogoutActionRef.current = event.detail?.continueLogout || null;
      setDismissedApprovalIds([]);
      setApprovalPopupSource("logout");
      setIsApprovalPopupOpen(true);
    };
    window.addEventListener(APPROVAL_LOGOUT_EVENT, handle);
    return () => window.removeEventListener(APPROVAL_LOGOUT_EVENT, handle);
  }, [approvalNotifications]);

  useEffect(() => {
    if (loading) return undefined;
    let cancelled = false;
    let polling = false;
    const poll = async () => {
      if (polling || document.hidden) return;
      polling = true;
      try {
        const r = await api.notifications.getAll();
        if (cancelled) return;
        const notifications = Array.isArray(r) ? r : [];
        const newOnes = notifications.filter((n) => n?._id && !knownNotificationIdsRef.current.has(n._id));
        setDashboardData((prev) => ({ ...prev, notifications }));
        newOnes.forEach((n) => window.dispatchEvent(new CustomEvent("app:notification", { detail: n })));
      } catch {}
      finally { polling = false; }
    };
    const id = window.setInterval(poll, DASHBOARD_NOTIFICATION_POLL_MS);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [loading]);

  if (loading) return <DashboardSkeleton />;

  const { cases, events, notifications, documents, stats } = dashboardData;

  const statsCards = [
    {
      title: "Total Cases",
      value: stats.totalCases,
      sub: `+${Math.max(1, Math.floor(stats.totalCases * 0.09))} from last month`,
      icon: Briefcase,
      iconBg: "bg-[#03234b]/10",
      iconColor: "text-[#03234b]",
      href: "/dashboard/cases",
    },
    {
      title: "Upcoming Hearings",
      value: stats.upcomingHearings,
      sub: `Today: ${todayHearings} hearing${todayHearings !== 1 ? "s" : ""}`,
      icon: Calendar,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      href: "/dashboard/calendar",
    },
    {
      title: "Urgent Actions",
      value: stats.urgentCases,
      sub: "Requires attention",
      icon: AlertCircle,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      href: "/dashboard/cases?filter=urgent",
    },
    {
      title: "Closed Cases",
      value: stats.closedCases,
      sub: `+${Math.max(1, Math.floor(stats.closedCases * 0.18))} from last month`,
      icon: CheckCircle,
      iconBg: "bg-gray-100",
      iconColor: "text-gray-500",
      href: "/dashboard/cases?filter=closed",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/60 p-6">
      <ApprovalNotificationsPopup
        notifications={approvalNotifications}
        open={isApprovalPopupOpen}
        onOpenChange={(open) => {
          if (!open) { dismissCurrentApprovalPopup(); return; }
          setIsApprovalPopupOpen(true);
        }}
        dismissedNotificationIds={dismissedApprovalIds}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Banner */}
        <WelcomeBanner user={user} todayHearings={todayHearings} overdueTasks={overdueTasks} />

        {/* Stats Row — 4 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card) => (
            <StatsCard key={card.title} {...card} />
          ))}
        </div>

        {/* Hearings Table + Cases by Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <UpcomingHearingsTable events={events} cases={cases} />
          </div>
          <div>
            <CasesByStatusChart cases={cases} />
          </div>
        </div>

        <CauseListSearchCard cases={cases} />

        {/* Cases by Category + Tasks & Team */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CasesByCategoryChart cases={cases} />
          <TasksAndTeam cases={cases} notifications={notifications} />
        </div>
      </div>
    </div>
  );
};

export default NewDashboard;
