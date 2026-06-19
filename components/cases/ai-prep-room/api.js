/**
 * AI Prep Room — API integration placeholders.
 *
 * These wrap the eventual backend (`/api/cases/:id/ai/*`). For now they
 * resolve mock data after a short delay so the UI exercises loading,
 * error and success states. Replace the bodies with real `fetch` calls;
 * the component layer already consumes these promises.
 */

import { buildPrepRoomData } from "./mock-data";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET the full prep-room view-model for a case. */
export async function fetchPrepRoom(caseId, caseData) {
  await delay(900);
  // throw new Error("Failed to load AI Prep Room"); // ← uncomment to test error state
  return buildPrepRoomData({ ...caseData, _id: caseId });
}

/** POST — (re)generate the hearing brief. */
export async function generateHearingBrief(caseId) {
  await delay(1500);
  const { brief } = buildPrepRoomData({ _id: caseId });
  return { ...brief, generatedAt: new Date().toISOString() };
}

/** POST a chat turn. Returns the assistant message (with citations). */
export async function askCaseAI(caseId, prompt) {
  await delay(1200);
  return {
    id: `m-${Date.now()}`,
    role: "assistant",
    content: "…",
    createdAt: new Date().toISOString(),
    citations: [],
  };
}

/** POST — run weakness analysis. */
export async function runWeaknessAnalysis(caseId) {
  await delay(1400);
  return buildPrepRoomData({ _id: caseId }).findings;
}

/** POST — export the brief to PDF; returns a blob URL in the real impl. */
export async function exportBriefPdf(caseId) {
  await delay(800);
  return { url: `#/cases/${caseId}/brief.pdf` };
}
