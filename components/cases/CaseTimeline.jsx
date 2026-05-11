"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

function EventText({ ev, align }) {
  return (
    <div className={align === "right" ? "text-right pr-3" : "text-left pl-3"}>
      <p className="text-[11px] font-semibold leading-tight text-foreground">{ev.title}</p>
      {ev.description && (
        <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground line-clamp-2">
          {ev.description}
        </p>
      )}
      <p className="mt-0.5 text-[9px] font-medium text-muted-foreground/70">
        {formatDate(ev.date)}
      </p>
    </div>
  );
}

export default function CaseTimeline({ caseData }) {
  const events = useMemo(() => buildEvents(caseData), [caseData]);
  const [open, setOpen] = useState(true);

  return (
    <Card>
      <CardHeader
        className="pb-2 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Case Timeline</CardTitle>
            {open && (
              <CardDescription className="text-xs mt-0.5">
                {events.length === 0
                  ? "No events yet."
                  : "Key events from filing to current status."}
              </CardDescription>
            )}
          </div>
          <ChevronDown
            className="h-4 w-4 text-muted-foreground transition-transform duration-200"
            style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
          />
        </div>
      </CardHeader>

      {open && events.length > 0 && (
        <CardContent className="pt-0">
          <div className="relative py-2">
            <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-border" />
            <ul className="space-y-4">
              {events.map((ev, idx) => {
                const left = idx % 2 === 0;
                return (
                  <li
                    key={ev.key}
                    className="grid grid-cols-[1fr_auto_1fr] items-center"
                  >
                    {left ? <EventText ev={ev} align="right" /> : <div />}
                    <div
                      className="relative z-10 h-3 w-3 rounded-full ring-2 ring-white"
                      style={{ backgroundColor: "#03234b" }}
                    />
                    {!left ? <EventText ev={ev} align="left" /> : <div />}
                  </li>
                );
              })}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
