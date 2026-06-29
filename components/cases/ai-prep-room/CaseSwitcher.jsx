"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  Database,
  Loader2,
  RefreshCw,
  Repeat,
  Scale,
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

/** Compact case-scope bar with index status + actions, shown above features. */
export default function CaseSwitcher() {
  const { caseData, status, indexing, config, ingest, clearCase } = usePrepCase();
  const [error, setError] = useState("");

  if (!caseData) return null;

  const indexed = status?.indexed;
  const embeddingsReady = config?.embeddings !== false;
  const generationReady = config?.generation !== false;
  const totalDocuments = status?.totalDocuments ?? 0;

  const handleIngest = async () => {
    setError("");
    try {
      await ingest();
    } catch (e) {
      setError(e?.message || "Indexing failed");
    }
  };

  return (
    <div className="mb-5 rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Scale className="h-[18px] w-[18px]" />
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

        <div className="flex items-center gap-2">
          <IndexBadge indexed={indexed} status={status} />

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={indexing || totalDocuments === 0}
            onClick={handleIngest}
            title={
              totalDocuments === 0
                ? "No documents on this case to index"
                : embeddingsReady
                ? "Index this case's documents for semantic AI retrieval"
                : "Index this case's documents for keyword retrieval"
            }
          >
            {indexing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : indexed ? (
              <RefreshCw className="h-3.5 w-3.5" />
            ) : (
              <Database className="h-3.5 w-3.5" />
            )}
            {indexing ? "Indexing…" : indexed ? "Re-index" : "Index documents"}
          </Button>

          <Button variant="ghost" size="sm" className="gap-1.5" onClick={clearCase}>
            <Repeat className="h-3.5 w-3.5" />
            Change case
          </Button>
        </div>
      </div>

      {!generationReady ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-3.5 w-3.5" />
          AI generation is disabled — add OPENAI_API_KEY on the server to use the AI features.
        </p>
      ) : totalDocuments === 0 ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5" />
          No documents uploaded — the AI answers from this case's details. Upload documents to ground answers with citations.
        </p>
      ) : !embeddingsReady ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Database className="h-3.5 w-3.5" />
          Keyword retrieval mode. Add OPENAI_API_KEY on the server for semantic (meaning-based) search.
        </p>
      ) : null}
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      <AIDataNotice compact className="mt-2 border-0 bg-transparent px-0 py-0" />
    </div>
  );
}

function IndexBadge({ indexed, status }) {
  if (indexed) {
    const mode = status?.mode === "keyword" ? "keyword" : "semantic";
    return (
      <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400 sm:inline-flex">
        <Check className="h-3.5 w-3.5" />
        {status?.indexedDocuments || 0} indexed · {mode}
      </span>
    );
  }
  return (
    <span className="hidden items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border/60 sm:inline-flex">
      <Database className="h-3.5 w-3.5" />
      {status?.totalDocuments === 0 ? "No documents" : "Not indexed"}
    </span>
  );
}
