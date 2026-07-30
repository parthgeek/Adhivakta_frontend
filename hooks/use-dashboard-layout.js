"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/services/api";
import {
  DASHBOARD_LAYOUT_CACHE_KEY,
  DASHBOARD_LAYOUT_EVENT,
  getDefaultDashboardSettings,
  normalizeDashboardSettings,
} from "@/lib/dashboard-layout";

const readCachedLayout = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DASHBOARD_LAYOUT_CACHE_KEY);
    return raw ? normalizeDashboardSettings(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

// Cache locally so the dashboard renders the user's layout on first paint
// instead of flashing the default one while the profile request is in flight.
export const cacheDashboardLayout = (layout) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DASHBOARD_LAYOUT_CACHE_KEY, JSON.stringify(layout));
  } catch {
    // Storage can be unavailable (private mode / quota); the layout still works.
  }
  window.dispatchEvent(new CustomEvent(DASHBOARD_LAYOUT_EVENT, { detail: layout }));
};

/**
 * Per-user dashboard layout: which blocks are visible, in what order, how wide.
 * Reads the cached layout synchronously, then reconciles with the saved profile.
 */
export const useDashboardLayout = () => {
  const [layout, setLayout] = useState(
    () => readCachedLayout() || getDefaultDashboardSettings()
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadLayout = async () => {
      try {
        const response = await api.users.getDashboardLayout();
        if (cancelled) return;
        const next = normalizeDashboardSettings(response?.data?.layout);
        setLayout(next);
        cacheDashboardLayout(next);
      } catch {
        // Keep the cached/default layout when the profile call fails.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadLayout();
    return () => {
      cancelled = true;
    };
  }, []);

  // Live-update an open dashboard when the layout is saved from settings.
  useEffect(() => {
    const handle = (event) => {
      if (!event?.detail) return;
      setLayout(normalizeDashboardSettings(event.detail));
    };
    window.addEventListener(DASHBOARD_LAYOUT_EVENT, handle);
    return () => window.removeEventListener(DASHBOARD_LAYOUT_EVENT, handle);
  }, []);

  const isStatCardVisible = useCallback(
    (id) => layout.statCards.some((card) => card.id === id && card.visible),
    [layout]
  );

  return { layout, isLoading, isStatCardVisible };
};

export default useDashboardLayout;
