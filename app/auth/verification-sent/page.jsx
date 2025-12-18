import React, { Suspense } from "react";
import VerificationSentClient from "../../../components/auth/VerificationSentClient";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    }>
      <VerificationSentClient />
    </Suspense>
  );
}
