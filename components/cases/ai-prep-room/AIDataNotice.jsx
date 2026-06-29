"use client";

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Transparency notice — tells the user their case data is processed by
 * external AI providers. Shown on the case picker and inside the prep room.
 */
export default function AIDataNotice({ className, compact = false }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground",
        className
      )}
    >
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
      <p className="leading-relaxed">
        {compact ? (
          <>
            Case facts, document snippets, and your questions are sent to a
            third-party AI service (OpenAI) to generate answers.
          </>
        ) : (
          <>
            <span className="font-medium text-foreground/80">AI &amp; your data:</span>{" "}
            To answer questions and draft briefs, this feature sends the selected
            case's facts, relevant document snippets, and your questions to a
            third-party AI provider (OpenAI). Avoid entering anything you are not
            permitted to share with an external service.
          </>
        )}
      </p>
    </div>
  );
}
