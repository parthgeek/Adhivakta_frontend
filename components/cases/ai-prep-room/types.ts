/**
 * AI Prep Room — shared TypeScript contracts.
 *
 * These types describe the data the screen renders. They are intentionally
 * decoupled from the API layer so the UI can be driven by mock data today and
 * a real `/api/cases/:id/ai/*` backend tomorrow without touching components.
 */

export type Severity = "low" | "medium" | "high";

export type AIAssistantStatus = "ready" | "thinking" | "indexing" | "offline";

export type PrepActionId =
  | "hearing-brief"
  | "ask-ai"
  | "find-weaknesses"
  | "opposing-counsel";

/** Header / case scope summary. */
export interface CaseSummary {
  id: string;
  name: string;
  caseNumber: string;
  court?: string;
  upcomingHearingDate: string | null; // ISO date
  assistantStatus: AIAssistantStatus;
  /** 0–100 — how much of the case file the AI has indexed. */
  indexedPercent: number;
}

/** A single large action card in the actions grid. */
export interface PrepAction {
  id: PrepActionId;
  title: string;
  description: string;
  /** Tailwind gradient utility string, e.g. "from-indigo-500 to-violet-600". */
  gradient: string;
}

/** Document citation rendered as a chip under an AI answer. */
export interface Citation {
  id: string;
  document: string;
  page?: number;
  snippet?: string;
}

export interface BriefSection {
  id: string;
  title: string;
  body: string;
  /** Optional bullet points rendered instead of / in addition to body. */
  bullets?: string[];
}

export interface HearingBrief {
  generatedAt: string | null; // ISO — null => not generated yet
  sections: BriefSection[];
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string; // ISO
  citations?: Citation[];
  pending?: boolean; // true while the assistant is "typing"
}

export interface WeaknessFinding {
  id: string;
  category: "missing-evidence" | "contradiction" | "procedural-risk" | "objection";
  title: string;
  severity: Severity;
  description: string;
  recommendedAction: string;
}

export interface PracticeQuestion {
  id: string;
  index: number; // 1-based
  total: number;
  prompt: string;
  tone: "aggressive" | "probing" | "leading";
  answered: boolean;
}

export interface PracticeScore {
  confidence: number; // 0–100
  preparedness: number; // 0–100
  areasToImprove: string[];
}

export interface ActivityEntry {
  id: string;
  type:
    | "brief-generated"
    | "weakness-run"
    | "practice-completed"
    | "question-asked";
  title: string;
  detail?: string;
  at: string; // ISO
}

/** The full view-model for the screen. */
export interface AIPrepRoomData {
  caseSummary: CaseSummary;
  brief: HearingBrief;
  chat: ChatMessage[];
  suggestedPrompts: string[];
  findings: WeaknessFinding[];
  practice: {
    questions: PracticeQuestion[];
    score: PracticeScore | null;
  };
  activity: ActivityEntry[];
}

/** Loose props the host case page can pass in. */
export interface AIPrepRoomProps {
  caseId?: string;
  /** When provided, overrides the mock case summary header fields. */
  caseData?: Partial<CaseSummary> & Record<string, unknown>;
  className?: string;
}
