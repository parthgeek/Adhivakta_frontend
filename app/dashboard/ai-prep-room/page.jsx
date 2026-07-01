"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, History, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import AIActionGrid from "@/components/cases/ai-prep-room/AIActionGrid";
import ActivityTimeline from "@/components/cases/ai-prep-room/ActivityTimeline";
import { SectionShell, SectionError } from "@/components/cases/ai-prep-room/shared";
import { useAIPrepRoom } from "@/components/cases/ai-prep-room/useAIPrepRoom";
import { ACTION_ROUTES, BASE } from "@/components/cases/ai-prep-room/routes";

/** AI Prep Room — overview hub. Action cards route to dedicated feature pages. */
export default function AIPrepRoomHubPage() {
  const router = useRouter();
  const { status, data, error, reload, caseId } = useAIPrepRoom({});
  const qs = caseId ? `?case=${caseId}` : "";

  const handleAction = (id) => {
    const href = ACTION_ROUTES[id];
    if (href) router.push(`${href}${qs}`);
  };

  if (status === "error") {
    return <SectionError message={error} onRetry={reload} />;
  }

  if (status === "loading" || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <SectionShell
        icon={LayoutGrid}
        title="What do you want to do?"
        description="Pick a workflow — every answer is grounded in this case's file."
      >
        <AIActionGrid onAction={handleAction} />
      </SectionShell>

      {data.activity.length > 0 && (
        <SectionShell
          icon={History}
          title="Recent Activity"
          description="The latest things the AI has done on this case."
          action={
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => router.push(`${BASE}/activity${qs}`)}
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          }
        >
          <ActivityTimeline activity={data.activity.slice(0, 3)} />
        </SectionShell>
      )}
    </div>
  );
}
