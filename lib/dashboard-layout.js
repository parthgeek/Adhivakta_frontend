// lib/dashboard-layout.js
// Registry + normalizer for the user-customisable dashboard layout.
// Keep the ids here in sync with Adhivakta_backend/utils/dashboardLayout.js.

export const WIDGET_WIDTHS = ["full", "two-thirds", "half", "one-third"];

export const WIDTH_LABELS = {
  full: "Full width",
  "two-thirds": "Two thirds",
  half: "Half width",
  "one-third": "One third",
};

// The dashboard grid is 6 columns wide on lg and up.
export const WIDTH_SPAN_CLASSES = {
  full: "lg:col-span-6",
  "two-thirds": "lg:col-span-4",
  half: "lg:col-span-3",
  "one-third": "lg:col-span-2",
};

// Array order = default order on a fresh dashboard.
export const STAT_CARDS = [
  {
    id: "totalCases",
    label: "Total Cases",
    description: "Case count with month-over-month change.",
    defaultVisible: true,
  },
  {
    id: "upcomingHearings",
    label: "Upcoming Hearings",
    description: "Hearings from today onwards.",
    defaultVisible: true,
  },
  {
    id: "urgentActions",
    label: "Urgent Actions",
    description: "Cases flagged as needing attention.",
    defaultVisible: true,
  },
  {
    id: "closedCases",
    label: "Disposed/Closed",
    description: "Cases disposed or closed, with monthly change.",
    defaultVisible: true,
  },
];

export const WIDGETS = [
  {
    id: "dayBriefing",
    label: "Today's Briefing",
    description: "Hearings today, overdue tasks and the current date.",
    defaultVisible: true,
    defaultWidth: "full",
    fixedWidth: true,
  },
  {
    id: "causeList",
    label: "Saved Cause List",
    description: "Your latest saved personalised cause list.",
    defaultVisible: true,
    defaultWidth: "full",
    fixedWidth: true,
  },
  {
    id: "hearingsTable",
    label: "Upcoming Hearings Table",
    description: "Your next five scheduled hearings.",
    defaultVisible: true,
    defaultWidth: "two-thirds",
  },
  {
    id: "casesByStatus",
    label: "Cases by Status",
    description: "Donut chart of ongoing, pending, and disposed/closed cases.",
    defaultVisible: true,
    defaultWidth: "one-third",
  },
  {
    id: "casesByCategory",
    label: "Cases by Category",
    description: "Donut chart of practice-area distribution.",
    defaultVisible: true,
    defaultWidth: "half",
  },
  {
    id: "casesByCourt",
    label: "Cases by Court / State",
    description: "Distribution of cases across courts or states.",
    defaultVisible: true,
    defaultWidth: "half",
  },
  {
    id: "causeListSearch",
    label: "Cause List Search",
    description: "Fetch a live eCourts cause list without leaving the dashboard.",
    defaultVisible: false,
    defaultWidth: "full",
    fixedWidth: true,
  },
];

export const getStatCardDefinition = (id) => STAT_CARDS.find((card) => card.id === id);
export const getWidgetDefinition = (id) => WIDGETS.find((widget) => widget.id === id);

export const getDefaultDashboardSettings = () => ({
  statCards: STAT_CARDS.map((card) => ({ id: card.id, visible: card.defaultVisible })),
  widgets: WIDGETS.map((widget) => ({
    id: widget.id,
    visible: widget.defaultVisible,
    width: widget.defaultWidth,
  })),
});

const normalizeWidth = (widgetId, width) => {
  const definition = getWidgetDefinition(widgetId);
  if (!definition) return "full";
  if (definition.fixedWidth) return definition.defaultWidth;
  return WIDGET_WIDTHS.includes(width) ? width : definition.defaultWidth;
};

// Keeps the saved order, drops unknown ids, appends anything the user has never
// seen so newly shipped blocks surface instead of silently disappearing.
const normalizeList = (savedList, definitions, buildEntry) => {
  const saved = Array.isArray(savedList) ? savedList : [];
  const seen = new Set();
  const normalized = [];

  saved.forEach((entry) => {
    const id = entry && typeof entry === "object" ? entry.id : entry;
    if (!id || seen.has(id)) return;
    const definition = definitions.find((item) => item.id === id);
    if (!definition) return;
    seen.add(id);
    normalized.push(buildEntry(definition, entry || {}));
  });

  definitions.forEach((definition) => {
    if (seen.has(definition.id)) return;
    normalized.push(buildEntry(definition, {}));
  });

  return normalized;
};

export const normalizeDashboardSettings = (settings = {}) => ({
  statCards: normalizeList(settings?.statCards, STAT_CARDS, (definition, entry) => ({
    id: definition.id,
    visible: typeof entry.visible === "boolean" ? entry.visible : definition.defaultVisible,
  })),
  widgets: normalizeList(settings?.widgets, WIDGETS, (definition, entry) => ({
    id: definition.id,
    visible: typeof entry.visible === "boolean" ? entry.visible : definition.defaultVisible,
    width: normalizeWidth(definition.id, entry.width),
  })),
});

// Ready-made layouts offered as one-click starting points.
// `statCardIds` / `widgetSpecs` are listed in display order; everything a preset
// leaves out is kept in the layout but hidden, so nothing is lost when switching.
const buildLayout = (statCardIds, widgetSpecs) => {
  const listed = normalizeDashboardSettings({
    statCards: statCardIds.map((id) => ({ id, visible: true })),
    widgets: widgetSpecs.map(([id, width]) => ({ id, visible: true, width })),
  });

  return {
    statCards: listed.statCards.map((card) => ({
      ...card,
      visible: statCardIds.includes(card.id),
    })),
    widgets: listed.widgets.map((widget) => ({
      ...widget,
      visible: widgetSpecs.some(([id]) => id === widget.id),
    })),
  };
};

export const DASHBOARD_PRESETS = [
  {
    id: "default",
    label: "Default",
    description: "The standard Adhivakta layout.",
    build: () => getDefaultDashboardSettings(),
  },
  {
    id: "hearings",
    label: "Hearing focused",
    description: "Today's work first, charts underneath.",
    build: () =>
      buildLayout(["upcomingHearings", "urgentActions", "totalCases", "closedCases"], [
        ["dayBriefing", "full"],
        ["hearingsTable", "two-thirds"],
        ["casesByStatus", "one-third"],
        ["causeList", "full"],
        ["casesByCategory", "half"],
        ["casesByCourt", "half"],
      ]),
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "All three charts on one row, up top.",
    build: () =>
      buildLayout(["totalCases", "closedCases", "upcomingHearings", "urgentActions"], [
        ["casesByStatus", "one-third"],
        ["casesByCategory", "one-third"],
        ["casesByCourt", "one-third"],
        ["dayBriefing", "full"],
        ["hearingsTable", "full"],
      ]),
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Just today's hearings and the numbers.",
    build: () =>
      buildLayout(["upcomingHearings", "totalCases"], [
        ["dayBriefing", "full"],
        ["hearingsTable", "full"],
      ]),
  },
];

// Moves an entry within a list by `offset` positions, returning a new array.
export const moveListItem = (list, index, offset) => {
  const target = index + offset;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) {
    return list;
  }
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
};

export const DASHBOARD_LAYOUT_CACHE_KEY = "dashboardLayout";
export const DASHBOARD_LAYOUT_EVENT = "app:dashboard-layout";
