/**
 * Mock view-model for the AI Prep Room.
 *
 * Swap this out for the real API response shaped like `AIPrepRoomData`
 * (see ./types.ts). `buildPrepRoomData(caseData)` lets the host case page
 * seed the header from a real case while everything else stays mocked.
 */

// Cards share a deep navy base tied to the app's primary (hsl 213 92% 15%)
// so they read as one cohesive brand family. Each card carries a subtle
// accent — used only for the icon chip and corner glow — for differentiation.
export const PREP_ACTIONS = [
  {
    id: "hearing-brief",
    title: "Generate Hearing Brief",
    description: "Generate a concise hearing preparation summary",
    gradient: "from-[#0f2747] via-[#16345c] to-[#0c1f3a]",
    accent: "sky",
  },
  {
    id: "ask-ai",
    title: "Ask Case AI",
    description: "Ask questions about case documents and history",
    gradient: "from-[#102a4c] via-[#1b3f66] to-[#0d2342]",
    accent: "blue",
  },
  {
    id: "find-weaknesses",
    title: "Find Weaknesses",
    description: "Identify missing evidence, contradictions and procedural gaps",
    gradient: "from-[#13263d] via-[#2a3a54] to-[#101d33]",
    accent: "amber",
  },
  {
    id: "opposing-counsel",
    title: "Opposing Counsel Practice",
    description: "Simulate aggressive questioning and prepare responses",
    gradient: "from-[#0f2c3c] via-[#1a4150] to-[#0c2233]",
    accent: "teal",
  },
];

export const SUGGESTED_PROMPTS = [
  "What evidence supports our claim?",
  "Summarize recent hearings",
  "What are the strongest arguments?",
  "What documents are missing?",
];

const MOCK_BRIEF = {
  generatedAt: "2026-06-17T09:30:00.000Z",
  sections: [
    {
      id: "overview",
      title: "Case Overview",
      body: "A commercial dispute concerning breach of a supply agreement dated 12 March 2023. The plaintiff alleges non-delivery of contracted goods and seeks damages of ₹42,00,000 along with interest. The defendant disputes liability on grounds of force majeure and defective purchase orders.",
    },
    {
      id: "key-facts",
      title: "Key Facts",
      body: "",
      bullets: [
        "Supply agreement executed 12 Mar 2023 with a 60-day delivery clause.",
        "Two part-shipments received; the final consignment was never delivered.",
        "Plaintiff issued a legal notice on 04 Aug 2023; no substantive reply on record.",
        "Defendant relies on a force majeure email dated 18 Jul 2023.",
      ],
    },
    {
      id: "recent",
      title: "Recent Developments",
      body: "",
      bullets: [
        "Defendant filed written statement on 21 May 2026 raising limitation.",
        "Court directed both parties to complete documentary admission/denial.",
        "Plaintiff's additional affidavit of evidence was taken on record.",
      ],
    },
    {
      id: "hearing",
      title: "Upcoming Hearing Summary",
      body: "Matter is listed for framing of issues and cross-examination of PW-1. Be ready to oppose the limitation objection and to tender the courier delivery logs as Exhibit P-7.",
    },
    {
      id: "arguments",
      title: "Suggested Arguments",
      body: "",
      bullets: [
        "Force majeure email is self-serving and post-dates the breach — not pleaded in defence originally.",
        "Limitation runs from the last acknowledged shipment (within 3 years).",
        "Part-performance estops the defendant from disputing the agreement's validity.",
      ],
    },
  ],
};

const MOCK_CHAT = [
  {
    id: "m1",
    role: "assistant",
    content:
      "I've indexed 14 documents for this case. Ask me anything about the pleadings, evidence, or hearing history — I'll cite the source.",
    createdAt: "2026-06-18T11:59:00.000Z",
  },
  {
    id: "m2",
    role: "user",
    content: "What evidence supports our claim?",
    createdAt: "2026-06-18T12:00:00.000Z",
  },
  {
    id: "m3",
    role: "assistant",
    content:
      "Three exhibits directly support the non-delivery claim: the signed supply agreement, the courier tracking logs showing only two of three consignments, and the witness statement of the warehouse manager confirming the final shipment never arrived.",
    createdAt: "2026-06-18T12:00:08.000Z",
    citations: [
      { id: "c1", document: "Supply Agreement.pdf", page: 2 },
      { id: "c2", document: "Witness Statement.pdf", page: 4 },
      { id: "c3", document: "Courier Logs.pdf", page: 1 },
    ],
  },
];

