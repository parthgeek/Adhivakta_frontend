"use client";

/**
 * Holds the case scope for the entire AI Prep Room.
 *
 * The selected case lives in the URL (`?case=<id>`) so it survives navigation
 * between feature pages and is shareable. The provider also loads the case
 * list (for the picker), the selected case's details (for the header), and the
 * RAG index status, and exposes a one-call (re)index action.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

const PrepCaseContext = createContext(null);

const LAST_CASE_KEY = "adhivakta:lastPrepCase";

export function PrepCaseProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const caseId = searchParams.get("case") || "";

  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [caseLoading, setCaseLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [indexing, setIndexing] = useState(false);
  const [config, setConfig] = useState(null);

  // Load case list + server AI config once.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [list, cfg] = await Promise.all([
          api.cases.getAll().catch(() => []),
          api.aiPrep.getConfig().catch(() => null),
        ]);
        if (!alive) return;
        setCases(Array.isArray(list) ? list : []);
        setConfig(cfg);
      } finally {
        if (alive) setCasesLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const refreshStatus = useCallback(async (id) => {
    if (!id) return;
    try {
      const s = await api.aiPrep.getStatus(id);
      setStatus(s);
    } catch {
      setStatus(null);
    }
  }, []);

  // Load the selected case + its index status whenever caseId changes.
  useEffect(() => {
    if (!caseId) {
      setCaseData(null);
      setStatus(null);
      return;
    }
    let alive = true;
    setCaseLoading(true);
    (async () => {
      try {
        const c = await api.cases.getById(caseId);
        if (!alive) return;
        setCaseData(c);
        try {
          localStorage.setItem(LAST_CASE_KEY, caseId);
        } catch {}
      } catch {
        if (alive) setCaseData(null);
      } finally {
        if (alive) setCaseLoading(false);
      }
      await refreshStatus(caseId);
    })();
    return () => {
      alive = false;
    };
  }, [caseId, refreshStatus]);

  const setCase = useCallback(
    (id) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) params.set("case", id);
      else params.delete("case");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const clearCase = useCallback(() => setCase(""), [setCase]);

  const ingest = useCallback(async () => {
    if (!caseId) return null;
    setIndexing(true);
    try {
      const result = await api.aiPrep.ingest(caseId);
      await refreshStatus(caseId);
      return result;
    } finally {
      setIndexing(false);
    }
  }, [caseId, refreshStatus]);

  const value = useMemo(
    () => ({
      caseId,
      cases,
      casesLoading,
      caseData,
      caseLoading,
      status,
      indexing,
      config,
      setCase,
      clearCase,
      ingest,
      refreshStatus,
    }),
    [
      caseId,
      cases,
      casesLoading,
      caseData,
      caseLoading,
      status,
      indexing,
      config,
      setCase,
      clearCase,
      ingest,
      refreshStatus,
    ]
  );

  return <PrepCaseContext.Provider value={value}>{children}</PrepCaseContext.Provider>;
}

export function usePrepCase() {
  const ctx = useContext(PrepCaseContext);
  if (!ctx) {
    throw new Error("usePrepCase must be used within a PrepCaseProvider");
  }
  return ctx;
}

/**
 * Non-throwing variant — returns `null` when used outside a provider.
 * Used by `useAIPrepRoom`, which can also be embedded inside the per-case
 * prep page (`/dashboard/cases/[id]/prep`) where no provider exists.
 */
export function usePrepCaseOptional() {
  return useContext(PrepCaseContext);
}
