"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import AIPrepRoom from "@/components/cases/ai-prep-room";

/**
 * AI Prep Room — case-scoped route.
 *
 * Lives under the Case Details page at /dashboard/cases/:id/prep. Today it
 * renders on mock data; pass the real `caseData` (once fetched) to seed the
 * header. To embed inside the existing tabs instead, drop <AIPrepRoom /> into
 * a new <TabsContent value="prep"> in components/cases/CaseTabs.jsx.
 */
export default function CasePrepRoomPage() {
  const { id } = useParams();
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/dashboard/cases/${id}`)}
        className="mb-4 -ml-2 gap-1.5 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to case
      </Button>

      <AIPrepRoom caseId={id} />
    </div>
  );
}
