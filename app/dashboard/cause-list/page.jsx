"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CauseListPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/cases");
  }, [router]);

  return null;
}
