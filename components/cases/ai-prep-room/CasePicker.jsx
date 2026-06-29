"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  Hash,
  Landmark,
  Scale,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrepCase } from "./PrepCaseContext";
import { formatDate, relativeFromNow } from "./utils";
import AIDataNotice from "./AIDataNotice";

/* ----------------------------- helpers ----------------------------- */

const courtLabel = (court) => {
  if (!court) return "";
  if (typeof court === "string") return court;
  return court.name || court.establishment || court.district || "";
};

const STATUS_STYLES = {
  active: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  pending: "bg-amber-500/12 text-amber-600 dark:text-amber-400 ring-amber-500/20",
  closed: "bg-slate-500/12 text-slate-500 ring-slate-500/20",
};

function CaseCard({ caseItem, onSelect, index }) {
  const court = courtLabel(caseItem.court);
  const status = (caseItem.status || "active").toLowerCase();
  const next = caseItem.nextHearingDate;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      onClick={() => onSelect(caseItem._id || caseItem.id)}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 text-left shadow-sm ring-1 ring-transparent transition-all hover:border-primary/30 hover:shadow-lg hover:ring-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-opacity duration-300 group-hover:bg-primary/10"
      />
      <div className="relative flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Scale className="h-5 w-5" />
        </span>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1",
            STATUS_STYLES[status] || STATUS_STYLES.active
          )}
        >
          {status}
        </span>
      </div>

      <h3 className="relative mt-4 line-clamp-2 font-heading text-base font-semibold leading-snug text-foreground">
        {caseItem.title || "Untitled case"}
      </h3>

      <dl className="relative mt-3 space-y-1.5 text-sm text-muted-foreground">
        {caseItem.caseNumber && (
          <div className="flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <dd className="truncate font-medium text-foreground/80">{caseItem.caseNumber}</dd>
          </div>
        )}
        {court && (
          <div className="flex items-center gap-1.5">
            <Landmark className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <dd className="truncate">{court}</dd>
          </div>
        )}
        {next && (
          <div className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <dd>
              {formatDate(next)}
              <span className="ml-1.5 text-xs text-amber-600 dark:text-amber-400">
                {relativeFromNow(next)}
              </span>
            </dd>
          </div>
        )}
      </dl>

      <div className="relative mt-4 flex items-center gap-1.5 text-sm font-semibold text-primary">
        Open prep room
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </motion.button>
  );
}

/* ----------------------------- picker ----------------------------- */

/** Full-screen case selector shown until a case is chosen. */
export default function CasePicker() {
  const { cases, casesLoading, setCase } = usePrepCase();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((c) =>
      [c.title, c.caseNumber, courtLabel(c.court)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [cases, query]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,hsl(var(--primary)/0.14),transparent_55%),radial-gradient(120%_120%_at_100%_0%,theme(colors.violet.500/0.10),transparent_50%)]"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            AI Prep Room
          </span>
          <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Select a case to begin
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            The AI Prep Room is grounded in a single case file. Choose a case and
            Adhivakta will index its documents to answer questions, draft hearing
            briefs, surface weaknesses, and run cross-examination drills — all with
            citations to your own records.
          </p>

          <div className="relative mt-5 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cases by title, number, or court…"
              className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <AIDataNotice className="mt-4 max-w-2xl" />
        </div>
      </motion.div>

      {casesLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-10 text-center">
          <Scale className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 font-medium text-foreground">No matching cases</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {cases.length === 0
              ? "Create a case and upload documents to use the AI Prep Room."
              : "Try a different search term."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c, i) => (
            <CaseCard key={c._id || c.id} caseItem={c} index={i} onSelect={setCase} />
          ))}
        </div>
      )}
    </div>
  );
}
