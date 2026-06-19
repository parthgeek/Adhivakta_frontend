"use client";

import { Gavel } from "lucide-react";
import OpposingCounselPractice from "@/components/cases/ai-prep-room/OpposingCounselPractice";
import {
  SectionShell,
  SectionLoading,
  SectionError,
} from "@/components/cases/ai-prep-room/shared";
import { useAIPrepRoom } from "@/components/cases/ai-prep-room/useAIPrepRoom";

export default function OpposingCounselPracticePage() {
  const { status, data, error, reload } = useAIPrepRoom({});

  return (
    <SectionShell
      icon={Gavel}
      title="Opposing Counsel Practice"
      description="Rehearse hostile questioning and sharpen your responses."
    >
      {status === "error" ? (
        <SectionError message={error} onRetry={reload} />
      ) : status === "loading" || !data ? (
        <SectionLoading />
      ) : (
        <OpposingCounselPractice
          questions={data.practice.questions}
          score={data.practice.score}
        />
      )}
    </SectionShell>
  );
}
