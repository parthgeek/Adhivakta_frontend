"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Check,
  Copy,
  Download,
  FileText,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, SkeletonLine } from "./shared";
import { formatDateTime } from "./utils";

function BriefSkeleton() {
  return (
    <Card className="space-y-4 p-6">
      <SkeletonLine className="h-5 w-40" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-2 rounded-xl border border-border/60 p-4">
          <SkeletonLine className="w-32" />
          <SkeletonLine className="w-full" />
          <SkeletonLine className="w-5/6" />
        </div>
      ))}
    </Card>
  );
}

/**
 * Section 2 — AI Hearing Brief preview with expandable sections + actions.
 */
export default function HearingBriefPreview({
  brief,
  loading,
  onRegenerate,
  onExport,
}) {
  const [copied, setCopied] = useState(false);

  if (loading) return <BriefSkeleton />;

  if (!brief?.generatedAt) {
    return (
      <EmptyState
        icon={FileText}
        title="No hearing brief generated yet"
        description="Generate an AI summary of the case overview, key facts, recent developments and suggested arguments for your next hearing."
        action={
          <Button onClick={onRegenerate} className="gap-2">
            <FileText className="h-4 w-4" />
            Generate Hearing Brief
          </Button>
        }
      />
    );
  }

  const handleCopy = async () => {
    const text = brief.sections
      .map((s) => `${s.title}\n${s.body || (s.bullets || []).map((b) => `• ${b}`).join("\n")}`)
      .join("\n\n");
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — no-op for the demo */
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/30 px-5 py-3.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <span className="font-medium text-foreground">Hearing Brief</span>
          <span className="text-muted-foreground">
            · Generated {formatDateTime(brief.generatedAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onRegenerate}>
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </Button>
          <Button size="sm" className="gap-1.5" onClick={onExport}>
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      <Accordion
        type="multiple"
        defaultValue={["overview", "hearing"]}
        className="px-2 sm:px-4"
      >
        {brief.sections.map((section, i) => (
          <AccordionItem
            key={section.id}
            value={section.id}
            className="border-border/60"
          >
            <AccordionTrigger className="py-4 text-left hover:no-underline">
              <span className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="font-heading text-sm font-semibold text-foreground">
                  {section.title}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="pl-9 pr-2 text-sm leading-relaxed text-muted-foreground"
              >
                {section.body && <p>{section.body}</p>}
                {section.bullets?.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {section.bullets.map((b, bi) => (
                      <li key={bi} className="flex gap-2.5">
                        <span
                          className={cn(
                            "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60",
                          )}
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}
