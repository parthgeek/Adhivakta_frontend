const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toDate = (value) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const getNextCaseHearingDate = (caseItem = {}) =>
  toDate(
    caseItem.nextHearingDate ||
      caseItem.nextHearing ||
      caseItem.hearingDate ||
      null
  );

export const getCasePriority = (caseItem = {}, options = {}) => {
  const now = options.now instanceof Date ? options.now : new Date();
  const hearingDate =
    options.hearingDate !== undefined
      ? toDate(options.hearingDate)
      : getNextCaseHearingDate(caseItem);
  const status = (caseItem.status || "").toLowerCase();

  // Finished matters are never a priority.
  if (status === "closed" || status === "disposed") {
    return "normal";
  }

  // The advocate explicitly flagged this case as urgent.
  if (caseItem.isUrgent) {
    return "urgent";
  }

  if (!hearingDate) {
    return "normal";
  }

  const today = startOfDay(now);
  const hearingDay = startOfDay(hearingDate);
  if (hearingDay < today) {
    return "normal";
  }

  const daysUntilHearing = Math.ceil(
    (hearingDay.getTime() - today.getTime()) / MS_PER_DAY
  );

  if (daysUntilHearing <= 3) {
    return "urgent";
  }

  if (daysUntilHearing <= 7) {
    return "high";
  }

  return "normal";
};

export const getCasePriorityColor = (priority) => {
  switch ((priority || "normal").toLowerCase()) {
    case "urgent":
      return "bg-red-100 text-red-800 border border-red-200 hover:bg-red-100";
    case "high":
      return "bg-orange-100 text-orange-800 border border-orange-200 hover:bg-orange-100";
    case "normal":
      return "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-100";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-100";
  }
};

export const getCasePriorityLabel = (priority) =>
  (priority || "normal").toUpperCase();

export const isPriorityAlertCase = (priority) =>
  ["high", "urgent"].includes((priority || "").toLowerCase());
