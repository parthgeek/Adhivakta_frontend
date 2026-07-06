"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import CaseTabs from "@/components/cases/CaseTabs";
import SidebarGuide from "@/components/cases/SidebarGuide";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  buildCaseNumber,
  getBackendCaseType,
  getEcourtCaseTypeReference,
  normalizeFormattedCaseNumber,
  normalizeCaseNumber,
} from "@/lib/caseTypeUtils";
import { toast } from "@/components/ui/use-toast";
import api from "@/services/api";

const normalizeValue = (value) =>
  typeof value === "string" ? value.trim() : "";

const normalizeEmail = (value) => normalizeValue(value).toLowerCase();
const getCurrentUserId = (currentUser) => currentUser?.id || currentUser?._id || null;
const DEFAULT_ECOURT_SELECTION = {
  source: "ecourts",
  stateCode: "",
  state: "",
  districtCode: "",
  district: "",
  complexCode: "",
  complex: "",
  courtCode: "",
  court: "",
  caseTypeCode: "",
  caseTypeName: "",
  requiresEstablishment: false,
};

const EMPTY_COURT_DIRECTORY_OPTIONS = {
  states: [],
  districts: [],
  complexes: [],
  courts: [],
  caseTypes: [],
};

const EMPTY_COURT_DIRECTORY_LOADING = {
  states: false,
  districts: false,
  complexes: false,
  courts: false,
  caseTypes: false,
};

const DEFAULT_CASE_YEAR = String(new Date().getFullYear());
const TAB_ORDER = ["court", "details", "party", "documents", "transfer", "associatedParties"];
const TERMINAL_CASE_STATUSES = ["closed", "disposed"];

// Auto-save draft so a half-filled "New Case" form survives navigating away / reload.
const DRAFT_STORAGE_PREFIX = "adhivakta:new-case-draft:";
const DRAFT_DATE_FIELDS = [
  "filingDate",
  "registrationDate",
  "eFilingDate",
  "nextHearingDate",
  "closedAt",
];
const getDraftStorageKey = (currentUser) =>
  `${DRAFT_STORAGE_PREFIX}${getCurrentUserId(currentUser) || "anon"}`;
const LIGHT_ERROR_TOAST_CLASSNAME =
  "!bg-red-50 !text-red-950 !border !border-red-200";
const CNR_NUMBER_PATTERN = /^[A-Z]{4}\d{12}$/;
const EMPTY_AUTO_FILL_STATE = {
  isLoadingCaptcha: false,
  isFetching: false,
  captchaSessionId: "",
  captchaImageUrl: "",
  captchaCode: "",
  message: "",
};

const EMPTY_CNR_AUTO_FILL_STATE = {
  cnrNumber: "",
  isLoadingCaptcha: false,
  isFetching: false,
  captchaSessionId: "",
  captchaImageUrl: "",
  captchaCode: "",
  message: "",
  error: "",
  importSummaryFields: [],
};

