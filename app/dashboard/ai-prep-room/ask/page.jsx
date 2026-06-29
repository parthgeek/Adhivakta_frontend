"use client";

import { useMemo } from "react";
import { MessageSquare } from "lucide-react";
import AskCaseAIChat from "@/components/cases/ai-prep-room/AskCaseAIChat";
import {
  SectionShell,
  SectionLoading,
  SectionError,
} from "@/components/cases/ai-prep-room/shared";
import { useAIPrepRoom } from "@/components/cases/ai-prep-room/useAIPrepRoom";
import { usePrepCase } from "@/components/cases/ai-prep-room/PrepCaseContext";

export default function AskCaseAIPage() {
  const { status: prepStatus, data, error, reload, ask } = useAIPrepRoom({});
  const { status: indexStatus } = usePrepCase();

  const initialMessages = useMemo(() => {
    const indexed = indexStatus?.indexed;
    const content = indexed
      ? `I've indexed ${indexStatus.indexedDocuments} document${
          indexStatus.indexedDocuments === 1 ? "" : "s"
        } for this case. Ask me anything about the pleadings, evidence, or history — I'll cite the source.`
      : "This case isn't indexed yet. Use “Index documents” above so I can ground my answers in your case files. You can still ask general questions in the meantime.";
    return [
      {
        id: "welcome",
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
      },
    ];
  }, [indexStatus]);

  return (
    <SectionShell
      icon={MessageSquare}
      title="Ask Case AI"
      description="Grounded answers with sources from this case file."
    >
      {prepStatus === "error" ? (
        <SectionError message={error} onRetry={reload} />
      ) : prepStatus === "loading" || !data ? (
        <SectionLoading />
      ) : (
        <AskCaseAIChat
          key={indexStatus?.lastIndexedAt || "chat"}
          initialMessages={initialMessages}
          onSend={ask}
          suggestedPrompts={data.suggestedPrompts}
        />
      )}
    </SectionShell>
  );
}
