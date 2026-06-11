"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCcw, Search } from "lucide-react";
import api from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DISPLAY_BOARD_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const getTodayIsoDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDisplayDate = (isoDate) => {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
};

const formatCountdown = (remainingMs) => {
  const safeMs = Math.max(0, remainingMs || 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const formatMinutesAgo = (timestamp) => {
  if (!timestamp) {
    return "Refreshed just now";
  }

  const elapsedMs = Math.max(0, Date.now() - new Date(timestamp).getTime());
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  if (elapsedMinutes <= 0) {
    return "Refreshed just now";
  }

  return `Refreshed ${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;
};

export default function CauseListSearchPage() {
  const router = useRouter();

  const [stateOptions, setStateOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [complexOptions, setComplexOptions] = useState([]);
  const [establishmentOptions, setEstablishmentOptions] = useState([]);

  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedComplex, setSelectedComplex] = useState("");
  const [selectedEstablishment, setSelectedEstablishment] = useState("");

  const [selectedDate, setSelectedDate] = useState(getTodayIsoDate());

  const [courtJudgeOptions, setCourtJudgeOptions] = useState([]);
  const [selectedCourtOptionValue, setSelectedCourtOptionValue] = useState("");

  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaSessionId, setCaptchaSessionId] = useState("");
  const [captchaImageUrl, setCaptchaImageUrl] = useState("");
  const [captchaNonce, setCaptchaNonce] = useState(0);

  const [loadingJudges, setLoadingJudges] = useState(false);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [directoryLoading, setDirectoryLoading] = useState({
    states: false,
    districts: false,
    complexes: false,
    establishments: false,
  });

  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [tableFilter, setTableFilter] = useState("");
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [personalizedError, setPersonalizedError] = useState("");
  const [personalizedResult, setPersonalizedResult] = useState(null);
  const [personalizedTableFilter, setPersonalizedTableFilter] = useState("");
  const [personalizedCaptchaCode, setPersonalizedCaptchaCode] = useState("");
  const [personalizedCaptchaSessionId, setPersonalizedCaptchaSessionId] = useState("");
  const [personalizedCaptchaImageUrl, setPersonalizedCaptchaImageUrl] = useState("");
  const [personalizedCaptchaNonce, setPersonalizedCaptchaNonce] = useState(0);
  const [personalizedCourtOptions, setPersonalizedCourtOptions] = useState([]);
  const [personalizedSelectedCourtOptionValue, setPersonalizedSelectedCourtOptionValue] =
    useState("");
  const [displayBoardLoading, setDisplayBoardLoading] = useState(false);
  const [displayBoardError, setDisplayBoardError] = useState("");
  const [displayBoardStates, setDisplayBoardStates] = useState([]);
  const [displayBoardSelectedStateCode, setDisplayBoardSelectedStateCode] = useState("");
  const [displayBoardSelectedState, setDisplayBoardSelectedState] = useState(null);
  const [displayBoardFrameNonce, setDisplayBoardFrameNonce] = useState(0);
  const [displayBoardLastRefreshedAt, setDisplayBoardLastRefreshedAt] = useState("");
  const [displayBoardCountdownMs, setDisplayBoardCountdownMs] = useState(
    DISPLAY_BOARD_REFRESH_INTERVAL_MS
  );

  const setDirLoading = (key, value) =>
    setDirectoryLoading((prev) => ({ ...prev, [key]: value }));

  const resetCaptchaSession = () => {
    setCourtJudgeOptions([]);
    setSelectedCourtOptionValue("");
    setCaptchaCode("");
    setCaptchaSessionId("");
    setCaptchaImageUrl("");
    setCaptchaNonce(0);
    setResult(null);
    setTableFilter("");
  };

  const resetPersonalizedFlow = () => {
    setPersonalizedError("");
    setPersonalizedResult(null);
    setPersonalizedTableFilter("");
    setPersonalizedCaptchaCode("");
    setPersonalizedCaptchaSessionId("");
    setPersonalizedCaptchaImageUrl("");
    setPersonalizedCaptchaNonce(0);
    setPersonalizedCourtOptions([]);
    setPersonalizedSelectedCourtOptionValue("");
  };

  const applyPersonalizedResponse = (response) => {
    setPersonalizedResult(response || null);

    const options = Array.isArray(response?.courtOptions) ? response.courtOptions : [];
    const nextSessionId = response?.captchaSessionId || "";
    const nextImageUrl = response?.captchaImageUrl || "";
    const isCompleted = Boolean(response?.completed);

    setPersonalizedCourtOptions(options);
    setPersonalizedSelectedCourtOptionValue(
      options.length === 1 ? options[0].value : ""
    );
    setPersonalizedCaptchaSessionId(isCompleted ? "" : nextSessionId);
    setPersonalizedCaptchaImageUrl(isCompleted ? "" : nextImageUrl);
    setPersonalizedCaptchaCode("");
    setPersonalizedCaptchaNonce((value) => value + 1);
  };

  useEffect(() => {
    (async () => {
      setDirLoading("states", true);
      try {
        const states = await api.courtDirectory.getStates("ecourts");
        setStateOptions(states || []);
      } catch (err) {
        setError(err?.message || "Failed to load states.");
      } finally {
        setDirLoading("states", false);
      }
    })();
  }, []);

  const loadHighCourtDisplayBoard = async (stateCode = "") => {
    setDisplayBoardLoading(true);
    setDisplayBoardError("");

    try {
      const response = await api.causeList.getHighCourtDisplayBoard(stateCode);
      const states = Array.isArray(response?.states) ? response.states : [];
      const selectedState = response?.selectedState || states[0] || null;

      setDisplayBoardStates(states);
      setDisplayBoardSelectedState(selectedState);
      setDisplayBoardSelectedStateCode(selectedState?.code || "");
      setDisplayBoardLastRefreshedAt(response?.refreshedAt || new Date().toISOString());
      setDisplayBoardCountdownMs(DISPLAY_BOARD_REFRESH_INTERVAL_MS);
      setDisplayBoardFrameNonce((value) => value + 1);

      if (response?.message) {
        setDisplayBoardError(response.message);
      }
    } catch (err) {
      setDisplayBoardError(
        err?.message || "Unable to load the high court display board right now."
      );
    } finally {
      setDisplayBoardLoading(false);
    }
  };

  useEffect(() => {
    loadHighCourtDisplayBoard();
  }, []);

  useEffect(() => {
    if (!displayBoardSelectedState?.code) return undefined;

    const activeStateCode = displayBoardSelectedState.code;
    const intervalId = window.setInterval(() => {
      setDisplayBoardCountdownMs((previousValue) => {
        if (previousValue <= 1000) {
          loadHighCourtDisplayBoard(activeStateCode);
          return DISPLAY_BOARD_REFRESH_INTERVAL_MS;
        }

        return previousValue - 1000;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [displayBoardSelectedState?.code]);

  useEffect(() => {
    resetPersonalizedFlow();
  }, [selectedDate]);

  useEffect(() => {
    setDistrictOptions([]);
    setSelectedDistrict("");
    setComplexOptions([]);
    setSelectedComplex("");
    setEstablishmentOptions([]);
    setSelectedEstablishment("");
    resetCaptchaSession();

    if (!selectedState) return;

    let cancelled = false;
    (async () => {
      setDirLoading("districts", true);
      try {
        const districts = await api.courtDirectory.getDistricts(selectedState, "ecourts");
        if (!cancelled) setDistrictOptions(districts || []);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load districts.");
      } finally {
        if (!cancelled) setDirLoading("districts", false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedState]);

  useEffect(() => {
    setComplexOptions([]);
    setSelectedComplex("");
    setEstablishmentOptions([]);
    setSelectedEstablishment("");
    resetCaptchaSession();

    if (!selectedState || !selectedDistrict) return;

    let cancelled = false;
    (async () => {
      setDirLoading("complexes", true);
      try {
        const complexes = await api.courtDirectory.getComplexes(
          selectedState,
          selectedDistrict,
          "ecourts"
        );
        if (!cancelled) setComplexOptions(complexes || []);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load complexes.");
      } finally {
        if (!cancelled) setDirLoading("complexes", false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedState, selectedDistrict]);

  useEffect(() => {
    setEstablishmentOptions([]);
    setSelectedEstablishment("");
    resetCaptchaSession();

    if (!selectedState || !selectedDistrict || !selectedComplex) return;

    let cancelled = false;
    (async () => {
      setDirLoading("establishments", true);
      try {
        const courts = await api.courtDirectory.getCourts(
          selectedState,
          selectedDistrict,
          selectedComplex,
          "ecourts"
        );
        if (cancelled) return;

        const list = courts || [];
        setEstablishmentOptions(list);

        if (list.length === 1) {
          setSelectedEstablishment(list[0].code);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load courts.");
      } finally {
        if (!cancelled) setDirLoading("establishments", false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedState, selectedDistrict, selectedComplex]);

  const requiresEstablishmentChoice = establishmentOptions.length > 1;

  const allCourtCodesSelected = useMemo(
    () =>
      Boolean(
        selectedState && selectedDistrict && selectedComplex && selectedEstablishment
      ),
    [selectedState, selectedDistrict, selectedComplex, selectedEstablishment]
  );

  const loadCourtJudges = async () => {
    if (!allCourtCodesSelected || !selectedDate) return;

    setLoadingJudges(true);
    setError("");
    setResult(null);

    try {
      const response = await api.causeList.getJudgesForCourt({
        stateCode: selectedState,
        districtCode: selectedDistrict,
        complexCode: selectedComplex,
        courtCode: selectedEstablishment,
        date: selectedDate,
      });

      const options = Array.isArray(response?.courtOptions) ? response.courtOptions : [];
      setCourtJudgeOptions(options);
      setSelectedCourtOptionValue(options.length === 1 ? options[0].value : "");
      setCaptchaSessionId(response?.captchaSessionId || "");
      setCaptchaImageUrl(response?.captchaImageUrl || "");
      setCaptchaNonce((value) => value + 1);
    } catch (err) {
      setError(
        err?.message ||
          err?.errors?.[0]?.msg ||
          "Unable to load eCourts court/judge entries."
      );
    } finally {
      setLoadingJudges(false);
    }
  };

  const refreshCaptcha = async () => {
    if (!captchaSessionId) return;

    try {
      const response = await api.causeList.refreshCaptcha(captchaSessionId);
      setCaptchaImageUrl(response?.captchaImageUrl || "");
      setCaptchaCode("");
      setCaptchaNonce((value) => value + 1);
    } catch (err) {
      setError(err?.message || "Unable to refresh captcha right now.");
    }
  };

  const submitForListing = async (listingType) => {
    if (!captchaSessionId || !captchaCode || !selectedCourtOptionValue) return;

    setLoadingFetch(true);
    setError("");

    try {
      const response = await api.causeList.searchForCourt({
        date: selectedDate,
        listingType,
        courtOptionValue: selectedCourtOptionValue,
        captchaCode,
        captchaSessionId,
      });
      setResult(response);
      setCaptchaImageUrl(response?.captchaImageUrl || captchaImageUrl);
      setCaptchaCode("");
      setCaptchaNonce((value) => value + 1);
      setTableFilter("");
    } catch (err) {
      const message =
        err?.message ||
        err?.errors?.[0]?.msg ||
        "Unable to fetch cause list right now.";
      setError(message);
      setResult(null);
      if (/captcha/i.test(message)) {
        await refreshCaptcha();
      }
    } finally {
      setLoadingFetch(false);
    }
  };

  const startPersonalizedFlow = async () => {
    if (!selectedDate) return;

    setPersonalizedLoading(true);
    setPersonalizedError("");

    try {
      const response = await api.causeList.startPersonalizedLive({
        date: selectedDate,
      });
      applyPersonalizedResponse(response);
    } catch (err) {
      setPersonalizedResult(null);
      setPersonalizedTableFilter("");
      setPersonalizedCaptchaCode("");
      setPersonalizedCaptchaSessionId("");
      setPersonalizedCaptchaImageUrl("");
      setPersonalizedCaptchaNonce(0);
      setPersonalizedCourtOptions([]);
      setPersonalizedSelectedCourtOptionValue("");
      setPersonalizedError(
        err?.message ||
          err?.errors?.[0]?.msg ||
          "Unable to start your personalized cause list."
      );
    } finally {
      setPersonalizedLoading(false);
    }
  };

  const refreshPersonalizedCaptcha = async () => {
    if (!personalizedCaptchaSessionId) return;

    try {
      const response = await api.causeList.refreshCaptcha(personalizedCaptchaSessionId);
      setPersonalizedCaptchaImageUrl(response?.captchaImageUrl || "");
      setPersonalizedCaptchaCode("");
      setPersonalizedCaptchaNonce((value) => value + 1);
    } catch (err) {
      setPersonalizedError(err?.message || "Unable to refresh captcha right now.");
    }
  };

  const submitPersonalizedForListing = async (listingType) => {
    if (
      !personalizedCaptchaSessionId ||
      !personalizedCaptchaCode ||
      !personalizedSelectedCourtOptionValue
    ) {
      return;
    }

    setPersonalizedLoading(true);
    setPersonalizedError("");

    try {
      const response = await api.causeList.searchPersonalizedLive({
        date: selectedDate,
        listingType,
        courtOptionValue: personalizedSelectedCourtOptionValue,
        captchaCode: personalizedCaptchaCode,
        captchaSessionId: personalizedCaptchaSessionId,
      });
      applyPersonalizedResponse(response);
    } catch (err) {
      const message =
        err?.message ||
        err?.errors?.[0]?.msg ||
        "Unable to fetch your personalized cause list right now.";
      setPersonalizedError(message);

      if (/captcha/i.test(message)) {
        await refreshPersonalizedCaptcha();
      }
    } finally {
      setPersonalizedLoading(false);
    }
  };

  const filteredEntries = useMemo(() => {
    const entries = result?.entries || [];
    const term = tableFilter.trim().toLowerCase();
    if (!term) return entries;

    return entries.filter((entry) =>
      [
        entry.case_number,
        entry.party,
        entry.advocate,
        entry.judge_name,
        entry.category,
        entry.stage,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [result, tableFilter]);

  const filteredPersonalizedEntries = useMemo(() => {
    const entries = personalizedResult?.personalized_cases || [];
    const term = personalizedTableFilter.trim().toLowerCase();
    if (!term) return entries;

    return entries.filter((entry) =>
      [
        entry.serial,
        entry.case_title,
        entry.case_number,
        entry.cnr_number,
        entry.party,
        entry.judge_name,
        entry.stage,
        entry.court_name,
        entry.source_label,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [personalizedResult, personalizedTableFilter]);

  const courtTitle =
    courtJudgeOptions.find((option) => option.value === selectedCourtOptionValue)?.label ||
    "";

  const headingComplexName =
    complexOptions.find((option) => option.code === selectedComplex)?.name || "";

  const displayBoardEmbedHtml = displayBoardSelectedState?.embedHtml || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold text-[#03234b]">Cause Lists</h1>
      </div>

      <Card className="overflow-hidden border-[#d6deeb] shadow-sm">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 gap-4 bg-[#1e2b3d] px-4 py-4 text-white sm:grid-cols-3 sm:gap-6">
            <div>
              <label className="mb-1 block text-sm font-medium">Select State</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                disabled={directoryLoading.states}
                className="h-11 w-full rounded-md border border-white/30 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <option value="">
                  {directoryLoading.states ? "Loading..." : "Select State"}
                </option>
                {stateOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Select District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedState || directoryLoading.districts}
                className="h-11 w-full rounded-md border border-white/30 bg-white px-3 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <option value="">
                  {directoryLoading.districts ? "Loading..." : "Select District"}
                </option>
                {districtOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Select Court Complex</label>
              <select
                value={selectedComplex}
                onChange={(e) => setSelectedComplex(e.target.value)}
                disabled={!selectedDistrict || directoryLoading.complexes}
                className="h-11 w-full rounded-md border border-white/30 bg-white px-3 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <option value="">
                  {directoryLoading.complexes ? "Loading..." : "Select Court Complex"}
                </option>
                {complexOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="px-4 py-4">
            <p className="text-sm font-medium text-[#355487]">
              Cause list displayed may differ from the actual cause list. For further
              queries, contact court administrator.
            </p>
          </div>

          <div className="border-t border-[#d6deeb] bg-white px-4 py-5">
            <p className="mb-4 text-sm font-medium text-rose-600">
              Fields marked with <span className="font-bold">*</span> are required
            </p>

            {requiresEstablishmentChoice ? (
              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#355487]">
                    <span className="text-rose-600">*</span> Establishment
                  </label>
                  <select
                    value={selectedEstablishment}
                    onChange={(e) => setSelectedEstablishment(e.target.value)}
                    disabled={directoryLoading.establishments}
                    className="h-11 w-full rounded-md border border-[#d6deeb] bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03234b]"
                  >
                    <option value="">
                      {directoryLoading.establishments
                        ? "Loading..."
                        : "Select Establishment"}
                    </option>
                    {establishmentOptions.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-end">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#355487]">
                  <span className="text-rose-600">*</span> Court Name
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedCourtOptionValue}
                    onChange={(e) => setSelectedCourtOptionValue(e.target.value)}
                    disabled={courtJudgeOptions.length === 0}
                    className="h-11 w-full rounded-md border border-[#d6deeb] bg-white px-3 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03234b]"
                  >
                    <option value="">
                      {courtJudgeOptions.length > 0
                        ? "Select Court Name"
                        : loadingJudges
                          ? "Loading entries..."
                          : "Load entries first"}
                    </option>
                    {courtJudgeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loadCourtJudges}
                    disabled={!allCourtCodesSelected || !selectedDate || loadingJudges}
                    className="h-11 shrink-0 border-[#d6deeb] text-[#03234b] hover:bg-[#eef4fb]"
                  >
                    {loadingJudges ? "Loading..." : courtJudgeOptions.length ? "Reload" : "Load"}
                  </Button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#355487]">
                  <span className="text-rose-600">*</span> Cause List Date
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max="2099-12-31"
                  className="h-11 border-[#d6deeb]"
                />
              </div>
            </div>

            {captchaSessionId ? (
              <div className="mt-5 grid grid-cols-1 items-end gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#355487]">
                    Captcha
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex h-11 min-w-[140px] items-center justify-center rounded-md border border-[#d6deeb] bg-white px-3">
                      {captchaImageUrl ? (
                        <img
                          src={`${captchaImageUrl}${captchaImageUrl.includes("?") ? "&" : "?"}v=${captchaNonce}`}
                          alt="eCourts captcha"
                          className="max-h-[36px] w-auto object-contain"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">Captcha</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={refreshCaptcha}
                      title="Refresh captcha"
                      className="h-11 w-11 border-[#d6deeb] text-[#03234b] hover:bg-[#eef4fb]"
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#355487]">
                    <span className="text-rose-600">*</span> Enter Captcha
                  </label>
                  <Input
                    value={captchaCode}
                    onChange={(e) =>
                      setCaptchaCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))
                    }
                    placeholder="Enter Captcha"
                    className="h-11 border-[#d6deeb]"
                    maxLength={6}
                  />
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                onClick={() => submitForListing("civ")}
                disabled={
                  loadingFetch ||
                  !captchaSessionId ||
                  !captchaCode ||
                  !selectedCourtOptionValue
                }
                className="h-11 min-w-[120px] bg-[#03234b] text-white hover:bg-[#042d5e]"
              >
                {loadingFetch ? "Loading..." : "Civil"}
              </Button>
              <Button
                type="button"
                onClick={() => submitForListing("cri")}
                disabled={
                  loadingFetch ||
                  !captchaSessionId ||
                  !captchaCode ||
                  !selectedCourtOptionValue
                }
                className="h-11 min-w-[120px] bg-[#03234b] text-white hover:bg-[#042d5e]"
              >
                {loadingFetch ? "Loading..." : "Criminal"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-[#d6deeb] shadow-sm">
        <CardContent className="p-0">
          <div className="border-b border-[#d6deeb] bg-[#eef4fb] px-4 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#03234b]">Your Personalized Cause List</h2>
                <p className="mt-1 text-sm text-[#355487]">
                  Run the live eCourts flow court by court, solve each captcha, and build a personalized list that keeps only your tracked case numbers for{" "}
                  {toDisplayDate(selectedDate)}.
                </p>
              </div>
              <div className="text-sm text-[#355487]">
                {personalizedLoading
                  ? "Loading..."
                  : personalizedResult
                    ? `${personalizedResult?.personalized_total_entries || 0} matched entries across ${personalizedResult?.personalized_total_cases || 0} cases`
                    : "Start the live personalized fetch"}
              </div>
            </div>
          </div>

          <div className="border-b border-[#d6deeb] bg-white px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-[#355487]">
                {personalizedResult?.workflow?.total_steps
                  ? `Progress: ${personalizedResult.workflow.completed_steps || 0}/${personalizedResult.workflow.total_steps} courts completed`
                  : "No live personalized session started yet."}
              </div>
              <Button
                type="button"
                onClick={startPersonalizedFlow}
                disabled={!selectedDate || personalizedLoading}
                className="h-10 bg-[#03234b] text-white hover:bg-[#042d5e]"
              >
                {personalizedLoading && !personalizedCaptchaSessionId
                  ? "Starting..."
                  : "Start Personalized Flow"}
              </Button>
            </div>

            {personalizedResult?.currentCourt ? (
              <div className="mt-4 rounded-lg border border-[#d6deeb] bg-[#f8fbff] p-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-[#03234b]">
                    Court {personalizedResult.workflow?.current_step || 1} of{" "}
                    {personalizedResult.workflow?.total_steps || 1}
                  </p>
                  <p className="text-sm text-[#355487]">
                    {personalizedResult.currentCourt.court?.name || "Court"}{" "}
                    {personalizedResult.currentCourt.court?.district
                      ? `• ${personalizedResult.currentCourt.court.district}`
                      : ""}
                  </p>
                  {personalizedResult.currentCourt.court?.complex ? (
                    <p className="text-xs text-[#4f5f77]">
                      Court complex: {personalizedResult.currentCourt.court.complex}
                    </p>
                  ) : null}
                  <p className="text-xs text-[#4f5f77]">
                    Matching {personalizedResult.currentCourt.caseCount || 0} tracked cases in this court.
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[#355487]">
                      <span className="text-rose-600">*</span> Court Name
                    </label>
                    <select
                      value={personalizedSelectedCourtOptionValue}
                      onChange={(e) => setPersonalizedSelectedCourtOptionValue(e.target.value)}
                      disabled={personalizedCourtOptions.length === 0 || personalizedLoading}
                      className="h-11 w-full rounded-md border border-[#d6deeb] bg-white px-3 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03234b]"
                    >
                      <option value="">
                        {personalizedCourtOptions.length
                          ? "Select Court Name"
                          : "No eCourts entries available"}
                      </option>
                      {personalizedCourtOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[#355487]">
                      Tracked Cases
                    </label>
                    <div className="rounded-md border border-[#d6deeb] bg-white px-3 py-2 text-sm text-slate-700">
                      {(personalizedResult.currentCourt.cases || []).map((caseItem) => (
                        <div
                          key={caseItem.id}
                          className="border-b border-slate-100 py-2 last:border-b-0"
                        >
                          <div className="font-medium text-slate-900">
                            {caseItem.caseNumber || caseItem.title || "Case"}
                          </div>
                          <div className="mt-1 text-xs text-[#4f5f77]">
                            {[caseItem.district, caseItem.courtComplex]
                              .filter(Boolean)
                              .join(" / ") || "District / complex unavailable"}
                          </div>
                          {caseItem.caseType ? (
                            <div className="mt-1 text-xs text-[#4f5f77]">
                              Case type: {caseItem.caseType}
                            </div>
                          ) : null}
                          {caseItem.petitioners?.length ? (
                            <div className="mt-1 text-xs text-[#4f5f77]">
                              Petitioner: {caseItem.petitioners.join(", ")}
                            </div>
                          ) : null}
                          {caseItem.respondents?.length ? (
                            <div className="mt-1 text-xs text-[#4f5f77]">
                              Respondent: {caseItem.respondents.join(", ")}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {personalizedCaptchaSessionId ? (
                  <div className="mt-4 grid grid-cols-1 items-end gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-[#355487]">
                        Captcha
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex h-11 min-w-[140px] items-center justify-center rounded-md border border-[#d6deeb] bg-white px-3">
                          {personalizedCaptchaImageUrl ? (
                            <img
                              src={`${personalizedCaptchaImageUrl}${personalizedCaptchaImageUrl.includes("?") ? "&" : "?"}v=${personalizedCaptchaNonce}`}
                              alt="eCourts captcha"
                              className="max-h-[36px] w-auto object-contain"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">Captcha</span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={refreshPersonalizedCaptcha}
                          title="Refresh captcha"
                          className="h-11 w-11 border-[#d6deeb] text-[#03234b] hover:bg-[#eef4fb]"
                        >
                          <RefreshCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-[#355487]">
                        <span className="text-rose-600">*</span> Enter Captcha
                      </label>
                      <Input
                        value={personalizedCaptchaCode}
                        onChange={(e) =>
                          setPersonalizedCaptchaCode(
                            e.target.value.replace(/[^a-zA-Z0-9]/g, "")
                          )
                        }
                        placeholder="Enter Captcha"
                        className="h-11 border-[#d6deeb]"
                        maxLength={6}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    type="button"
                    onClick={() => submitPersonalizedForListing("civ")}
                    disabled={
                      personalizedLoading ||
                      !personalizedCaptchaSessionId ||
                      !personalizedCaptchaCode ||
                      !personalizedSelectedCourtOptionValue
                    }
                    className="h-11 min-w-[120px] bg-[#03234b] text-white hover:bg-[#042d5e]"
                  >
                    {personalizedLoading ? "Loading..." : "Civil"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => submitPersonalizedForListing("cri")}
                    disabled={
                      personalizedLoading ||
                      !personalizedCaptchaSessionId ||
                      !personalizedCaptchaCode ||
                      !personalizedSelectedCourtOptionValue
                    }
                    className="h-11 min-w-[120px] bg-[#03234b] text-white hover:bg-[#042d5e]"
                  >
                    {personalizedLoading ? "Loading..." : "Criminal"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="text-sm text-[#4f5f77]">
              Sources:{" "}
              {(personalizedResult?.personalized_sources || []).length
                ? personalizedResult.personalized_sources
                    .map((source) =>
                      source === "delhi_high_court" ? "Delhi High Court" : "District Courts"
                    )
                    .join(", ")
                : "No source loaded yet"}
            </div>
            <div className="flex w-full max-w-md items-center gap-2">
              <Input
                value={personalizedTableFilter}
                onChange={(e) => setPersonalizedTableFilter(e.target.value)}
                placeholder="Search your cause list..."
                className="h-10 border-[#d6deeb]"
              />
              <Button
                type="button"
                size="icon"
                className="h-10 w-10 bg-[#03234b] text-white hover:bg-[#042d5e]"
                aria-label="Search personalized cause list"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {personalizedError ? (
            <div className="px-4 pb-4 text-sm text-rose-700">{personalizedError}</div>
          ) : null}

          {!personalizedError && personalizedResult?.message ? (
            <div className="px-4 pb-4 text-sm text-amber-700">
              {personalizedResult.message}
            </div>
          ) : null}

          <div className="overflow-x-auto px-4 pb-5">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="bg-[#26364d] px-3 py-3 text-left font-semibold text-white">
                    Sr No
                  </th>
                  <th className="bg-[#1e3a5f] px-3 py-3 text-left font-semibold text-white">
                    Hearing Date
                  </th>
                  <th className="bg-[#1f4d3a] px-3 py-3 text-left font-semibold text-white">
                    Case
                  </th>
                  <th className="bg-[#7a3320] px-3 py-3 text-left font-semibold text-white">
                    Court
                  </th>
                  <th className="bg-[#3b2670] px-3 py-3 text-left font-semibold text-white">
                    Judge / Stage
                  </th>
                  <th className="bg-[#5a2d20] px-3 py-3 text-left font-semibold text-white">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {personalizedLoading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                      Loading your personalized cause list...
                    </td>
                  </tr>
                ) : filteredPersonalizedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                      No personalized cause list entries found for this date.
                    </td>
                  </tr>
                ) : (
                  filteredPersonalizedEntries.map((entry, idx) => (
                    <tr
                      key={`${entry.case_id}-${entry.case_number}-${idx}`}
                      className="border-b border-[#d6deeb] align-top hover:bg-[#f6f9fc]"
                    >
                      <td className="px-3 py-3 text-[#20324a]">
                        {entry.serial || idx + 1}
                      </td>
                      <td className="px-3 py-3 text-[#20324a]">
                        <div className="font-medium">
                          {toDisplayDate(
                            entry.scheduled_hearing_date || entry.next_hearing_date || selectedDate
                          ) || "—"}
                        </div>
                        {entry.next_hearing_date &&
                        entry.next_hearing_date !== entry.scheduled_hearing_date ? (
                          <div className="mt-1 text-xs text-[#6b7a90]">
                            Cause list date: {entry.next_hearing_date}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-[#20324a]">
                          {entry.case_title || entry.case_number || "—"}
                        </div>
                        <div className="mt-1 text-xs text-[#4f5f77]">
                          {entry.case_number || "No case number"}
                        </div>
                        {entry.party ? (
                          <div className="mt-2 text-xs text-[#6b7a90]">{entry.party}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-[#20324a]">
                        <div className="font-medium">{entry.court_name || "—"}</div>
                        <div className="mt-1 text-xs text-[#6b7a90]">
                          {[entry.court_state, entry.district].filter(Boolean).join(" / ") || "—"}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[#20324a]">
                        <div>{entry.judge_name || "—"}</div>
                        {entry.stage ? (
                          <div className="mt-1 text-xs text-[#6b7a90]">Stage: {entry.stage}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-[#20324a]">
                        <div>{entry.source_label || "—"}</div>
                        {entry.target_label ? (
                          <div className="mt-1 text-xs text-[#6b7a90]">
                            Target: {entry.target_label}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-[#d6deeb] shadow-sm">
        <CardContent className="p-0">
          <div className="border-b border-[#d6deeb] bg-[#eef4fb] px-4 py-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#03234b]">
                  High Court Display Board
                </h2>
                <p className="mt-1 text-sm text-[#355487]">
                  View the live board directly from supported high court websites for
                  states mapped from your tracked cases.
                </p>
              </div>
              <div className="text-sm text-[#355487]">
                {formatMinutesAgo(displayBoardLastRefreshedAt)}
              </div>
            </div>
          </div>

          <div className="border-b border-[#d6deeb] bg-white px-4 py-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-end">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#355487]">
                  Select State
                </label>
                <select
                  value={displayBoardSelectedStateCode}
                  onChange={(e) => loadHighCourtDisplayBoard(e.target.value)}
                  disabled={displayBoardLoading || displayBoardStates.length === 0}
                  className="h-11 w-full rounded-md border border-[#d6deeb] bg-white px-3 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03234b]"
                >
                  <option value="">
                    {displayBoardStates.length
                      ? "Select State"
                      : displayBoardLoading
                        ? "Loading states..."
                        : "No states available"}
                  </option>
                  {displayBoardStates.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadHighCourtDisplayBoard(displayBoardSelectedStateCode)}
                  disabled={displayBoardLoading || !displayBoardSelectedStateCode}
                  className="h-11 border-[#d6deeb] text-[#03234b] hover:bg-[#eef4fb]"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {displayBoardLoading ? "Refreshing..." : "Refresh"}
                </Button>
                <div className="text-sm text-[#355487]">
                  Auto refresh in {formatCountdown(displayBoardCountdownMs)}
                </div>
                {displayBoardSelectedState?.officialSiteUrl ? (
                  <a
                    href={displayBoardSelectedState.officialSiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center rounded-md border border-[#d6deeb] px-4 text-sm font-medium text-[#03234b] hover:bg-[#eef4fb]"
                  >
                    Open Official Site
                  </a>
                ) : null}
              </div>
            </div>

            {displayBoardSelectedState ? (
              <div className="mt-4 text-sm text-[#4f5f77]">
                <span className="font-medium text-[#20324a]">
                  {displayBoardSelectedState.highCourtName || displayBoardSelectedState.name}
                </span>
                {displayBoardSelectedState.benchName &&
                displayBoardSelectedState.benchName !==
                  displayBoardSelectedState.highCourtName
                  ? ` • Bench: ${displayBoardSelectedState.benchName}`
                  : ""}
                {displayBoardSelectedState.sourceCaseCount
                  ? ` • ${displayBoardSelectedState.sourceCaseCount} tracked case${
                      displayBoardSelectedState.sourceCaseCount === 1 ? "" : "s"
                    } in this state`
                  : ""}
              </div>
            ) : null}

            {displayBoardError ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {displayBoardError}
              </div>
            ) : null}
          </div>

          <div className="bg-[#f8fbff] px-4 py-4">
            {displayBoardEmbedHtml ? (
              <div className="overflow-hidden rounded-xl border border-[#d6deeb] bg-white">
                <iframe
                  key={`${displayBoardSelectedState?.code || "display-board"}-${displayBoardFrameNonce}`}
                  srcDoc={displayBoardEmbedHtml}
                  title="High court display board"
                  className="h-[720px] w-full bg-white"
                  sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#c7d4e4] bg-white px-4 py-10 text-center text-sm text-[#4f5f77]">
                {displayBoardSelectedState
                  ? "The live board could not be rendered here. Use Open Official Site to view it directly on the court portal."
                  : "Select a state linked to your cases to load its live high court board."}
              </div>
            )}

            <p className="mt-3 text-xs text-[#6b7a90]">
              District-court display boards are not included here. If the live board does
              not render inside this page, use <span className="font-medium">Open Official Site</span> to view it directly on the high court portal.
            </p>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <Card className="overflow-hidden border-[#d6deeb] shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-[#d6deeb] bg-[#eef4fb] px-4 py-3 text-center">
              <p className="text-xl font-semibold text-[#03234b] sm:text-2xl">
                {headingComplexName || courtTitle || "Cause List"}
              </p>
              {courtTitle ? (
                <p className="mt-1 text-sm text-[#355487]">In the court of : {courtTitle}</p>
              ) : null}
              <p className="mt-1 text-sm font-semibold text-[#355487]">
                {(result.listingType === "criminal" ? "Criminal" : "Civil")} Cases Listed on{" "}
                {toDisplayDate(result.date || selectedDate)}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">
              <Input
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                placeholder="Search..."
                className="h-10 max-w-xs border-[#d6deeb]"
              />
              <Button
                type="button"
                size="icon"
                className="h-10 w-10 bg-[#03234b] text-white hover:bg-[#042d5e]"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="overflow-x-auto px-4 pb-5">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="bg-[#1e3a5f] px-3 py-3 text-left font-semibold text-white">
                      Sr No
                    </th>
                    <th className="bg-[#1f4d3a] px-3 py-3 text-left font-semibold text-white">
                      Cases
                    </th>
                    <th className="bg-[#7a3320] px-3 py-3 text-left font-semibold text-white">
                      Party Name
                    </th>
                    <th className="bg-[#3b2670] px-3 py-3 text-left font-semibold text-white">
                      Advocate Name
                    </th>
                    <th className="bg-[#5a2d20] px-3 py-3 text-left font-semibold text-white">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                        No cause list entries to display.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry, idx) => (
                      <tr
                        key={`${entry.case_number}-${idx}`}
                        className="border-b border-[#d6deeb] align-top hover:bg-[#f6f9fc]"
                      >
                        <td className="px-3 py-3 text-[#20324a]">
                          {entry.serial || idx + 1}
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-[#20324a]">
                            {entry.case_number || "—"}
                          </div>
                          {entry.next_hearing_date ? (
                            <div className="mt-2 text-xs text-[#4f5f77]">
                              Next hearing date:- {entry.next_hearing_date}
                            </div>
                          ) : null}
                          {entry.stage ? (
                            <div className="mt-1 text-xs text-[#6b7a90]">
                              Stage: {entry.stage}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 whitespace-pre-line text-[#20324a]">
                          {entry.party || "—"}
                        </td>
                        <td className="px-3 py-3 text-[#20324a]">
                          {entry.advocate || "—"}
                        </td>
                        <td className="px-3 py-3 text-[#20324a]">
                          {entry.category || entry.stage || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
