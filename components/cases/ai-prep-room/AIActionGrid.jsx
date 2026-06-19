"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  FileText,
  Gavel,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PREP_ACTIONS } from "./mock-data";

const ICONS = {
  "hearing-brief": FileText,
  "ask-ai": MessageSquare,
  "find-weaknesses": AlertTriangle,
  "opposing-counsel": Gavel,
};

// Subtle per-card accent — only the icon chip + corner glow get tinted,
// keeping the cards a single cohesive navy family.
const ACCENTS = {
  sky: { chip: "bg-sky-400/15 ring-sky-300/25 text-sky-200", glow: "bg-sky-400/20" },
  blue: { chip: "bg-blue-400/15 ring-blue-300/25 text-blue-200", glow: "bg-blue-400/20" },
  amber: { chip: "bg-amber-400/15 ring-amber-300/25 text-amber-200", glow: "bg-amber-400/20" },
  teal: { chip: "bg-teal-400/15 ring-teal-300/25 text-teal-200", glow: "bg-teal-400/20" },
};

const cardMotion = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
};

/**
 * Section 1 — four large gradient action cards.
 * @param {{ onAction: (id: string) => void }} props
 */
export default function AIActionGrid({ onAction }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {PREP_ACTIONS.map((action, i) => {
        const Icon = ICONS[action.id] ?? FileText;
        const accent = ACCENTS[action.accent] ?? ACCENTS.blue;
        return (
          <motion.button
            key={action.id}
            type="button"
            custom={i}
            variants={cardMotion}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => onAction?.(action.id)}
            className={cn(
              "group relative flex h-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-left text-white shadow-lg ring-1 ring-white/10 transition-shadow duration-300 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              action.gradient,
            )}
          >
            {/* sheen + accent glow */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(255,255,255,0.10),transparent_55%)]"
            />
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute -bottom-10 -right-8 h-32 w-32 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-125",
                accent.glow,
              )}
            />

            <div className="relative flex items-start justify-between">
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset backdrop-blur-sm",
                  accent.chip,
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-5 w-5 -translate-y-0.5 translate-x-0.5 opacity-70 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
            </div>

            <div className="relative mt-5">
              <h3 className="font-heading text-base font-semibold leading-snug">
                {action.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/85">
                {action.description}
              </p>
            </div>

            <div className="relative mt-4 flex items-center gap-1.5 text-xs font-semibold text-white/90">
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                Open
              </span>
              <span
                aria-hidden
                className="h-px w-5 origin-left scale-x-100 bg-white/60 transition-transform duration-300 group-hover:scale-x-150"
              />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
