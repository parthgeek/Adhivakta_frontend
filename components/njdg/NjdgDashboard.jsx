"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  RefreshCw,
  AlertTriangle,
  Clock,
  Scale,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/services/api";

// ─── Palette ──────────────────────────────────────────────────────────────────

const PRIMARY = "#03234b";
const COLORS = ["#03234b", "#1e4d8c", "#3b82f6", "#60a5fa", "#93c5fd"];
const CIVIL_COLOR = "#1e4d8c";
const CRIMINAL_COLOR = "#dc2626";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => {
  if (n == null) return "—";
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(2)} L`;
  if (n >= 1_000) return n.toLocaleString("en-IN");
  return String(n);
};

const fmtAge = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const AGE_BUCKET_LABELS = {
  lessThanOneYear: "< 1 Year",
  oneToThreeYears: "1–3 Years",
  threeToFiveYears: "3–5 Years",
  fiveToTenYears: "5–10 Years",
  aboveTenYears: "> 10 Years",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StaleBadge() {
  return (
    <Badge
      variant="outline"
      className="border-amber-400 text-amber-600 bg-amber-50 gap-1 text-xs"
    >
      <AlertTriangle className="h-3 w-3" />
      Stale data
    </Badge>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, colorClass = "text-[#03234b]" }) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {title}
            </p>
            <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className="p-2 rounded-lg bg-gray-50">
              <Icon className={`h-5 w-5 ${colorClass}`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TripletRow({ label, data }) {
  if (!data) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex gap-6 text-right">
        <div className="w-24">
          <p className="text-xs text-gray-400">Civil</p>
          <p className="text-sm font-semibold text-[#1e4d8c]">{fmt(data.civil)}</p>
        </div>
        <div className="w-24">
          <p className="text-xs text-gray-400">Criminal</p>
          <p className="text-sm font-semibold text-red-600">{fmt(data.criminal)}</p>
        </div>
        <div className="w-28">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-sm font-bold text-gray-800">{fmt(data.total)}</p>
        </div>
      </div>
    </div>
  );
}

function CivilCriminalBar({ title, data }) {
  if (!data) return null;
  const chartData = [
    { name: "Civil", value: data.civil ?? 0, fill: CIVIL_COLOR },
    { name: "Criminal", value: data.criminal ?? 0, fill: CRIMINAL_COLOR },
  ];
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 40 }}>
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            width={60}
          />
          <Tooltip
            cursor={false}
            formatter={(v) => [fmt(v), ""]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AgeWiseChart({ ageWise }) {
  if (!ageWise || !Object.keys(ageWise).length) return null;

  const data = Object.entries(ageWise)
    .filter(([, v]) => v?.total != null)
    .map(([key, v], i) => ({
      name: AGE_BUCKET_LABELS[key] || key,
      total: v.total,
      civil: v.civil ?? 0,
      criminal: v.criminal ?? 0,
      fill: COLORS[i % COLORS.length],
    }));

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#03234b]" />
          Age-wise Pending Cases
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ left: 8, right: 16, top: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v) => fmt(v)}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(v, n) => [fmt(v), n.charAt(0).toUpperCase() + n.slice(1)]}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            />
            <Bar dataKey="civil" name="civil" stackId="a" fill={CIVIL_COLOR} radius={[0, 0, 0, 0]} />
            <Bar dataKey="criminal" name="criminal" stackId="a" fill={CRIMINAL_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 justify-center mt-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: CIVIL_COLOR }} />
            Civil
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: CRIMINAL_COLOR }} />
            Criminal
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsGrid({ alerts }) {
  if (!alerts) return null;

  const items = [
    { label: "Listed Today", data: alerts.listedToday, icon: Calendar, color: "text-blue-600" },
    { label: "Undated Cases", data: alerts.undatedCases, icon: AlertTriangle, color: "text-amber-600" },
    { label: "Excessive Dated", data: alerts.excessiveDatedCases, icon: TrendingUp, color: "text-red-600" },
    { label: "Filed by Women", data: alerts.filedByWomen, icon: Users, color: "text-purple-600" },
    { label: "Senior Citizen Filed", data: alerts.filedBySeniorCitizen, icon: Users, color: "text-green-600" },
  ];

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#03234b]" />
          Case Alerts & Indicators
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map(({ label, data, icon: Icon, color }) => (
          data && (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
              <div className="flex gap-5 text-right">
                <div>
                  <p className="text-xs text-gray-400">Civil</p>
                  <p className="text-sm font-semibold text-[#1e4d8c]">{fmt(data.civil)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Criminal</p>
                  <p className="text-sm font-semibold text-red-600">{fmt(data.criminal)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-sm font-bold text-gray-800">{fmt(data.total)}</p>
                </div>
              </div>
            </div>
          )
        ))}
      </CardContent>
    </Card>
  );
}

function TotalsDistributionPie({ totals }) {
  if (!totals) return null;
  const civil = totals.civilCases ?? 0;
  const criminal = totals.criminalCases ?? 0;
  if (!civil && !criminal) return null;

  const data = [
    { name: "Civil", value: civil },
    { name: "Criminal", value: criminal },
  ];

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Scale className="h-4 w-4 text-[#03234b]" />
          Civil vs Criminal Split
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              dataKey="value"
              paddingAngle={3}
            >
              <Cell fill={CIVIL_COLOR} />
              <Cell fill={CRIMINAL_COLOR} />
            </Pie>
            <Tooltip
              formatter={(v, n) => [fmt(v), n]}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            />
            <Legend
              iconType="circle"
              iconSize={10}
              wrapperStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function MonthlyFlowsCard({ monthlyFlows }) {
  if (!monthlyFlows) return null;
  const { institutedLastMonth, disposedLastMonth } = monthlyFlows;

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#03234b]" />
          Monthly Case Flows
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {institutedLastMonth && (
          <CivilCriminalBar title="Instituted (Last Month)" data={institutedLastMonth} />
        )}
        {disposedLastMonth?.totals && (
          <CivilCriminalBar title="Disposed (Last Month)" data={disposedLastMonth.totals} />
        )}
        {disposedLastMonth?.contested && (
          <div className="pl-3 border-l-2 border-gray-100 space-y-3">
            <CivilCriminalBar title="  Contested" data={disposedLastMonth.contested} />
            <CivilCriminalBar title="  Uncontested" data={disposedLastMonth.uncontested} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Selector ─────────────────────────────────────────────────────────────────

function Selector({ label, options, value, onChange, placeholder, loading }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <select
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#03234b]/30 disabled:bg-gray-50 disabled:text-gray-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || !options.length}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.optionValue} value={opt.optionValue}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse rounded-md bg-gray-100 ${className}`} />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function NjdgDashboard() {
  const [nationalData, setNationalData] = useState(null);
  const [stateData, setStateData] = useState(null);
  const [districtData, setDistrictData] = useState(null);

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const [loading, setLoading] = useState(true);
  const [stateLoading, setStateLoading] = useState(false);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [error, setError] = useState(null);

  // Derive the active snapshot for the main display
  const activeData = districtData || stateData || nationalData;

  // ─── Load national on mount ───────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.njdg.getNationalSummary();
        setNationalData(data);
        setStates(data.availableStates || []);
      } catch (err) {
        setError(err.message || "Failed to load NJDG data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── State selection ──────────────────────────────────────────────────────

  const handleStateChange = useCallback(
    async (optionValue) => {
      setSelectedState(optionValue);
      setSelectedDistrict("");
      setStateData(null);
      setDistrictData(null);
      setDistricts([]);

      if (!optionValue) return;

      setStateLoading(true);
      try {
        const data = await api.njdg.getStateSummary(optionValue);
        setStateData(data);
        setDistricts(data.availableDistricts || []);
      } catch (err) {
        setError(err.message || `Failed to load state data`);
      } finally {
        setStateLoading(false);
      }
    },
    []
  );

  // ─── District selection ───────────────────────────────────────────────────

  const handleDistrictChange = useCallback(
    async (distCode) => {
      setSelectedDistrict(distCode);
      setDistrictData(null);

      if (!distCode || !selectedState) return;

      setDistrictLoading(true);
      try {
        const data = await api.njdg.getDistrictSummary(selectedState, distCode);
        setDistrictData(data);
      } catch (err) {
        setError(err.message || "Failed to load district data");
      } finally {
        setDistrictLoading(false);
      }
    },
    [selectedState]
  );

  // ─── Manual refresh ───────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      if (selectedDistrict && selectedState) {
        const data = await api.njdg.getDistrictSummary(
          selectedState,
          selectedDistrict,
          true
        );
        setDistrictData(data);
      } else if (selectedState) {
        const data = await api.njdg.getStateSummary(selectedState, true);
        setStateData(data);
        setDistricts(data.availableDistricts || []);
      } else {
        const data = await api.njdg.getNationalSummary(true);
        setNationalData(data);
        setStates(data.availableStates || []);
      }
    } catch (err) {
      setError(err.message || "Refresh failed");
    } finally {
      setSyncing(false);
    }
  }, [selectedState, selectedDistrict]);

  // ─── Render ───────────────────────────────────────────────────────────────

  const scopeLoading = stateLoading || districtLoading;

  const scopeLabel = selectedDistrict
    ? `District: ${districts.find((d) => d.optionValue === selectedDistrict)?.label || selectedDistrict}`
    : selectedState
    ? `State: ${states.find((s) => s.optionValue === selectedState)?.label || selectedState}`
    : "National";

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">NJDG Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            National Judicial Data Grid — District Courts
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {activeData?.isStale && <StaleBadge />}
          {activeData?.capturedAt && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              <span>Synced {fmtAge(activeData.capturedAt)}</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={syncing || loading}
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* ── Scope selector ── */}
      <Card className="border border-gray-200">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Selector
              label="State"
              options={states}
              value={selectedState}
              onChange={handleStateChange}
              placeholder="— All India (National) —"
              loading={loading}
            />
            <Selector
              label="District"
              options={districts}
              value={selectedDistrict}
              onChange={handleDistrictChange}
              placeholder={
                selectedState
                  ? districts.length
                    ? "— All Districts —"
                    : "No districts available"
                  : "— Select a state first —"
              }
              loading={stateLoading}
            />
          </div>

          {/* Breadcrumb trail */}
          <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
            <span
              className={`cursor-pointer hover:text-[#03234b] transition-colors ${!selectedState ? "font-semibold text-[#03234b]" : ""}`}
              onClick={() => { setSelectedState(""); setSelectedDistrict(""); setStateData(null); setDistrictData(null); setDistricts([]); }}
            >
              National
            </span>
            {selectedState && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span
                  className={`cursor-pointer hover:text-[#03234b] transition-colors ${!selectedDistrict ? "font-semibold text-[#03234b]" : ""}`}
                  onClick={() => { setSelectedDistrict(""); setDistrictData(null); }}
                >
                  {states.find((s) => s.optionValue === selectedState)?.label || selectedState}
                </span>
              </>
            )}
            {selectedDistrict && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="font-semibold text-[#03234b]">
                  {districts.find((d) => d.optionValue === selectedDistrict)?.label || selectedDistrict}
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
          <button
            className="ml-auto text-red-400 hover:text-red-600"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Main content ── */}
      {loading || scopeLoading ? (
        <DashboardSkeleton />
      ) : !activeData ? (
        <Card className="border border-gray-200">
          <CardContent className="py-16 text-center text-gray-400">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No data available. Try refreshing.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Scope label */}
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Showing: {scopeLabel}
          </p>

          {/* ── Top summary cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Cases"
              value={fmt(activeData.metrics?.totals?.totalCases)}
              icon={Scale}
            />
            <MetricCard
              title="Civil Cases"
              value={fmt(activeData.metrics?.totals?.civilCases)}
              icon={Scale}
              colorClass="text-[#1e4d8c]"
            />
            <MetricCard
              title="Criminal Cases"
              value={fmt(activeData.metrics?.totals?.criminalCases)}
              icon={Scale}
              colorClass="text-red-600"
            />
            <MetricCard
              title="Pre-Litigation"
              value={fmt(activeData.metrics?.totals?.preLitigationPreTrial)}
              icon={TrendingDown}
              colorClass="text-purple-700"
            />
          </div>

          {/* ── Charts row ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TotalsDistributionPie totals={activeData.metrics?.totals} />
            <MonthlyFlowsCard monthlyFlows={activeData.metrics?.monthlyFlows} />
          </div>

          {/* ── Age-wise pending ── */}
          <AgeWiseChart ageWise={activeData.metrics?.ageWisePending} />

          {/* ── Alerts & indicators ── */}
          <AlertsGrid alerts={activeData.metrics?.alerts} />

          {/* ── Operational indicators ── */}
          {activeData.metrics?.operationalIndicators && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricCard
                title="Data Not Transferred"
                value={fmt(activeData.metrics.operationalIndicators.dataNotTransferred)}
                icon={AlertTriangle}
                colorClass="text-amber-600"
              />
              <MetricCard
                title="Orders Not Uploaded"
                value={fmt(activeData.metrics.operationalIndicators.ordersNotUploaded)}
                icon={AlertTriangle}
                colorClass="text-orange-600"
              />
            </div>
          )}

          {/* ── Source metadata ── */}
          <div className="flex items-center justify-between gap-2 text-xs text-gray-400 border-t border-gray-100 pt-4">
            <span>Source: {activeData.sourceUrl}</span>
            <span>
              Captured:{" "}
              {new Date(activeData.capturedAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
