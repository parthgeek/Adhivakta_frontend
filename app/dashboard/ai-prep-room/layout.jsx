"use client";

import { Suspense } from "react";
import PrepNav from "@/components/cases/ai-prep-room/PrepNav";
import CasePicker from "@/components/cases/ai-prep-room/CasePicker";
import CaseSwitcher from "@/components/cases/ai-prep-room/CaseSwitcher";
import {
  PrepCaseProvider,
  usePrepCase,
} from "@/components/cases/ai-prep-room/PrepCaseContext";

/**
 * Shared chrome for every AI Prep Room page.
 *
 * Case-first: until a case is selected, the whole room shows the case picker.
 * Once a case is chosen (URL `?case=<id>`), the sticky nav, case switcher, and
 * feature pages render — all scoped to that case.
 */
function PrepShell({ children }) {
  const { caseId } = usePrepCase();

  if (!caseId) {
    return <CasePicker />;
  }

  return (
    <>
      <PrepNav />
      <CaseSwitcher />
      {children}
    </>
  );
}

export default function AIPrepRoomLayout({ children }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-muted" />}>
        <PrepCaseProvider>
          <PrepShell>{children}</PrepShell>
        </PrepCaseProvider>
      </Suspense>
    </div>
  );
}
