"use client";

import { motion } from "framer-motion";
import { CalendarClock, FileText, Hash, Landmark, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssistantStatusBadge } from "./shared";
import { formatDate, relativeFromNow } from "./utils";

/**
 * Premium gradient header for the AI Prep Room — case scope + primary CTA.
 */
export default function PrepHeader({ caseSummary, onGenerateBrief, generating }) {
  const {
    name,
    caseNumber,
    court,
    upcomingHearingDate,
    assistantStatus,
  } = caseSummary;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8"
    >
      {/* layered gradient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,hsl(var(--primary)/0.14),transparent_55%),radial-gradient(120%_120%_at_100%_0%,theme(colors.violet.500/0.12),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
              <Sparkles className="h-3.5 w-3.5" />
              AI Prep Room
            </span>
            <AssistantStatusBadge status={assistantStatus} />
          </div>

          <h1 className="font-heading text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
            {name}
          </h1>

          <dl className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Hash className="h-4 w-4 shrink-0 text-muted-foreground/70" />
              <dt className="sr-only">Case number</dt>
              <dd className="font-medium text-foreground/90">{caseNumber}</dd>
            </div>
            {court && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Landmark className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                <dt className="sr-only">Court</dt>
                <dd>{court}</dd>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground/70" />
              <dt className="sr-only">Upcoming hearing</dt>
              <dd>
                <span className="font-medium text-foreground/90">
                  {formatDate(upcomingHearingDate)}
                </span>
                {upcomingHearingDate && (
                  <span className="ml-1.5 rounded-full bg-amber-500/12 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {relativeFromNow(upcomingHearingDate)}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="shrink-0">
          <Button
            size="lg"
            onClick={onGenerateBrief}
            disabled={generating}
            className="group relative w-full overflow-hidden bg-gradient-to-r from-[#13345c] via-[#1b4a7e] to-[#0f2747] text-white shadow-lg shadow-[#0f2747]/25 transition-all hover:shadow-[#0f2747]/40 hover:brightness-110 sm:w-auto"
          >
            <FileText className="mr-2 h-4 w-4" />
            {generating ? "Generating…" : "Generate Hearing Brief"}
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
