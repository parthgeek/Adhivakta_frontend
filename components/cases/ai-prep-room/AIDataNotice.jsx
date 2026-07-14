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
            AI Prep Room shares only the case context needed for your request
            with OpenAI to generate tailored answers.
          </>
        ) : (
          <>
            <span className="font-medium text-foreground/80">AI &amp; your data:</span>{" "}
            AI Prep Room securely processes your selected case facts, relevant
            document excerpts, and questions to create case-specific answers and
            draft briefs. Only the context needed for your request is shared with
            OpenAI. Please include information you are authorised to share.
          </>
        )}
      </p>
    </div>
  );
}
