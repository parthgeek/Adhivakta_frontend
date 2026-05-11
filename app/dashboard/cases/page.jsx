"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Briefcase,
  Activity,
  Clock,
  AlertTriangle,
  Search,
  Download,
  Plus,
  SlidersHorizontal,
  FileDown,
  X,
} from "lucide-react";
import api from "@/services/api";
import { formatDisplayCaseNumber } from "@/lib/caseTypeUtils";
import { getCaseLegalTeam, getLeadLegalTeamMember } from "@/lib/legal-team";
import { getCasePriority, isPriorityAlertCase } from "@/lib/casePriority";

// ─── Helpers ────────────────────────────────────────────────────────────────

const ADVOCATE_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-amber-600",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-pink-500",
];

function getAdvocateColor(name) {
  if (!name) return "bg-gray-400";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return ADVOCATE_COLORS[Math.abs(hash) % ADVOCATE_COLORS.length];
}

function getAdvocateInitials(name) {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatHearingDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();
  return { date, time };
}

function fmtDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function getTabStatus(raw) {
  const s = (raw.status || "active").toLowerCase();
  if (s === "closed" || s === "disposed") return "Closed";
  if (s === "pending") return "Pending";
  if (s === "disposal") return "Disposal";
  return "Ongoing";
}

// ─── PDF generation ──────────────────────────────────────────────────────────

function parseActRows(actsValue = "") {
  return String(actsValue)
    .split(/\n|;/)
    .map((e) => e.trim())
    .filter(Boolean)
    .map((e) => {
      const [actName, sectionText = ""] = e.split(/sections?:/i);
      return {
        act: actName.replace(/^under act\(s\)\s*/i, "").trim(),
        sections: sectionText.trim() || "—",
      };
    });
}

