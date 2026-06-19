"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCcw } from "lucide-react";
import api from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

const normalizeCaseReference = (value = "") =>
  String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const getComparableSerialNumber = (value = "") => {
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : null;
};

const isSerialHeader = (value = "") =>
  /^(?:LIVE\s+)?(?:SL|SR|SERIAL|ITEM)\.?(?:\s*NO\.?)?$/i.test(
    String(value).trim().replace(/\s+/g, " ")
  );

const getLiveSerialsByCase = (embedHtml = "", cases = []) => {
  const result = {
    byCaseId: new Map(),
    hallSerial: "",
  };

  if (!embedHtml || typeof DOMParser === "undefined") {
    return result;
  }

  try {
    const document = new DOMParser().parseFromString(embedHtml, "text/html");
    const caseRows = [];

    document.querySelectorAll("table").forEach((table) => {
      const headers = Array.from(table.querySelectorAll("thead th")).map((cell) =>
        cell.textContent?.trim().replace(/\s+/g, " ")
      );
      const serialIndex = headers.findIndex(isSerialHeader);

      if (serialIndex < 0) {
        return;
      }

      table.querySelectorAll("tbody tr").forEach((row) => {
        const cells = Array.from(row.querySelectorAll("td")).map((cell) =>
          cell.textContent?.trim().replace(/\s+/g, " ")
        );
        const liveSerial = cells[serialIndex] || "";

        if (liveSerial && liveSerial !== "-") {
          caseRows.push({
            comparableText: normalizeCaseReference(cells.join(" ")),
            liveSerial,
          });
        }
      });
    });

    if (caseRows.length === 1) {
      result.hallSerial = caseRows[0].liveSerial;
    }

    (Array.isArray(cases) ? cases : []).forEach((caseItem) => {
      const references = [caseItem.caseNumber, caseItem.cnrNumber]
        .map(normalizeCaseReference)
        .filter(Boolean);
      const matchedRow = caseRows.find((row) =>
        references.some((reference) => row.comparableText.includes(reference))
      );

      if (matchedRow && caseItem.id) {
        result.byCaseId.set(caseItem.id, matchedRow.liveSerial);
      }
    });
  } catch {
    // The official board remains visible when its HTML cannot be parsed.
  }

  return result;
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
  const [canParseDisplayBoardHtml, setCanParseDisplayBoardHtml] = useState(false);
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
    setCanParseDisplayBoardHtml(true);
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
        </CardContent>
      </Card>

      <Accordion
        type="multiple"
        defaultValue={["personalized-display-board", "overall-display-board"]}
        className="space-y-6"
      >
        <Card className="overflow-hidden border-[#d6deeb] shadow-sm">
          <AccordionItem value="personalized-display-board" className="border-b-0">
            <AccordionTrigger className="bg-[#eef4fb] px-4 py-4 text-left hover:no-underline">
              <div className="flex w-full flex-col gap-2 pr-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#03234b]">
                    Personalised Display Board
                  </h2>
                  <p className="mt-1 text-sm font-normal text-[#355487]">
                    View only your tracked cases and court halls for the selected high
                    court board.
                  </p>
                </div>
                <div className="text-sm font-normal text-[#355487]">
                  {personalizedBoardLoading ? "Refreshing..." : "Synced to selected state"}
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="bg-white px-4 py-4">
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
                  {personalizedCourtHalls.map((group) => {
                    const liveSerials = getLiveSerialsByCase(
                      canParseDisplayBoardHtml ? group.embedHtml : "",
                      group.cases
                    );

                    return (
                      <div
                        key={group.courtHall}
                        className="overflow-hidden rounded-xl border border-[#d6deeb] bg-white"
                      >
                        <div className="border-b border-[#d6deeb] bg-[#f8fbff] p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold text-[#03234b]">
                                  Court Hall {group.courtHall}
                                </h3>
                                <span className="rounded-full border border-[#bfd0e4] bg-white px-2.5 py-1 text-xs font-semibold text-[#355487]">
                                  {group.totalCases} tracked case
                                  {group.totalCases === 1 ? "" : "s"}
                                </span>
                              </div>
                              <p className="mt-1 text-sm font-medium text-[#20324a]">
                                {group.courtName || "Court name unavailable"}
                              </p>
                              {group.judgeName ? (
                                <p className="mt-1 text-sm text-[#4f5f77]">
                                  Judge: {group.judgeName}
                                </p>
                              ) : null}
                            </div>
                            <div className="text-xs text-[#6b7a90] sm:max-w-[260px] sm:text-right">
                              Your serial comes from the Personalised Cause List. Live
                              serial is read from the current court board.
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[680px] border-collapse text-left">
                            <thead>
                              <tr className="border-b border-[#d6deeb] bg-white text-xs uppercase tracking-[0.08em] text-[#5d6d83]">
                                <th className="px-4 py-3 font-semibold">Case</th>
                                <th className="px-4 py-3 font-semibold">Court</th>
                                <th className="px-4 py-3 font-semibold">Your serial</th>
                                <th className="px-4 py-3 font-semibold">Live serial</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e3e9f1]">
                              {(group.cases || []).map((caseItem) => {
                                const liveSerial =
                                  liveSerials.byCaseId.get(caseItem.id) ||
                                  ((group.cases || []).length === 1
                                    ? liveSerials.hallSerial
                                    : "");
                                const userSerialNumber = getComparableSerialNumber(
                                  caseItem.serial
                                );
                                const liveSerialNumber =
                                  getComparableSerialNumber(liveSerial);
                                const hasComparableSerials =
                                  userSerialNumber !== null &&
                                  liveSerialNumber !== null;
                                const userSerialHasPassed =
                                  hasComparableSerials &&
                                  userSerialNumber < liveSerialNumber;
                                const userSerialClassName = hasComparableSerials
                                  ? userSerialHasPassed
                                    ? "border border-[#f2b8b5] bg-[#fcebea] text-[#a32929]"
                                    : "border border-[#b8ddc8] bg-[#e9f7ef] text-[#176b43]"
                                  : "bg-[#e8f0fa] text-[#03234b]";

                                return (
                                  <tr key={caseItem.id || caseItem.caseNumber}>
                                    <td className="px-4 py-3">
                                      <div className="font-semibold text-[#20324a]">
                                        {caseItem.caseNumber ||
                                          caseItem.cnrNumber ||
                                          caseItem.title ||
                                          "Tracked case"}
                                      </div>
                                      {caseItem.title &&
                                      caseItem.title !== caseItem.caseNumber ? (
                                        <div className="mt-1 text-xs text-[#6b7a90]">
                                          {caseItem.title}
                                        </div>
                                      ) : null}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#4f5f77]">
                                      Hall {caseItem.courtHall || group.courtHall}
                                    </td>
                                    <td className="px-4 py-3">
                                      {caseItem.serial ? (
                                        <div>
                                          <span
                                            className={`inline-flex min-w-10 justify-center rounded-md px-2.5 py-1 font-mono text-sm font-bold ${userSerialClassName}`}
                                            title={
                                              hasComparableSerials
                                                ? userSerialHasPassed
                                                  ? "Your case serial has already passed the live serial."
                                                  : "Your case serial is current or upcoming."
                                                : "Live serial comparison is unavailable."
                                            }
                                          >
                                            {caseItem.serial}
                                          </span>
                                          {caseItem.serialDate ? (
                                            <div className="mt-1 text-[11px] text-[#7a8799]">
                                              List date:{" "}
                                              {formatHearingDate(caseItem.serialDate)}
                                            </div>
                                          ) : null}
                                        </div>
                                      ) : (
                                        <span className="text-xs text-[#7a8799]">
                                          Not in personalised cause list
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      {liveSerial ? (
                                        <span className="inline-flex min-w-10 justify-center rounded-md bg-[#e9f7ef] px-2.5 py-1 font-mono text-sm font-bold text-[#176b43]">
                                          {liveSerial}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-[#7a8799]">
                                          Awaiting live board
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="border-t border-[#d6deeb] bg-[#f8fbff] p-3">
                          {group.embedHtml ? (
                            <div className="overflow-hidden rounded-lg border border-[#d6deeb] bg-white">
                              <div className="border-b border-[#d6deeb] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#5d6d83]">
                                Live court board
                              </div>
                              <iframe
                                key={`personalized-${group.courtHall}-${displayBoardFrameNonce}`}
                                srcDoc={group.embedHtml}
                                title={`Personalized display board for court hall ${group.courtHall}`}
                                className="h-[420px] w-full bg-white"
                                sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                              />
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed border-[#c7d4e4] bg-white px-4 py-8 text-center text-sm text-[#4f5f77]">
                              Live court-hall display board is unavailable right now for
                              this hall.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Card>

        <Card className="overflow-hidden border-[#d6deeb] shadow-sm">
          <AccordionItem value="overall-display-board" className="border-b-0">
            <AccordionTrigger className="bg-[#eef4fb] px-4 py-4 text-left hover:no-underline">
              <div className="flex w-full flex-col gap-2 pr-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#03234b]">
                    High Court Display Board
                  </h2>
                  <p className="mt-1 text-sm font-normal text-[#355487]">
                    View the live board directly from supported high court websites for
                    states mapped from your tracked cases.
                  </p>
                </div>
                <div className="text-sm font-normal text-[#355487]">
                  {formatMinutesAgo(displayBoardLastRefreshedAt)}
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="bg-[#f8fbff] px-4 py-4">
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
            </AccordionContent>
          </AccordionItem>
        </Card>
      </Accordion>
    </div>
  );
}
