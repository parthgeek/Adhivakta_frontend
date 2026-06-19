"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronRight,
  Gavel,
  History,
  LayoutGrid,
  MessageSquare,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import PrepHeader from "./PrepHeader";
import AIActionGrid from "./AIActionGrid";
import HearingBriefPreview from "./HearingBriefPreview";
import AskCaseAIChat from "./AskCaseAIChat";
import WeaknessAnalysis from "./WeaknessAnalysis";
import OpposingCounselPractice from "./OpposingCounselPractice";
import ActivityTimeline from "./ActivityTimeline";
import { SectionShell, SkeletonLine } from "./shared";
import { useAIPrepRoom } from "./useAIPrepRoom";

const NAV = [
  { id: "actions", label: "Actions", icon: LayoutGrid },
  { id: "brief", label: "Hearing Brief", icon: Sparkles },
  { id: "chat", label: "Ask AI", icon: MessageSquare },
  { id: "weakness", label: "Weaknesses", icon: AlertTriangle },
  { id: "practice", label: "Practice", icon: Gavel },
  { id: "activity", label: "Activity", icon: History },
];

/* ------------------------------ loading -------------------------------- */

function PrepRoomSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-3xl bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="space-y-3 rounded-2xl border border-border/60 p-6">
        <SkeletonLine className="h-5 w-48" />
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-5/6" />
        <SkeletonLine className="w-2/3" />
      </div>
    </div>
  );
}

/* ------------------------------- error --------------------------------- */

function PrepRoomError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <TriangleAlert className="h-6 w-6" />
      </span>
      <h3 className="font-heading text-base font-semibold text-foreground">
        Couldn&apos;t load the AI Prep Room
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button onClick={onRetry} className="mt-5 gap-2">
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}

/* ------------------------------- nav ----------------------------------- */

function StickyNav({ active, refreshing, onRefresh }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="sticky top-0 z-30 -mx-1 mb-6 border-b border-border/60 bg-background/80 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active === id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className="shrink-0 gap-1.5"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------- root ---------------------------------- */

/**
 * AI Prep Room — case-scoped screen mounted inside the Case Details page.
 * Pure UI today (mock data via `useAIPrepRoom`), ready to swap to the API.
 */
export default function AIPrepRoom({ caseId, caseData, className }) {
  const {
    status,
    data,
    error,
    generating,
    refreshing,
    reload,
    refresh,
    generateBrief,
    exportBrief,
  } = useAIPrepRoom({ caseId, caseData });

  const [activeSection, setActiveSection] = useState("actions");
  const chatRef = useRef(null);

  // Track the section in view to highlight the sticky nav.
  useEffect(() => {
    if (status !== "ready") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5] },
    );
    NAV.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [status]);

  const scrollToChat = () => {
    document.getElementById("chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAction = (id) => {
    const target = { "hearing-brief": "brief", "ask-ai": "chat", "find-weaknesses": "weakness", "opposing-counsel": "practice" }[id];
    if (id === "hearing-brief" && !data?.brief?.generatedAt) generateBrief();
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (status === "loading") {
    return (
      <div className={cn("mx-auto w-full max-w-6xl px-1", className)}>
        <PrepRoomSkeleton />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={cn("mx-auto w-full max-w-6xl px-1", className)}>
        <PrepRoomError message={error} onRetry={reload} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={cn("relative mx-auto w-full max-w-6xl px-1", className)}>
      <StickyNav active={activeSection} refreshing={refreshing} onRefresh={refresh} />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive"
          >
            <TriangleAlert className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-10 pb-28">
        <PrepHeader
          caseSummary={data.caseSummary}
          onGenerateBrief={generateBrief}
          generating={generating}
        />

        <SectionShell
          id="actions"
          icon={LayoutGrid}
          title="AI Actions"
          description="Jump straight into the most common prep workflows."
        >
          <AIActionGrid onAction={handleAction} />
        </SectionShell>

        <SectionShell
          id="brief"
          icon={Sparkles}
          title="AI Hearing Brief"
          description="A structured, citable summary for your next hearing."
        >
          <HearingBriefPreview
            brief={data.brief}
            loading={generating}
            onRegenerate={generateBrief}
            onExport={exportBrief}
          />
        </SectionShell>

        <SectionShell
          id="chat"
          icon={MessageSquare}
          title="Ask Case AI"
          description="Grounded answers with sources from this case file."
        >
          <AskCaseAIChat ref={chatRef} initialMessages={data.chat} />
        </SectionShell>

        <SectionShell
          id="weakness"
          icon={AlertTriangle}
          title="Weakness Analysis"
          description="Gaps, contradictions and risks — with recommended actions."
        >
          <WeaknessAnalysis findings={data.findings} />
        </SectionShell>

        <SectionShell
          id="practice"
          icon={Gavel}
          title="Opposing Counsel Practice"
          description="Rehearse hostile questioning and sharpen your responses."
        >
          <OpposingCounselPractice
            questions={data.practice.questions}
            score={data.practice.score}
          />
        </SectionShell>

        <SectionShell
          id="activity"
          icon={History}
          title="Activity Timeline"
          description="A history of everything the AI has done on this case."
        >
          <ActivityTimeline activity={data.activity} />
        </SectionShell>
      </div>

      {/* Floating Ask AI button */}
      <motion.button
        type="button"
        onClick={scrollToChat}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="group fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#13345c] via-[#1b4a7e] to-[#0f2747] py-3 pl-4 pr-5 text-sm font-semibold text-white shadow-xl shadow-[#0f2747]/35 ring-1 ring-white/15"
      >
        <Sparkles className="h-4 w-4" />
        Ask AI
        <ChevronRight className="h-4 w-4 -ml-1 opacity-70 transition-transform group-hover:translate-x-0.5" />
      </motion.button>
    </div>
  );
}
