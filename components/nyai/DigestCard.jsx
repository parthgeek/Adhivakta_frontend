"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowRight, CalendarClock, FileText, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

/**
 * NyaAI daily digest widget for the main dashboard: today's schedule counts,
 * AI suggestions, and a jump into the assistant.
 */
export default function DigestCard({ className }) {
  const router = useRouter();
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api.nyai.getDigest();
        if (!cancelled) setDigest(d);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const hearings = (digest?.todaySchedule || []).filter((e) => e.type === "hearing");
  const meetings = (digest?.todaySchedule || []).filter((e) => e.type === "client_meeting");
  const pending = digest?.pendingDocuments || [];
  const suggestions = digest?.suggestions || [];

  const ask = (prompt) =>
    router.push(`/dashboard/nyai?q=${encodeURIComponent(prompt)}`);

  return (
    <Card className={`overflow-hidden ${className || ""}`}>
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-1 ring-border/60">
            <img
              src="/nyai-avatar.png"
              alt="NyaAI"
              className="h-full w-full object-cover"
              draggable={false}
            />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">{greeting}.</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "EEEE, d MMMM")} · NyaAI briefing
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() => router.push("/dashboard/nyai")}
        >
          Open NyaAI <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/60">
        {[
          { icon: CalendarClock, label: "Hearings", value: hearings.length },
          { icon: CalendarClock, label: "Meetings", value: meetings.length },
          { icon: FileText, label: "Pending reviews", value: pending.length },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3 text-center">
            <p className="text-xl font-bold text-foreground">{loading ? "—" : s.value}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          AI suggestions
        </p>
        {loading && <p className="text-xs text-muted-foreground">Preparing your day…</p>}
        {!loading && suggestions.length === 0 && (
          <p className="text-xs text-muted-foreground">You're all caught up. Ask NyaAI anything.</p>
        )}
        {suggestions.slice(0, 3).map((s, i) => (
          <button
            key={`${s.kind}-${i}`}
            type="button"
            onClick={() =>
              s.kind === "prepare_hearing" && s.caseId
                ? ask(`Prepare me for the hearing of case ${s.caseId}`)
                : s.caseId
                ? router.push(`/dashboard/cases/${s.caseId}`)
                : router.push("/dashboard/nyai")
            }
            className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-2.5 py-2 text-left text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span className="truncate">{s.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
