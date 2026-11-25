"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Briefcase,
  Activity,
  AlertTriangle,
  Search,
  CheckCircle2,
  Download,
  Plus,
  SlidersHorizontal,
  FileDown,
  X,
} from "lucide-react";
import api from "@/services/api";
import { formatDisplayCaseNumber, getCaseCategory } from "@/lib/caseTypeUtils";
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
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  // A "next" hearing that has already passed means the proceeding / new date
  // has not been recorded yet.
  return { date, isPast: d.getTime() < todayStart.getTime() };
}

function fmtDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

const DISPOSED_CLOSED_TAB = "Disposed/Closed";

function isDisposedOrClosedStatus(status) {
  const s = String(status || "").toLowerCase();
  return s === "closed" || s === "disposed" || s === "disposal";
}

function getTabStatus(raw) {
  const s = (raw.status || "active").toLowerCase();
  if (isDisposedOrClosedStatus(s)) return DISPOSED_CLOSED_TAB;
  if (s === "pending") return "Pending";
  return "Ongoing";
}

const TERMINAL_TAB_STATUSES = new Set([DISPOSED_CLOSED_TAB]);

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
  const logoSrc =
    typeof window !== "undefined"
      ? `${window.location.origin}/images/adhi_logo_main.png`
      : "/images/adhi_logo_main.png";

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
        ${p.advocateName ? `<span class="detail">Advocate: ${p.advocateName}</span>` : ""}
        ${p.opposingCounsel ? `<span class="detail">Advocate: ${p.opposingCounsel}</span>` : ""}
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
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Public+Sans:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Public Sans', 'Segoe UI', Arial, sans-serif; font-size: 11.5px; color: #1a1a1a; background: #fff; }
    h1, h2, h3, h4, h5, h6, .brand-name, .case-title-block h1, .section-title { font-family: 'Manrope', 'Segoe UI', Arial, sans-serif; }
    .page { position: relative; padding: 36px 40px 72px; max-width: 940px; margin: 0 auto; }

    .doc-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2.5px solid #1a2332; margin-bottom: 20px; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand-logo { width: 52px; height: 52px; object-fit: contain; }
    .brand-name { font-size: 22px; font-weight: 800; color: #1a2332; letter-spacing: 1px; }
    .brand-sub  { font-size: 10px; color: #888; font-weight: 400; margin-top: 2px; letter-spacing: 0.5px; }
    .doc-meta   { text-align: right; font-size: 10px; color: #666; line-height: 1.7; }
    .doc-meta strong { color: #1a2332; }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      width: 620px;
      height: 620px;
      transform: translate(-50%, -50%);
      opacity: 0.06;
      z-index: 0;
      object-fit: contain;
      pointer-events: none;
    }

    .case-title-block { background: #f4f6fb; border-left: 4px solid #1a2332; padding: 14px 18px; border-radius: 0 6px 6px 0; margin-bottom: 24px; }
    .case-title-block h1 { font-size: 16px; font-weight: 700; color: #1a2332; line-height: 1.3; }
    .case-number { font-size: 11px; color: #666; margin-top: 4px; }
    .status-chip { display: inline-block; margin-top: 8px; padding: 2px 10px; border-radius: 99px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    .status-active   { background: #dcfce7; color: #166534; }
    .status-pending  { background: #fef9c3; color: #854d0e; }
    .status-closed   { background: #f1f5f9; color: #475569; }
    .status-disposed { background: #fee2e2; color: #991b1b; }

    .section { position: relative; z-index: 1; margin-bottom: 22px; page-break-inside: avoid; }
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

    .doc-header,
    .case-title-block,
    .doc-footer { position: relative; z-index: 1; }
    .doc-footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9.5px; color: #6b7280; }
    .print-footer {
      position: fixed;
      left: 12mm;
      right: 12mm;
      bottom: 6mm;
      display: flex;
      justify-content: center;
      font-size: 9px;
      color: #6b7280;
      border-top: 1px solid #dbe1ea;
      padding-top: 6px;
      background: #fff;
      z-index: 2;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 20px 24px 64px; }
      @page { margin: 12mm; size: A4 portrait; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
<img class="watermark" src="${logoSrc}" alt="Adhivakta watermark" />
<div class="page">

  <div class="doc-header">
    <div class="brand">
      <img class="brand-logo" src="${logoSrc}" alt="Adhivakta logo" />
      <div>
        <div class="brand-name">ADHIVAKTA</div>
        <div class="brand-sub">LEGAL CASE MANAGEMENT</div>
      </div>
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
    <span>&copy; ${new Date().getFullYear()} Adhivakta</span>
    <span>${title} &mdash; ${number}</span>
  </div>

</div>
<div class="print-footer">&copy; ${new Date().getFullYear()} Adhivakta. All rights reserved.</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
}

function buildCasesPDF(rawCases = []) {
  const printableCases = (Array.isArray(rawCases) ? rawCases : [rawCases]).filter(Boolean);
  if (printableCases.length <= 1) return buildCasePDF(printableCases[0] || {});

  const documents = printableCases.map((raw) => buildCasePDF(raw));
  const firstDocument = documents[0];
  const head =
    firstDocument.match(/<head>[\s\S]*?<\/head>/)?.[0] ||
    `<head><meta charset="utf-8"/><title>Selected Cases Report</title></head>`;
  const enhancedHead = head
    .replace(/<title>[\s\S]*?<\/title>/, "<title>Selected Cases Report</title>")
    .replace(
      "</style>",
      `
    .case-page-break { page-break-before: always; break-before: page; }
  </style>`
    );
  const watermark = firstDocument.match(/<img class="watermark"[^>]*>/)?.[0] || "";
  const printFooter = firstDocument.match(/<div class="print-footer">[\s\S]*?<\/div>/)?.[0] || "";
  const pages = documents
    .map((doc, index) => {
      const page = doc.match(/<div class="page">[\s\S]*?<\/div>\s*(?=<div class="print-footer">)/)?.[0];
      if (!page) return "";
      return page.replace(
        'class="page"',
        `class="page${index > 0 ? " case-page-break" : ""}"`
      );
    })
    .filter(Boolean)
    .join("\n");

  return `<!DOCTYPE html>
<html>
${enhancedHead}
<body>
${watermark}
${pages}
${printFooter}
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
}

// ─── Components ──────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, iconBg, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full bg-white border rounded-lg p-4 flex items-center gap-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a2332]/30 active:scale-[0.99] ${
        active
          ? "border-[#1a2332] bg-slate-50 shadow-sm ring-1 ring-[#1a2332]/15"
          : "hover:-translate-y-[1px] hover:border-[#1a2332]/30 hover:shadow-sm"
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </button>
  );
}

function FilterOptionGroup({ title, options, value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="grid grid-cols-1 gap-1">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors active:scale-[0.99] ${
                selected
                  ? "border-[#1a2332] bg-slate-50 text-[#1a2332]"
                  : "border-transparent text-muted-foreground hover:border-gray-200 hover:bg-gray-50 hover:text-foreground"
              }`}
            >
              <span className="font-medium">{option.label}</span>
              <span className={selected ? "text-[#1a2332]/70" : "text-muted-foreground/70"}>
                {option.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const STATUS_TABS = ["All Cases", "Ongoing", "Pending", DISPOSED_CLOSED_TAB];
const CASES_PER_PAGE = 7;

function getCaseId(raw = {}) {
  return raw._id || raw.id || raw.caseNumber || raw.number || raw.title;
}

function getCaseSelectionId(raw = {}) {
  const id = getCaseId(raw);
  return id == null ? "" : String(id);
}

function getCaseHearingTime(raw = {}) {
  const value = raw.nextHearingDate || raw.nextHearing || raw.hearingDate;
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function hasCaseHearing(raw = {}) {
  return Boolean(raw.nextHearingDate || raw.nextHearing || raw.hearingDate);
}

function getUpcomingHearingTime(raw = {}, nowTime = Date.now()) {
  const hearingTime = getCaseHearingTime(raw);
  const today = new Date(nowTime);
  const hearingDate = hearingTime ? new Date(hearingTime) : null;
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const hearingDayStart = hearingDate
    ? new Date(hearingDate.getFullYear(), hearingDate.getMonth(), hearingDate.getDate()).getTime()
    : null;

  if (!hearingDayStart || hearingDayStart < todayStart || TERMINAL_TAB_STATUSES.has(getTabStatus(raw))) {
    return null;
  }
  return hearingDayStart;
}

function buildPriorityCaseIds(caseList = []) {
  const priorityIds = new Set();

  caseList.forEach((raw) => {
    const id = getCaseId(raw);
    if (id && isPriorityAlertCase(getCasePriority(raw))) {
      priorityIds.add(id);
    }
  });

  // Only genuinely urgent/high cases count. The list is already sorted by
  // the soonest hearing, so no case is promoted just for being first.
  return priorityIds;
}

function compareCasesByPriorityAndHearing(a, b, priorityIds) {
  const aIsPriority = priorityIds.has(getCaseId(a));
  const bIsPriority = priorityIds.has(getCaseId(b));
  if (aIsPriority !== bIsPriority) return aIsPriority ? -1 : 1;

  const nowTime = Date.now();
  const aTime = getUpcomingHearingTime(a, nowTime) ?? Number.POSITIVE_INFINITY;
  const bTime = getUpcomingHearingTime(b, nowTime) ?? Number.POSITIVE_INFINITY;
  if (aTime !== bTime) return aTime - bTime;

  const aTitle = (a.title || "").toLowerCase();
  const bTitle = (b.title || "").toLowerCase();
  return aTitle.localeCompare(bTitle);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CasesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLawyer, setIsLawyer] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [activeTab, setActiveTab] = useState("All Cases");
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);
  const [hearingFilter, setHearingFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseIds, setSelectedCaseIds] = useState(() => new Set());

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
        setHasLoadedOnce(true);
      }
    };
    fetchCases();
  }, [isLawyer, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, hearingFilter, priorityFilter, searchTerm]);

  const clearCaseFilters = useCallback(() => {
    setActiveTab("All Cases");
    setHearingFilter("all");
    setPriorityFilter("all");
    setActiveQuickFilter(null);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const filter = new URLSearchParams(window.location.search).get("filter");
    if (!filter) return;

    setCurrentPage(1);
    setHearingFilter("all");
    if (filter === "closed") {
      setActiveTab(DISPOSED_CLOSED_TAB);
      setPriorityFilter("all");
      setActiveQuickFilter("closed");
    } else if (filter === "urgent") {
      setActiveTab("All Cases");
      setPriorityFilter("high");
      setActiveQuickFilter("highPriority");
    }
  }, []);

  const handleStatusTab = useCallback((tab) => {
    setActiveTab(tab);
    setActiveQuickFilter(null);
  }, []);

  const uniqueCases = useMemo(
    () => Array.from(new Map(cases.map((c) => [getCaseId(c), c])).values()),
    [cases]
  );

  useEffect(() => {
    setSelectedCaseIds((current) => {
      const availableIds = new Set(uniqueCases.map((raw) => getCaseSelectionId(raw)).filter(Boolean));
      const next = new Set([...current].filter((id) => availableIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [uniqueCases]);

  const priorityCaseIds = useMemo(
    () => buildPriorityCaseIds(uniqueCases),
    [uniqueCases]
  );

  const mapCase = useCallback((raw) => {
    const legalTeam = getCaseLegalTeam(raw);
    const lead = getLeadLegalTeamMember(legalTeam);
    return {
      id: getCaseId(raw),
      title: raw.title || "Untitled Case",
      number: formatDisplayCaseNumber({
        caseNumber: raw.caseNumber || raw.number,
        caseTypeName: raw.caseSubType || raw.eCourt?.caseTypeName || raw.type || "",
        caseTypeCode: raw.eCourt?.caseTypeCode || raw.caseCode || "",
      }),
      court: raw.court || "N/A",
      category: getCaseCategory(raw),
      stage: raw.caseStage?.replace(/_/g, " ") || raw.stage || raw.currentStage || raw.hearingStage || "—",
      // Disposed/closed matters have no next hearing.
      nextHearing: TERMINAL_TAB_STATUSES.has(getTabStatus(raw))
        ? null
        : raw.nextHearingDate || raw.nextHearing || raw.hearingDate,
      advocateName: lead?.name || raw.assignedTo?.name || null,
      isHighPriority: priorityCaseIds.has(getCaseId(raw)),
      tabStatus: getTabStatus(raw),
    };
  }, [priorityCaseIds]);

  const tabCounts = useMemo(() => ({
    "All Cases": uniqueCases.length,
    "Ongoing":   uniqueCases.filter((c) => getTabStatus(c) === "Ongoing").length,
    "Pending":   uniqueCases.filter((c) => getTabStatus(c) === "Pending").length,
    [DISPOSED_CLOSED_TAB]: uniqueCases.filter((c) => getTabStatus(c) === DISPOSED_CLOSED_TAB).length,
  }), [uniqueCases]);

  const stats = useMemo(() => ({
    total:        uniqueCases.length,
    ongoing:      tabCounts["Ongoing"],
    closed:       tabCounts[DISPOSED_CLOSED_TAB],
    highPriority: priorityCaseIds.size,
  }), [uniqueCases, tabCounts, priorityCaseIds]);

  const hearingCounts = useMemo(() => ({
    all: uniqueCases.length,
    with: uniqueCases.filter(hasCaseHearing).length,
    upcoming: uniqueCases.filter((c) => !!getUpcomingHearingTime(c)).length,
    without: uniqueCases.filter((c) => !hasCaseHearing(c)).length,
  }), [uniqueCases]);

  const priorityCounts = useMemo(() => ({
    all: uniqueCases.length,
    high: priorityCaseIds.size,
    standard: Math.max(0, uniqueCases.length - priorityCaseIds.size),
  }), [uniqueCases, priorityCaseIds]);

  const activeFilterCount = [
    activeTab !== "All Cases",
    hearingFilter !== "all",
    priorityFilter !== "all",
  ].filter(Boolean).length;

  const activeFilterLabels = useMemo(() => {
    const labels = [];
    if (activeTab !== "All Cases") labels.push(activeTab);
    if (hearingFilter === "with") labels.push("With hearings");
    if (hearingFilter === "upcoming") labels.push("Upcoming hearings");
    if (hearingFilter === "without") labels.push("No hearing date");
    if (priorityFilter === "high") labels.push("High priority");
    if (priorityFilter === "standard") labels.push("Standard priority");
    return labels;
  }, [activeTab, hearingFilter, priorityFilter]);

  const applyStatFilter = useCallback((filterKey) => {
    // Re-clicking an active card is a no-op; only "Total Cases" clears filters.
    if (activeQuickFilter === filterKey) return;

    setCurrentPage(1);

    if (filterKey === "total") {
      clearCaseFilters();
      return;
    }

    const statusByFilterKey = { ongoing: "Ongoing", closed: DISPOSED_CLOSED_TAB };

    setActiveQuickFilter(filterKey);
    setActiveTab(statusByFilterKey[filterKey] || "All Cases");
    setHearingFilter("all");
    setPriorityFilter(filterKey === "highPriority" ? "high" : "all");
  }, [activeQuickFilter, clearCaseFilters]);

  const statusFilterOptions = useMemo(
    () => STATUS_TABS.map((tab) => ({ value: tab, label: tab, count: tabCounts[tab] })),
    [tabCounts]
  );

  const hearingFilterOptions = useMemo(() => ([
    { value: "all", label: "All hearing states", count: hearingCounts.all },
    { value: "with", label: "With hearings", count: hearingCounts.with },
    { value: "upcoming", label: "Upcoming hearings", count: hearingCounts.upcoming },
    { value: "without", label: "No hearing date", count: hearingCounts.without },
  ]), [hearingCounts]);

  const priorityFilterOptions = useMemo(() => ([
    { value: "all", label: "All priorities", count: priorityCounts.all },
    { value: "high", label: "High priority", count: priorityCounts.high },
    { value: "standard", label: "Standard priority", count: priorityCounts.standard },
  ]), [priorityCounts]);

  const filtered = useMemo(() => {
    return uniqueCases
      .filter((raw) => {
        const c = mapCase(raw);
        if (activeTab !== "All Cases" && c.tabStatus !== activeTab) return false;
        if (hearingFilter === "with" && !hasCaseHearing(raw)) return false;
        if (hearingFilter === "upcoming" && !getUpcomingHearingTime(raw)) return false;
        if (hearingFilter === "without" && hasCaseHearing(raw)) return false;
        if (priorityFilter === "high" && !priorityCaseIds.has(getCaseId(raw))) return false;
        if (priorityFilter === "standard" && priorityCaseIds.has(getCaseId(raw))) return false;
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
      })
      .sort((a, b) => compareCasesByPriorityAndHearing(a, b, priorityCaseIds));
  }, [uniqueCases, activeTab, hearingFilter, priorityFilter, searchTerm, priorityCaseIds, mapCase]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / CASES_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleStart = filtered.length === 0 ? 0 : (safeCurrentPage - 1) * CASES_PER_PAGE + 1;
  const visibleEnd = Math.min(safeCurrentPage * CASES_PER_PAGE, filtered.length);
  const paginatedCases = useMemo(() => {
    const start = (safeCurrentPage - 1) * CASES_PER_PAGE;
    return filtered.slice(start, start + CASES_PER_PAGE);
  }, [filtered, safeCurrentPage]);

  const visibleCaseIds = useMemo(
    () => paginatedCases.map((raw) => getCaseSelectionId(raw)).filter(Boolean),
    [paginatedCases]
  );
  const selectedCases = useMemo(
    () => uniqueCases.filter((raw) => selectedCaseIds.has(getCaseSelectionId(raw))),
    [uniqueCases, selectedCaseIds]
  );
  const selectedCount = selectedCases.length;
  const allVisibleSelected =
    visibleCaseIds.length > 0 && visibleCaseIds.every((id) => selectedCaseIds.has(id));
  const someVisibleSelected = visibleCaseIds.some((id) => selectedCaseIds.has(id));

  const toggleCaseSelection = useCallback((raw, checked) => {
    const id = getCaseSelectionId(raw);
    if (!id) return;
    setSelectedCaseIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleVisibleSelection = useCallback((checked) => {
    setSelectedCaseIds((current) => {
      const next = new Set(current);
      visibleCaseIds.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  }, [visibleCaseIds]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

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
  }, [uniqueCases, exportSearch, mapCase]);

  const printCaseDocument = (html) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");

    const cleanup = () => {
      window.setTimeout(() => {
        iframe.remove();
      }, 1000);
    };

    iframe.onload = () => {
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        cleanup();
        return;
      }

      frameWindow.onafterprint = cleanup;
      frameWindow.focus();
      frameWindow.print();
    };

    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  };

  const handleExportCase = (raw) => {
    printCaseDocument(buildCasePDF(raw));
    setExportOpen(false);
    setExportSearch("");
  };

  const handleExportCases = (rawCases) => {
    const casesToExport = (Array.isArray(rawCases) ? rawCases : [rawCases]).filter(Boolean);
    if (casesToExport.length === 0) {
      setExportOpen(true);
      return;
    }

    printCaseDocument(buildCasesPDF(casesToExport));
    setExportOpen(false);
    setExportSearch("");
  };

  if (loading && !hasLoadedOnce) {
    return (
      <div className="space-y-3 p-6">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5" data-tour="cases-page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Case Register</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and track all litigation matters across courts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedCount > 0 ? handleExportCases(selectedCases) : setExportOpen(true)}
          >
            <Download className="h-4 w-4 mr-1.5" />
            {selectedCount > 0 ? `Export Selected (${selectedCount})` : "Export"}
          </Button>
          <Link href="/dashboard/cases/new" data-tour="create-case-btn">
            <Button size="sm" className="bg-[#1a2332] hover:bg-[#253345]">
              <Plus className="h-4 w-4 mr-1.5" />
              New Case
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<Briefcase className="h-5 w-5 text-blue-600" />}
          value={stats.total}
          label="Total Cases"
          iconBg="bg-blue-50"
          onClick={() => applyStatFilter("total")}
        />
        <StatCard
          icon={<Activity className="h-5 w-5 text-green-600" />}
          value={stats.ongoing}
          label="Ongoing"
          iconBg="bg-green-50"
          active={activeQuickFilter === "ongoing"}
          onClick={() => applyStatFilter("ongoing")}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-slate-600" />}
          value={stats.closed}
          label={DISPOSED_CLOSED_TAB}
          iconBg="bg-slate-100"
          active={activeQuickFilter === "closed"}
          onClick={() => applyStatFilter("closed")}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
          value={stats.highPriority}
          label="High Priority"
          iconBg="bg-orange-50"
          active={activeQuickFilter === "highPriority"}
          onClick={() => applyStatFilter("highPriority")}
        />
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1 flex-wrap" data-tour="case-tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleStatusTab(tab)}
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
          <div className="relative" data-tour="case-search">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search cases..."
              className="pl-8 h-8 w-52 text-sm"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 gap-1.5 text-xs ${
                  activeFilterCount > 0
                    ? "border-[#1a2332] bg-slate-50 text-[#1a2332]"
                    : ""
                }`}
                data-tour="case-filter"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 rounded-full bg-[#1a2332] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="max-h-[min(520px,calc(100vh-7rem))] w-80 overflow-hidden p-0">
              <div className="flex items-center justify-between border-b px-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Filters</p>
                  <p className="text-xs text-muted-foreground">Refine the case register</p>
                </div>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearCaseFilters}>
                    Clear
                  </Button>
                )}
              </div>
              <div className="max-h-[calc(min(520px,100vh-7rem)-61px)] space-y-4 overflow-y-auto px-3 py-3 overscroll-contain">
                <FilterOptionGroup
                  title="Case status"
                  options={statusFilterOptions}
                  value={activeTab}
                  onChange={(value) => {
                    setActiveTab(value);
                    setActiveQuickFilter(null);
                  }}
                />
                <FilterOptionGroup
                  title="Hearing"
                  options={hearingFilterOptions}
                  value={hearingFilter}
                  onChange={(value) => {
                    setHearingFilter(value);
                    setActiveQuickFilter(null);
                  }}
                />
                <FilterOptionGroup
                  title="Priority"
                  options={priorityFilterOptions}
                  value={priorityFilter}
                  onChange={(value) => {
                    setPriorityFilter(value);
                    setActiveQuickFilter(null);
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {activeFilterLabels.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          <span>
            Showing:{" "}
            <span className="font-medium text-foreground">
              {activeFilterLabels.join(" + ")}
            </span>
          </span>
          <button className="ml-1 text-[#1a2332] underline" onClick={clearCaseFilters}>
            Clear
          </button>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium text-foreground">
            {selectedCount} case{selectedCount !== 1 ? "s" : ""} selected for export
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExportCases(selectedCases)}>
              <FileDown className="h-4 w-4 mr-1.5" />
              Export PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedCaseIds(new Set())}>
              <X className="h-4 w-4 mr-1.5" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white" data-tour="case-list">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="w-12 px-4 py-3 text-left">
                <Checkbox
                  checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                  onCheckedChange={(checked) => toggleVisibleSelection(checked === true)}
                  aria-label="Select all visible cases"
                />
              </th>
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
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No cases found.
                </td>
              </tr>
            ) : (
              paginatedCases.map((raw) => {
                const c = mapCase(raw);
                const hearing = formatHearingDate(c.nextHearing);
                return (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/cases/${c.id}`)}
                  >
                    <td className="w-12 px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedCaseIds.has(getCaseSelectionId(raw))}
                        onCheckedChange={(checked) => toggleCaseSelection(raw, checked === true)}
                        aria-label={`Select ${c.title}`}
                      />
                    </td>
                    <td className="px-4 py-3.5 min-w-[240px] max-w-[320px]">
                      <div className="flex items-start gap-2">
                        {c.isHighPriority && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                        )}
                        <div>
                          <p className="case-heading font-medium text-foreground leading-snug">{c.title}</p>
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
                          {hearing.isPast && (
                            <p className="text-xs text-amber-600 whitespace-nowrap">Update next date</p>
                          )}
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

        <div className="flex flex-col gap-3 px-4 py-3 border-t text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {filtered.length <= CASES_PER_PAGE
              ? `Showing ${filtered.length} of ${filtered.length} cases`
              : `Showing ${visibleStart}-${visibleEnd} of ${filtered.length} cases`}
          </span>
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <span className="mr-1 text-xs text-muted-foreground/80">
                Page {safeCurrentPage} of {totalPages}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage === 1 || filtered.length === 0}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage === totalPages || filtered.length === 0}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              Next
            </Button>
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
                        <p className="case-heading text-sm font-medium text-foreground truncate">{c.title}</p>
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
