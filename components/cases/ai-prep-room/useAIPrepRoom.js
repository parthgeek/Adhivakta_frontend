"use client";

/**
 * State management for the AI Prep Room.
 *
 * A single `useReducer` owns the screen's async lifecycle (idle → loading →
 * ready / error) plus per-action busy flags (brief generation, refreshing).
 * Components stay presentational; all side-effects funnel through here so the
 * mock `api.js` can be swapped for the real backend without touching the UI.
 */

import { useCallback, useEffect, useReducer } from "react";
import { exportBriefPdf, fetchPrepRoom, generateHearingBrief } from "./api";

const initialState = {
  status: "idle", // 'idle' | 'loading' | 'ready' | 'error'
  data: null,
  error: null,
  generating: false,
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
      return { ...state, generating: true };
    case "BRIEF_SUCCESS":
      return { ...state, generating: false, data: { ...state.data, brief: action.brief } };
    case "BRIEF_ERROR":
      return { ...state, generating: false, error: action.error };
    default:
      return state;
  }
}

export function useAIPrepRoom({ caseId, caseData } = {}) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const load = useCallback(
    async (mode = "initial") => {
      dispatch({ type: mode === "refresh" ? "REFRESH_START" : "LOAD_START" });
      try {
        const data = await fetchPrepRoom(caseId, caseData);
        dispatch({ type: "LOAD_SUCCESS", data });
      } catch (err) {
        dispatch({ type: "LOAD_ERROR", error: err?.message || "Something went wrong" });
      }
    },
    [caseId, caseData],
  );

  useEffect(() => {
    load("initial");
  }, [load]);

  const refresh = useCallback(() => load("refresh"), [load]);

  const generateBrief = useCallback(async () => {
    dispatch({ type: "BRIEF_START" });
    try {
      const brief = await generateHearingBrief(caseId);
      dispatch({ type: "BRIEF_SUCCESS", brief });
    } catch (err) {
      dispatch({ type: "BRIEF_ERROR", error: err?.message || "Failed to generate brief" });
    }
  }, [caseId]);

  const exportBrief = useCallback(async () => {
    try {
      await exportBriefPdf(caseId);
      // real impl: trigger download from returned blob URL
    } catch {
      /* surface a toast in the real impl */
    }
  }, [caseId]);

  return {
    ...state,
    reload: () => load("initial"),
    refresh,
    generateBrief,
    exportBrief,
  };
}
