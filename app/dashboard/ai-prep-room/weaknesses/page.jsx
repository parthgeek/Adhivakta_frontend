"use client";

import { AlertTriangle } from "lucide-react";
import WeaknessAnalysis from "@/components/cases/ai-prep-room/WeaknessAnalysis";
import {
  SectionShell,
  SectionLoading,
  SectionError,
} from "@/components/cases/ai-prep-room/shared";
import { useAIPrepRoom } from "@/components/cases/ai-prep-room/useAIPrepRoom";

export default function WeaknessAnalysisPage() {
  const { status, data, error, reload } = useAIPrepRoom({});

  return (
    <SectionShell
      icon={AlertTriangle}
      title="Weakness Analysis"
      description="Gaps, contradictions and risks — with recommended actions."
    >
      {status === "error" ? (
        <SectionError message={error} onRetry={reload} />
      ) : status === "loading" || !data ? (
        <SectionLoading />
      ) : (
        <WeaknessAnalysis findings={data.findings} />
      )}
    </SectionShell>
  );
}
