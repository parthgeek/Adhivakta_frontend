import { caseTypes } from "./caseTypes";

export const CASE_TYPE_CATEGORY_TO_VALUE = {
  Civil: "civil",
  Criminal: "criminal",
  Family: "family",
  Commercial: "commercial",
  Consumer: "consumer",
  Labour: "labour",
  Tribunal: "tribunal",
  Special: "special",
  Writ: "writ",
  Appeal: "appeal",
  Revision: "revision",
  Execution: "execution",
  Arbitration: "arbitration",
  Revenue: "revenue",
  "Motor Accident Claims": "motor_accident",
  Other: "other",
};

export const CASE_TYPE_VALUE_TO_LABEL = Object.fromEntries(
  Object.entries(CASE_TYPE_CATEGORY_TO_VALUE).map(([label, value]) => [
    value,
    label,
  ])
);

export const normalizeCaseNumber = (value = "") =>
  typeof value === "string"
    ? value.toUpperCase().replace(/[^A-Z0-9]/g, "")
    : "";

export const getBackendCaseType = (category = "") =>
  CASE_TYPE_CATEGORY_TO_VALUE[category] || "other";

export const findCaseTypeCode = (category = "", selectedCaseType = "") => {
  const matched = (caseTypes[category] || []).find(
    (type) => type.label === selectedCaseType
  );

  return matched?.code || "";
};

export const inferCaseCategory = ({
  caseType = "",
  caseSubType = "",
} = {}) => {
  const normalizedSubType =
    typeof caseSubType === "string" ? caseSubType.trim() : "";

  if (normalizedSubType) {
    const matchedCategory = Object.entries(caseTypes).find(([, types]) =>
      types.some((type) => type.label === normalizedSubType)
    );

    if (matchedCategory) {
      return matchedCategory[0];
    }
  }

  return CASE_TYPE_VALUE_TO_LABEL[caseType] || "";
};

export const formatCaseTypeLabel = (value = "") => {
  const normalizedValue = typeof value === "string" ? value.trim() : "";

  if (!normalizedValue) {
    return "";
  }

  return CASE_TYPE_VALUE_TO_LABEL[normalizedValue] || normalizedValue;
};

export const getDisplayCaseType = (caseItem = {}) =>
  formatCaseTypeLabel(
    caseItem.caseSubType || caseItem.caseType || caseItem.type || ""
  );
