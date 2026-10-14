"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  FileText,
  Calendar,
  AlertCircle,
  Briefcase,
  CheckCircle,
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
import { useRouter } from "next/navigation";
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
import { getCaseCategory, getDisplayCaseType } from "@/lib/caseTypeUtils";
import { cn } from "@/lib/utils";
import { formatLegalTeamSummary } from "@/lib/legal-team";
import { WIDTH_SPAN_CLASSES } from "@/lib/dashboard-layout";
import { useDashboardLayout } from "@/hooks/use-dashboard-layout";

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

const formatDashboardDate = (value) => {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getValidDate = (...values) => {
  for (const value of values) {
    if (!value) continue;
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
};

const getMonthStart = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const getMonthlyCountLabel = (count, singularLabel, pluralLabel = `${singularLabel}s`) => {
  if (count > 0) {
    return `+${count} ${count === 1 ? singularLabel : pluralLabel} from last month`;
  }
  return "No change from last month";
};

const formatNumericDate = (value, separator = "/") => {
  if (!value) {
    return "";
  }

  const stringValue = String(value);
  const isoDateMatch = stringValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    return [isoDateMatch[3], isoDateMatch[2], isoDateMatch[1]].join(separator);
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return stringValue;
  }

  return [
    padDatePart(parsedDate.getDate()),
    padDatePart(parsedDate.getMonth() + 1),
    parsedDate.getFullYear(),
  ].join(separator);
};

const getCaseDisplayLabel = (caseItem = {}) =>
  caseItem.title || caseItem.caseNumber || caseItem.cnrNumber || "Untitled case";

const getEventCaseId = (event = {}) => {
  const candidates = [
    event.case?._id,
    event.case?.id,
    typeof event.case === "string" ? event.case : null,
    event.caseId?._id,
    event.caseId?.id,
    typeof event.caseId === "string" ? event.caseId : null,
    event.case_id?._id,
    event.case_id?.id,
    typeof event.case_id === "string" ? event.case_id : null,
  ];

  return String(candidates.find(Boolean) || "");
};

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

// ─── StatsCard ───────────────────────────────────────────────────────────────

const StatsCard = ({
  title,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  href,
  compact = false,
  surfaceClass,
  titleClass,
  valueClass,
  subClass,
  trendClass,
  glowClass,
}) => {
  if (compact) {
    const content = (
      <div className="group rounded-xl border border-white/15 bg-white/10 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm transition duration-300 hover:bg-white/15 active:translate-y-[1px]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
          <TrendingUp className="h-3.5 w-3.5 text-emerald-200 opacity-80 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
        <p className="mt-3 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100">
          {title}
        </p>
        <div className="mt-1 flex items-end gap-2">
          <p className="font-mono text-2xl font-bold leading-none text-white">{value ?? 0}</p>
          <p className="min-w-0 truncate pb-0.5 text-[11px] font-medium text-blue-100/85">{sub}</p>
        </div>
      </div>
    );
    return href ? <Link href={href}>{content}</Link> : content;
  }

  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:translate-y-[1px]",
        surfaceClass || "border-gray-100 bg-white"
      )}
    >
      {glowClass ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-125",
            glowClass
          )}
        />
      ) : null}
      <div className="relative flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-lg", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
        <TrendingUp className={cn("h-3.5 w-3.5", trendClass || "text-emerald-500")} />
      </div>
      <p className={cn("relative text-[11px] font-medium uppercase tracking-wide", titleClass || "text-gray-500")}>
        {title}
      </p>
      <div className="relative mt-0.5 flex items-end gap-2">
        <p className={cn("text-2xl font-bold leading-none", valueClass || "text-gray-900")}>{value ?? 0}</p>
        <p className={cn("truncate pb-0.5 text-[11px]", subClass || "text-gray-400")}>{sub}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
};

// ─── UpcomingHearingsTable ────────────────────────────────────────────────────

