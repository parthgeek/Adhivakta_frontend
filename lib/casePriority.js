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

  if (status === "closed" || !hearingDate) {
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
      return "bg-red-600 text-white border-transparent";
    case "high":
      return "bg-red-500 text-white border-transparent";
    case "normal":
      return "bg-orange-400 text-white border-transparent";
    default:
      return "bg-gray-200 text-gray-700";
  }
};

export const getCasePriorityLabel = (priority) =>
  (priority || "normal").toUpperCase();

export const isPriorityAlertCase = (priority) =>
  ["high", "urgent"].includes((priority || "").toLowerCase());