function buildCasePDF(raw) {
  const legalTeam = getCaseLegalTeam(raw);

  // ── Core fields ───────────────────────────────────────────────────
  const title = raw.title || "Untitled Case";
  const number = formatDisplayCaseNumber({
    caseNumber: raw.caseNumber || raw.number,
    caseTypeName: raw.caseSubType || raw.eCourt?.caseTypeName || raw.type || "",
    caseTypeCode: raw.eCourt?.caseTypeCode || raw.caseCode || "",
  });
  const status   = raw.status ? raw.status.charAt(0).toUpperCase() + raw.status.slice(1) : "Active";
  const court    = raw.court || "—";
  const courtType = String(raw.courtType || "").replace(/_/g, " ") || "—";
  const caseType    = raw.caseType || raw.type || "—";
  const caseSubType = raw.caseSubType || raw.eCourt?.caseTypeName || "—";
  const stage    = raw.caseStage?.replace(/_/g, " ") || raw.stage || raw.currentStage || "—";
  const district = raw.district || "—";
  const courtHall = raw.courtHall ? `Hall ${raw.courtHall}` : (raw.eCourt?.courtNo || "—");
  const cnr      = raw.cnrNumber || raw.eCourt?.cnrNumber || "—";
  const regNum   = raw.registrationNumber || raw.eCourt?.registrationNumber || "—";

  // ── Dates ─────────────────────────────────────────────────────────
  const filingDate       = fmtDate(raw.filingDate || raw.filing_date || raw.dateOfFiling);
  const registrationDate = fmtDate(raw.registrationDate || raw.eCourt?.registrationDate);

  // Compute first/next hearing from hearings array if available
  const hearingEvents = Array.isArray(raw.hearings) ? raw.hearings : [];
  const now = Date.now();
  const hearingDates = hearingEvents
    .map((h) => new Date(h.businessDate || h.start || h.date))
    .filter((d) => !isNaN(d.getTime()));
  const computedFirst = hearingDates.length
    ? new Date(Math.min(...hearingDates.map((d) => d.getTime())))
    : null;
  const computedNext  = hearingDates
    .filter((d) => d.getTime() > now)
    .sort((a, b) => a - b)[0] || null;

  const firstHearing = fmtDate(
    computedFirst || raw.firstHearingDate || raw.eCourt?.firstHearingDate
  );
  const nextHearing = fmtDate(
    computedNext || raw.nextHearingDate || raw.nextHearing || raw.hearingDate
  );

  // ── Textual sections ──────────────────────────────────────────────
  const description  = raw.description  || "";
  const reliefSought = raw.reliefSought || "";
  const notes        = raw.notes        || "";

  // ── Parties ───────────────────────────────────────────────────────
  const petitioners = raw.parties?.petitioner || [];
  const respondents = raw.parties?.respondent || [];

  // ── Acts ──────────────────────────────────────────────────────────
  const actRows = raw.acts ? parseActRows(raw.acts) : [];

  // ── FIR ───────────────────────────────────────────────────────────
  const hasFir = raw.policeStation || raw.firNumber || raw.firYear;

  // ── Processes ─────────────────────────────────────────────────────
  const processes   = Array.isArray(raw.processes)       ? raw.processes       : [];
  const iaStatuses  = Array.isArray(raw.iaStatuses)      ? raw.iaStatuses      : [];
  const interimOrders = Array.isArray(raw.interimOrders) ? raw.interimOrders   : [];
  const transferHistory = Array.isArray(raw.transferHistory) ? raw.transferHistory : [];

  const generated = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });

  // ── HTML helpers ──────────────────────────────────────────────────
  const field = (label, value) =>
    `<div class="field"><div class="field-label">${label}</div><div class="field-value">${value || "—"}</div></div>`;

  const section = (title, content) =>
    `<div class="section"><div class="section-title">${title}</div>${content}</div>`;

  const textBlock = (text) =>
    `<div class="text-block">${text}</div>`;

  const partyRows = (arr, label) => {
    if (!arr.length) return `<p class="none">No ${label} recorded</p>`;
    return arr.map((p) => `
      <div class="party-row">
        <strong>${p.name || "—"}</strong>
        ${p.age     ? `<span class="detail">Age: ${p.age}</span>`                    : ""}
        ${p.address ? `<span class="detail">${p.address}</span>`                     : ""}
        ${p.contact ? `<span class="detail">Contact: ${p.contact}</span>`            : ""}
        ${p.email   ? `<span class="detail">Email: ${p.email}</span>`                : ""}
        ${p.opposingCounsel ? `<span class="detail">Opp. Counsel: ${p.opposingCounsel}</span>` : ""}
      </div>`).join("");
  };

  const teamRows = legalTeam.length
    ? legalTeam.map((m) => `
      <div class="party-row">
        <strong>${m.name || "—"}</strong>
        ${m.level   ? `<span class="detail">${m.level} Advocate</span>`   : ""}
        ${m.company ? `<span class="detail">${m.company}</span>`          : ""}
        ${m.email   ? `<span class="detail">${m.email}</span>`            : ""}
        ${m.contact ? `<span class="detail">${m.contact}</span>`          : ""}
      </div>`).join("")
    : `<p class="none">No legal team recorded</p>`;

  const htable = (headers, rows, emptyMsg) => {
    if (!rows.length) return `<p class="none">${emptyMsg}</p>`;
    return `<table class="htable">
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((cells, i) =>
        `<tr class="${i % 2 === 0 ? "even" : "odd"}">${cells.map((c) => `<td>${c || "—"}</td>`).join("")}</tr>`
      ).join("")}</tbody>
    </table>`;
  };

  const hearingTableHtml = htable(
    ["Judge", "Business Date", "Hearing Date", "Purpose", "Outcome"],
    hearingEvents.map((h) => [
      h.judge || "—",
      fmtDate(h.businessDate),
      fmtDate(h.start || h.date),
      h.purpose || h.description || "—",
      h.outcome || "—",
    ]),
    "No hearings recorded"
  );

  const processesHtml = htable(
    ["Process ID", "Process Title", "Date"],
    processes.map((p) => [p.processId, p.processTitle, fmtDate(p.processDate)]),
    "No processes recorded"
  );

  const iaHtml = htable(
    ["IA Number", "Filed By", "Status", "Date"],
    iaStatuses.map((ia) => [ia.iaNumber, ia.filedBy, ia.status, fmtDate(ia.date)]),
    "No IA statuses recorded"
  );

  const ordersHtml = htable(
    ["Order No.", "Date", "Details"],
    interimOrders.map((o) => [o.orderNumber, fmtDate(o.orderDate), o.orderDetails || o.documentName || "—"]),
    "No interim orders linked"
  );

  const transferHtml = htable(
    ["From Court", "To Court", "Date", "Reason"],
    [...transferHistory]
      .sort((a, b) => new Date(b.transferDate || 0) - new Date(a.transferDate || 0))
      .map((t) => [t.fromCourt, t.toCourt, fmtDate(t.transferDate), t.reason || "—"]),
    "No transfer history"
  );

  const actsHtml = actRows.length
    ? htable(["Under Act(s)", "Under Section(s)"], actRows.map((r) => [r.act, r.sections]), "")
    : `<p class="none">No acts or sections recorded</p>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11.5px; color: #1a1a1a; background: #fff; }
    .page { padding: 36px 40px; max-width: 940px; margin: 0 auto; }

    .doc-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2.5px solid #1a2332; margin-bottom: 20px; }
    .brand-name { font-size: 22px; font-weight: 800; color: #1a2332; letter-spacing: 1px; }
    .brand-sub  { font-size: 10px; color: #888; font-weight: 400; margin-top: 2px; letter-spacing: 0.5px; }
    .doc-meta   { text-align: right; font-size: 10px; color: #666; line-height: 1.7; }
    .doc-meta strong { color: #1a2332; }

    .case-title-block { background: #f4f6fb; border-left: 4px solid #1a2332; padding: 14px 18px; border-radius: 0 6px 6px 0; margin-bottom: 24px; }
    .case-title-block h1 { font-size: 16px; font-weight: 700; color: #1a2332; line-height: 1.3; }
    .case-number { font-size: 11px; color: #666; margin-top: 4px; }
    .status-chip { display: inline-block; margin-top: 8px; padding: 2px 10px; border-radius: 99px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    .status-active   { background: #dcfce7; color: #166534; }
    .status-pending  { background: #fef9c3; color: #854d0e; }
    .status-closed   { background: #f1f5f9; color: #475569; }
    .status-disposed { background: #fee2e2; color: #991b1b; }

    .section { margin-bottom: 22px; page-break-inside: avoid; }
    .section-title { font-size: 10px; font-weight: 700; color: #1a2332; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 16px; }
    .field { padding: 5px 0; }
    .field-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
    .field-value { font-size: 11.5px; color: #1a1a1a; font-weight: 500; }

    .party-row { padding: 7px 10px; background: #f8f9fb; border-radius: 5px; margin-bottom: 5px; }
    .party-row strong { display: block; font-size: 11.5px; color: #1a2332; }
    .detail { display: block; font-size: 10px; color: #666; margin-top: 1px; }
    .none { font-size: 11px; color: #aaa; font-style: italic; }

    .text-block { font-size: 11.5px; color: #444; line-height: 1.65; padding: 10px 14px; background: #f8f9fb; border-radius: 5px; }

    .htable { width: 100%; border-collapse: collapse; }
    .htable thead tr { background: #1a2332; color: #fff; }
    .htable th { padding: 6px 10px; text-align: left; font-size: 9px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; white-space: nowrap; }
    .htable td { padding: 7px 10px; font-size: 11px; border-bottom: 1px solid #e8eaed; vertical-align: top; }
    .htable tr.even td { background: #f8f9fb; }
    .htable tr.odd  td { background: #fff; }

    .doc-footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9.5px; color: #bbb; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 20px 24px; }
      @page { margin: 12mm; size: A4 portrait; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="doc-header">
    <div>
      <div class="brand-name">ADHIVAKTA</div>
      <div class="brand-sub">LEGAL CASE MANAGEMENT</div>
    </div>
    <div class="doc-meta">
      <div><strong>Case Information Report</strong></div>
      <div>Generated: ${generated}</div>
      <div>Confidential &mdash; For internal use only</div>
    </div>
  </div>

  <div class="case-title-block">
    <h1>${title}</h1>
    <div class="case-number">${number}</div>
    <span class="status-chip status-${status.toLowerCase()}">${status}</span>
  </div>

  ${section("Case Details", `
    <div class="grid-3">
      ${field("Court", court)}
      ${field("Court Level", courtType)}
      ${field("Case Type", caseType)}
      ${field("Case Sub-Type", caseSubType)}
      ${field("Case Stage", stage)}
      ${field("District", district)}
      ${field("Court Hall / No.", courtHall)}
      ${field("Registration Number", regNum)}
      ${field("CNR Number", cnr)}
    </div>`)}

  ${section("Filing &amp; Hearing Dates", `
    <div class="grid-2">
      ${field("Filing Date", filingDate)}
      ${field("Registration Date", registrationDate)}
      ${field("First Hearing Date", firstHearing)}
      ${field("Next Hearing Date", nextHearing)}
    </div>`)}

  ${description ? section("Case Description", textBlock(description)) : ""}
  ${reliefSought ? section("Relief Sought", textBlock(reliefSought)) : ""}
  ${notes        ? section("Additional Notes", textBlock(notes))       : ""}

  ${section("Petitioner(s)", partyRows(petitioners, "petitioners"))}
  ${section("Respondent(s)", partyRows(respondents, "respondents"))}
  ${section("Legal Team (Petitioner's Counsel)", teamRows)}

  ${actRows.length ? section("Acts &amp; Sections", actsHtml) : ""}

  ${hasFir ? section("FIR Details", `
    <div class="grid-3">
      ${field("Police Station", raw.policeStation)}
      ${field("FIR Number", raw.firNumber)}
      ${field("FIR Year", raw.firYear)}
    </div>`) : ""}

  ${section("Case History / Hearing History", hearingTableHtml)}

  ${processes.length   ? section("Processes",        processesHtml) : ""}
  ${iaStatuses.length  ? section("IA Statuses",       iaHtml)        : ""}
  ${interimOrders.length ? section("Interim Orders",  ordersHtml)    : ""}
  ${transferHistory.length ? section("Transfer History", transferHtml) : ""}

  <div class="doc-footer">
    <span>Adhivakta Legal Case Management</span>
    <span>${title} &mdash; ${number}</span>
  </div>

</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
}

// ─── Components ──────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, iconBg }) {
  return (
    <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

const STATUS_TABS = ["All Cases", "Ongoing", "Pending", "Disposal", "Closed"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CasesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLawyer, setIsLawyer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All Cases");
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // export dialog
  const [exportOpen, setExportOpen] = useState(false);
  const [exportSearch, setExportSearch] = useState("");

  useEffect(() => {
    if (user) setIsLawyer(user.role === "lawyer");
  }, [user]);

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      try {
        const response = await api.cases.getAll({ search: searchTerm });
        if (Array.isArray(response)) setCases(response);
        else if (response?.data && Array.isArray(response.data)) setCases(response.data);
        else setCases(isLawyer ? lawyerCases : clientCases);
      } catch {
        setCases(isLawyer ? lawyerCases : clientCases);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [isLawyer, searchTerm]);

  const mapCase = (raw) => {
    const legalTeam = getCaseLegalTeam(raw);
    const lead = getLeadLegalTeamMember(legalTeam);
    const priority = getCasePriority(raw);
    return {
      id: raw._id || raw.id,
      title: raw.title || "Untitled Case",
      number: formatDisplayCaseNumber({
        caseNumber: raw.caseNumber || raw.number,
        caseTypeName: raw.caseSubType || raw.eCourt?.caseTypeName || raw.type || "",
        caseTypeCode: raw.eCourt?.caseTypeCode || raw.caseCode || "",
      }),
      court: raw.court || "N/A",
      category: raw.caseType || raw.type || "Civil",
      stage: raw.caseStage?.replace(/_/g, " ") || raw.stage || raw.currentStage || raw.hearingStage || "—",
      nextHearing: raw.nextHearingDate || raw.nextHearing || raw.hearingDate,
      advocateName: lead?.name || raw.assignedTo?.name || null,
      isHighPriority: isPriorityAlertCase(priority),
      tabStatus: getTabStatus(raw),
    };
  };

  const uniqueCases = useMemo(
    () => Array.from(new Map(cases.map((c) => [c._id || c.id, c])).values()),
    [cases]
  );

  const tabCounts = useMemo(() => ({
    "All Cases": uniqueCases.length,
    "Ongoing":   uniqueCases.filter((c) => getTabStatus(c) === "Ongoing").length,
    "Pending":   uniqueCases.filter((c) => getTabStatus(c) === "Pending").length,
    "Disposal":  uniqueCases.filter((c) => getTabStatus(c) === "Disposal").length,
    "Closed":    uniqueCases.filter((c) => getTabStatus(c) === "Closed").length,
  }), [uniqueCases]);

  const stats = useMemo(() => ({
    total:        uniqueCases.length,
    ongoing:      tabCounts["Ongoing"],
    withHearings: uniqueCases.filter((c) => !!(c.nextHearingDate || c.nextHearing || c.hearingDate)).length,
    highPriority: uniqueCases.filter((c) => isPriorityAlertCase(getCasePriority(c))).length,
  }), [uniqueCases, tabCounts]);

  const filtered = useMemo(() => uniqueCases.filter((raw) => {
    const c = mapCase(raw);
    if (activeTab !== "All Cases" && c.tabStatus !== activeTab) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.number.toLowerCase().includes(q) ||
        c.court.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  }), [uniqueCases, activeTab, searchTerm]);

  const exportFilteredList = useMemo(() => {
    if (!exportSearch.trim()) return uniqueCases;
    const q = exportSearch.toLowerCase();
    return uniqueCases.filter((raw) => {
      const c = mapCase(raw);
      return (
        c.title.toLowerCase().includes(q) ||
        c.number.toLowerCase().includes(q) ||
        c.court.toLowerCase().includes(q)
      );
    });
  }, [uniqueCases, exportSearch]);

  const handleExportCase = (raw) => {
    const html = buildCasePDF(raw);
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setExportOpen(false);
    setExportSearch("");
  };

  if (loading) {
    return (
      <div className="space-y-3 p-6">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Case Register</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and track all litigation matters across courts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Link href="/dashboard/cases/new">
            <Button size="sm" className="bg-[#1a2332] hover:bg-[#253345]">
              <Plus className="h-4 w-4 mr-1.5" />
              New Case
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Briefcase className="h-5 w-5 text-blue-600" />}   value={stats.total}        label="Total Cases"   iconBg="bg-blue-50" />
        <StatCard icon={<Activity   className="h-5 w-5 text-green-600" />} value={stats.ongoing}      label="Ongoing"       iconBg="bg-green-50" />
        <StatCard icon={<Clock      className="h-5 w-5 text-blue-500" />}  value={stats.withHearings} label="With Hearings" iconBg="bg-blue-50" />
        <StatCard icon={<AlertTriangle className="h-5 w-5 text-orange-500" />} value={stats.highPriority} label="High Priority" iconBg="bg-orange-50" />
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-[#1a2332] text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-gray-100"
              }`}
            >
              {tab}{" "}
              <span className={activeTab === tab ? "opacity-70" : "opacity-60"}>
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search cases..."
              className="pl-8 h-8 w-52 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Priority
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground tracking-wider">
                CASE ↑
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground tracking-wider">
                COURT
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground tracking-wider">
                CATEGORY
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground tracking-wider">
                STAGE
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground tracking-wider">
                NEXT<br />HEARING
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground tracking-wider">
                ADVOCATE
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No cases found.
                </td>
              </tr>
            ) : (
              filtered.map((raw) => {
                const c = mapCase(raw);
                const hearing = formatHearingDate(c.nextHearing);
                return (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/cases/${c.id}`)}
                  >
                    <td className="px-4 py-3.5 min-w-[240px] max-w-[320px]">
                      <div className="flex items-start gap-2">
                        {c.isHighPriority && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-foreground leading-snug">{c.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground text-sm whitespace-nowrap">
                      {c.court}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                        {c.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-sm whitespace-nowrap">
                      {c.stage}
                    </td>
                    <td className="px-4 py-3.5">
                      {hearing ? (
                        <div>
                          <p className="text-sm text-foreground whitespace-nowrap">{hearing.date}</p>
                          <p className="text-xs text-muted-foreground">{hearing.time}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {c.advocateName ? (
                        <div className="flex items-center gap-2">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${getAdvocateColor(c.advocateName)}`}>
                            {getAdvocateInitials(c.advocateName)}
                          </span>
                          <span className="text-sm">{c.advocateName.split(" ")[0]}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
          <span>Showing {filtered.length} of {uniqueCases.length} cases</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </div>

      {/* Export Case Dialog */}
      <Dialog open={exportOpen} onOpenChange={(v) => { setExportOpen(v); if (!v) setExportSearch(""); }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3 border-b">
            <DialogTitle className="text-base font-semibold">Export Case as PDF</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select a case to generate a full case information report.
            </p>
          </DialogHeader>

          {/* Search */}
          <div className="px-5 py-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search by case name or number..."
                className="pl-9 h-8 text-sm"
                value={exportSearch}
                onChange={(e) => setExportSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Case list */}
          <div className="overflow-y-auto max-h-[380px] py-1">
            {exportFilteredList.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">No cases match your search.</p>
            ) : (
              exportFilteredList.map((raw) => {
                const c = mapCase(raw);
                return (
                  <button
                    key={c.id}
                    onClick={() => handleExportCase(raw)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {c.isHighPriority && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{c.number}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground truncate">{c.court}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                        {c.category}
                      </Badge>
                      <FileDown className="h-4 w-4 text-muted-foreground group-hover:text-[#1a2332] transition-colors" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="px-5 py-3 border-t bg-gray-50 text-xs text-muted-foreground">
            {uniqueCases.length} case{uniqueCases.length !== 1 ? "s" : ""} available · Click a case to download PDF
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Fallback data ────────────────────────────────────────────────────────────

const lawyerCases = [
  {
    id: "case-1",
    title: "Rajesh Industries Pvt. Ltd. vs Bharti Enterprises Pvt. Ltd.",
    number: "OS 123/2024",
    caseType: "Civil",
    status: "active",
    court: "City Civil Court, Delhi",
    district: "Central Delhi",
    caseStage: "Arguments",
    nextHearingDate: "2026-05-14T10:30:00",
    filingDate: "2024-03-15",
    assignedTo: { name: "Vikram Malhotra" },
    parties: {
      petitioner: [{ name: "Rajesh Industries Pvt. Ltd.", address: "123, Connaught Place, New Delhi" }],
      respondent: [{ name: "Bharti Enterprises Pvt. Ltd.", address: "45, Nehru Place, New Delhi" }],
    },
  },
  {
    id: "case-2",
    title: "Ramesh Kumar vs State of Delhi",
    number: "CRL.M.C. 567/2024",
    caseType: "Criminal",
    status: "active",
    court: "Tis Hazari Court, Delhi",
    district: "North Delhi",
    caseStage: "Bail Hearing",
    nextHearingDate: "2026-05-16T11:00:00",
    filingDate: "2024-05-10",
    assignedTo: { name: "Anjali Sharma" },
    parties: {
      petitioner: [{ name: "Ramesh Kumar", address: "78, Model Town, Delhi" }],
      respondent: [{ name: "State of Delhi" }],
    },
  },
  {
    id: "case-3",
    title: "Sunil Traders vs Bharat Corp.",
    number: "CS 890/2024",
    caseType: "Corporate",
    status: "active",
    court: "Commercial Court, Mumbai",
    district: "Mumbai City",
    caseStage: "Evidence",
    nextHearingDate: "2026-06-05T11:00:00",
    filingDate: "2024-07-22",
    assignedTo: { name: "Raj Mehta" },
    parties: {
      petitioner: [{ name: "Sunil Traders", address: "22, Dadar, Mumbai" }],
      respondent: [{ name: "Bharat Corp.", address: "Fort, Mumbai" }],
    },
  },
  {
    id: "case-4",
    title: "Neha Singh vs Khanna & Associates",
    number: "FAO 234/2024",
    caseType: "Civil",
    status: "pending",
    court: "High Court, Delhi",
    district: "New Delhi",
    caseStage: "Final Arguments",
    nextHearingDate: "2026-06-10T15:30:00",
    filingDate: "2024-01-08",
    assignedTo: { name: "Neha Verma" },
    parties: {
      petitioner: [{ name: "Neha Singh", address: "Lajpat Nagar, New Delhi" }],
      respondent: [{ name: "Khanna & Associates", address: "Connaught Place, New Delhi" }],
    },
  },
  {
    id: "case-5",
    title: "Karan Builders vs MCD",
    number: "W.P. 456/2024",
    caseType: "Civil",
    status: "active",
    court: "High Court, Delhi",
    district: "New Delhi",
    caseStage: "Hearing",
    nextHearingDate: "2026-06-18T11:30:00",
    filingDate: "2024-04-30",
    assignedTo: { name: "Vikram Malhotra" },
    parties: {
      petitioner: [{ name: "Karan Builders Pvt. Ltd.", address: "Rohini, Delhi" }],
      respondent: [{ name: "Municipal Corporation of Delhi" }],
    },
  },
  {
    id: "case-6",
    title: "Indus Bank vs Mehra & Co.",
    number: "OS 99/2023",
    caseType: "Corporate",
    status: "closed",
    court: "City Civil Court, Delhi",
    district: "Central Delhi",
    caseStage: "Disposed",
    nextHearingDate: null,
    filingDate: "2023-11-14",
    assignedTo: { name: "Priya Singh" },
    parties: {
      petitioner: [{ name: "Indus Bank Ltd." }],
      respondent: [{ name: "Mehra & Co.", address: "Karol Bagh, Delhi" }],
    },
  },
  {
    id: "case-7",
    title: "Asha Devi vs Mohan Lal",
    number: "MISS 12/2025",
    caseType: "Family",
    status: "pending",
    court: "Family Court, Saket",
    district: "South Delhi",
    caseStage: "Mediation",
    nextHearingDate: "2026-07-01T12:00:00",
    filingDate: "2025-01-20",
    assignedTo: { name: "Anjali Sharma" },
    parties: {
      petitioner: [{ name: "Asha Devi", address: "Saket, New Delhi" }],
      respondent: [{ name: "Mohan Lal", address: "Malviya Nagar, New Delhi" }],
    },
  },
];

const clientCases = [
  {
    id: "case-1",
    title: "Property Dispute - Rajesh Industries",
    number: "CV-2024-4567",
    caseType: "Civil",
    status: "active",
    court: "City Civil Court, Delhi",
    caseStage: "Arguments",
    nextHearingDate: "2026-05-14T10:30:00",
    filingDate: "2024-03-15",
    assignedTo: { name: "Vikram Malhotra" },
  },
  {
    id: "case-2",
    title: "Insurance Claim Matter",
    number: "CC-2024-7890",
    caseType: "Corporate",
    status: "pending",
    court: "Commercial Court, Mumbai",
    caseStage: "Evidence",
    nextHearingDate: "2026-06-05T11:00:00",
    filingDate: "2024-07-22",
    assignedTo: { name: "Anjali Sharma" },
  },
  {
    id: "case-3",
    title: "Employment Dispute",
    number: "LC-2024-1234",
    caseType: "Civil",
    status: "active",
    court: "High Court, Delhi",
    caseStage: "Hearing",
    nextHearingDate: "2026-06-18T11:30:00",
    filingDate: "2024-01-08",
    assignedTo: { name: "Neha Verma" },
  },
];
