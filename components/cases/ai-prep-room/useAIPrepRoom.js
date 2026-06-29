"use client";

/**
 * State management for the AI Prep Room.
 *
 * A single `useReducer` owns the screen's async lifecycle (idle → loading →
 * ready / error) plus per-action busy flags (brief generation, weakness scan).
 * The case scope comes from `PrepCaseContext` unless explicitly passed in, so
 * every feature page stays in sync with the selected case.
 */

import { useCallback, useEffect, useReducer } from "react";
import {
  askCaseAI as askCaseAIApi,
  exportBriefPdf,
  fetchPrepRoom,
  generateHearingBrief,
  runWeaknessAnalysis,
} from "./api";
import { usePrepCaseOptional } from "./PrepCaseContext";

const initialState = {
  status: "idle", // 'idle' | 'loading' | 'ready' | 'error'
  data: null,
  error: null,
  generating: false,
  analyzing: false,
  refreshing: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, status: state.data ? state.status : "loading", error: null };
    case "REFRESH_START":
      return { ...state, refreshing: true, error: null };
    case "LOAD_SUCCESS":
      return { ...state, status: "ready", data: action.data, refreshing: false, error: null };
    case "LOAD_ERROR":
      return { ...state, status: state.data ? "ready" : "error", refreshing: false, error: action.error };
    case "BRIEF_START":
      return { ...state, generating: true, error: null };
    case "BRIEF_SUCCESS":
      return { ...state, generating: false, data: { ...state.data, brief: action.brief } };
    case "BRIEF_ERROR":
      return { ...state, generating: false, error: action.error };
    case "WEAKNESS_START":
      return { ...state, analyzing: true, error: null };
    case "WEAKNESS_SUCCESS":
      return { ...state, analyzing: false, data: { ...state.data, findings: action.findings } };
    case "WEAKNESS_ERROR":
      return { ...state, analyzing: false, error: action.error };
    default:
      return state;
  }
}

export function useAIPrepRoom({ caseId: caseIdProp, caseData: caseDataProp } = {}) {
  const prep = usePrepCaseOptional();
  const caseId = caseIdProp || prep?.caseId || "";
  const caseData = caseDataProp || prep?.caseData || null;

  const [state, dispatch] = useReducer(reducer, initialState);

  const load = useCallback(
    async (mode = "initial") => {
      if (!caseId) return;
      dispatch({ type: mode === "refresh" ? "REFRESH_START" : "LOAD_START" });
      try {
        const data = await fetchPrepRoom(caseId, caseData);
        dispatch({ type: "LOAD_SUCCESS", data });
      } catch (err) {
        dispatch({ type: "LOAD_ERROR", error: err?.message || "Something went wrong" });
      }
    },
    [caseId, caseData]
  );

  useEffect(() => {
    load("initial");
  }, [load]);

  const refresh = useCallback(() => load("refresh"), [load]);

  const generateBrief = useCallback(async () => {
    if (!caseId) return;
    dispatch({ type: "BRIEF_START" });
    try {
      const brief = await generateHearingBrief(caseId);
      dispatch({ type: "BRIEF_SUCCESS", brief });
    } catch (err) {
      dispatch({ type: "BRIEF_ERROR", error: err?.message || "Failed to generate brief" });
    }
  }, [caseId]);

  const runWeaknesses = useCallback(async () => {
    if (!caseId) return;
    dispatch({ type: "WEAKNESS_START" });
    try {
      const findings = await runWeaknessAnalysis(caseId);
      dispatch({ type: "WEAKNESS_SUCCESS", findings });
    } catch (err) {
      dispatch({ type: "WEAKNESS_ERROR", error: err?.message || "Failed to analyse weaknesses" });
    }
  }, [caseId]);

  const ask = useCallback(
    (prompt, history = []) => askCaseAIApi(caseId, prompt, history),
    [caseId]
  );

  const exportBrief = useCallback(async () => {
    try {
      await exportBriefPdf(caseId);
    } catch {
      /* surfaced via toast elsewhere */
    }
  }, [caseId]);

  return {
    ...state,
    caseId,
    reload: () => load("initial"),
    refresh,
    generateBrief,
    runWeaknesses,
    ask,
    exportBrief,
  };
}
