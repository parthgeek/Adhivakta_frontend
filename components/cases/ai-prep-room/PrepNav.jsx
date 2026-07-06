"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PREP_NAV } from "./routes";
import { usePrepCase } from "./PrepCaseContext";

/**
 * Sticky, route-aware navigation shared across all AI Prep Room pages.
 * Preserves the selected case (`?case=`) across navigation.
 */
export default function PrepNav() {
  const pathname = usePathname();
  const { caseId } = usePrepCase();
  const qs = caseId ? `?case=${caseId}` : "";

  return (
    <div className="sticky top-0 z-30 -mx-1 mb-6 border-b border-border/60 bg-background/80 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60" data-tour="ai-feature-tabs">
      <div className="flex flex-1 items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PREP_NAV.map(({ id, label, icon: Icon, href }) => {
          const active =
            href === PREP_NAV[0].href ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={id}
              href={`${href}${qs}`}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              data-tour={`ai-tab-${id}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
