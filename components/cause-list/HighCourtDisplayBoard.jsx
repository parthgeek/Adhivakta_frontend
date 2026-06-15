"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCcw } from "lucide-react";
import api from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DISPLAY_BOARD_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

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

const formatHearingDate = (value) => {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function HighCourtDisplayBoard() {
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
  const [personalizedBoardLoading, setPersonalizedBoardLoading] = useState(false);
  const [personalizedBoardError, setPersonalizedBoardError] = useState("");
  const [personalizedBoardResult, setPersonalizedBoardResult] = useState(null);
  const displayBoardRequestIdRef = useRef(0);
  const personalizedBoardRequestIdRef = useRef(0);

  const loadHighCourtDisplayBoard = async (stateCode = "") => {
    const requestId = displayBoardRequestIdRef.current + 1;
    displayBoardRequestIdRef.current = requestId;
    setDisplayBoardLoading(true);
    setDisplayBoardError("");

    try {
      const response = await api.causeList.getHighCourtDisplayBoard(stateCode);
      if (displayBoardRequestIdRef.current !== requestId) {
        return;
      }
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
      if (displayBoardRequestIdRef.current !== requestId) {
        return;
      }
      setDisplayBoardError(
        err?.message || "Unable to load the high court display board right now."
      );
    } finally {
      if (displayBoardRequestIdRef.current === requestId) {
        setDisplayBoardLoading(false);
      }
    }
  };

  const loadPersonalizedHighCourtDisplayBoard = async (stateCode = "") => {
    const requestId = personalizedBoardRequestIdRef.current + 1;
    personalizedBoardRequestIdRef.current = requestId;
    setPersonalizedBoardLoading(true);
    setPersonalizedBoardError("");
    setPersonalizedBoardResult(null);

    try {
      const response = await api.causeList.getPersonalizedHighCourtDisplayBoard(stateCode);
      if (personalizedBoardRequestIdRef.current !== requestId) {
        return;
      }
      setPersonalizedBoardResult(response || null);

      if (response?.message) {
        setPersonalizedBoardError(response.message);
      }
    } catch (err) {
      if (personalizedBoardRequestIdRef.current !== requestId) {
        return;
      }
      setPersonalizedBoardError(
        err?.message ||
          "Unable to load the personalized high court display board right now."
      );
    } finally {
      if (personalizedBoardRequestIdRef.current === requestId) {
        setPersonalizedBoardLoading(false);
      }
    }
  };

  useEffect(() => {
    loadHighCourtDisplayBoard();
  }, []);

  useEffect(() => {
    loadPersonalizedHighCourtDisplayBoard(displayBoardSelectedState?.code || "");
  }, [displayBoardSelectedState?.code, displayBoardFrameNonce]);

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

  const displayBoardEmbedHtml = displayBoardSelectedState?.embedHtml || "";
  const personalizedSelectedState =
    personalizedBoardResult?.selectedState || displayBoardSelectedState || null;
  const personalizedCourtHalls = personalizedBoardResult?.courtHalls || [];

  return (
    <div className="space-y-6">
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
                      {[
                        state.name,
                        state.sourceCaseCount
                          ? `${state.sourceCaseCount} case${
                              state.sourceCaseCount === 1 ? "" : "s"
                            }`
                          : "",
                        state.nextHearingDate
                          ? `next hearing ${formatHearingDate(state.nextHearingDate)}`
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" • ")}
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
              District-court display boards are not included here. If the live board
              does not render inside this page, use{" "}
              <span className="font-medium">Open Official Site</span> to view it
              directly on the high court portal.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-[#d6deeb] shadow-sm">
        <CardContent className="p-0">
          <div className="border-b border-[#d6deeb] bg-[#eef4fb] px-4 py-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#03234b]">
                  Personalised Display Board
                </h2>
                <p className="mt-1 text-sm text-[#355487]">
                  View only your tracked cases and court halls for the selected high
                  court board.
                </p>
              </div>
              <div className="text-sm text-[#355487]">
                {personalizedBoardLoading ? "Refreshing..." : "Synced to selected state"}
              </div>
            </div>
          </div>

          <div className="bg-white px-4 py-4">
            {personalizedSelectedState ? (
              <div className="mb-4 text-sm text-[#4f5f77]">
                <span className="font-medium text-[#20324a]">
                  {personalizedSelectedState.highCourtName ||
                    personalizedSelectedState.name}
                </span>
                {personalizedSelectedState.nextHearingDate
                  ? ` • Next hearing ${formatHearingDate(
                      personalizedSelectedState.nextHearingDate
                    )}`
                  : ""}
                {personalizedBoardResult?.totalCourtHalls
                  ? ` • ${personalizedBoardResult.totalCourtHalls} court hall${
                      personalizedBoardResult.totalCourtHalls === 1 ? "" : "s"
                    }`
                  : ""}
                {personalizedBoardResult?.totalCases
                  ? ` • ${personalizedBoardResult.totalCases} tracked case${
                      personalizedBoardResult.totalCases === 1 ? "" : "s"
                    }`
                  : ""}
              </div>
            ) : null}

            {personalizedBoardError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {personalizedBoardError}
              </div>
            ) : null}

            {!displayBoardSelectedState ? (
              <div className="rounded-xl border border-dashed border-[#c7d4e4] bg-[#f8fbff] px-4 py-10 text-center text-sm text-[#4f5f77]">
                Select a state above to load your personalised display board.
              </div>
            ) : personalizedCourtHalls.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#c7d4e4] bg-[#f8fbff] px-4 py-10 text-center text-sm text-[#4f5f77]">
                {personalizedBoardLoading
                  ? "Loading your personalised display board..."
                  : "No tracked court halls found for your cases in this state."}
              </div>
            ) : (
              <div className="space-y-4">
                {personalizedCourtHalls.map((group) => (
                  <div
                    key={group.courtHall}
                    className="rounded-xl border border-[#d6deeb] bg-[#f8fbff] p-4"
                  >
                    <div className="flex flex-col gap-1 border-b border-[#d6deeb] pb-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#03234b]">
                          Court Hall {group.courtHall}
                        </h3>
                        <p className="mt-1 text-sm text-[#4f5f77]">
                          {group.courtName || "Court name unavailable"}
                        </p>
                        {group.judgeName ? (
                          <p className="mt-1 text-sm text-[#4f5f77]">
                            Judge: {group.judgeName}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-sm font-medium text-[#355487]">
                        {group.totalCases} case{group.totalCases === 1 ? "" : "s"}
                      </div>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      {group.embedHtml ? (
                        <div className="overflow-hidden rounded-xl border border-[#d6deeb] bg-white">
                          <iframe
                            key={`personalized-${group.courtHall}-${displayBoardFrameNonce}`}
                            srcDoc={group.embedHtml}
                            title={`Personalized display board for court hall ${group.courtHall}`}
                            className="h-[420px] w-full bg-white"
                            sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                          />
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-[#c7d4e4] bg-white px-4 py-8 text-center text-sm text-[#4f5f77]">
                          Live court-hall display board is unavailable right now for this hall.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
