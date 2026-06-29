"use client";

import { useCallback, useState } from "react";
import { Gavel, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import AskCaseAIChat from "@/components/cases/ai-prep-room/AskCaseAIChat";
import {
  SectionShell,
  EmptyState,
} from "@/components/cases/ai-prep-room/shared";
import { usePrepCase } from "@/components/cases/ai-prep-room/PrepCaseContext";
import { practiceTurn } from "@/components/cases/ai-prep-room/api";

/**
 * Live cross-examination drill. Claude role-plays opposing counsel, asking one
 * pointed question at a time; the advocate answers and the model probes the
 * weakest part of each reply — all grounded in the case file.
 */
export default function OpposingCounselPracticePage() {
  const { caseId } = usePrepCase();
  const [session, setSession] = useState(null); // { firstQuestion }
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const onSend = useCallback(
    (text, history) => practiceTurn(caseId, [...history, { role: "user", content: text }]),
    [caseId]
  );

  const start = async () => {
    setStarting(true);
    setError("");
    try {
      const first = await practiceTurn(caseId, []);
      setSession({ firstQuestion: first });
    } catch (e) {
      setError(e?.message || "Could not start the drill. Make sure the case is indexed.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <SectionShell
      icon={Gavel}
      title="Opposing Counsel Practice"
      description="Rehearse hostile questioning and sharpen your responses."
    >
      {!session ? (
        <EmptyState
          icon={Gavel}
          title="Start a cross-examination drill"
          description="Claude plays sharp opposing counsel and fires realistic, adversarial questions one at a time. Answer in your own words — it will probe the weakest part of each reply, grounded in this case's documents."
          action={
            <div className="flex flex-col items-center gap-2">
              <Button onClick={start} disabled={starting} className="gap-2">
                <Play className="h-4 w-4" />
                {starting ? "Preparing…" : "Begin drill"}
              </Button>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          }
        />
      ) : (
        <AskCaseAIChat
          initialMessages={[session.firstQuestion]}
          onSend={onSend}
          suggestedPrompts={[]}
          placeholder="Type your answer to opposing counsel…"
        />
      )}
    </SectionShell>
  );
}
