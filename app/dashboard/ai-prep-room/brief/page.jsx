"use client";

import { Sparkles } from "lucide-react";
import HearingBriefPreview from "@/components/cases/ai-prep-room/HearingBriefPreview";
import {
  SectionShell,
  SectionLoading,
  SectionError,
} from "@/components/cases/ai-prep-room/shared";
import { useAIPrepRoom } from "@/components/cases/ai-prep-room/useAIPrepRoom";

export default function HearingBriefPage() {
  const { status, data, error, generating, generateBrief, exportBrief, reload } =
    useAIPrepRoom({});

  return (
    <SectionShell
      icon={Sparkles}
      title="AI Hearing Brief"
      description="A structured, citable summary for your next hearing."
    >
      {status === "error" ? (
        <SectionError message={error} onRetry={reload} />
      ) : status === "loading" || !data ? (
        <SectionLoading />
      ) : (
        <HearingBriefPreview
          brief={data.brief}
          loading={generating}
          onRegenerate={generateBrief}
          onExport={exportBrief}
        />
      )}
    </SectionShell>
  );
}
