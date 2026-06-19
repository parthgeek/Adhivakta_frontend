"use client";

import { motion } from "framer-motion";
import {
  FileSearch,
  GitCompareArrows,
  Lightbulb,
  ShieldAlert,
  Siren,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SeverityBadge } from "./shared";

const CATEGORY_META = {
  "missing-evidence": { icon: FileSearch, tint: "text-sky-500", ring: "ring-sky-500/15", bg: "bg-sky-500/10" },
  contradiction: { icon: GitCompareArrows, tint: "text-violet-500", ring: "ring-violet-500/15", bg: "bg-violet-500/10" },
  "procedural-risk": { icon: ShieldAlert, tint: "text-rose-500", ring: "ring-rose-500/15", bg: "bg-rose-500/10" },
  objection: { icon: Siren, tint: "text-amber-500", ring: "ring-amber-500/15", bg: "bg-amber-500/10" },
};

/**
 * Section 4 — weakness analysis findings as cards.
 */
export default function WeaknessAnalysis({ findings = [] }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {findings.map((f, i) => {
        const meta = CATEGORY_META[f.category] ?? CATEGORY_META["missing-evidence"];
        const Icon = meta.icon;
        return (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="group h-full p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset",
                      meta.bg,
                      meta.ring,
                      meta.tint,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-heading text-sm font-semibold text-foreground">
                    {f.title}
                  </h3>
                </div>
                <SeverityBadge severity={f.severity} />
              </div>

              <p className="mt-3.5 text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/30 p-3">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Recommended action
                  </p>
                  <p className="mt-0.5 text-sm text-foreground/90">{f.recommendedAction}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
