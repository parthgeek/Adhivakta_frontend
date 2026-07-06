"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  Database,
  FileText,
  Loader2,
  RefreshCw,
  Repeat,
  Scale,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePrepCase } from "./PrepCaseContext";
import AIDataNotice from "./AIDataNotice";

const courtLabel = (court) => {
  if (!court) return "";
  if (typeof court === "string") return court;
  return court.name || court.establishment || court.district || "";
};

/**
 * Case-scope bar shown above every AI Prep Room feature.
 * Surfaces the current case, AI/index status, and — prominently, when needed —
 * the "Index documents" action so it can't be missed.
 */
export default function CaseSwitcher() {
  const { caseData, status, indexing, config, ingest, clearCase } = usePrepCase();
  const [error, setError] = useState("");

  if (!caseData) return null;

  const indexed = status?.indexed;
  const embeddingsReady = config?.embeddings !== false;
  const generationReady = config?.generation !== false;
  const totalDocuments = status?.totalDocuments ?? 0;
  const needsIndexing = totalDocuments > 0 && !indexed;

  const handleIngest = async () => {
    setError("");
    try {
      await ingest();
    } catch (e) {
      setError(e?.message || "Indexing failed");
    }
  };

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm" data-tour="ai-selected-case">
      {/* main row */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Scale className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {caseData.title || "Untitled case"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {caseData.caseNumber || "—"}
              {courtLabel(caseData.court) ? ` · ${courtLabel(caseData.court)}` : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {indexed ? (
            <>
              <StatusChip status={status} />
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                disabled={indexing}
                onClick={handleIngest}
                title="Re-index documents"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", indexing && "animate-spin")} />
                <span className="hidden sm:inline">{indexing ? "Indexing…" : "Re-index"}</span>
              </Button>
            </>
          ) : needsIndexing ? (
            <Button
              size="sm"
              className="gap-1.5 shadow-sm"
              disabled={indexing || !generationReady}
              onClick={handleIngest}
            >
              {indexing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {indexing ? "Indexing…" : "Index documents"}
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              No documents
            </span>
          )}

          <Button variant="ghost" size="sm" className="gap-1.5" onClick={clearCase}>
            <Repeat className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Change case</span>
          </Button>
        </div>
      </div>

      {/* attention / info strip */}
      {!generationReady ? (
        <Strip tone="warn">
          <AlertCircle className="h-4 w-4 shrink-0" />
          AI generation is disabled — add <code className="font-mono">OPENAI_API_KEY</code> on the server to use the AI features.
        </Strip>
      ) : needsIndexing ? (
        <Strip tone="accent">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            <strong className="font-semibold text-foreground">Index this case</strong> so the AI can read
            and cite your {totalDocuments} document{totalDocuments === 1 ? "" : "s"}. Takes a few seconds.
          </span>
        </Strip>
      ) : totalDocuments === 0 ? (
        <Strip tone="muted">
          <FileText className="h-4 w-4 shrink-0" />
          No documents uploaded — the AI answers from this case's details. Upload documents to ground answers with citations.
        </Strip>
      ) : !embeddingsReady ? (
        <Strip tone="muted">
          <Database className="h-4 w-4 shrink-0" />
          Keyword search mode. Add <code className="font-mono">OPENAI_API_KEY</code> for semantic (meaning-based) search.
        </Strip>
      ) : null}

      {error && (
        <Strip tone="error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </Strip>
      )}

      <div className="border-t border-border/50 px-4 py-2">
        <AIDataNotice compact className="border-0 bg-transparent px-0 py-0" />
      </div>
    </div>
  );
}

function Strip({ tone = "muted", children }) {
  const tones = {
    accent:
      "border-t border-primary/15 bg-primary/[0.06] text-foreground/80",
    warn: "border-t border-amber-500/20 bg-amber-500/[0.08] text-amber-700 dark:text-amber-400",
    error: "border-t border-destructive/20 bg-destructive/[0.08] text-destructive",
    muted: "border-t border-border/50 bg-muted/30 text-muted-foreground",
  };
  return (
    <div className={cn("flex items-center gap-2 px-4 py-2 text-xs", tones[tone])}>
      {children}
    </div>
  );
}

function StatusChip({ status }) {
  const mode = status?.mode === "keyword" ? "keyword" : "semantic";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
      <Check className="h-3.5 w-3.5" />
      Indexed
      <span className="hidden font-normal text-emerald-600/70 dark:text-emerald-400/70 sm:inline">
        · {status?.indexedDocuments || 0} doc{status?.indexedDocuments === 1 ? "" : "s"} · {mode}
      </span>
    </span>
  );
}
