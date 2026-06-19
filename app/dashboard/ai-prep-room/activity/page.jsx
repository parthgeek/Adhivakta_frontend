"use client";

import { History } from "lucide-react";
import ActivityTimeline from "@/components/cases/ai-prep-room/ActivityTimeline";
import {
  SectionShell,
  SectionLoading,
  SectionError,
} from "@/components/cases/ai-prep-room/shared";
import { useAIPrepRoom } from "@/components/cases/ai-prep-room/useAIPrepRoom";

export default function ActivityTimelinePage() {
  const { status, data, error, reload } = useAIPrepRoom({});

  return (
    <SectionShell
      icon={History}
      title="Activity Timeline"
      description="A history of everything the AI has done on this case."
    >
      {status === "error" ? (
        <SectionError message={error} onRetry={reload} />
      ) : status === "loading" || !data ? (
        <SectionLoading />
      ) : (
        <ActivityTimeline activity={data.activity} />
      )}
    </SectionShell>
  );
}
