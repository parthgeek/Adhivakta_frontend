"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Gavel,
  Mic,
  Pencil,
  Target,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { scoreColor } from "./utils";

/* --------------------------- circular score ---------------------------- */

function ScoreRing({ value, label, icon: Icon }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle cx="32" cy="32" r={r} className="fill-none stroke-muted" strokeWidth="6" />
          <motion.circle
            cx="32"
            cy="32"
            r={r}
            className={cn("fill-none", scoreColor(value))}
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
          {value}
        </span>
      </div>
      <div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <p className={cn("text-sm font-semibold", scoreColor(value))}>
          {value >= 75 ? "Strong" : value >= 50 ? "Improving" : "Needs work"}
        </p>
      </div>
    </div>
  );
}

const TONE_LABEL = {
  aggressive: "Aggressive",
  probing: "Probing",
  leading: "Leading",
};

/**
 * Section 5 — opposing counsel practice, interview style.
 */
export default function OpposingCounselPractice({ questions = [], score }) {
  const [current, setCurrent] = useState(
    Math.max(0, questions.findIndex((q) => !q.answered)),
  );
  const [mode, setMode] = useState(null); // 'type' | 'record' | null
  const [answer, setAnswer] = useState("");

  const q = questions[current];
  const total = q?.total ?? questions.length;
  const progress = total ? ((current + 1) / total) * 100 : 0;

  const next = () => {
    setMode(null);
    setAnswer("");
    setCurrent((c) => Math.min(c + 1, questions.length - 1));
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* interview panel */}
      <Card className="relative overflow-hidden lg:col-span-2">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-rose-500/10 to-transparent"
        />
        <div className="relative p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-400">
              <Gavel className="h-3.5 w-3.5" />
              Opposing Counsel
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Question {Math.min(current + 1, total)} of {total}
            </span>
          </div>

          <Progress value={progress} className="h-1.5" />

          <AnimatePresence mode="wait">
            <motion.div
              key={q?.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.3 }}
              className="mt-5"
            >
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-sm">
                  <Gavel className="h-4 w-4" />
                </span>
                <div className="rounded-2xl rounded-tl-md border border-border/60 bg-muted/40 px-4 py-3">
                  {q?.tone && (
                    <span className="mb-1 inline-block text-[11px] font-semibold uppercase tracking-wide text-rose-500">
                      {TONE_LABEL[q.tone]}
                    </span>
                  )}
                  <p className="text-sm leading-relaxed text-foreground">
                    {q?.prompt ?? "No more questions — session complete."}
                  </p>
                </div>
              </div>

              {mode === "type" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4"
                >
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Draft your response to opposing counsel…"
                    className="min-h-24 resize-none"
                  />
                </motion.div>
              )}

              {mode === "record" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3"
                >
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
                  </span>
                  <span className="text-sm font-medium text-foreground">Recording…</span>
                  <div className="ml-auto flex items-end gap-0.5">
                    {[6, 12, 8, 16, 10, 14, 7].map((h, i) => (
                      <motion.span
                        key={i}
                        className="w-1 rounded-full bg-rose-500/70"
                        animate={{ height: [h, h * 1.8, h] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08 }}
                        style={{ height: h }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              variant={mode === "record" ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setMode(mode === "record" ? null : "record")}
            >
              <Mic className="h-3.5 w-3.5" />
              {mode === "record" ? "Stop" : "Record Answer"}
            </Button>
            <Button
              variant={mode === "type" ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setMode(mode === "type" ? null : "type")}
            >
              <Pencil className="h-3.5 w-3.5" />
              Type Answer
            </Button>
            <Button
              size="sm"
              className="ml-auto gap-1.5"
              onClick={next}
              disabled={current >= questions.length - 1}
            >
              Next Question
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* scorecard */}
      <Card className="p-5 sm:p-6">
        <h3 className="font-heading text-sm font-semibold text-foreground">Performance</h3>
        <div className="mt-4 space-y-5">
          <ScoreRing value={score?.confidence ?? 0} label="Confidence Score" icon={TrendingUp} />
          <ScoreRing value={score?.preparedness ?? 0} label="Preparedness Score" icon={Target} />
        </div>

        <div className="mt-5 border-t border-border/60 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Areas to improve
          </p>
          <ul className="mt-2.5 space-y-2">
            {(score?.areasToImprove ?? []).map((a, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
