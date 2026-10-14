"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRightLeft, BriefcaseBusiness, CalendarDays, FileText, Loader2, Mail, Phone, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import api from "@/services/api";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

const formatDate = (value, options = {}) => {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
};

const StatCard = ({ icon: Icon, label, value }) => (
  <Card>
    <CardContent className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-semibold text-gray-950">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </CardContent>
  </Card>
);

export default function OrganizationAdvocateProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [targetAdvocateId, setTargetAdvocateId] = useState("");

  const loadProfile = async () => {
    const [profileData, organizationData] = await Promise.all([
      api.organizations.getAdvocateProfile(id),
      api.organizations.getMine(),
    ]);
    setProfile(profileData);
    setOrganization(organizationData);
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== "organization_admin") {
      router.replace("/dashboard");
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const [profileData, organizationData] = await Promise.all([
          api.organizations.getAdvocateProfile(id),
          api.organizations.getMine(),
        ]);
        if (!cancelled) {
          setProfile(profileData);
          setOrganization(organizationData);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Could not load advocate profile",
          description: error.message || "Please try again.",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id, router, user]);

  const activeAdvocates = useMemo(
    () =>
      (organization?.members || []).filter(
        (member) => member.role === "lawyer" && member.status === "active" && member.userId !== id
      ),
    [id, organization?.members]
  );

  const openTransfer = () => {
    setTargetAdvocateId(activeAdvocates[0] ? String(activeAdvocates[0].userId) : "");
    setTransferOpen(true);
  };

  const handleTransfer = async () => {
    if (!targetAdvocateId) {
      toast({
        variant: "destructive",
        title: "Select receiving advocate",
        description: "Choose another active advocate before transferring cases.",
      });
      return;
    }

    try {
      setSaving(true);
      await api.organizations.transferAdvocateCases(id, targetAdvocateId);
      await loadProfile();
      setTransferOpen(false);
      toast({
        title: "Cases transferred",
        description: "Assigned cases are now with the selected advocate.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not transfer cases",
        description: error.message || "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const { advocate, summary, cases, hearings, documents, clients } = profile;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button type="button" variant="ghost" className="-ml-3 mb-2" onClick={() => router.push("/dashboard/organization")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Organization
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-gray-950">{advocate.name || "Unnamed advocate"}</h1>
            <Badge variant={advocate.membershipStatus === "active" ? "secondary" : "outline"}>
              {advocate.membershipStatus}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              {advocate.email}
            </span>
            {advocate.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                {advocate.phone}
              </span>
            )}
          </div>
        </div>
        <Button type="button" onClick={openTransfer} disabled={saving || activeAdvocates.length === 0}>
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Transfer Cases
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BriefcaseBusiness} label="Assigned cases" value={summary.cases} />
        <StatCard icon={CalendarDays} label="Hearings" value={summary.hearings} />
        <StatCard icon={FileText} label="Documents" value={summary.documents} />
        <StatCard icon={Users} label="Clients" value={summary.clients} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Cases</CardTitle>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No assigned cases.
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {cases.map((caseItem) => (
                <button
                  key={caseItem.id}
                  type="button"
                  className="flex w-full flex-col gap-1 p-4 text-left hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                  onClick={() => router.push(`/dashboard/cases/${caseItem.id}`)}
                >
                  <div>
                    <div className="font-medium text-gray-950">{caseItem.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {caseItem.caseNumber} {caseItem.court ? `- ${caseItem.court}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{caseItem.status}</Badge>
                    <span className="text-sm text-muted-foreground">{formatDate(caseItem.nextHearingDate)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hearings</CardTitle>
          </CardHeader>
          <CardContent>
            {hearings.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No hearings found.
              </div>
            ) : (
              <div className="divide-y rounded-lg border">
                {hearings.map((hearing) => (
                  <div key={hearing.id} className="p-4">
                    <div className="font-medium text-gray-950">{hearing.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(hearing.start, { hour: "2-digit", minute: "2-digit" })} - {hearing.case?.title || "No case"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No clients found.
              </div>
            ) : (
              <div className="divide-y rounded-lg border">
                {clients.map((client, index) => (
                  <div key={client.id || client.email || index} className="p-4">
                    <div className="font-medium text-gray-950">{client.name || "Unnamed client"}</div>
                    <div className="text-sm text-muted-foreground">{client.email || client.phone || "No contact details"}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No documents found.
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {documents.map((document) => (
                <div key={document.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium text-gray-950">{document.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {document.case?.title || "No case"} - {formatDate(document.createdAt)}
                    </div>
                  </div>
                  <Badge variant="outline">{document.category}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer advocate cases</DialogTitle>
            <DialogDescription>Choose another active advocate to receive these assigned cases.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="profile-target-advocate">Receiving Advocate</Label>
            <Select value={targetAdvocateId} onValueChange={setTargetAdvocateId} disabled={saving}>
              <SelectTrigger id="profile-target-advocate">
                <SelectValue placeholder="Select advocate" />
              </SelectTrigger>
              <SelectContent>
                {activeAdvocates.map((member) => (
                  <SelectItem key={member.userId} value={String(member.userId)}>
                    {member.name || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTransferOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleTransfer} disabled={saving || !targetAdvocateId}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transfer Cases
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
