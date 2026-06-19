"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  FileText,
  Gavel,
  History,
  MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EmptyState } from "./shared";
import { formatDateTime } from "./utils";

const TYPE_META = {
  "brief-generated": { icon: FileText, tint: "text-indigo-500", bg: "bg-indigo-500/10" },
  "weakness-run": { icon: AlertTriangle, tint: "text-amber-500", bg: "bg-amber-500/10" },
  "practice-completed": { icon: Gavel, tint: "text-emerald-500", bg: "bg-emerald-500/10" },
  "question-asked": { icon: MessageSquare, tint: "text-sky-500", bg: "bg-sky-500/10" },
};

/**
 * Section 6 — chronological AI activity timeline.
 */
export default function ActivityTimeline({ activity = [] }) {
  if (!activity.length) {
    return (
      <EmptyState
        icon={History}
        title="No AI history yet"
        description="Generate a brief, run a weakness analysis or start a practice session — your AI activity will appear here."
      />
    );
  }

  const items = [...activity].sort((a, b) => new Date(b.at) - new Date(a.at));

  return (
    <Card className="p-5 sm:p-6">
      <ol className="relative">
        <span
          aria-hidden
          className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-border via-border to-transparent"
        />
        {items.map((item, i) => {
          const meta = TYPE_META[item.type] ?? TYPE_META["brief-generated"];
          const Icon = meta.icon;
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              <span
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                  meta.bg,
                  meta.tint,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <time className="text-xs text-muted-foreground">
                    {formatDateTime(item.at)}
                  </time>
                </div>
                {item.detail && (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{item.detail}</p>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </Card>
  );
}
