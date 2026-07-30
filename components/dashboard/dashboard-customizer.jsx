"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Plus,
  RotateCcw,
} from "lucide-react";
import api from "@/services/api";
import { cn } from "@/lib/utils";
import { cacheDashboardLayout } from "@/hooks/use-dashboard-layout";
import {
  DASHBOARD_PRESETS,
  WIDGET_WIDTHS,
  getDefaultDashboardSettings,
  getStatCardDefinition,
  getWidgetDefinition,
  normalizeDashboardSettings,
} from "@/lib/dashboard-layout";

// Column span each width occupies on the 6-column canvas.
const CANVAS_SPANS = {
  full: "col-span-6",
  "two-thirds": "col-span-4",
  half: "col-span-3",
  "one-third": "col-span-2",
};

const WIDTH_SHORT_LABELS = {
  full: "1／1",
  "two-thirds": "2／3",
  half: "1／2",
  "one-third": "1／3",
};

const isSameLayout = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export default function DashboardCustomizer() {
  const [layout, setLayout] = useState(() => getDefaultDashboardSettings());
  const [savedLayout, setSavedLayout] = useState(() => getDefaultDashboardSettings());
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const messageTimerRef = useRef(null);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setMessage(null), 4000);
  };

  useEffect(
    () => () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    const loadLayout = async () => {
      try {
        const profile = await api.users.getProfile();
        if (cancelled) return;
        const next = normalizeDashboardSettings(profile?.data?.dashboardSettings);
        setLayout(next);
        setSavedLayout(next);
      } catch {
        if (!cancelled) showMessage("error", "Could not load your saved dashboard layout.");
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    };

    loadLayout();
    return () => {
      cancelled = true;
    };
  }, []);

  const setStatCards = (statCards) => setLayout((prev) => ({ ...prev, statCards }));
  const setWidgets = (widgets) => setLayout((prev) => ({ ...prev, widgets }));

  const hasChanges = useMemo(() => !isSameLayout(layout, savedLayout), [layout, savedLayout]);
  const activePresetId = useMemo(
    () => DASHBOARD_PRESETS.find((preset) => isSameLayout(preset.build(), layout))?.id || null,
    [layout]
  );

  const visibleWidgets = layout.widgets.filter((widget) => widget.visible);
  const hiddenWidgets = layout.widgets.filter((widget) => !widget.visible);
  const visibleStatCards = layout.statCards.filter((card) => card.visible);
  const hiddenStatCards = layout.statCards.filter((card) => !card.visible);

  // Reordering happens on the full list so hidden blocks keep their place.
  const moveWidget = (id, offset) => {
    const ordered = [...layout.widgets];
    const fromIndex = ordered.findIndex((widget) => widget.id === id);
    const visibleIds = visibleWidgets.map((widget) => widget.id);
    const neighbourId = visibleIds[visibleIds.indexOf(id) + offset];
    if (fromIndex < 0 || !neighbourId) return;
    const toIndex = ordered.findIndex((widget) => widget.id === neighbourId);
    const [item] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, item);
    setWidgets(ordered);
  };

  const dropWidgetOn = (targetId) => {
    setDropTargetId(null);
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const ordered = [...layout.widgets];
    const fromIndex = ordered.findIndex((widget) => widget.id === dragId);
    const toIndex = ordered.findIndex((widget) => widget.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [item] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, item);
    setWidgets(ordered);
    setDragId(null);
  };

  const setWidgetVisible = (id, visible) =>
    setWidgets(layout.widgets.map((widget) => (widget.id === id ? { ...widget, visible } : widget)));

  const setWidgetWidth = (id, width) =>
    setWidgets(layout.widgets.map((widget) => (widget.id === id ? { ...widget, width } : widget)));

  const setStatCardVisible = (id, visible) =>
    setStatCards(layout.statCards.map((card) => (card.id === id ? { ...card, visible } : card)));

  const moveStatCard = (id, offset) => {
    const ordered = [...layout.statCards];
    const fromIndex = ordered.findIndex((card) => card.id === id);
    const visibleIds = visibleStatCards.map((card) => card.id);
    const neighbourId = visibleIds[visibleIds.indexOf(id) + offset];
    if (fromIndex < 0 || !neighbourId) return;
    const toIndex = ordered.findIndex((card) => card.id === neighbourId);
    const [item] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, item);
    setStatCards(ordered);
  };

  const applyPreset = (preset) => {
    setLayout(preset.build());
    showMessage("info", `${preset.label} layout applied — save to keep it.`);
  };

  const saveLayout = async () => {
    setIsSaving(true);
    try {
      const response = await api.users.updateDashboardLayout(layout);
      const next = normalizeDashboardSettings(response?.data || layout);
      setLayout(next);
      setSavedLayout(next);
      cacheDashboardLayout(next);
      showMessage("success", "Dashboard layout saved.");
    } catch (error) {
      showMessage("error", error?.message || "Failed to save the dashboard layout.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetLayout = async () => {
    setIsResetting(true);
    try {
      const response = await api.users.resetDashboardLayout();
      const next = normalizeDashboardSettings(response?.data || getDefaultDashboardSettings());
      setLayout(next);
      setSavedLayout(next);
      cacheDashboardLayout(next);
      showMessage("success", "Dashboard layout reset to the default.");
    } catch (error) {
      showMessage("error", error?.message || "Failed to reset the dashboard layout.");
    } finally {
      setIsResetting(false);
    }
  };

  if (isFetching) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {message && (
        <div
          className={cn(
            "rounded-md px-4 py-3 text-sm",
            message.type === "success" && "bg-green-50 text-green-800",
            message.type === "error" && "bg-red-50 text-red-800",
            message.type === "info" && "bg-blue-50 text-blue-800"
          )}
        >
          {message.text}
        </div>
      )}

      {/* ── Presets ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Start from a preset</CardTitle>
          <CardDescription>
            Pick a ready-made arrangement, then fine-tune it below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {DASHBOARD_PRESETS.map((preset) => {
              const isActive = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition active:translate-y-[1px]",
                    isActive
                      ? "border-[#03234b] bg-[#03234b]/5 ring-1 ring-[#03234b]/20"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900">{preset.label}</span>
                    {isActive && (
                      <span className="rounded-full bg-[#03234b] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Stat cards</CardTitle>
          <CardDescription>
            The summary tiles across the top. Use the arrows to reorder, the eye to hide.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {visibleStatCards.map((card, index) => {
              const definition = getStatCardDefinition(card.id);
              if (!definition) return null;
              return (
                <div
                  key={card.id}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                    {definition.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => moveStatCard(card.id, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${definition.label} earlier`}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-25 disabled:hover:bg-transparent"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStatCard(card.id, 1)}
                    disabled={index === visibleStatCards.length - 1}
                    aria-label={`Move ${definition.label} later`}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-25 disabled:hover:bg-transparent"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatCardVisible(card.id, false)}
                    aria-label={`Hide ${definition.label}`}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            {visibleStatCards.length === 0 && (
              <p className="text-sm text-muted-foreground">All stat cards are hidden.</p>
            )}
          </div>

          {hiddenStatCards.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Hidden
              </span>
              {hiddenStatCards.map((card) => {
                const definition = getStatCardDefinition(card.id);
                if (!definition) return null;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setStatCardVisible(card.id, true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-2.5 py-1.5 text-sm text-gray-600 hover:border-[#03234b]/40 hover:text-[#03234b]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {definition.label}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Widget canvas ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Widgets</CardTitle>
          <CardDescription>
            Drag a block to move it, or pick a width. Blocks flow left to right and wrap onto the
            next row when a row is full.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-6 gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/70 p-2">
            {visibleWidgets.map((widget, index) => {
              const definition = getWidgetDefinition(widget.id);
              if (!definition) return null;
              const isDragging = dragId === widget.id;
              const isDropTarget = dropTargetId === widget.id && dragId !== widget.id;

              return (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", widget.id);
                    setDragId(widget.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setDropTargetId(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDropTargetId(widget.id);
                  }}
                  onDragLeave={() =>
                    setDropTargetId((current) => (current === widget.id ? null : current))
                  }
                  onDrop={(event) => {
                    event.preventDefault();
                    dropWidgetOn(widget.id);
                  }}
                  className={cn(
                    "group flex cursor-grab flex-col justify-between gap-2 rounded-lg border bg-white p-2.5 shadow-sm transition active:cursor-grabbing",
                    CANVAS_SPANS[widget.width] || CANVAS_SPANS.full,
                    isDragging && "opacity-40",
                    isDropTarget
                      ? "border-[#03234b] ring-2 ring-[#03234b]/25"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-start gap-1.5">
                    <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 group-hover:text-gray-400" />
                    <p className="min-w-0 flex-1 text-sm font-semibold leading-tight text-gray-900">
                      {definition.label}
                    </p>
                    <button
                      type="button"
                      onClick={() => setWidgetVisible(widget.id, false)}
                      aria-label={`Hide ${definition.label}`}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {definition.fixedWidth ? (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        Full width
                      </span>
                    ) : (
                      <div
                        className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5"
                        role="group"
                        aria-label={`${definition.label} width`}
                      >
                        {WIDGET_WIDTHS.map((width) => (
                          <button
                            key={width}
                            type="button"
                            onClick={() => setWidgetWidth(widget.id, width)}
                            aria-pressed={widget.width === width}
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums transition",
                              widget.width === width
                                ? "bg-white text-[#03234b] shadow-sm"
                                : "text-gray-400 hover:text-gray-700"
                            )}
                          >
                            {WIDTH_SHORT_LABELS[width]}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => moveWidget(widget.id, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${definition.label} earlier`}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-25 disabled:hover:bg-transparent"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWidget(widget.id, 1)}
                        disabled={index === visibleWidgets.length - 1}
                        aria-label={`Move ${definition.label} later`}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-25 disabled:hover:bg-transparent"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {visibleWidgets.length === 0 && (
              <p className="col-span-6 py-8 text-center text-sm text-muted-foreground">
                No widgets on your dashboard. Add one from the list below.
              </p>
            )}
          </div>

          {hiddenWidgets.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Hidden widgets
              </p>
              <div className="flex flex-wrap gap-2">
                {hiddenWidgets.map((widget) => {
                  const definition = getWidgetDefinition(widget.id);
                  if (!definition) return null;
                  return (
                    <button
                      key={widget.id}
                      type="button"
                      onClick={() => setWidgetVisible(widget.id, true)}
                      title={definition.description}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-2.5 py-1.5 text-sm text-gray-600 hover:border-[#03234b]/40 hover:text-[#03234b]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {definition.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Save bar ─────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="outline" onClick={resetLayout} disabled={isResetting || isSaving}>
          {isResetting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to default
            </>
          )}
        </Button>
        <div className="flex items-center gap-3">
          {hasChanges ? (
            <span className="text-xs text-amber-600">Unsaved changes</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              Matches your dashboard
            </span>
          )}
          <Button type="button" onClick={saveLayout} disabled={isSaving || isResetting || !hasChanges}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save layout"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
