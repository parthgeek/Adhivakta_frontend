"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Building2, CheckCircle, Loader2 } from "lucide-react";

import api from "@/services/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function OrganizationInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadInvite = async () => {
      if (!token) {
        setError("Invitation token is missing.");
        setLoading(false);
        return;
      }

      try {
        const data = await api.organizations.getInvite(token);
        if (!cancelled) setInvite(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "This invitation is invalid or expired.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadInvite();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAccept = async () => {
    try {
      setAccepting(true);
      setError("");
      await api.organizations.acceptInvite(token);
      setAccepted(true);
    } catch (err) {
      setError(err.message || "Could not accept invitation.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
            {accepted ? (
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            ) : (
              <Building2 className="h-6 w-6 text-blue-700" />
            )}
          </div>
          <CardTitle>{accepted ? "Invitation Accepted" : "Organization Invite"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading invitation...
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : accepted ? (
            <>
              <p className="text-sm text-muted-foreground">
                You have joined {invite?.organizationName || "the organization"}. Sign in to continue.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/login">Go to Login</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-lg border bg-white p-4">
                <div className="text-sm text-muted-foreground">Organization</div>
                <div className="mt-1 font-medium text-gray-950">{invite?.organizationName}</div>
                <div className="mt-3 text-sm text-muted-foreground">Invited email</div>
                <div className="mt-1 font-medium text-gray-950">{invite?.email}</div>
              </div>
              <Button onClick={handleAccept} disabled={accepting} className="w-full">
                {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accept Invite
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrganizationInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading invitation...
            </CardContent>
          </Card>
        </div>
      }
    >
      <OrganizationInviteContent />
    </Suspense>
  );
}