const UpcomingHearingsTable = ({ events = [], cases = [] }) => {
  const router = useRouter();
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
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="font-heading text-lg font-bold text-gray-900">Upcoming Hearings</CardTitle>
          <p className="text-xs text-gray-400 mt-0.5">Your next {Math.min(upcoming.length || 5, 5)} scheduled hearings</p>
        </div>
        <Link href="/dashboard/calendar">
          <span className="text-sm font-medium text-[#03234b] hover:underline cursor-pointer">
            View Calendar →
          </span>
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-0">
        {upcoming.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12 text-gray-400">
            <Calendar className="h-12 w-12 mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">No upcoming hearings</p>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
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
                  const caseId = getEventCaseId(event);
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
                  const caseHref = caseId ? `/dashboard/cases/${caseId}` : null;
                  const openCase = () => {
                    if (caseHref) router.push(caseHref);
                  };

                  return (
                    <tr
                      key={event._id || idx}
                      onClick={openCase}
                      onKeyDown={(keyboardEvent) => {
                        if (!caseHref) return;
                        if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                          keyboardEvent.preventDefault();
                          openCase();
                        }
                      }}
                      role={caseHref ? "link" : undefined}
                      tabIndex={caseHref ? 0 : undefined}
                      aria-label={caseHref ? `Open case ${event.title || caseNum || caseId}` : undefined}
                      className={cn(
                        "border-b border-gray-50 transition-colors",
                        caseHref
                          ? "cursor-pointer hover:bg-gray-50/70 focus-visible:bg-gray-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#03234b]"
                          : "hover:bg-gray-50/70"
                      )}
                    >
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
          <div className="mt-auto px-4 py-3 border-t border-gray-100">
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
    const counts = { Ongoing: 0, Pending: 0, Disposed: 0, Closed: 0 };
    cases.forEach((c) => {
      const s = (c.status || "active").toLowerCase();
      if (s === "active" || s === "ongoing") counts.Ongoing++;
      else if (s === "pending") counts.Pending++;
      else if (s === "disposal" || s === "disposed") counts.Disposed++;
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
      const cat = getCaseCategory(c);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const ranked = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Keep the chart readable but still account for every case, so the slice
    // percentages add up to the case total shown elsewhere.
    if (ranked.length <= 6) return ranked;
    const top = ranked.slice(0, 5);
    const restTotal = ranked.slice(5).reduce((sum, d) => sum + d.value, 0);
    return [...top, { name: "Other", value: restTotal }];
  }, [cases]);

  const total = cases.length;

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

// ─── CasesByCourtState ──────────────────────────────────────────────────────

const getCaseCourtLabel = (caseItem = {}) =>
  safeText(caseItem.eCourt?.court) ||
  safeText(caseItem.court) ||
  safeText(caseItem.courtName) ||
  safeText(caseItem.courtComplex) ||
  safeText(caseItem.eCourt?.complex) ||
  "Court not specified";

const getCaseStateLabel = (caseItem = {}) => {
  const courtLabel = safeText(caseItem.eCourt?.court) || safeText(caseItem.court) || "";
  const isSupremeCourt =
    caseItem.courtType === "supreme_court" ||
    caseItem.eCourt?.source === "supremecourt" ||
    caseItem.eCourt?.stateCode === "IND" ||
    /supreme court of india/i.test(courtLabel);

  if (isSupremeCourt) {
    return "Supreme Court of India";
  }

  return (
    safeText(caseItem.eCourt?.state) ||
    safeText(caseItem.courtState) ||
    safeText(caseItem.state) ||
    "State not specified"
  );
};

const CasesByCourtState = ({ cases = [] }) => {
  const [groupBy, setGroupBy] = useState("court");

  const data = useMemo(() => {
    const counts = new Map();

    cases.forEach((caseItem) => {
      const label =
        groupBy === "state"
          ? getCaseStateLabel(caseItem)
          : getCaseCourtLabel(caseItem);
      counts.set(label, (counts.get(label) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
      .slice(0, 6);
  }, [cases, groupBy]);

  const total = cases.length;
  const topCount = data[0]?.value || 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
        <div>
          <CardTitle className="text-lg font-bold text-gray-900">
            Cases by {groupBy === "state" ? "State" : "Court"}
          </CardTitle>
          <p className="text-xs text-gray-400">
            Distribution across {total} case{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
          {[
            { value: "court", label: "Courts" },
            { value: "state", label: "States" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setGroupBy(option.value)}
              className={cn(
                "rounded-md px-2.5 py-1.5 transition active:translate-y-[1px]",
                groupBy === option.value
                  ? "bg-white text-[#03234b] shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Scale className="h-10 w-10 mb-2 text-gray-200" />
            <p className="text-sm">No court data yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((entry, index) => {
              const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
              const barWidth = topCount > 0 ? Math.max(8, (entry.value / topCount) * 100) : 0;

              return (
                <div key={entry.name} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                        />
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {entry.name}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {entry.value} case{entry.value !== 1 ? "s" : ""} • {percentage}%
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#03234b]/10 px-2.5 py-0.5 text-xs font-semibold text-[#03234b]">
                      {entry.value}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-[#03234b]"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
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
              Select one of your cases, load the live eCourts court and judge entries, solve the current captcha, then fetch the cause list using your case number only.
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

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full min-w-[760px] border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="bg-[#1e3a5f] px-3 py-3 text-left font-semibold text-white">
                          Sr No
                        </th>
                        <th className="bg-[#1f4d3a] px-3 py-3 text-left font-semibold text-white">
                          Cases
                        </th>
                        <th className="bg-[#7a3320] px-3 py-3 text-left font-semibold text-white">
                          Party Name
                        </th>
                        <th className="bg-[#3b2670] px-3 py-3 text-left font-semibold text-white">
                          Advocate Name
                        </th>
                        <th className="bg-[#5a2d20] px-3 py-3 text-left font-semibold text-white">
                          Category
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(result.entries || []).map((item, index) => (
                        <tr
                          key={`${item.case_number}-${item.serial || index}`}
                          className="border-b border-[#d6deeb] align-top hover:bg-[#f6f9fc]"
                        >
                          <td className="px-3 py-3 text-[#20324a]">
                            {item.serial || index + 1}
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-[#20324a]">
                              {item.case_number || "—"}
                            </div>
                            {item.next_hearing_date ? (
                              <div className="mt-2 text-xs text-[#4f5f77]">
                                Next hearing date:- {item.next_hearing_date}
                              </div>
                            ) : null}
                            {item.stage ? (
                              <div className="mt-1 text-xs text-[#6b7a90]">
                                Stage: {item.stage}
                              </div>
                            ) : null}
                            {item.judge_name ? (
                              <div className="mt-1 text-xs font-medium uppercase tracking-wide text-[#6b7a90]">
                                {item.judge_name}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-3 py-3 whitespace-pre-line text-[#20324a]">
                            {item.party || "—"}
                          </td>
                          <td className="px-3 py-3 text-[#20324a]">
                            {item.advocate || "—"}
                          </td>
                          <td className="px-3 py-3 text-[#20324a]">
                            {item.category || item.stage || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                No cause-list entry matched this case number for the selected date.
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            Choose a case to auto-fill court details, load the live eCourts court and judge entry, solve the captcha, then fetch the matching cause list by case number.
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

// ─── Personalized Cause List Preview ────────────────────────────────────────

const PersonalizedCauseListPreview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadPersonalizedList = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.causeList.getLatestSavedPersonalized();
        if (!cancelled) {
          setResult(response || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load your personalised cause list right now.");
          setResult(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPersonalizedList();

    return () => {
      cancelled = true;
    };
  }, []);

  const entries = Array.isArray(result?.personalized_cases)
    ? result.personalized_cases.slice(0, 8)
    : [];
  const totalCases = result?.personalized_total_cases ?? entries.length;
  const totalEntries = result?.personalized_total_entries ?? entries.length;
  const displayedDate = result?.displayedSavedDate || result?.date;

  if (!loading && !error && entries.length === 0) {
    return (
      <Card className="border-[#d6deeb] bg-white shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#03234b]/5">
              <Scale className="h-4 w-4 text-[#03234b]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">No cause list saved</p>
              <p className="text-xs text-slate-500">
                Save a personalised cause list to see it here.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/cause-list/search"
            className="inline-flex h-9 items-center rounded-lg border border-[#03234b]/15 px-3 text-sm font-semibold text-[#03234b] transition hover:bg-[#03234b]/5 active:translate-y-[1px]"
          >
            Create list
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-[#d6deeb] bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#03234b]">
              <Scale className="h-4 w-4" />
              Cause List
            </div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Saved Personalised cause list
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              {displayedDate
                ? `Latest saved list for ${formatDashboardDate(displayedDate)}`
                : "Latest saved personalised cause list"}
            </p>
          </div>
          <Link
            href="/dashboard/cause-list/search"
            className="inline-flex h-9 items-center rounded-lg border border-[#03234b]/15 px-3 text-sm font-semibold text-[#03234b] transition hover:bg-[#03234b]/5 active:translate-y-[1px]"
          >
            Open full list
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/70 sm:grid-cols-3">
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Cases
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-slate-900">{totalCases || 0}</p>
          </div>
          <div className="border-l border-slate-100 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Entries
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-slate-900">{totalEntries || 0}</p>
          </div>
          <div className="col-span-2 border-t border-slate-100 px-4 py-3 sm:col-span-1 sm:border-l sm:border-t-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Source
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-800">
              {(result?.personalized_sources || []).length
                ? result.personalized_sources
                    .map((source) =>
                      source === "delhi_high_court"
                        ? "Delhi High Court"
                        : source === "highcourts"
                          ? "High Courts"
                          : "District Courts"
                    )
                    .join(", ")
                : "Not loaded"}
            </p>
          </div>
        </div>

        {error ? (
          <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : loading ? (
          <div className="space-y-2 p-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="m-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            No saved personalised cause-list entries are available yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-sm">
              <thead>
                <tr className="text-left font-semibold text-white">
                  <th className="w-[7%] bg-[#26364d] px-3 py-3">Sr No</th>
                  <th className="w-[16%] bg-[#1e3a5f] px-3 py-3">Hearing Date</th>
                  <th className="w-[22%] bg-[#1f4d3a] px-3 py-3">Case</th>
                  <th className="w-[20%] bg-[#7a3320] px-3 py-3">Court</th>
                  <th className="w-[16%] bg-[#3b2670] px-3 py-3">Judge / Stage</th>
                  <th className="w-[19%] bg-[#5a2d20] px-3 py-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const hearingDate =
                    entry.scheduled_hearing_date || entry.next_hearing_date || displayedDate;
                  const causeListDate = entry.next_hearing_date || displayedDate;
                  const shouldShowCauseListDate =
                    causeListDate && String(causeListDate) !== String(hearingDate);

                  return (
                    <tr
                      key={`${entry.case_id || entry.case_number || "case"}-${index}`}
                      className="border-b border-[#d6deeb] align-top transition hover:bg-[#f6f9fc]"
                    >
                      <td className="px-3 py-3 text-[#20324a]">
                        {entry.serial || index + 1}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-[#20324a]">
                          {formatNumericDate(hearingDate) || "—"}
                        </p>
                        {shouldShowCauseListDate ? (
                          <p className="mt-1 text-xs text-[#6b7a90]">
                            Cause list date: {formatNumericDate(causeListDate, "-")}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-[#20324a]">
                          {entry.case_title || entry.case_number || "—"}
                        </p>
                        <p className="mt-1 text-xs font-medium text-[#4f5f77]">
                          {entry.case_number || "No case number"}
                        </p>
                        {entry.party ? (
                          <p className="mt-2 max-w-[34rem] whitespace-pre-line text-xs uppercase leading-5 text-[#6b7a90]">
                            {entry.party}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-[#20324a]">
                          {entry.court_name || "—"}
                        </p>
                        <p className="mt-1 text-xs text-[#6b7a90]">
                          {[entry.court_state, entry.district].filter(Boolean).join(" / ") || "—"}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-[#20324a]">
                          {entry.judge_name || "—"}
                        </p>
                        {entry.stage ? (
                          <p className="mt-1 text-xs text-[#6b7a90]">
                            Stage: {entry.stage}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-[#20324a]">
                          {entry.source_label || "—"}
                        </p>
                        {entry.target_label ? (
                          <p className="mt-1 text-xs text-[#6b7a90]">
                            Target: {entry.target_label}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
  const { layout } = useDashboardLayout();
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
      organizationName: null,
      organizationAdvocates: 0,
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

  const totalUpcomingHearings = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return dashboardData.events.filter((event) => {
      const eventDate = new Date(event.start);
      return eventDate >= todayStart;
    }).length;
  }, [dashboardData.events]);

  useEffect(() => {
    let cancelled = false;
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fire all requests in parallel (was a 7-call sequential waterfall, with
        // cases/events fetched twice each via the old `await ... ? await ...`).
        const toArray = (r) => (Array.isArray(r) ? r : []);
        const [stats, cases, events, notifications, documents] = await Promise.all([
          api.dashboard.getSummary().catch(() => null),
          api.cases.getAll().then(toArray).catch(() => []),
          api.events.getAll().then(toArray).catch(() => []),
          api.notifications.getAll().then(toArray).catch(() => []),
          api.documents.getAll().then(toArray).catch(() => []),
        ]);
        if (cancelled) return;
        setDashboardData({
          cases,
          events,
          notifications,
          documents,
          stats: stats || {
            totalCases: cases.length,
            activeCases: cases.filter((c) => c.status === "active").length,
            closedCases: cases.filter((c) => c.status === "closed").length,
            urgentCases: 0,
            upcomingHearings: events.length,
            documents: documents.length,
            activeClients: 0,
            organizationName: null,
            organizationAdvocates: 0,
          },
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        if (!cancelled) setLoading(false);
        const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
        console.debug(`[perf] dashboard load ${Math.round(t1 - t0)}ms`);
      }
    };

    fetchDashboardData();
    return () => {
      cancelled = true;
    };
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

  const todayDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const currentMonthStart = getMonthStart();
  const casesAddedThisMonth = cases.filter((caseItem) => {
    const createdDate = getValidDate(caseItem.createdAt, caseItem.filingDate);
    return createdDate && createdDate >= currentMonthStart;
  }).length;
  const casesClosedThisMonth = cases.filter((caseItem) => {
    const status = String(caseItem.status || "").toLowerCase();
    if (status !== "closed") return false;
    const closedDate = getValidDate(caseItem.closedAt, caseItem.updatedAt);
    return closedDate && closedDate >= currentMonthStart;
  }).length;

  const statsCardsById = {
    totalCases: {
      title: "Total Cases",
      value: stats.totalCases,
      sub: getMonthlyCountLabel(casesAddedThisMonth, "new case"),
      icon: Briefcase,
      iconBg: "bg-white/15 ring-1 ring-white/20",
      iconColor: "text-white",
      surfaceClass: "border-[#051a36]/40 bg-[linear-gradient(135deg,#02172f_0%,#06315f_100%)] text-white shadow-[0_18px_36px_-24px_rgba(3,35,75,0.9)]",
      titleClass: "text-blue-100/85",
      valueClass: "text-white",
      subClass: "text-blue-100/75",
      trendClass: "text-emerald-200",
      glowClass: "bg-sky-300/20",
      href: "/dashboard/cases",
    },
    upcomingHearings: {
      title: "Upcoming Hearings",
      value: totalUpcomingHearings,
      sub: `Today: ${todayHearings} hearing${todayHearings !== 1 ? "s" : ""}`,
      icon: Calendar,
      iconBg: "bg-white/15 ring-1 ring-white/20",
      iconColor: "text-emerald-100",
      surfaceClass: "border-emerald-950/30 bg-[linear-gradient(135deg,#064e3b_0%,#0f766e_100%)] text-white shadow-[0_18px_36px_-24px_rgba(5,95,70,0.9)]",
      titleClass: "text-emerald-50/80",
      valueClass: "text-white",
      subClass: "text-emerald-50/70",
      trendClass: "text-emerald-100",
      glowClass: "bg-emerald-200/20",
      href: "/dashboard/calendar",
    },
    urgentActions: {
      title: "Urgent Actions",
      value: stats.urgentCases,
      sub: "Requires attention",
      icon: AlertCircle,
      iconBg: "bg-white/15 ring-1 ring-white/20",
      iconColor: "text-amber-100",
      surfaceClass: "border-amber-950/30 bg-[linear-gradient(135deg,#78350f_0%,#b45309_100%)] text-white shadow-[0_18px_36px_-24px_rgba(146,64,14,0.9)]",
      titleClass: "text-amber-50/80",
      valueClass: "text-white",
      subClass: "text-amber-50/70",
      trendClass: "text-amber-100",
      glowClass: "bg-amber-200/20",
      href: "/dashboard/cases?filter=urgent",
    },
    closedCases: {
      title: "Closed Cases",
      value: stats.closedCases,
      sub: getMonthlyCountLabel(casesClosedThisMonth, "closed case"),
      icon: CheckCircle,
      iconBg: "bg-white/15 ring-1 ring-white/20",
      iconColor: "text-slate-100",
      surfaceClass: "border-slate-950/30 bg-[linear-gradient(135deg,#1e293b_0%,#334155_100%)] text-white shadow-[0_18px_36px_-24px_rgba(15,23,42,0.85)]",
      titleClass: "text-slate-100/75",
      valueClass: "text-white",
      subClass: "text-slate-100/65",
      trendClass: "text-slate-200",
      glowClass: "bg-slate-200/20",
      href: "/dashboard/cases?filter=closed",
    },
  };

  const visibleStatCards = layout.statCards
    .filter((card) => card.visible && statsCardsById[card.id])
    .map((card) => ({ id: card.id, ...statsCardsById[card.id] }));

  const widgetRenderers = {
    dayBriefing: () => (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
              <Calendar className="h-4 w-4 text-blue-600" />
            </span>
            <span>
              <span className="font-bold text-gray-900">{todayHearings}</span>{" "}
              hearing{todayHearings !== 1 ? "s" : ""} today
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </span>
            <span>
              <span className="font-bold text-gray-900">{overdueTasks}</span>{" "}
              overdue task{overdueTasks !== 1 ? "s" : ""} needing attention
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-600">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{todayDateStr}</span>
        </div>
      </div>
    ),
    causeList: () => (
      <div data-tour="dashboard-activity">
        <PersonalizedCauseListPreview />
      </div>
    ),
    hearingsTable: () => (
      <div className="h-full" data-tour="dashboard-hearings">
        <UpcomingHearingsTable events={events} cases={cases} />
      </div>
    ),
    casesByStatus: () => <CasesByStatusChart cases={cases} />,
    casesByCategory: () => <CasesByCategoryChart cases={cases} />,
    casesByCourt: () => <CasesByCourtState cases={cases} />,
    causeListSearch: () => <CauseListSearchCard cases={cases} />,
  };

  const visibleWidgets = layout.widgets.filter(
    (widget) => widget.visible && widgetRenderers[widget.id]
  );

  return (
    <div className="min-h-screen bg-gray-50/60 p-6" data-tour="dashboard">
      <ApprovalNotificationsPopup
        notifications={approvalNotifications}
        open={isApprovalPopupOpen}
        onOpenChange={(open) => {
          if (!open) { dismissCurrentApprovalPopup(); return; }
          setIsApprovalPopupOpen(true);
        }}
        dismissedNotificationIds={dismissedApprovalIds}
      />

      <div className="max-w-7xl mx-auto space-y-5">
        {user?.role === "organization_admin" && (
          <div className="flex flex-col gap-2 rounded-xl border border-blue-100 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-950">
                {stats.organizationName ||
                  user?.organization?.name ||
                  "Organization dashboard"}
              </div>
              <div className="text-sm text-muted-foreground">
                Aggregate view across {stats.organizationAdvocates || 0} assigned
                advocate
                {(stats.organizationAdvocates || 0) !== 1 ? "s" : ""}
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/organization">Manage Advocates</Link>
            </Button>
          </div>
        )}

        {/* Stats cards — visibility and order come from Settings → Dashboard */}
        {visibleStatCards.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" data-tour="dashboard-stats">
            {visibleStatCards.map((card) => (
              <StatsCard key={card.id} {...card} />
            ))}
          </div>
        )}

        {/* Widgets laid out on a 6-column grid using each widget's saved width */}
        {visibleWidgets.length > 0 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-6">
            {visibleWidgets.map((widget) => (
              <div
                key={widget.id}
                className={cn("min-w-0", WIDTH_SPAN_CLASSES[widget.width] || WIDTH_SPAN_CLASSES.full)}
              >
                {widgetRenderers[widget.id]()}
              </div>
            ))}
          </div>
        )}

        {visibleStatCards.length === 0 && visibleWidgets.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="font-medium text-gray-700">Your dashboard is empty</p>
            <p className="mt-1 text-sm text-gray-500">
              Every block is currently hidden. Turn some back on to see your case activity.
            </p>
            <Link
              href="/dashboard/settings?tab=dashboard"
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#03234b] px-4 text-sm font-semibold text-white hover:bg-[#042d5e]"
            >
              Customize dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewDashboard;
