"use client";

import { MessageSquare } from "lucide-react";
import AskCaseAIChat from "@/components/cases/ai-prep-room/AskCaseAIChat";
import {
  SectionShell,
  SectionLoading,
  SectionError,
} from "@/components/cases/ai-prep-room/shared";
import { useAIPrepRoom } from "@/components/cases/ai-prep-room/useAIPrepRoom";

export default function AskCaseAIPage() {
  const { status, data, error, reload } = useAIPrepRoom({});

  return (
    <SectionShell
      icon={MessageSquare}
      title="Ask Case AI"
      description="Grounded answers with sources from this case file."
    >
      {status === "error" ? (
        <SectionError message={error} onRetry={reload} />
      ) : status === "loading" || !data ? (
        <SectionLoading />
      ) : (
        <AskCaseAIChat initialMessages={data.chat} />
      )}
    </SectionShell>
  );
}