const MOCK_FINDINGS = [
  {
    id: "f1",
    category: "missing-evidence",
    title: "Missing Evidence",
    severity: "high",
    description:
      "No proof of dispatch for the third consignment is on record. The courier logs end at the second shipment, leaving a gap the defence can exploit.",
    recommendedAction:
      "Subpoena the courier's master manifest and file it as additional evidence before issues are framed.",
  },
  {
    id: "f2",
    category: "contradiction",
    title: "Contradictions",
    severity: "medium",
    description:
      "PW-1's affidavit states delivery was expected by 10 May, but the agreement's 60-day clause points to 11 May. A one-day discrepancy may be used to challenge credibility.",
    recommendedAction:
      "Clarify the date during examination-in-chief and reconcile it with the agreement clause.",
  },
  {
    id: "f3",
    category: "procedural-risk",
    title: "Procedural Risks",
    severity: "high",
    description:
      "The limitation objection in the written statement is arguable if the cause of action is counted from the agreement date rather than the last shipment.",
    recommendedAction:
      "Prepare a limitation note anchoring the cause of action to the last acknowledged shipment (within 3 years).",
  },
  {
    id: "f4",
    category: "objection",
    title: "Likely Objections",
    severity: "low",
    description:
      "The force majeure email may be objected to as hearsay and as not originally pleaded in the defence.",
    recommendedAction:
      "Be ready with an objection that the document is self-serving and was introduced after the breach.",
  },
];

const MOCK_PRACTICE_QUESTIONS = [
  {
    id: "q1",
    index: 1,
    total: 10,
    prompt:
      "Isn't it true your client never actually inspected the second consignment, so how can you claim the third was defective?",
    tone: "aggressive",
    answered: true,
  },
  {
    id: "q2",
    index: 2,
    total: 10,
    prompt:
      "You waited four months to issue a legal notice — doesn't that delay show the breach was never material to you?",
    tone: "leading",
    answered: true,
  },
  {
    id: "q3",
    index: 3,
    total: 10,
    prompt:
      "Point to one document, signed by my client, that admits the final shipment was contracted at all.",
    tone: "probing",
    answered: false,
  },
];

const MOCK_ACTIVITY = [
  {
    id: "a1",
    type: "brief-generated",
    title: "Hearing Brief Generated",
    detail: "5 sections · 1,240 words",
    at: "2026-06-17T09:30:00.000Z",
  },
  {
    id: "a2",
    type: "weakness-run",
    title: "Weakness Analysis Run",
    detail: "4 findings · 2 high severity",
    at: "2026-06-17T10:05:00.000Z",
  },
  {
    id: "a3",
    type: "practice-completed",
    title: "Practice Session Completed",
    detail: "Confidence 72% · Preparedness 68%",
    at: "2026-06-18T16:20:00.000Z",
  },
  {
    id: "a4",
    type: "question-asked",
    title: "AI Questions Asked",
    detail: "“What evidence supports our claim?”",
    at: "2026-06-18T12:00:00.000Z",
  },
];

/**
 * Build the full view-model. Pass a real case object to seed the header.
 * @param {Record<string, any>} [caseData]
 */
export function buildPrepRoomData(caseData = {}) {
  const name =
    caseData.title ||
    caseData.caseTitle ||
    caseData.name ||
    "Acme Traders Pvt. Ltd. v. Veridian Supplies";

  return {
    caseSummary: {
      id: caseData._id || caseData.id || "case-mock-001",
      name,
      caseNumber: caseData.caseNumber || caseData.cnrNumber || "CS(COMM) 482/2024",
      court: caseData.court || caseData.courtName || "Commercial Court, Bengaluru",
      upcomingHearingDate:
        caseData.upcomingHearingDate || caseData.nextHearingDate || "2026-06-26T00:00:00.000Z",
      assistantStatus: "ready",
      indexedPercent: 100,
    },
    brief: MOCK_BRIEF,
    chat: MOCK_CHAT,
    suggestedPrompts: SUGGESTED_PROMPTS,
    findings: MOCK_FINDINGS,
    practice: {
      questions: MOCK_PRACTICE_QUESTIONS,
      score: { confidence: 72, preparedness: 68, areasToImprove: [
        "Anchor the limitation timeline to the last shipment.",
        "Have Exhibit P-7 (courier logs) ready to tender.",
        "Tighten the date reconciliation for PW-1.",
      ] },
    },
    activity: MOCK_ACTIVITY,
  };
}

/** Canned assistant reply used by the chat demo when the user sends a message. */
export function mockAssistantReply(prompt) {
  return {
    id: `m-${Date.now()}`,
    role: "assistant",
    content:
      "Based on the indexed case file, here's what I found. The supply agreement and courier logs together establish the non-delivery, while the warehouse manager's statement corroborates the timeline. Consider tendering the courier master manifest to close the evidentiary gap.",
    createdAt: new Date().toISOString(),
    citations: [
      { id: `cite-${Date.now()}-1`, document: "Witness Statement.pdf", page: 4 },
      { id: `cite-${Date.now()}-2`, document: "Supply Agreement.pdf", page: 2 },
    ],
  };
}
