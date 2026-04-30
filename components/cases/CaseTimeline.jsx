"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PALETTE = [
  "bg-indigo-600",
  "bg-purple-600",
  "bg-pink-600",
  "bg-rose-600",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
];

const formatDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

const yearOf = (d) => {
  if (!d) return "";
  try {
    return String(new Date(d).getFullYear());
  } catch {
    return "";
  }
};

const buildEvents = (caseData = {}) => {
  const items = [];

  if (caseData.filingDate) {
    items.push({
      key: "filing",
      date: caseData.filingDate,
      title: "Case Filed",
      description: `Filing No. ${caseData.caseNumber || "—"}`,
    });
  }

  (caseData.events || []).forEach((ev, idx) => {
    if (!ev?.start) return;
    items.push({
      key: `event-${ev._id || idx}`,
      date: ev.start,
      title: ev.title || ev.type?.replace(/_/g, " ") || "Event",
      description:
        ev.status && ev.status !== "scheduled"
          ? `${ev.type?.replace(/_/g, " ") || ""} · ${ev.status}`
          : ev.type?.replace(/_/g, " ") || "",
    });
  });

  (caseData.transferHistory || []).forEach((t, idx) => {
    if (!t?.transferDate) return;
    items.push({
      key: `transfer-${t._id || idx}`,
      date: t.transferDate,
      title: "Case Transferred",
      description: `${t.fromCourt || "—"} → ${t.toCourt || "—"}`,
    });
  });

  if (caseData.closedAt) {
    items.push({
      key: "closed",
      date: caseData.closedAt,
      title: "Case Closed",
      description: "",
    });
  }

  return items.sort((a, b) => new Date(a.date) - new Date(b.date));
};

export default function CaseTimeline({ caseData }) {
  const events = useMemo(() => buildEvents(caseData), [caseData]);

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Case Timeline</CardTitle>
          <CardDescription>No events yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Timeline</CardTitle>
        <CardDescription>
          Key events from filing to current status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative py-4">
          {/* Center vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-border" />

          <ul className="space-y-6">
            {events.map((ev, idx) => {
              const left = idx % 2 === 0;
              const color = PALETTE[idx % PALETTE.length];
              return (
                <li
                  key={ev.key}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"
                >
                  {/* Left text */}
                  <div className={left ? "text-right pr-2" : ""}>
                    {left && (
                      <>
                        <p className="text-sm font-semibold">{ev.title}</p>
                        {ev.description && (
                          <p className="text-xs text-muted-foreground">
                            {ev.description}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(ev.date)}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Center circle */}
                  <div
                    className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full text-white text-xs font-bold shadow ${color}`}
                  >
                    {yearOf(ev.date)}
                  </div>

                  {/* Right text */}
                  <div className={!left ? "text-left pl-2" : ""}>
                    {!left && (
                      <>
                        <p className="text-sm font-semibold">{ev.title}</p>
                        {ev.description && (
                          <p className="text-xs text-muted-foreground">
                            {ev.description}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(ev.date)}
                        </p>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
