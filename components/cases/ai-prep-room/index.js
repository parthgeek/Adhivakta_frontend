/**
 * AI Prep Room — public surface.
 *
 * Folder layout
 * ─────────────
 *   AIPrepRoom.jsx ............ screen orchestrator (sticky nav, FAB, states)
 *   PrepHeader.jsx ............ case scope header + primary CTA
 *   AIActionGrid.jsx ......... section 1 — gradient action cards
 *   HearingBriefPreview.jsx .. section 2 — expandable cited brief
 *   AskCaseAIChat.jsx ........ section 3 — chat with citation chips
 *   WeaknessAnalysis.jsx ..... section 4 — findings cards
 *   OpposingCounselPractice .. section 5 — interview + scorecard
 *   ActivityTimeline.jsx ..... section 6 — AI activity log
 *   shared.jsx ............... SectionShell, badges, EmptyState, skeletons
 *   useAIPrepRoom.js ......... reducer-based state + async lifecycle
 *   api.js ................... backend integration placeholders
 *   mock-data.js / utils.js .. demo data + formatters
 *   types.ts ................. shared TypeScript contracts
 *
 * Usage (inside the Case Details page):
 *   import AIPrepRoom from "@/components/cases/ai-prep-room";
 *   <AIPrepRoom caseId={caseData._id} caseData={caseData} />
 */

export { default } from "./AIPrepRoom";
export { default as AIPrepRoom } from "./AIPrepRoom";
export { useAIPrepRoom } from "./useAIPrepRoom";
export { buildPrepRoomData } from "./mock-data";
