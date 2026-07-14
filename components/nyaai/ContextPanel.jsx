"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  ChevronRight,
  FileText,
  Scale,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";

/**
 * NyaAI right-hand context panel: current case, today's hearings, pending
 * reviews, cases needing attention, recent smart reminders.
 */

function Section({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, sublabel, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-2.5 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{label}</p>
        {sublabel && <p className="truncate text-[11px] text-muted-foreground">{sublabel}</p>}
      </div>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function Empty({ children }) {
  return <p className="px-1 text-xs text-muted-foreground">{children}</p>;
}

export default function ContextPanel({ context, className }) {
  const router = useRouter();
  const [digest, setDigest] = useState(null);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, r] = await Promise.all([
          api.nyaai.getDigest(),
          api.nyaai.getReminders(),
        ]);
        if (!cancelled) {
          setDigest(d);
          setReminders(r || []);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const todayHearings = (digest?.todaySchedule || []).filter((e) => e.type === "hearing");

  return (
    <Card className={`space-y-5 overflow-y-auto p-4 ${className || ""}`}>
      {context?.caseId && (
        <Section icon={Scale} title="Current case">
          <Row
            label={context.caseTitle || "Open case"}
            sublabel="Conversation is grounded in this case"
            onClick={() => router.push(`/dashboard/cases/${context.caseId}`)}
          />
        </Section>
      )}

      <Section icon={CalendarClock} title="Today's hearings">
        {todayHearings.length === 0 && <Empty>No hearings today.</Empty>}
        {todayHearings.slice(0, 4).map((h) => (
          <Row
            key={h.id}
            label={h.caseTitle || h.title}
            sublabel={`${format(new Date(h.start), "h:mm a")}${h.location ? ` · ${h.location}` : ""}`}
            onClick={() => (h.caseId ? router.push(`/dashboard/cases/${h.caseId}`) : router.push("/dashboard/hearings"))}
          />
        ))}
      </Section>

      <Section icon={FileText} title="Pending reviews">
        {(digest?.pendingDocuments || []).length === 0 && <Empty>Nothing pending.</Empty>}
        {(digest?.pendingDocuments || []).slice(0, 4).map((d) => (
          <Row
            key={d.id}
            label={d.name}
            sublabel={d.caseTitle}
            onClick={() => (d.caseId ? router.push(`/dashboard/cases/${d.caseId}`) : router.push("/dashboard/documents"))}
          />
        ))}
      </Section>

      <Section icon={AlertTriangle} title="Needs attention">
        {(digest?.casesNeedingAttention || []).length === 0 && <Empty>All cases have hearing dates.</Empty>}
        {(digest?.casesNeedingAttention || []).slice(0, 4).map((c) => (
          <Row
            key={c.id}
            label={c.title}
            sublabel="No next hearing date"
            onClick={() => router.push(`/dashboard/cases/${c.id}`)}
          />
        ))}
      </Section>

      <Section icon={Bell} title="Smart reminders">
        {reminders.length === 0 && <Empty>No reminders right now.</Empty>}
        {reminders.slice(0, 4).map((r) => (
          <Row
            key={r._id}
            label={r.message}
            sublabel={format(new Date(r.createdAt), "d MMM, h:mm a")}
            onClick={() => r.link && router.push(r.link)}
          />
        ))}
      </Section>
    </Card>
  );
}
