/**
 * Route map for the AI Prep Room multi-page experience.
 *
 * `BASE` is the sidebar/standalone hub. The same sub-paths can be mounted under
 * a case (e.g. /dashboard/cases/:id/prep/...) by passing a different base.
 */

import {
  AlertTriangle,
  Gavel,
  History,
  LayoutGrid,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export const BASE = "/dashboard/ai-prep-room";

export const PREP_NAV = [
  { id: "hub", label: "Overview", icon: LayoutGrid, href: BASE },
  { id: "brief", label: "Hearing Brief", icon: Sparkles, href: `${BASE}/brief` },
  { id: "ask", label: "Ask AI", icon: MessageSquare, href: `${BASE}/ask` },
  { id: "weaknesses", label: "Weaknesses", icon: AlertTriangle, href: `${BASE}/weaknesses` },
  { id: "practice", label: "Practice", icon: Gavel, href: `${BASE}/practice` },
  { id: "activity", label: "Activity", icon: History, href: `${BASE}/activity` },
];

/** Action-card id (from mock-data) → destination route. */
export const ACTION_ROUTES = {
  "hearing-brief": `${BASE}/brief`,
  "ask-ai": `${BASE}/ask`,
  "find-weaknesses": `${BASE}/weaknesses`,
  "opposing-counsel": `${BASE}/practice`,
};
