"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, MailPlus, Trash2, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import api from "@/services/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

export default function OrganizationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [organization, setOrganization] = useState(null);
  const [email, setEmail] = useState("");
  const [accountForm, setAccountForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "organization_admin") {
      router.replace("/dashboard");
      return;
    }

    let cancelled = false;
    const loadOrganization = async () => {
      try {
        setLoading(true);
        const data = await api.organizations.getMine();
        if (!cancelled) setOrganization(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Could not load organization",
          description: error.message || "Please try again.",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOrganization();
    return () => {
      cancelled = true;
    };
  }, [router, user]);

  const activeAdvocates = useMemo(
    () =>
      (organization?.members || []).filter(
        (member) => member.role === "lawyer" && member.status === "active"
      ),
    [organization?.members]
  );

  const removedAdvocates = useMemo(
    () =>
      (organization?.members || []).filter(
        (member) => member.role === "lawyer" && member.status === "removed"
      ),
    [organization?.members]
  );

  const pendingInvites = organization?.pendingInvites || [];

  const handleAddAdvocate = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;

    try {
      setSaving(true);
      const data = await api.organizations.inviteAdvocate(email.trim());
      setOrganization(data);
      setEmail("");
      toast({
        title: "Invite sent",
        description: "The advocate will be added after accepting the invitation.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not send invite",
        description: error.message || "Please check the email and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAccountFormChange = (event) => {
    const { name, value } = event.target;
    setAccountForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAdvocateAccount = async (event) => {
    event.preventDefault();

    if (!accountForm.name.trim() || !accountForm.email.trim() || !accountForm.password) {
      toast({
        variant: "destructive",
        title: "Missing details",
        description: "Name, email, and temporary password are required.",
      });
      return;
    }

    try {
      setSaving(true);
      const data = await api.organizations.createAdvocateAccount({
        name: accountForm.name.trim(),
        email: accountForm.email.trim(),
        phone: accountForm.phone.trim(),
        password: accountForm.password,
      });
      setOrganization(data);
      setAccountForm({ name: "", email: "", phone: "", password: "" });
      toast({
        title: "Account created",
        description: "An invite with temporary login details has been sent.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not create account",
        description: error.message || "Please check the details and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAdvocate = async (userId) => {
    try {
      setSaving(true);
      const data = await api.organizations.removeAdvocate(userId);
      setOrganization(data);
      toast({
        title: "Advocate removed",
        description: "Their data is no longer included in this organization dashboard.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not remove advocate",
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

  if (!organization) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Building2 className="h-4 w-4" />
            Organization
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">{organization.name}</h1>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
            <Users className="h-3.5 w-3.5" />
            {activeAdvocates.length} active advocate{activeAdvocates.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
            <MailPlus className="h-3.5 w-3.5" />
            {pendingInvites.length} pending invite{pendingInvites.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Advocate</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAdvocate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="advocate-email">Existing Advocate Email</Label>
                <Input
                  id="advocate-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="advocate@example.com"
                  disabled={saving}
                />
              </div>
              <Button type="submit" disabled={saving || !email.trim()} className="w-full sm:w-auto">
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MailPlus className="mr-2 h-4 w-4" />
                )}
                Send Invite
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Advocate Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdvocateAccount} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-advocate-name">Full Name</Label>
                  <Input
                    id="new-advocate-name"
                    name="name"
                    value={accountForm.name}
                    onChange={handleAccountFormChange}
                    placeholder="Advocate name"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-advocate-email">Email</Label>
                  <Input
                    id="new-advocate-email"
                    name="email"
                    type="email"
                    value={accountForm.email}
                    onChange={handleAccountFormChange}
                    placeholder="advocate@example.com"
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-advocate-phone">Phone</Label>
                  <Input
                    id="new-advocate-phone"
                    name="phone"
                    value={accountForm.phone}
                    onChange={handleAccountFormChange}
                    placeholder="Optional"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-advocate-password">Temporary Password</Label>
                  <Input
                    id="new-advocate-password"
                    name="password"
                    type="password"
                    value={accountForm.password}
                    onChange={handleAccountFormChange}
                    placeholder="At least 6 characters"
                    disabled={saving}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={
                  saving ||
                  !accountForm.name.trim() ||
                  !accountForm.email.trim() ||
                  accountForm.password.length < 6
                }
                className="w-full sm:w-auto"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Create and Invite
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y rounded-lg border">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium text-gray-950">{invite.email}</div>
                    <div className="text-sm text-muted-foreground">
                      Expires {new Date(invite.expiresAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assigned Advocates</CardTitle>
        </CardHeader>
        <CardContent>
          {activeAdvocates.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No advocates assigned yet.
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {activeAdvocates.map((member) => (
                <div key={member.userId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium text-gray-950">{member.name || "Unnamed advocate"}</div>
                    <div className="text-sm text-muted-foreground">{member.email}</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveAdvocate(member.userId)}
                    disabled={saving}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {removedAdvocates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Removed Advocates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y rounded-lg border">
              {removedAdvocates.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-4 text-sm text-muted-foreground">
                  <span>{member.email || member.name}</span>
                  <Badge variant="outline">Removed</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