const toDateOrNull = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsedValue =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00`
      : value;
  const parsedDate = new Date(parsedValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

// JSON.stringify turns Date fields into strings; turn them back into Date objects.
const reviveDraftDates = (draft = {}) => {
  const revived = { ...draft };
  DRAFT_DATE_FIELDS.forEach((field) => {
    if (revived[field]) {
      revived[field] = toDateOrNull(revived[field]);
    }
  });
  return revived;
};

const getNonEmptyArray = (value, fallback = []) =>
  Array.isArray(value) && value.length > 0 ? value : fallback;

const normalizePersonName = (value) =>
  normalizeValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const partyMatchesCurrentUser = (party, currentUser) => {
  const partyName = normalizePersonName(party?.name);
  const userName = normalizePersonName(currentUser?.name);

  if (!partyName || !userName) return false;

  return (
    partyName === userName ||
    (partyName.length >= 5 &&
      userName.length >= 5 &&
      (partyName.includes(userName) || userName.includes(partyName)))
  );
};

const resolveImportedClientSide = (formData, currentUser, fallbackSide) => {
  const petitionerMatches = (formData?.petitioners || []).some((party) =>
    partyMatchesCurrentUser(party, currentUser)
  );
  const respondentMatches = (formData?.respondents || []).some((party) =>
    partyMatchesCurrentUser(party, currentUser)
  );

  if (petitionerMatches !== respondentMatches) {
    return petitionerMatches ? "petitioner" : "respondent";
  }

  const petitionerHasAdvocate = (formData?.petitioners || []).some((party) =>
    normalizeValue(party?.advocateName)
  );
  const respondentHasAdvocate = (formData?.respondents || []).some((party) =>
    normalizeValue(party?.opposingCounsel)
  );

  if (petitionerHasAdvocate !== respondentHasAdvocate) {
    return petitionerHasAdvocate ? "petitioner" : "respondent";
  }

  return fallbackSide || "petitioner";
};

const getImportedAdvocateNames = (formData, clientSide) => {
  const parties =
    clientSide === "respondent"
      ? formData?.respondents || []
      : formData?.petitioners || [];
  const advocateField =
    clientSide === "respondent" ? "opposingCounsel" : "advocateName";
  const seenNames = new Set();

  return parties.reduce((names, party) => {
    const name = normalizeValue(party?.[advocateField]);
    const normalizedName = normalizePersonName(name);

    if (name && normalizedName && !seenNames.has(normalizedName)) {
      seenNames.add(normalizedName);
      names.push(name);
    }

    return names;
  }, []);
};

const synchronizeSelectedSideAdvocates = (
  existingAdvocates,
  caseInfo,
  clientSide
) => {
  const existing = Array.isArray(existingAdvocates)
    ? existingAdvocates.map((advocate) => ({ ...advocate }))
    : [];
  const selectedNames = getImportedAdvocateNames(caseInfo, clientSide);
  const allPartyNames = new Set([
    ...getImportedAdvocateNames(caseInfo, "petitioner"),
    ...getImportedAdvocateNames(caseInfo, "respondent"),
  ].map(normalizePersonName));
  const existingByName = new Map(
    existing
      .filter((advocate) => normalizePersonName(advocate?.name))
      .map((advocate) => [normalizePersonName(advocate.name), advocate])
  );
  let emptyAdvocate = existing.find(
    (advocate) => !normalizeValue(advocate?.name)
  );

  const selectedAdvocates = selectedNames.map((name, index) => {
    const normalizedName = normalizePersonName(name);
    const matchingAdvocate = existingByName.get(normalizedName);

    if (matchingAdvocate) {
      return {
        ...matchingAdvocate,
        name,
        isLead: matchingAdvocate.isLead || index === 0,
      };
    }

    if (emptyAdvocate) {
      const populatedAdvocate = {
        ...emptyAdvocate,
        name,
        isLead: emptyAdvocate.isLead || index === 0,
      };
      emptyAdvocate = null;
      return populatedAdvocate;
    }

    return {
      name,
      email: "",
      contact: "",
      company: "",
      gst: "",
      poc: "",
      level: "Senior",
      isLead: index === 0,
    };
  });

  const manualAdvocates = existing.filter((advocate) => {
    const normalizedName = normalizePersonName(advocate?.name);
    return normalizedName && !allPartyNames.has(normalizedName);
  });

  return [...selectedAdvocates, ...manualAdvocates];
};

const findImportedCaseType = (caseTypes = [], { caseTypeCode = "", caseTypeName = "" } = {}) => {
  const normalizedCode = normalizeValue(caseTypeCode).toLowerCase();
  const normalizedName = normalizeValue(caseTypeName).toLowerCase();

  return (
    caseTypes.find(
      (caseType) =>
        normalizedCode &&
        normalizeValue(caseType.code).toLowerCase() === normalizedCode
    ) ||
    caseTypes.find(
      (caseType) =>
        normalizedName &&
        normalizeValue(caseType.name).toLowerCase() === normalizedName
    ) ||
    caseTypes.find((caseType) => {
      const candidateName = normalizeValue(caseType.name).toLowerCase();
      return (
        normalizedName &&
        candidateName &&
        (candidateName.includes(normalizedName) || normalizedName.includes(candidateName))
      );
    }) ||
    null
  );
};

const buildImportSummaryMessage = (response = {}) => {
  const warning = normalizeValue(response?.warning);
  const filledFields = Array.isArray(response?.importSummary?.filledFields)
    ? response.importSummary.filledFields
    : [];

  if (!filledFields.length) {
    return warning || "No eCourts fields could be matched automatically.";
  }

  const summary = `${filledFields.length} field${
    filledFields.length === 1 ? "" : "s"
  } imported from eCourts.`;

  return [warning, summary].filter(Boolean).join(" ");
};

const syncDerivedCaseFields = (caseInfo = {}) => {
  const caseYear = caseInfo.caseYear || DEFAULT_CASE_YEAR;
  const caseTypeName = caseInfo.eCourt?.caseTypeName || "";
  const ecourtTypeCode = caseInfo.eCourt?.caseTypeCode || "";
  const caseTypeReference = getEcourtCaseTypeReference({
    caseTypeName,
    caseTypeCode: ecourtTypeCode,
  });

  return {
    ...caseInfo,
    caseYear,
    caseCode: caseTypeReference.caseCode,
    category: caseTypeReference.category,
    caseNumber: buildCaseNumber({
      caseCode: caseTypeReference.caseCode,
      caseNumberMiddle: caseInfo.caseNumberMiddle,
      caseYear,
    }),
  };
};

const getParticipantUserId = (participant) => {
  if (!participant) return null;

  if (participant.user && typeof participant.user === "object") {
    return participant.user._id || participant.user.id || null;
  }

  return participant.user || participant._id || participant.id || null;
};

const isSameUser = (participant, currentUser) => {
  const currentUserId = getCurrentUserId(currentUser);
  const currentUserEmail = normalizeEmail(currentUser?.email);
  const participantUserId = getParticipantUserId(participant);
  const participantEmail = normalizeEmail(participant?.email);

  return (
    (currentUserId &&
      participantUserId &&
      participantUserId.toString() === currentUserId.toString()) ||
    (currentUserEmail &&
      participantEmail &&
      participantEmail === currentUserEmail)
  );
};

const ensureCurrentUserPrimaryParticipant = (
  participants = [],
  currentUser,
  type
) => {
  const currentUserId = getCurrentUserId(currentUser);
  const currentUserEmail = normalizeEmail(currentUser?.email);

  if (!currentUserId && !currentUserEmail) {
    return Array.isArray(participants) ? participants : [];
  }

  let foundCurrentUser = false;
  const normalizedParticipants = [];

  (participants || []).forEach((participant) => {
    const isCurrentUser = isSameUser(participant, currentUser);

    if (isCurrentUser) {
      if (foundCurrentUser) {
        return;
      }

      foundCurrentUser = true;
      normalizedParticipants.push({
        ...participant,
        user: currentUserId || participant.user || null,
        name: normalizeValue(currentUser?.name) || normalizeValue(participant?.name),
        email:
          normalizeValue(currentUser?.email) || normalizeValue(participant?.email),
        contact:
          normalizeValue(participant?.contact) ||
          normalizeValue(currentUser?.phone) ||
          normalizeValue(currentUser?.contact),
        ...(type === "lawyer"
          ? {
              company:
                normalizeValue(participant?.company) ||
                normalizeValue(currentUser?.company),
              gst:
                normalizeValue(participant?.gst) || normalizeValue(currentUser?.gst),
              level: participant?.level || "Senior",
            }
          : {
              address:
                normalizeValue(participant?.address) ||
                normalizeValue(currentUser?.address),
            }),
        isPrimary: true,
      });
      return;
    }

    normalizedParticipants.push({
      ...participant,
      isPrimary: false,
    });
  });

  if (!foundCurrentUser) {
    normalizedParticipants.unshift({
      user: currentUserId || null,
      name: normalizeValue(currentUser?.name),
      email: normalizeValue(currentUser?.email),
      contact:
        normalizeValue(currentUser?.phone) || normalizeValue(currentUser?.contact),
      ...(type === "lawyer"
        ? {
            company: normalizeValue(currentUser?.company),
            gst: normalizeValue(currentUser?.gst),
            level: "Senior",
          }
        : {
            address: normalizeValue(currentUser?.address),
          }),
      isPrimary: true,
    });
  }

  return normalizedParticipants;
};

const removeCurrentUserFromParticipants = (participants = [], currentUser) =>
  (participants || []).filter((participant) => !isSameUser(participant, currentUser));

const validateRequiredLegalTeamFields = ({
  participants = [],
  roleLabel,
  tab,
  errors,
  requireAtLeastOne = false,
  emptyStateMessage,
  emptyStateField,
  emptyStateFocusId,
}) => {
  if (!Array.isArray(participants) || participants.length === 0) {
    if (requireAtLeastOne && emptyStateMessage) {
      errors.push({
        tab,
        field: emptyStateField,
        focusId: emptyStateFocusId,
        summary: emptyStateMessage,
        message: emptyStateMessage,
      });
    }
    return;
  }

  participants.forEach((participant, index) => {
    const participantNumber = `${roleLabel} ${index + 1}`;

    if (!normalizeValue(participant?.name)) {
      errors.push({
        tab,
        field: `${tab}.${roleLabel.toLowerCase()}.${index}.name`,
        focusId: `${roleLabel.toLowerCase()}-name-${index}`,
        summary: `${participantNumber} name`,
        message: `Enter ${participantNumber.toLowerCase()} name`,
      });
    }

    if (!normalizeValue(participant?.company)) {
      errors.push({
        tab,
        field: `${tab}.${roleLabel.toLowerCase()}.${index}.company`,
        focusId: `${roleLabel.toLowerCase()}-company-${index}`,
        summary: `${participantNumber} law firm`,
        message: `Enter ${participantNumber.toLowerCase()} law firm`,
      });
    }

    if (!normalizeValue(participant?.contact)) {
      errors.push({
        tab,
        field: `${tab}.${roleLabel.toLowerCase()}.${index}.contact`,
        focusId: `${roleLabel.toLowerCase()}-contact-${index}`,
        summary: `${participantNumber} mobile number`,
        message: `Enter ${participantNumber.toLowerCase()} mobile number`,
      });
    }

    if (!normalizeValue(participant?.email)) {
      errors.push({
        tab,
        field: `${tab}.${roleLabel.toLowerCase()}.${index}.email`,
        focusId: `${roleLabel.toLowerCase()}-email-${index}`,
        summary: `${participantNumber} email`,
        message: `Enter ${participantNumber.toLowerCase()} email`,
      });
    }
  });
};

const buildValidationState = (errors = []) => {
  const grouped = {};

  errors.forEach((error) => {
    if (!grouped[error.tab]) {
      grouped[error.tab] = {
        hasErrors: true,
        errorCount: 0,
        messages: [],
        summaries: [],
        fieldErrors: {},
        firstFocusId: error.focusId || null,
      };
    }

    const bucket = grouped[error.tab];
    bucket.errorCount += 1;

    if (error.message && !bucket.messages.includes(error.message)) {
      bucket.messages.push(error.message);
    }

    if (error.summary && !bucket.summaries.includes(error.summary)) {
      bucket.summaries.push(error.summary);
    }

    if (error.field && !bucket.fieldErrors[error.field]) {
      bucket.fieldErrors[error.field] = error.message;
    }

    if (!bucket.firstFocusId && error.focusId) {
      bucket.firstFocusId = error.focusId;
    }
  });

  return grouped;
};

const focusFieldById = (fieldId) => {
  if (typeof document === "undefined" || !fieldId) return false;

  const element = document.getElementById(fieldId);
  if (!element) return false;

  element.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  });

  if (typeof element.focus === "function") {
    element.focus({ preventScroll: true });
  }

  return true;
};

const formatValidationToast = (errors = [], activeTabOnly = false) => {
  if (!errors.length) return null;

  if (activeTabOnly) {
    const fields = [...new Set(errors.map((error) => error.summary))];
    return {
      title: "Complete required fields",
      description: fields.join(", "),
    };
  }

  const grouped = errors.reduce((acc, error) => {
    if (!acc[error.tab]) {
      acc[error.tab] = [];
    }

    if (!acc[error.tab].includes(error.summary)) {
      acc[error.tab].push(error.summary);
    }

    return acc;
  }, {});

  const tabLabels = {
    court: "Court",
    details: "Case details",
    party: "Parties",
    documents: "Documents",
    associatedParties: "People",
  };

  return {
    title: "Complete required fields",
    description: Object.entries(grouped)
      .map(([tab, items]) => `${tabLabels[tab] || tab}: ${items.join(", ")}`)
      .join("\n"),
  };
};

export default function NewCasePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [activeTab, setActiveTab] = useState("court");
  const [courtSource, setCourtSource] = useState("ecourts");
  const [courtDirectoryOptions, setCourtDirectoryOptions] = useState(
    EMPTY_COURT_DIRECTORY_OPTIONS
  );
  const [courtDirectoryLoading, setCourtDirectoryLoading] = useState(
    EMPTY_COURT_DIRECTORY_LOADING
  );
  const isLawyer = user?.role === "lawyer" || user?.role === "admin";

  const pageTopRef = useRef(null);
  const draftRestoredRef = useRef(false);
  const draftSaveTimerRef = useRef(null);
  const skipDraftSaveRef = useRef(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [pendingFocusTarget, setPendingFocusTarget] = useState(null);
  const [showFinalOrderPrompt, setShowFinalOrderPrompt] = useState(false);
  const [caseAutoFill, setCaseAutoFill] = useState(EMPTY_AUTO_FILL_STATE);
  const [cnrAutoFill, setCnrAutoFill] = useState(EMPTY_CNR_AUTO_FILL_STATE);
  const [caseData, setCaseData] = useState(
    syncDerivedCaseFields({
      title: "",
      cnrNumber: "",
      caseNumber: "",
      caseNumberMiddle: "",
      caseYear: DEFAULT_CASE_YEAR,
      category: "",
      caseType: "",
      caseCode: "",
      courtState: "",
      district: "",
      bench: "",
      courtLevel: "",
      courtBench: "",
      courtType: "district_court",
      court: "",
      courtHall: "",
      courtComplex: "",
      eCourt: DEFAULT_ECOURT_SELECTION,
      filingDate: new Date(),
      registrationDate: null,
      registrationNumber: "",
      eFilingNumber: "",
      eFilingDate: null,
      registrationSameAsFilingDate: false,
      nextHearingDate: null,
      clientSide: "petitioner",
      petitionerRole: "Petitioner",
      petitionerType: "Individual",
      petitionerLabel: "Petitioner",
      petitioners: [],
      respondentRole: "Defendant",
      respondentLabel: "Defendant",
      respondents: [],
      description: "",
      status: "active",
      isUrgent: false,
      caseStage: "filing",
      actSections: "",
      policeStation: "",
      firNumber: "",
      firYear: "",
      reliefSought: "",
      notes: "",
      closedAt: null,
      processes: [],
      iaStatuses: [],
      interimOrders: [],
      finalOrders: [],
      advocates: [],
      clients: [],
      stakeholders: [],
      lawyers: [],
      transferHistory: [],
    })
  );

  // Restore a previously auto-saved draft once we know which user it belongs to.
  useEffect(() => {
    if (!user || draftRestoredRef.current) return;
    draftRestoredRef.current = true;

    try {
      const raw = localStorage.getItem(getDraftStorageKey(user));
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!parsed?.caseData) return;

      setCaseData(syncDerivedCaseFields(reviveDraftDates(parsed.caseData)));
      if (parsed.activeTab && TAB_ORDER.includes(parsed.activeTab)) {
        setActiveTab(parsed.activeTab);
      }

      toast({
        title: "Draft restored",
        description: "We brought back your unsaved case. Continue where you left off.",
      });
    } catch (error) {
      console.error("Failed to restore case draft:", error);
    }
  }, [user]);

  // Debounced auto-save of the in-progress form to localStorage.
  useEffect(() => {
    if (!user || !draftRestoredRef.current || skipDraftSaveRef.current) return;

    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
    }

    draftSaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          getDraftStorageKey(user),
          JSON.stringify({ caseData, activeTab, savedAt: Date.now() })
        );
      } catch (error) {
        console.error("Failed to save case draft:", error);
      }
    }, 800);

    return () => {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
      }
    };
  }, [caseData, activeTab, user]);

  useEffect(() => {
    if (!user) return;

    setCaseData((prev) => {
      const nextLawyers = isLawyer
        ? ensureCurrentUserPrimaryParticipant(prev.lawyers || [], user, "lawyer")
        : removeCurrentUserFromParticipants(prev.lawyers || [], user);

      const nextClients = isLawyer
        ? removeCurrentUserFromParticipants(prev.clients || [], user)
        : ensureCurrentUserPrimaryParticipant(prev.clients || [], user, "client");

      const lawyersChanged =
        JSON.stringify(nextLawyers) !== JSON.stringify(prev.lawyers || []);
      const clientsChanged =
        JSON.stringify(nextClients) !== JSON.stringify(prev.clients || []);

      if (!lawyersChanged && !clientsChanged) {
        return prev;
      }

      return {
        ...prev,
        lawyers: nextLawyers,
        clients: nextClients,
      };
    });
  }, [user, isLawyer]);

  useEffect(() => {
    if (!user || isLawyer) return;

    setCaseData((prev) => {
      const nextAdvocates = synchronizeSelectedSideAdvocates(
        prev.advocates,
        prev,
        prev.clientSide || "petitioner"
      );

      return JSON.stringify(nextAdvocates) === JSON.stringify(prev.advocates || [])
        ? prev
        : { ...prev, advocates: nextAdvocates };
    });
  }, [
    user,
    isLawyer,
    caseData.clientSide,
    caseData.petitioners,
    caseData.respondents,
  ]);

  const setCourtLookupLoading = (key, value) => {
    setCourtDirectoryLoading((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const loadStates = async (source = "ecourts") => {
    setCourtLookupLoading("states", true);

    try {
      const states = await api.courtDirectory.getStates(source);
      setCourtDirectoryOptions((prev) => ({
        ...prev,
        states,
      }));
    } catch (error) {
      toast({
        title: "Unable to load states",
        description: error.message || "Failed to load court directory states.",
        variant: "destructive",
      });
    } finally {
      setCourtLookupLoading("states", false);
    }
  };

  const loadDistricts = async (stateCode, source = "ecourts") => {
    if (!stateCode) return [];

    setCourtLookupLoading("districts", true);

    try {
      const districts = await api.courtDirectory.getDistricts(stateCode, source);
      setCourtDirectoryOptions((prev) => ({
        ...prev,
        districts,
        complexes: [],
        courts: [],
        caseTypes: [],
      }));
      return districts;
    } catch (error) {
      toast({
        title: "Unable to load districts",
        description: error.message || "Failed to load districts for the selected state.",
        variant: "destructive",
      });
      setCourtDirectoryOptions((prev) => ({
        ...prev,
        districts: [],
        complexes: [],
        courts: [],
        caseTypes: [],
      }));
      return [];
    } finally {
      setCourtLookupLoading("districts", false);
    }
  };

  const loadComplexes = async (stateCode, districtCode, source = "ecourts") => {
    if (!stateCode || !districtCode) return [];

    setCourtLookupLoading("complexes", true);

    try {
      const complexes = await api.courtDirectory.getComplexes(stateCode, districtCode, source);
      setCourtDirectoryOptions((prev) => ({
        ...prev,
        complexes,
        courts: [],
        caseTypes: [],
      }));
      return complexes;
    } catch (error) {
      toast({
        title: "Unable to load court complexes",
        description:
          error.message || "Failed to load court complexes for the selected district.",
        variant: "destructive",
      });
      setCourtDirectoryOptions((prev) => ({
        ...prev,
        complexes: [],
        courts: [],
        caseTypes: [],
      }));
      return [];
    } finally {
      setCourtLookupLoading("complexes", false);
    }
  };

  const loadCourts = async (stateCode, districtCode, complexCode, source = "ecourts") => {
    if (!stateCode || !districtCode || !complexCode) return [];

    setCourtLookupLoading("courts", true);

    try {
      const courts = await api.courtDirectory.getCourts(stateCode, districtCode, complexCode, source);
      setCourtDirectoryOptions((prev) => ({
        ...prev,
        courts,
        caseTypes: [],
      }));
      return courts;
    } catch (error) {
      toast({
        title: "Unable to load courts",
        description:
          error.message || "Failed to load courts for the selected complex.",
        variant: "destructive",
      });
      setCourtDirectoryOptions((prev) => ({
        ...prev,
        courts: [],
        caseTypes: [],
      }));
      return [];
    } finally {
      setCourtLookupLoading("courts", false);
    }
  };

  const loadCaseTypes = async (stateCode, districtCode, complexCode, courtCode, source = "ecourts") => {
    if (!stateCode || !districtCode || !complexCode || !courtCode) {
      return [];
    }

    setCourtLookupLoading("caseTypes", true);

    try {
      const payload = await api.courtDirectory.getCaseTypes(
        stateCode,
        districtCode,
        complexCode,
        courtCode,
        source
      );
      const caseTypes = payload?.caseTypes || [];
      setCourtDirectoryOptions((prev) => ({
        ...prev,
        caseTypes,
      }));
      return caseTypes;
    } catch (error) {
      toast({
        title: "Unable to load Case types",
        description:
          error.message || "Failed to load case types for the selected court.",
        variant: "destructive",
      });
      setCourtDirectoryOptions((prev) => ({
        ...prev,
        caseTypes: [],
      }));
      return [];
    } finally {
      setCourtLookupLoading("caseTypes", false);
    }
  };

  const getAutoFillPayload = () => {
    const eCourt = caseData.eCourt || {};
    return {
      stateCode: eCourt.stateCode || "",
      districtCode: eCourt.districtCode || "",
      complexCode: eCourt.complexCode || "",
      courtCode: eCourt.courtCode || "",
      caseTypeCode: eCourt.caseTypeCode || "",
      caseTypeName: eCourt.caseTypeName || "",
      caseNumber: normalizeCaseNumber(caseData.caseNumberMiddle || ""),
      caseYear: caseData.caseYear || DEFAULT_CASE_YEAR,
    };
  };

  const validateAutoFillPayload = () => {
    if (courtSource !== "ecourts") {
      toast({
        title: "eCourts auto-fill unavailable",
        description: "Case-number auto-fill is available for District Court eCourts records.",
        variant: "destructive",
        className: LIGHT_ERROR_TOAST_CLASSNAME,
      });
      return null;
    }

    const payload = getAutoFillPayload();
    const missingFields = [];

    if (!payload.stateCode) missingFields.push("state");
    if (!payload.districtCode) missingFields.push("district");
    if (!payload.complexCode) missingFields.push("court complex");
    if (!payload.courtCode) missingFields.push("court");
    if (!payload.caseTypeCode) missingFields.push("case type");
    if (!payload.caseNumber) missingFields.push("filing number");
    if (!payload.caseYear) missingFields.push("year");

    if (missingFields.length > 0) {
      toast({
        title: "Complete eCourts lookup fields",
        description: `Select or enter ${missingFields.join(", ")} first.`,
        variant: "destructive",
        className: LIGHT_ERROR_TOAST_CLASSNAME,
      });
      return null;
    }

    return payload;
  };

  const handleLoadAutoFillCaptcha = async () => {
    const payload = validateAutoFillPayload();
    if (!payload) return;

    setCaseAutoFill((prev) => ({
      ...prev,
      isLoadingCaptcha: true,
      message: "",
    }));

    try {
      const response = await api.cases.loadAutoFillCaptcha(payload);
      setCaseAutoFill((prev) => ({
        ...prev,
        isLoadingCaptcha: false,
        captchaSessionId: response.captchaSessionId || "",
        captchaImageUrl: response.captchaImageUrl || "",
        captchaCode: "",
        message: "Captcha loaded from eCourts.",
      }));
    } catch (error) {
      setCaseAutoFill((prev) => ({
        ...prev,
        isLoadingCaptcha: false,
        message: error.message || "Unable to load eCourts captcha.",
      }));
      toast({
        title: "Unable to load captcha",
        description: error.message || "Please try again.",
        variant: "destructive",
        className: LIGHT_ERROR_TOAST_CLASSNAME,
      });
    }
  };

  const handleAutoFillCaptchaChange = (value) => {
    setCaseAutoFill((prev) => ({
      ...prev,
      captchaCode: normalizeValue(value),
    }));
  };

  const handleRefreshAutoFillCaptcha = async () => {
    if (!caseAutoFill.captchaSessionId) {
      await handleLoadAutoFillCaptcha();
      return;
    }

    setCaseAutoFill((prev) => ({
      ...prev,
      isLoadingCaptcha: true,
      message: "",
    }));

    try {
      const response = await api.cases.refreshAutoFillCaptcha(
        caseAutoFill.captchaSessionId
      );
      setCaseAutoFill((prev) => ({
        ...prev,
        isLoadingCaptcha: false,
        captchaImageUrl: response.captchaImageUrl || prev.captchaImageUrl,
        captchaCode: "",
        message: "Captcha refreshed.",
      }));
    } catch (error) {
      setCaseAutoFill((prev) => ({
        ...prev,
        isLoadingCaptcha: false,
        message: error.message || "Unable to refresh captcha.",
      }));
      toast({
        title: "Unable to refresh captcha",
        description: error.message || "Please load a new captcha.",
        variant: "destructive",
        className: LIGHT_ERROR_TOAST_CLASSNAME,
      });
    }
  };

  const applyAutoFilledCaseData = (
    formData = {},
    { importClientAdvocates = false } = {}
  ) => {
    setCaseData((prev) => {
      const importedClientSide =
        importClientAdvocates && !isLawyer
          ? resolveImportedClientSide(formData, user, prev.clientSide)
          : prev.clientSide;
      const nextData = {
        ...prev,
        title: normalizeValue(formData.title) || prev.title,
        cnrNumber: normalizeValue(formData.cnrNumber).toUpperCase() || prev.cnrNumber,
        caseNumberMiddle:
          normalizeCaseNumber(formData.caseNumberMiddle || "") ||
          prev.caseNumberMiddle,
        caseYear: normalizeValue(formData.caseYear) || prev.caseYear,
        filingDate: toDateOrNull(formData.filingDate) || prev.filingDate,
        registrationDate:
          toDateOrNull(formData.registrationDate) || prev.registrationDate,
        registrationNumber:
          normalizeValue(formData.registrationNumber) || prev.registrationNumber,
        eFilingNumber:
          normalizeValue(formData.eFilingNumber) || prev.eFilingNumber,
        eFilingDate: toDateOrNull(formData.eFilingDate) || prev.eFilingDate,
        nextHearingDate:
          toDateOrNull(formData.nextHearingDate) || prev.nextHearingDate,
        petitioners: getNonEmptyArray(formData.petitioners, prev.petitioners),
        respondents: getNonEmptyArray(formData.respondents, prev.respondents),
        petitionerLabel: formData.petitionerLabel || prev.petitionerLabel,
        respondentLabel: formData.respondentLabel || prev.respondentLabel,
        description: normalizeValue(formData.description) || prev.description,
        actSections: normalizeValue(formData.actSections) || prev.actSections,
        policeStation: normalizeValue(formData.policeStation) || prev.policeStation,
        firNumber: normalizeValue(formData.firNumber) || prev.firNumber,
        firYear: normalizeValue(formData.firYear) || prev.firYear,
        reliefSought: normalizeValue(formData.reliefSought) || prev.reliefSought,
        notes: normalizeValue(formData.notes) || prev.notes,
        status: normalizeValue(formData.status) || prev.status,
        caseStage: normalizeValue(formData.caseStage) || prev.caseStage,
        courtHall: normalizeValue(formData.courtHall) || prev.courtHall,
        processes: getNonEmptyArray(formData.processes, prev.processes),
        iaStatuses: getNonEmptyArray(formData.iaStatuses, prev.iaStatuses),
        transferHistory: getNonEmptyArray(
          formData.transferHistory,
          prev.transferHistory
        ),
        interimOrders: getNonEmptyArray(formData.interimOrders, prev.interimOrders),
        finalOrders: getNonEmptyArray(formData.finalOrders, prev.finalOrders),
        clientSide: importedClientSide,
      };

      if (importClientAdvocates && !isLawyer) {
        nextData.advocates = synchronizeSelectedSideAdvocates(
          prev.advocates,
          nextData,
          importedClientSide
        );
      }

      return syncDerivedCaseFields(nextData);
    });
  };

  const handleFetchAutoFill = async () => {
    if (!caseAutoFill.captchaSessionId) {
      await handleLoadAutoFillCaptcha();
      return;
    }

    if (!normalizeValue(caseAutoFill.captchaCode)) {
      toast({
        title: "Enter captcha",
        description: "Enter the captcha shown by eCourts.",
        variant: "destructive",
        className: LIGHT_ERROR_TOAST_CLASSNAME,
      });
      return;
    }

    setCaseAutoFill((prev) => ({
      ...prev,
      isFetching: true,
      message: "",
    }));

    try {
      const response = await api.cases.fetchAutoFill({
        captchaSessionId: caseAutoFill.captchaSessionId,
        captchaCode: caseAutoFill.captchaCode,
      });
      const formData = response?.formData || {};
      applyAutoFilledCaseData(formData);

      const missingFields = response?.missingRequiredFields || [];
      setCaseAutoFill((prev) => ({
        ...prev,
        isFetching: false,
        captchaCode: "",
        message: missingFields.length
          ? `Still required: ${missingFields.join(", ")}.`
          : "Case details imported.",
      }));

      toast({
        title: "eCourts details imported",
        description: missingFields.length
          ? `Still required: ${missingFields.join(", ")}.`
          : "Review the populated fields before saving.",
      });
    } catch (error) {
      setCaseAutoFill((prev) => ({
        ...prev,
        isFetching: false,
        message: error.message || "Unable to fetch case details.",
      }));
      toast({
        title: "Unable to fetch eCourts details",
        description: error.message || "Please check the captcha and try again.",
        variant: "destructive",
        className: LIGHT_ERROR_TOAST_CLASSNAME,
      });
    }
  };

  const handleCnrNumberChange = (value) => {
    setCnrAutoFill((prev) => ({
      ...prev,
      cnrNumber: normalizeValue(value).toUpperCase(),
      error: "",
      message: "",
      importSummaryFields: [],
    }));
  };

  const handleLoadCnrCaptcha = async () => {
    const cnr = normalizeValue(cnrAutoFill.cnrNumber).toUpperCase();
    if (!CNR_NUMBER_PATTERN.test(cnr)) {
      setCnrAutoFill((prev) => ({
        ...prev,
        error: "Enter a valid CNR number: 4 letters + 12 digits (e.g. PBCH010001232015).",
        importSummaryFields: [],
      }));
      return;
    }

    setCnrAutoFill((prev) => ({
      ...prev,
      isLoadingCaptcha: true,
      error: "",
      message: "",
      importSummaryFields: [],
    }));

    try {
      const response = await api.cases.loadCnrAutoFillCaptcha({ cnrNumber: cnr });
      setCnrAutoFill((prev) => ({
        ...prev,
        isLoadingCaptcha: false,
        captchaSessionId: response.captchaSessionId || "",
        captchaImageUrl: response.captchaImageUrl || "",
        captchaCode: "",
        message: "",
        importSummaryFields: [],
      }));
    } catch (error) {
      setCnrAutoFill((prev) => ({
        ...prev,
        isLoadingCaptcha: false,
        error: error.message || "Unable to load captcha from eCourts.",
        importSummaryFields: [],
      }));
    }
  };

  const handleCnrCaptchaChange = (value) => {
    setCnrAutoFill((prev) => ({
      ...prev,
      captchaCode: normalizeValue(value),
    }));
  };

  const handleRefreshCnrCaptcha = async () => {
    if (!cnrAutoFill.captchaSessionId) {
      await handleLoadCnrCaptcha();
      return;
    }

    setCnrAutoFill((prev) => ({
      ...prev,
      isLoadingCaptcha: true,
      error: "",
      importSummaryFields: [],
    }));
    try {
      const response = await api.cases.refreshAutoFillCaptcha(cnrAutoFill.captchaSessionId);
      setCnrAutoFill((prev) => ({
        ...prev,
        isLoadingCaptcha: false,
        captchaImageUrl: response.captchaImageUrl || prev.captchaImageUrl,
        captchaCode: "",
        importSummaryFields: [],
      }));
    } catch (error) {
      setCnrAutoFill((prev) => ({
        ...prev,
        isLoadingCaptcha: false,
        error: error.message || "Unable to refresh captcha.",
        importSummaryFields: [],
      }));
    }
  };

  const handleFetchCnrAutoFill = async () => {
    if (!cnrAutoFill.captchaSessionId) {
      await handleLoadCnrCaptcha();
      return;
    }

    if (!normalizeValue(cnrAutoFill.captchaCode)) {
      setCnrAutoFill((prev) => ({
        ...prev,
        error: "Enter the captcha shown by eCourts.",
        importSummaryFields: [],
      }));
      return;
    }

    setCnrAutoFill((prev) => ({
      ...prev,
      isFetching: true,
      error: "",
      message: "",
      importSummaryFields: [],
    }));

    try {
      const response = await api.cases.fetchCnrAutoFill({
        captchaSessionId: cnrAutoFill.captchaSessionId,
        captchaCode: cnrAutoFill.captchaCode,
      });

      const formData = response?.formData || {};
      const courtInfo = response?.courtInfo || null;
      const importSummaryMessage = buildImportSummaryMessage(response);
      const importSummaryFields = Array.isArray(response?.importSummary?.filledFields)
        ? response.importSummary.filledFields
        : [];

      applyAutoFilledCaseData(formData, { importClientAdvocates: true });

      if (courtInfo?.stateCode) {
        setCourtSource("ecourts");
        setCaseData((prev) =>
          syncDerivedCaseFields({
            ...prev,
            courtType: "district_court",
            eCourt: {
              source: "ecourts",
              stateCode: courtInfo.stateCode || "",
              state: courtInfo.state || "",
              districtCode: courtInfo.districtCode || "",
              district: courtInfo.district || "",
              complexCode: courtInfo.complexCode || "",
              complex: courtInfo.complex || "",
              courtCode: courtInfo.courtCode || "",
              court: courtInfo.court || "",
              caseTypeCode: courtInfo.caseTypeCode || "",
              caseTypeName: courtInfo.caseTypeName || "",
              requiresEstablishment: Boolean(courtInfo.requiresEstablishment),
            },
            courtState: courtInfo.state || prev.courtState,
            district: courtInfo.district || prev.district,
            courtComplex: courtInfo.complex || prev.courtComplex,
            court: courtInfo.court || prev.court,
          })
        );

        await loadDistricts(courtInfo.stateCode, "ecourts");
        await loadComplexes(courtInfo.stateCode, courtInfo.districtCode, "ecourts");
        await loadCourts(courtInfo.stateCode, courtInfo.districtCode, courtInfo.complexCode, "ecourts");

        let importedCaseTypes = [];
        if (courtInfo.courtCode) {
          importedCaseTypes = await loadCaseTypes(
            courtInfo.stateCode,
            courtInfo.districtCode,
            courtInfo.complexCode,
            courtInfo.courtCode,
            "ecourts"
          );
        }

        const resolvedImportedCaseType = findImportedCaseType(importedCaseTypes, {
          caseTypeCode: courtInfo.caseTypeCode,
          caseTypeName: courtInfo.caseTypeName,
        });

        if (resolvedImportedCaseType || courtInfo.caseTypeName) {
          setCaseData((prev) =>
            syncDerivedCaseFields({
              ...prev,
              eCourt: {
                ...prev.eCourt,
                caseTypeCode:
                  resolvedImportedCaseType?.code || prev.eCourt?.caseTypeCode || "",
                caseTypeName:
                  resolvedImportedCaseType?.name ||
                  courtInfo.caseTypeName ||
                  prev.eCourt?.caseTypeName ||
                  "",
              },
            })
          );
        }
      }

      const missingFields = response?.missingRequiredFields || [];
      setCnrAutoFill((prev) => ({
        ...prev,
        isFetching: false,
        captchaCode: "",
        message: [
          missingFields.length
            ? `Imported. Still required: ${missingFields.join(", ")}.`
            : "Case details imported from eCourts.",
          importSummaryMessage,
        ]
          .filter(Boolean)
          .join(" "),
        error: "",
        importSummaryFields,
      }));

      toast({
        title: "eCourts CNR details imported",
        description: importSummaryMessage ||
          (courtInfo
            ? "Court info and case details populated."
            : "Case details populated. Fill court dropdowns manually."),
      });
    } catch (error) {
      setCnrAutoFill((prev) => ({
        ...prev,
        isFetching: false,
        captchaCode: "",
        error: error.message || "Unable to fetch case details.",
        importSummaryFields: [],
      }));
      toast({
        title: "CNR lookup failed",
        description: error.message || "Check the captcha and try again.",
        variant: "destructive",
        className: LIGHT_ERROR_TOAST_CLASSNAME,
      });
    }
  };

  // Fixed Supreme Court identifiers (only one court exists)
  const SUPREME_COURT_ECOURT = {
    source: "supremecourt",
    stateCode: "IND",
    state: "India",
    districtCode: "SCI",
    district: "Supreme Court of India",
    complexCode: "SCI_PRINCIPAL_BENCH",
    complex: "Principal Bench, New Delhi",
    courtCode: "SCI_MAIN",
    court: "Supreme Court of India",
    caseTypeCode: "",
    caseTypeName: "",
    requiresEstablishment: false,
  };

  const handleCourtTypeChange = async (newSource) => {
    const courtTypeMap = {
      ecourts: "district_court",
      highcourts: "high_court",
      supremecourt: "supreme_court",
    };

    setCourtSource(newSource);
    setCourtDirectoryOptions(EMPTY_COURT_DIRECTORY_OPTIONS);

    if (newSource === "supremecourt") {
      // Auto-populate all fixed SC values; user just picks case type
      setCaseData((prev) =>
        syncDerivedCaseFields({
          ...prev,
          eCourt: { ...SUPREME_COURT_ECOURT },
          courtType: "supreme_court",
        })
      );
      await loadCaseTypes("IND", "SCI", "SCI_PRINCIPAL_BENCH", "SCI_MAIN", "supremecourt");
    } else {
      setCaseData((prev) =>
        syncDerivedCaseFields({
          ...prev,
          eCourt: { ...DEFAULT_ECOURT_SELECTION, source: newSource },
          courtType: courtTypeMap[newSource] || "district_court",
        })
      );
      await loadStates(newSource);
    }
  };

  useEffect(() => {
    loadStates("ecourts");
  }, []);

  useEffect(() => {
    setCaseAutoFill((prev) => {
      if (!prev.captchaSessionId && !prev.captchaImageUrl && !prev.captchaCode) {
        return prev;
      }

      return {
        ...EMPTY_AUTO_FILL_STATE,
        message: "eCourts lookup changed. Load a fresh captcha.",
      };
    });
  }, [
    courtSource,
    caseData.eCourt?.stateCode,
    caseData.eCourt?.districtCode,
    caseData.eCourt?.complexCode,
    caseData.eCourt?.courtCode,
    caseData.eCourt?.caseTypeCode,
    caseData.caseNumberMiddle,
    caseData.caseYear,
  ]);

  useEffect(() => {
    if (pageTopRef.current) {
      pageTopRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab]);

  useEffect(() => {
    if (!pendingFocusTarget?.fieldId || pendingFocusTarget.tab !== activeTab) {
      return;
    }

    const timer = window.setTimeout(() => {
      const didFocus = focusFieldById(pendingFocusTarget.fieldId);
      if (didFocus) {
        setPendingFocusTarget(null);
      }
    }, 80);

    return () => window.clearTimeout(timer);
  }, [activeTab, pendingFocusTarget]);

  // Validate all fields
  const validateAllFields = () => {
    const errors = [];

    // Case Details validation
    if (!caseData.title || caseData.title.trim() === '') {
      errors.push({
        tab: "details",
        field: "title",
        focusId: "title",
        summary: "Case title",
        message: "Enter case title",
      });
    } else if (caseData.title.length < 3) {
      errors.push({
        tab: "details",
        field: "title",
        focusId: "title",
        summary: "Case title",
        message: "Case title must be at least 3 characters",
      });
    }

    if (!normalizeValue(caseData.caseNumberMiddle)) {
      errors.push({
        tab: "details",
        field: "caseNumberMiddle",
        focusId: "caseNumberMiddle",
        summary: "Filing number",
        message: "Enter filing number",
      });
    }

    const normalizedCnrNumber = normalizeValue(caseData.cnrNumber).toUpperCase();
    const isCnrRequired = !["high_court", "supreme_court"].includes(
      caseData.courtType
    );

    if (isCnrRequired && !normalizedCnrNumber) {
      errors.push({
        tab: "details",
        field: "cnrNumber",
        focusId: "cnrNumber",
        summary: "CNR number",
        message: "Enter CNR number",
      });
    } else if (
      normalizedCnrNumber &&
      !CNR_NUMBER_PATTERN.test(normalizedCnrNumber)
    ) {
      errors.push({
        tab: "details",
        field: "cnrNumber",
        focusId: "cnrNumber",
        summary: "CNR number",
        message: "Enter a valid CNR number like MHAU019999992015",
      });
    }

    if (!normalizeValue(caseData.caseYear)) {
      errors.push({
        tab: "details",
        field: "caseYear",
        focusId: "caseYear",
        summary: "Case year",
        message: "Select case year",
      });
    }

    if (!caseData.category) {
      errors.push({
        tab: "details",
        field: "selectedCaseType",
        focusId: "selectedCaseType",
        summary: "Case type",
        message: "Select case type in Court Information first",
      });
    }

    if (!caseData.status) {
      errors.push({
        tab: "details",
        field: "status",
        focusId: "status",
        summary: "Status",
        message: "Select case status",
      });
    }

    if (!normalizeValue(caseData.description)) {
      errors.push({
        tab: "details",
        field: "description",
        focusId: "description",
        summary: "Case description",
        message: "Enter case description",
      });
    }

    if (!normalizeValue(caseData.actSections)) {
      errors.push({
        tab: "details",
        field: "actSections",
        focusId: "actSections",
        summary: "Act & Sections",
        message: "Enter act and sections",
      });
    }

    if (!normalizeValue(caseData.reliefSought)) {
      errors.push({
        tab: "details",
        field: "reliefSought",
        focusId: "reliefSought",
        summary: "Relief sought",
        message: "Enter relief sought",
      });
    }

    // Court validation — supreme court values are auto-filled, only case type is user-selected
    if (courtSource === "supremecourt") {
      if (!caseData.eCourt?.caseTypeCode) {
        errors.push({ tab: 'court', message: 'Case type is required' });
      }
    } else {
      if (!caseData.eCourt?.stateCode) {
        errors.push({ tab: 'court', message: 'State is required' });
      }
      if (!caseData.eCourt?.districtCode) {
        errors.push({
          tab: 'court',
          message: courtSource === "highcourts" ? 'High Court is required' : 'District is required',
        });
      }
      if (!caseData.eCourt?.complexCode) {
        errors.push({
          tab: 'court',
          message: courtSource === "highcourts" ? 'Bench is required' : 'Court complex is required',
        });
      }
      if (!caseData.eCourt?.courtCode) {
        errors.push({ tab: 'court', message: 'Court selection is required' });
      }
      if (!caseData.eCourt?.caseTypeCode) {
        errors.push({ tab: 'court', message: 'Case type is required' });
      }
    }

    // First Hearing Date validation (MANDATORY)
    if (!caseData.nextHearingDate) {
      errors.push({
        tab: "details",
        field: "nextHearingDate",
        focusId: "nextHearingDate",
        summary: "First hearing date",
        message: "Select first hearing date",
      });
    } else {
      const hearingDate = new Date(caseData.nextHearingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (hearingDate < today) {
        errors.push({
          tab: "details",
          field: "nextHearingDate",
          focusId: "nextHearingDate",
          summary: "First hearing date",
          message: "First hearing date must be in the future",
        });
      }

      if (caseData.filingDate) {
        const filingDate = new Date(caseData.filingDate);
        filingDate.setHours(0, 0, 0, 0);

        if (hearingDate <= filingDate) {
          errors.push({
            tab: "details",
            field: "nextHearingDate",
            focusId: "nextHearingDate",
            summary: "First hearing date",
            message: "First hearing date must be after the filing date",
          });
        }
      }
    }

    // Petitioner validation (MANDATORY - at least one)
    if (!caseData.petitioners || caseData.petitioners.length === 0) {
      errors.push({
        tab: "party",
        field: "petitioners",
        focusId: "add-petitioner-button",
        summary: "Filing side",
        message: "Add at least one filing-side party",
      });
    } else {
      caseData.petitioners.forEach((petitioner, index) => {
        if (!petitioner.name || petitioner.name.trim() === '') {
          errors.push({
            tab: "party",
            field: `petitioners.${index}.name`,
            focusId: `petitioners-name-${index}`,
            summary: `Petitioner ${index + 1} name`,
            message: `Enter petitioner ${index + 1} name`,
          });
        }
      });
    }

    // Respondent validation (MANDATORY - at least one)
    if (!caseData.respondents || caseData.respondents.length === 0) {
      errors.push({
        tab: "party",
        field: "respondents",
        focusId: "add-respondent-button",
        summary: "Opposing side",
        message: "Add at least one opposing-side party",
      });
    } else {
      caseData.respondents.forEach((respondent, index) => {
        if (!respondent.name || respondent.name.trim() === '') {
          errors.push({
            tab: "party",
            field: `respondents.${index}.name`,
            focusId: `respondents-name-${index}`,
            summary: `Respondent ${index + 1} name`,
            message: `Enter respondent ${index + 1} name`,
          });
        }
      });
    }

    // Lawyer-specific validation
    if (isLawyer) {
      validateRequiredLegalTeamFields({
        participants: caseData.lawyers,
        roleLabel: "Advocate",
        tab: "associatedParties",
        errors,
        requireAtLeastOne: true,
        emptyStateMessage: "Add an advocate",
        emptyStateField: "lawyers",
        emptyStateFocusId: "add-lawyer-button",
      });

      if (!caseData.clients || caseData.clients.length === 0) {
        errors.push({
          tab: "associatedParties",
          field: "clients",
          focusId: "add-client-button",
          summary: "Client",
          message: "Add at least one client",
        });
      } else {
        caseData.clients.forEach((client, index) => {
          if (!client.name || client.name.trim() === '') {
            errors.push({
              tab: "associatedParties",
              field: `clients.${index}.name`,
              focusId: `client-name-${index}`,
              summary: `Client ${index + 1} name`,
              message: `Enter client ${index + 1} name`,
            });
          }
          if (!normalizeValue(client?.email)) {
            errors.push({
              tab: "associatedParties",
              field: `clients.${index}.email`,
              focusId: `client-email-${index}`,
              summary: `Client ${index + 1} email`,
              message: `Enter client ${index + 1} email`,
            });
          }
        });
      }
    } else {
      // Client-specific validation
      if (!caseData.clients || caseData.clients.length === 0) {
        errors.push({
          tab: "associatedParties",
          field: "clients",
          focusId: "add-client-button",
          summary: "Client",
          message: "Add a client",
        });
      } else {
        caseData.clients.forEach((client, index) => {
          if (!client.name || client.name.trim() === '') {
            errors.push({
              tab: "associatedParties",
              field: `clients.${index}.name`,
              focusId: `client-name-${index}`,
              summary: `Client ${index + 1} name`,
              message: `Enter client ${index + 1} name`,
            });
          }
        });
      }

      validateRequiredLegalTeamFields({
        participants: caseData.advocates,
        roleLabel: "Advocate",
        tab: "associatedParties",
        errors,
        requireAtLeastOne: true,
        emptyStateMessage: "Add an advocate",
        emptyStateField: "advocates",
        emptyStateFocusId: "add-advocate-button",
      });
    }

    // Stakeholders validation (if provided)
    if (caseData.stakeholders && caseData.stakeholders.length > 0) {
      caseData.stakeholders.forEach((stakeholder, index) => {
        if (!stakeholder.name || stakeholder.name.trim() === '') {
          errors.push({
            tab: "associatedParties",
            field: `stakeholders.${index}.name`,
            focusId: `stakeholder-name-${index}`,
            summary: `Stakeholder ${index + 1} name`,
            message: `Enter stakeholder ${index + 1} name`,
          });
        }
      });
    }

    return errors;
  };

  // Handle Next button click with validation
  const handleNext = () => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);

    const allErrors = validateAllFields();
    setValidationErrors(buildValidationState(allErrors));
    const currentTabErrors = allErrors.filter(error => error.tab === activeTab);

    if (currentTabErrors.length > 0) {
      const toastCopy = formatValidationToast(currentTabErrors, true);
      toast({
        title: toastCopy.title,
        description: toastCopy.description,
        variant: "destructive",
        className: LIGHT_ERROR_TOAST_CLASSNAME,
      });

      const firstError = currentTabErrors[0];
      if (firstError?.focusId) {
        const didFocus = focusFieldById(firstError.focusId);
        if (!didFocus) {
          setPendingFocusTarget({ tab: firstError.tab, fieldId: firstError.focusId });
        }
      }

      return;
    }

    if (currentIndex < TAB_ORDER.length - 1) {
      setValidationErrors({});
      setActiveTab(TAB_ORDER[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle Back button click
  const handleBack = () => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(TAB_ORDER[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Upload documents function
  async function uploadDocuments(caseId) {
    if (!caseId || selectedFiles.length === 0) return [];

    const uploadedDocs = [];

    for (const file of selectedFiles) {
      setUploadProgress((prev) => ({
        ...prev,
        [file.name]: 0,
      }));

      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      formData.append("description", `Document for case ${caseData.title || "Case"}`);
      formData.append("category", getBackendCaseType(caseData.category));

      try {
        const response = await api.documents.uploadToCaseId(
          caseId,
          formData,
          (event) => {
            if (!event.lengthComputable) return;
            // Cap at 99% — 100% is set only after server confirms scan passed
            const percent = Math.min(
              Math.round((event.loaded * 100) / event.total),
              99
            );
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: percent,
            }));
          }
        );

        if (response && response.data) {
          uploadedDocs.push({
            message: response.message,
            document: response.data,
          });
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: 100,
          }));
        }
      } catch (err) {
        console.error(`Error uploading document ${file.name}:`, err);
        toast({
          title: "Document upload failed",
          description: err.message || `${file.name} could not be uploaded.`,
          variant: "destructive",
          className: LIGHT_ERROR_TOAST_CLASSNAME,
        });
      }
    }

    return uploadedDocs;
  }

  const handleSubmit = async (e, section = "all") => {
    e.preventDefault();

    try {
      if (TERMINAL_CASE_STATUSES.includes(caseData.status) && (!caseData.finalOrders || caseData.finalOrders.length === 0)) {
        setActiveTab("transfer");
        toast({
          title: "Final judgment required",
          description: "Add at least one Final order / judgment entry before saving a closed/disposed case.",
          variant: "destructive",
          className: LIGHT_ERROR_TOAST_CLASSNAME,
        });
        return;
      }

      // Perform comprehensive validation
      const errors = validateAllFields();

      if (errors.length > 0) {
        setValidationErrors(buildValidationState(errors));
        const toastCopy = formatValidationToast(errors);

        toast({
          title: toastCopy.title,
          description: toastCopy.description,
          variant: "destructive",
          duration: 8000,
          className: LIGHT_ERROR_TOAST_CLASSNAME,
        });

        const firstErrorTab = errors[0]?.tab;
        if (firstErrorTab && firstErrorTab !== activeTab) {
          setActiveTab(firstErrorTab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        const firstFocusId = errors[0]?.focusId;
        if (firstErrorTab && firstFocusId) {
          if (firstErrorTab === activeTab) {
            const didFocus = focusFieldById(firstFocusId);
            if (!didFocus) {
              setPendingFocusTarget({ tab: firstErrorTab, fieldId: firstFocusId });
            }
          } else {
            setPendingFocusTarget({ tab: firstErrorTab, fieldId: firstFocusId });
          }
        }

        return;
      }

      setValidationErrors({});

      setIsSubmitting(true);

      const normalizedLawyers = isLawyer
        ? ensureCurrentUserPrimaryParticipant(caseData.lawyers || [], user, "lawyer")
        : removeCurrentUserFromParticipants(
            (caseData.advocates || []).map((adv) => ({
              name: normalizeValue(adv?.name),
              email: normalizeValue(adv?.email),
              contact: normalizeValue(adv?.contact),
              company: normalizeValue(adv?.company),
              gst: normalizeValue(adv?.gst),
              isLead: !!adv?.isLead,
              level: adv?.level || "",
              poc: normalizeValue(adv?.poc),
              spock: normalizeValue(adv?.spock),
            })),
            user
          );

      const normalizedClients = isLawyer
        ? removeCurrentUserFromParticipants(caseData.clients || [], user)
        : ensureCurrentUserPrimaryParticipant(caseData.clients || [], user, "client");
      const isUpdatingExistingCase = Boolean(caseData._id);

      // Format the data according to the API schema
      const formattedData = {
        // Basic case info
        title: normalizeValue(caseData.title),
        cnrNumber: normalizeValue(caseData.cnrNumber).toUpperCase(),
        caseNumber: normalizeFormattedCaseNumber(caseData.caseNumber),
        caseType: getBackendCaseType(caseData.category),
        caseSubType: normalizeValue(caseData.eCourt?.caseTypeName),
        status: caseData.status || "active",
        ...(isUpdatingExistingCase || TERMINAL_CASE_STATUSES.includes(caseData.status)
          ? {
              closedAt:
                TERMINAL_CASE_STATUSES.includes(caseData.status)
                  ? caseData.closedAt
                    ? new Date(caseData.closedAt).toISOString()
                    : new Date().toISOString()
                  : null,
            }
          : {}),

        // Court information
        courtState: normalizeValue(caseData.eCourt?.state || caseData.courtState),
        district: normalizeValue(caseData.eCourt?.district || caseData.district),
        bench: caseData.bench,
        courtType: caseData.courtType,
        court: normalizeValue(caseData.eCourt?.court || caseData.court),
        courtHall: normalizeValue(caseData.courtHall),
        courtComplex: normalizeValue(
          caseData.eCourt?.complex || caseData.courtComplex
        ),
        eCourt: caseData.eCourt?.stateCode
          ? {
              ...caseData.eCourt,
              state: normalizeValue(caseData.eCourt.state),
              district: normalizeValue(caseData.eCourt.district),
              complex: normalizeValue(caseData.eCourt.complex),
              court: normalizeValue(caseData.eCourt.court),
              caseTypeName: normalizeValue(caseData.eCourt.caseTypeName),
            }
          : undefined,

        // Dates
        filingDate: caseData.filingDate
          ? new Date(caseData.filingDate).toISOString()
          : new Date().toISOString(),
        registrationDate: caseData.registrationDate
          ? new Date(caseData.registrationDate).toISOString()
          : null,
        registrationNumber: normalizeValue(caseData.registrationNumber),
        eFilingNumber: normalizeValue(caseData.eFilingNumber),
        eFilingDate: caseData.eFilingDate
          ? new Date(caseData.eFilingDate).toISOString()
          : null,
        nextHearingDate: caseData.nextHearingDate
          ? new Date(caseData.nextHearingDate).toISOString()
          : null,

        // Parties Section
        parties: {
          petitioner: (caseData.petitioners || []).map((p) => ({
            name: normalizeValue(p.name),
            type: p.type || "Individual",
            role: p.label || caseData.petitionerLabel || "Petitioner",
            email: normalizeValue(p.email),
            contact: normalizeValue(p.contact),
            address: normalizeValue(p.address),
            advocateName: normalizeValue(p.advocateName),
          })),
          respondent: (caseData.respondents || []).map((r) => ({
            name: normalizeValue(r.name),
            type: r.type || "Individual",
            role: r.label || caseData.respondentLabel || "Defendant",
            email: normalizeValue(r.email),
            contact: normalizeValue(r.contact),
            address: normalizeValue(r.address),
            opposingCounsel: normalizeValue(r.opposingCounsel),
          })),
        },
        clientSide: caseData.clientSide || "petitioner",

        // Case Management
        isUrgent: caseData.isUrgent || false,
        caseStage: caseData.caseStage || "filing",
        actSections: normalizeValue(caseData.actSections),
        policeStation: normalizeValue(caseData.policeStation),
        firNumber: normalizeValue(caseData.firNumber),
        firYear: normalizeValue(caseData.firYear),
        reliefSought: normalizeValue(caseData.reliefSought),
        description: normalizeValue(caseData.description),
        notes: normalizeValue(caseData.notes),

        transferHistory: (caseData.transferHistory || []).map((t) => ({
          hearing: t.hearing || null,
          transferDate: t.transferDate
            ? new Date(t.transferDate).toISOString()
            : new Date().toISOString(),
          registrationNumber: normalizeValue(t.registrationNumber),
          fromCourt: normalizeValue(t.fromCourt),
          fromCourtHall: normalizeValue(t.fromCourtHall),
          fromJudge: normalizeValue(t.fromJudge),
          toCourt: normalizeValue(t.toCourt),
          toCourtHall: normalizeValue(t.toCourtHall),
          toJudge: normalizeValue(t.toJudge),
          remarks: normalizeValue(t.remarks),
        })),
        processes: (caseData.processes || []).map((processItem) => ({
          processId: normalizeValue(processItem.processId),
          processTitle: normalizeValue(processItem.processTitle),
          processDate: processItem.processDate
            ? new Date(processItem.processDate).toISOString()
            : null,
        })),
        iaStatuses: (caseData.iaStatuses || []).map((iaItem) => ({
          iaNumber: normalizeValue(iaItem.iaNumber),
          partyName: normalizeValue(iaItem.partyName),
          dateOfFiling: iaItem.dateOfFiling
            ? new Date(iaItem.dateOfFiling).toISOString()
            : null,
          nextDatePurpose: normalizeValue(iaItem.nextDatePurpose),
          status: normalizeValue(iaItem.status),
        })),
        interimOrders: (caseData.interimOrders || []).map((orderItem) => ({
          orderNumber: normalizeValue(orderItem.orderNumber),
          orderDate: orderItem.orderDate
            ? new Date(orderItem.orderDate).toISOString()
            : null,
          orderDetails: normalizeValue(orderItem.orderDetails),
          documentId: normalizeValue(orderItem.documentId),
          documentName: normalizeValue(orderItem.documentName),
        })),
        finalOrders: (caseData.finalOrders || []).map((orderItem) => ({
          orderNumber: normalizeValue(orderItem.orderNumber),
          orderDate: orderItem.orderDate
            ? new Date(orderItem.orderDate).toISOString()
            : null,
          orderDetails: normalizeValue(orderItem.orderDetails),
          documentId: normalizeValue(orderItem.documentId),
          documentName: normalizeValue(orderItem.documentName),
        })),

        // Role-specific data
        ...(isLawyer
          ? {
            // For lawyers
            clients: normalizedClients.map((client) => ({
              name: normalizeValue(client.name),
              email: normalizeValue(client.email),
              contact: normalizeValue(client.contact),
              address: normalizeValue(client.address),
              isPrimary: !!client.isPrimary,
            })),

            lawyers: normalizedLawyers.map((lawyer) => ({
              name: normalizeValue(lawyer.name),
              email: normalizeValue(lawyer.email),
              contact: normalizeValue(lawyer.contact),
              company: normalizeValue(lawyer.company),
              gst: normalizeValue(lawyer.gst),
              isLead: !!lawyer.isLead,
              level: lawyer.level || "",

              isPrimary: !!lawyer.isPrimary,
              poc: normalizeValue(lawyer.poc),
              spock: normalizeValue(lawyer.spock),
            })),

            stakeholders: (caseData.stakeholders || []).map(
              (stakeholder) => ({
                name: normalizeValue(stakeholder.name),
                email: normalizeValue(stakeholder.email),
                contact: normalizeValue(stakeholder.contact),
                address: normalizeValue(stakeholder.address),
                roleInCase: normalizeValue(stakeholder.roleInCase),
              })
            ),
          }
          : {
            // For clients
            clients: normalizedClients.map((client) => ({
              name: normalizeValue(client.name),
              email: normalizeValue(client.email),
              contact: normalizeValue(client.contact),
              address: normalizeValue(client.address),
              isPrimary: !!client.isPrimary,
            })),

            lawyers: normalizedLawyers.map((lawyer) => ({
              name: normalizeValue(lawyer.name),
              email: normalizeValue(lawyer.email),
              contact: normalizeValue(lawyer.contact),
              company: normalizeValue(lawyer.company),
              gst: normalizeValue(lawyer.gst),
              isLead: !!lawyer.isLead,
              level: lawyer.level || "",
              poc: normalizeValue(lawyer.poc),
              spock: normalizeValue(lawyer.spock),
            })),

            stakeholders: (caseData.stakeholders || []).map(
              (stakeholder) => ({
                name: normalizeValue(stakeholder.name),
                email: normalizeValue(stakeholder.email),
                contact: normalizeValue(stakeholder.contact),
                address: normalizeValue(stakeholder.address),
                roleInCase: normalizeValue(stakeholder.roleInCase),
              })
            ),
          }),
      };

      let response;

      if (caseData._id) {
        // Update existing case
        response = await api.cases.update(caseData._id, formattedData);
      } else {
        // Create new case
        response = await api.cases.create(formattedData);
      }

      if (response.error) {
        throw new Error(response.error);
      }

      // Handle backend validation errors
      if (response.errors && Array.isArray(response.errors)) {
        const formattedErrors = response.errors.map(err => err.message).join('\n');
        toast({
          title: "Validation Error",
          description: formattedErrors,
          variant: "destructive",
          duration: 8000,
          className: LIGHT_ERROR_TOAST_CLASSNAME,
        });
        setIsSubmitting(false);
        return;
      }

      // Upload documents after case is created
      const caseId = response?.case?._id || response?._id || response?.data?._id || response?.data?.case?._id;
      let uploadedDocs = [];
      if (caseId && selectedFiles.length > 0) {
        uploadedDocs = await uploadDocuments(caseId);
      }

      const hasPendingReviewDocuments = uploadedDocs.some(
        (item) => item?.document?.approvalStatus === "pending"
      );

      if (uploadedDocs.length > 0) {
        setSelectedFiles([]);
      }

      if (section !== "all") {
        setCaseData((prev) => ({
          ...prev,
          ...(response.data || response),
          _id: response.data?._id || response._id || prev._id,
        }));

        toast({
          title: "Success",
          description: `Case ${section} saved successfully`,
        });
      } else {
        // Case created — drop the saved draft so it doesn't reappear next time.
        skipDraftSaveRef.current = true;
        if (draftSaveTimerRef.current) {
          clearTimeout(draftSaveTimerRef.current);
        }
        try {
          localStorage.removeItem(getDraftStorageKey(user));
        } catch (error) {
          console.error("Failed to clear case draft:", error);
        }

        toast({
          title: "Success",
          description: hasPendingReviewDocuments
            ? "Case created. Uploaded documents are pending advocate approval."
            : "Case created successfully!",
        });

        const createdCaseId =
          response?.data?.data?.case?._id ||
          response?.data?.data?._id ||
          response?.data?.case?._id ||
          response?.data?._id ||
          response?.case?._id ||
          response?._id;

        setTimeout(() => {
          if (createdCaseId) {
            router.push(`/dashboard/cases/${createdCaseId}`);
          } else {
            router.push("/dashboard/cases");
            router.refresh();
          }
        }, 1000);
      }

      return response;
    } catch (error) {
      console.error("Error saving case:", error);

      // Handle specific error types
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors
          .map(err => err.message)
          .join('\n');

        toast({
          title: "Validation Error",
          description: backendErrors,
          variant: "destructive",
          duration: 8000,
          className: LIGHT_ERROR_TOAST_CLASSNAME,
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to save case. Please try again.",
          variant: "destructive",
          className: LIGHT_ERROR_TOAST_CLASSNAME,
        });
      }

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const hasErrors = Object.keys(validationErrors).length > 0;
    if (!hasErrors) return;

    setValidationErrors(buildValidationState(validateAllFields()));
  }, [caseData, isLawyer]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "caseNumberMiddle") {
      setCaseData((prev) =>
        syncDerivedCaseFields({
          ...prev,
          caseNumberMiddle: normalizeCaseNumber(value),
        })
      );
      return;
    }

    if (name === "cnrNumber") {
      setCaseData((prev) => ({
        ...prev,
        cnrNumber: value.toUpperCase(),
      }));
      return;
    }

    setCaseData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = async (name, value) => {
    if (name === "status" && TERMINAL_CASE_STATUSES.includes(value) && !TERMINAL_CASE_STATUSES.includes(caseData.status)) {
      setShowFinalOrderPrompt(true);
      return;
    }

    if (name === "status" && !TERMINAL_CASE_STATUSES.includes(value)) {
      setCaseData((prev) => ({
        ...prev,
        status: value,
        closedAt: null,
      }));
      return;
    }

    if (name === "category") {
      setCaseData((prev) => ({
        ...prev,
        category: value,
      }));
      return;
    }

    if (name === "caseYear") {
      setCaseData((prev) =>
        syncDerivedCaseFields({
          ...prev,
          caseYear: value,
        })
      );
      return;
    }

    if (name === "ecourtState") {
      const selectedState = courtDirectoryOptions.states.find(
        (state) => state.code === value
      );

      setCaseData((prev) =>
        syncDerivedCaseFields({
          ...prev,
          courtState: selectedState?.name || "",
          district: "",
          courtComplex: "",
          court: "",
          eCourt: {
            ...DEFAULT_ECOURT_SELECTION,
            source: courtSource,   // preserve the selected court type source
            stateCode: value,
            state: selectedState?.name || "",
          },
        })
      );

      setCourtDirectoryOptions((prev) => ({
        ...prev,
        districts: [],
        complexes: [],
        courts: [],
        caseTypes: [],
      }));

      await loadDistricts(value, courtSource);
      return;
    }

    if (name === "ecourtDistrict") {
      const selectedDistrict = courtDirectoryOptions.districts.find(
        (district) => district.code === value
      );
      const stateCode = caseData.eCourt?.stateCode || "";

      setCaseData((prev) =>
        syncDerivedCaseFields({
          ...prev,
          district: selectedDistrict?.name || "",
          courtComplex: "",
          court: "",
          eCourt: {
            ...prev.eCourt,
            districtCode: value,
            district: selectedDistrict?.name || "",
            complexCode: "",
            complex: "",
            courtCode: "",
            court: "",
            caseTypeCode: "",
            caseTypeName: "",
            requiresEstablishment: false,
          },
        })
      );

      setCourtDirectoryOptions((prev) => ({
        ...prev,
        complexes: [],
        courts: [],
        caseTypes: [],
      }));

      await loadComplexes(stateCode, value, courtSource);
      return;
    }

    if (name === "ecourtComplex") {
      const selectedComplex = courtDirectoryOptions.complexes.find(
        (complex) => complex.code === value
      );
      const stateCode = caseData.eCourt?.stateCode || "";
      const districtCode = caseData.eCourt?.districtCode || "";

      setCaseData((prev) =>
        syncDerivedCaseFields({
          ...prev,
          courtComplex: selectedComplex?.name || "",
          court: "",
          eCourt: {
            ...prev.eCourt,
            complexCode: value,
            complex: selectedComplex?.name || "",
            courtCode: "",
            court: "",
            caseTypeCode: "",
            caseTypeName: "",
            requiresEstablishment: false,
          },
        })
      );

      setCourtDirectoryOptions((prev) => ({
        ...prev,
        courts: [],
        caseTypes: [],
      }));

      const courts = await loadCourts(stateCode, districtCode, value, courtSource);

      if (courts.length === 1) {
        const selectedCourt = courts[0];

        setCaseData((prev) =>
          syncDerivedCaseFields({
            ...prev,
            court: selectedCourt.name,
            eCourt: {
              ...prev.eCourt,
              courtCode: selectedCourt.code,
              court: selectedCourt.name,
              caseTypeCode: "",
              caseTypeName: "",
            },
          })
        );

        const caseTypes = await loadCaseTypes(
          stateCode,
          districtCode,
          value,
          selectedCourt.code,
          courtSource
        );

        if (caseTypes.length === 1) {
          setCaseData((prev) =>
            syncDerivedCaseFields({
              ...prev,
              eCourt: {
                ...prev.eCourt,
                courtCode: selectedCourt.code,
                court: selectedCourt.name,
                caseTypeCode: caseTypes[0].code,
                caseTypeName: caseTypes[0].name,
              },
            })
          );
        }
      }
      return;
    }

    if (name === "ecourtCourt") {
      const selectedCourt = courtDirectoryOptions.courts.find(
        (court) => court.code === value
      );
      const stateCode = caseData.eCourt?.stateCode || "";
      const districtCode = caseData.eCourt?.districtCode || "";
      const complexCode = caseData.eCourt?.complexCode || "";

      setCaseData((prev) =>
        syncDerivedCaseFields({
          ...prev,
          court: selectedCourt?.name || "",
          eCourt: {
            ...prev.eCourt,
            courtCode: value,
            court: selectedCourt?.name || "",
            caseTypeCode: "",
            caseTypeName: "",
          },
        })
      );

      setCourtDirectoryOptions((prev) => ({
        ...prev,
        caseTypes: [],
      }));

      const caseTypes = await loadCaseTypes(
        stateCode,
        districtCode,
        complexCode,
        value,
        courtSource
      );

      if (caseTypes.length === 1) {
        setCaseData((prev) =>
          syncDerivedCaseFields({
            ...prev,
            eCourt: {
              ...prev.eCourt,
              courtCode: value,
              court: selectedCourt?.name || prev.eCourt?.court || "",
              caseTypeCode: caseTypes[0].code,
              caseTypeName: caseTypes[0].name,
            },
          })
        );
      }
      return;
    }

    if (name === "ecourtCaseType") {
      const selectedCaseType = courtDirectoryOptions.caseTypes.find(
        (caseType) => caseType.code === value
      );

      setCaseData((prev) =>
        syncDerivedCaseFields({
          ...prev,
          eCourt: {
            ...prev.eCourt,
            caseTypeCode: value,
            caseTypeName: selectedCaseType?.name || "",
          },
        })
      );
      return;
    }

    if (name === "courtType") {
      setCaseData((prev) => ({
        ...prev,
        [name]: value,
        bench: value === "high_court" ? prev.bench : "",
      }));
      return;
    }

    setCaseData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCaseTypeInputChange = (rawValue) => {
    const typedValue = normalizeValue(rawValue);

    if (!typedValue) {
      setCaseData((prev) =>
        syncDerivedCaseFields({
          ...prev,
          eCourt: {
            ...prev.eCourt,
            caseTypeCode: "",
            caseTypeName: "",
          },
        })
      );
      return;
    }

    const matchedCaseType = (courtDirectoryOptions.caseTypes || []).find(
      (caseType) =>
        normalizeValue(caseType.name).toLowerCase() === typedValue.toLowerCase() ||
        normalizeValue(caseType.code).toLowerCase() === typedValue.toLowerCase()
    );

    const resolvedName = matchedCaseType?.name || typedValue;
    const caseTypeReference = getEcourtCaseTypeReference({
      caseTypeName: resolvedName,
      caseTypeCode: matchedCaseType?.code || "",
    });

    setCaseData((prev) =>
      syncDerivedCaseFields({
        ...prev,
        eCourt: {
          ...prev.eCourt,
          caseTypeCode: matchedCaseType?.code || caseTypeReference.caseCode || "",
          caseTypeName: resolvedName,
        },
      })
    );
  };

  const handleCloseStatusConfirm = () => {
    setCaseData((prev) => ({
      ...prev,
      status: "closed",
      closedAt: prev.closedAt || new Date(),
    }));
    setShowFinalOrderPrompt(false);
    setActiveTab("transfer");
    toast({
      title: "Add final judgment",
      description: "Complete the Final order / judgment section before saving the closed/disposed case.",
    });
  };

  const handleDateChange = (name, date) => {
    setCaseData((prev) => {
      const newData = { ...prev, [name]: date };

      // Validate that next hearing date is after filing date
      if (name === "nextHearingDate" && newData.filingDate && date) {
        if (new Date(date) <= new Date(newData.filingDate)) {
          toast({
            title: "Validation Error",
            description: "First hearing date must be after the filing date",
            variant: "destructive",
          });
          return prev;
        }
      }

      // Validate that filing date is not in the future
      if (name === "filingDate" && date) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (new Date(date) > today) {
          toast({
            title: "Validation Error",
            description: "Filing date cannot be in the future",
            variant: "destructive",
          });
          return prev;
        }

        if (prev.registrationSameAsFilingDate) {
          newData.registrationDate = date;
        }
      }

      if (name === "registrationDate" && date) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (new Date(date) > today) {
          toast({
            title: "Validation Error",
            description: "Registration date cannot be in the future",
            variant: "destructive",
          });
          return prev;
        }
      }

      return newData;
    });
  };

  const handleCheckboxChange = (name, checked) => {
    setCaseData((prev) => {
      if (name === "registrationSameAsFilingDate") {
        return {
          ...prev,
          registrationSameAsFilingDate: Boolean(checked),
          registrationDate: checked ? prev.filingDate || new Date() : prev.registrationDate,
        };
      }

      return { ...prev, [name]: checked };
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  // Helper functions
  const updateClientField = (index, field, value) => {
    setCaseData((prev) => {
      const updatedClients = [...(prev.clients || [])];
      updatedClients[index] = { ...updatedClients[index], [field]: value };
      return { ...prev, clients: updatedClients };
    });
  };

  const removeClient = (index) => {
    setCaseData((prev) => ({
      ...prev,
      clients: prev.clients.filter((_, i) => i !== index),
    }));
  };

  const addClient = () => {
    setCaseData((prev) => ({
      ...prev,
      clients: [
        ...(prev.clients || []),
        { name: "", email: "", contact: "", address: "", isPrimary: (prev.clients || []).length === 0 },
      ],
    }));
  };

  const addStakeholder = () => {
    setCaseData((prev) => ({
      ...prev,
      stakeholders: [
        ...(prev.stakeholders || []),
        { name: "", email: "", contact: "", address: "", roleInCase: "" },
      ],
    }));
  };

  const updateStakeholderField = (index, field, value) => {
    setCaseData((prev) => {
      const updatedStakeholders = [...(prev.stakeholders || [])];
      updatedStakeholders[index] = {
        ...updatedStakeholders[index],
        [field]: value,
      };
      return { ...prev, stakeholders: updatedStakeholders };
    });
  };

  const removeStakeholder = (index) => {
    setCaseData((prev) => ({
      ...prev,
      stakeholders: prev.stakeholders.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6" ref={pageTopRef} data-tour="case-form">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Add Case</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Fill in all required fields marked with <span className="text-red-500">*</span>
          </p>
        </div>
      </div>

      <div className={`grid grid-cols-1 items-start gap-6 ${activeTab === "party" ? "" : "md:grid-cols-3"}`}>
        <div className={activeTab === "party" ? "" : "md:col-span-2"}>
          <CaseTabs
            caseData={caseData}
            setCaseData={setCaseData}
            handleCaseTypeInputChange={handleCaseTypeInputChange}
            courtDirectoryOptions={courtDirectoryOptions}
            courtDirectoryLoading={courtDirectoryLoading}
            courtSource={courtSource}
            handleCourtTypeChange={handleCourtTypeChange}
            isSubmitting={isSubmitting}
            isLawyer={isLawyer}
            selectedFiles={selectedFiles}
            uploadProgress={uploadProgress}
            handleSubmit={handleSubmit}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            handleDateChange={handleDateChange}
            handleCheckboxChange={handleCheckboxChange}
            handleFileChange={handleFileChange}
            updateClientField={updateClientField}
            removeClient={removeClient}
            addClient={addClient}
            addStakeholder={addStakeholder}
            updateStakeholderField={updateStakeholderField}
            removeStakeholder={removeStakeholder}
            router={router}
            user={user}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleNext={handleNext}
            handleBack={handleBack}
            validationErrors={validationErrors}
            allowClosedStatus={true}
            caseAutoFill={caseAutoFill}
            handleLoadAutoFillCaptcha={handleLoadAutoFillCaptcha}
            handleAutoFillCaptchaChange={handleAutoFillCaptchaChange}
            handleRefreshAutoFillCaptcha={handleRefreshAutoFillCaptcha}
            handleFetchAutoFill={handleFetchAutoFill}
            cnrAutoFill={cnrAutoFill}
            handleCnrNumberChange={handleCnrNumberChange}
            handleLoadCnrCaptcha={handleLoadCnrCaptcha}
            handleCnrCaptchaChange={handleCnrCaptchaChange}
            handleRefreshCnrCaptcha={handleRefreshCnrCaptcha}
            handleFetchCnrAutoFill={handleFetchCnrAutoFill}
          />
        </div>

        <div className="hidden md:block md:sticky md:top-0 md:self-start">
          <SidebarGuide />
        </div>
      </div>

      <Dialog open={showFinalOrderPrompt} onOpenChange={setShowFinalOrderPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Case is being closed/disposed</DialogTitle>
            <DialogDescription>
              Closed/disposed cases require a Final order / judgment entry. Continue to the judgment section now.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinalOrderPrompt(false)}>
              Cancel
            </Button>
            <Button onClick={handleCloseStatusConfirm}>Add Judgment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
