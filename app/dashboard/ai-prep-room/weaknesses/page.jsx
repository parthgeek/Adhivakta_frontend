"use client";

import { AlertTriangle, ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import WeaknessAnalysis from "@/components/cases/ai-prep-room/WeaknessAnalysis";
import {
  SectionShell,
  SectionLoading,
  SectionError,
  EmptyState,
} from "@/components/cases/ai-prep-room/shared";
import { useAIPrepRoom } from "@/components/cases/ai-prep-room/useAIPrepRoom";

function FindingsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export default function WeaknessAnalysisPage() {
  const { status, data, error, reload, analyzing, runWeaknesses } = useAIPrepRoom({});

  const findings = data?.findings || [];

  return (
    <SectionShell
      icon={AlertTriangle}
      title="Weakness Analysis"
      description="Gaps, contradictions and risks — with recommended actions."
      action={
        findings.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={runWeaknesses}
            disabled={analyzing}
          >
            <RefreshCw className={analyzing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            Re-run
          </Button>
        ) : null
      }
    >
      {status === "error" ? (
        <SectionError message={error} onRetry={reload} />
      ) : status === "loading" || !data ? (
        <SectionLoading />
      ) : analyzing ? (
        <FindingsSkeleton />
      ) : findings.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No analysis run yet"
          description="Run an AI risk scan to surface missing evidence, contradictions, and procedural risks in this case — each with a recommended action."
          action={
            <Button onClick={runWeaknesses} className="gap-2">
              <ShieldAlert className="h-4 w-4" />
              Analyse Weaknesses
            </Button>
          }
        />
      ) : (
        <WeaknessAnalysis findings={findings} />
      )}
    </SectionShell>
  );
}
