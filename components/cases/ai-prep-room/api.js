/**
 * AI Prep Room — backend integration.
 *
 * These call the case-scoped RAG endpoints (`/ai-prep/cases/:id/*`) and map the
 * backend payloads onto the view-model shapes the components already consume,
 * so the presentational layer didn't need to change.
 */

import api from "@/lib/api";

/* --------------------------------- mappers -------------------------------- */

function toCaseSummary(caseData = {}, status = null) {
  const court = caseData.court;
  const courtName =
    typeof court === "string"
      ? court
      : court?.name || court?.establishment || court?.district || "";

  let assistantStatus = "indexing";
  if (status) assistantStatus = status.indexed ? "ready" : "idle";

  const indexedPercent =
    status && status.totalDocuments
      ? Math.round((status.indexedDocuments / status.totalDocuments) * 100)
      : 0;

  return {
    id: caseData._id || caseData.id,
    name: caseData.title || caseData.caseTitle || "Untitled case",
    caseNumber: caseData.caseNumber || caseData.cnrNumber || "—",
    court: courtName,
    upcomingHearingDate: caseData.nextHearingDate || null,
    assistantStatus,
    indexedPercent,
  };
}

/** Map a Claude brief object into the section-based shape the UI renders. */
export function mapBrief(brief) {
  if (!brief) return null;
  const sections = [];
  if (brief.summary)
    sections.push({ id: "summary", title: "Case Overview", body: brief.summary });
  if (brief.keyFacts?.length)
    sections.push({ id: "key-facts", title: "Key Facts", bullets: brief.keyFacts });
  if (brief.issues?.length)
    sections.push({ id: "issues", title: "Issues", bullets: brief.issues });
  if (brief.arguments?.length)
    sections.push({
      id: "arguments",
      title: "Suggested Arguments",
      bullets: brief.arguments.map((a) =>
        a.support ? `${a.point} — ${a.support}` : a.point
      ),
    });
  if (brief.evidence?.length)
    sections.push({ id: "evidence", title: "Evidence", bullets: brief.evidence });
  if (brief.nextSteps?.length)
    sections.push({ id: "next-steps", title: "Next Steps", bullets: brief.nextSteps });

  return { generatedAt: brief.generatedAt || new Date().toISOString(), sections };
}

/** Map Claude findings into the WeaknessAnalysis card shape. */
export function mapFindings(findings = []) {
  return findings.map((f, i) => ({
    id: `f-${i}`,
    category: f.severity === "high" ? "procedural-risk" : "missing-evidence",
    title: f.title,
    severity: f.severity || "medium",
    description: f.detail,
    recommendedAction: f.mitigation,
  }));
}

/** Map citations to chip shape, deduped by document (one chip per source file). */
export function mapCitations(citations = []) {
  const seen = new Set();
  const out = [];
  for (const c of citations) {
    if (seen.has(c.documentName)) continue;
    seen.add(c.documentName);
    out.push({
      id: `cite-${c.id}`,
      document: c.documentName,
      page: null,
      snippet: c.snippet,
      score: c.score,
    });
  }
  return out;
}

function activityFromStatus(status) {
  if (!status) return [];
  const items = [];
  if (status.indexed) {
    items.push({
      id: "idx",
      type: "indexed",
      title: "Documents Indexed",
      detail: `${status.indexedDocuments} of ${status.totalDocuments} document${
        status.totalDocuments === 1 ? "" : "s"
      } indexed`,
      at: status.lastIndexedAt || new Date().toISOString(),
    });
  }
  return items;
}

/* --------------------------------- calls ---------------------------------- */

/** Assemble the hub/overview view-model from real case + index status. */
export async function fetchPrepRoom(caseId, caseData) {
  let status = null;
  if (caseId) {
    try {
      status = await api.aiPrep.getStatus(caseId);
    } catch {
      status = null;
    }
  }

  return {
    caseSummary: toCaseSummary(caseData || {}, status),
    status,
    brief: null,
    chat: [],
    findings: [],
    practice: { questions: [], score: null },
    activity: activityFromStatus(status),
    suggestedPrompts: [
      "What evidence supports our claim?",
      "Summarize the strongest arguments",
      "What documents or proof are missing?",
      "What are the procedural risks?",
    ],
  };
}

export async function generateHearingBrief(caseId) {
  const res = await api.aiPrep.brief(caseId);
  return mapBrief(res.brief);
}

export async function runWeaknessAnalysis(caseId) {
  const res = await api.aiPrep.weaknesses(caseId);
  return mapFindings(res.findings);
}

/** Post a chat turn; returns an assistant message with citation chips. */
export async function askCaseAI(caseId, prompt, history = []) {
  const res = await api.aiPrep.ask(caseId, prompt, history);
  return {
    id: `m-${Date.now()}`,
    role: "assistant",
    content: res.answer,
    createdAt: new Date().toISOString(),
    citations: mapCitations(res.citations),
  };
}

/** Opposing-counsel drill turn. */
export async function practiceTurn(caseId, history = []) {
  const res = await api.aiPrep.practice(caseId, history);
  return {
    id: `m-${Date.now()}`,
    role: "assistant",
    content: res.answer,
    createdAt: new Date().toISOString(),
    citations: mapCitations(res.citations),
  };
}

export async function exportBriefPdf() {
  // Export is handled client-side (copy/print) for now.
  return { url: null };
}
