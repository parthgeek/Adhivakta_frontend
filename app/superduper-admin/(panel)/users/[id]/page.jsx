"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/admin/shared/page-header"
import { StatusBadge } from "@/components/admin/shared/status-badge"
import { ConfirmActionDialog } from "@/components/admin/shared/confirm-action-dialog"
import { ActivityTimeline } from "@/components/admin/shared/activity-timeline"
import { PermissionGuard } from "@/components/admin/shared/permission-guard"
import { EmptyState } from "@/components/admin/shared/empty-state"
import { DetailRow } from "@/components/admin/shared/detail-drawer"
import { api } from "@/lib/admin/api"
import { useAuth } from "@/lib/admin/auth-context"
import { formatDateTime, formatNumber, titleCase } from "@/lib/admin/format"

const ADMIN_ROLES = ["super_admin", "operations_admin", "finance_admin", "support_admin", "security_auditor", "ai_operations_admin"]

export default function UserDetailPage() {
  const { id } = useParams()
  const { hasPermission } = useAuth()
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [dialog, setDialog] = useState(null) // { type, payload }
  const [pendingRole, setPendingRole] = useState(null)
  const [pendingAdminRole, setPendingAdminRole] = useState(null)
  const [note, setNote] = useState("")
  const canManage = hasPermission("users.manage")

  const load = useCallback(() => {
    api.get(`/admin/users/${id}`).then(({ data }) => setUser(data)).catch(setError)
  }, [id])

  useEffect(() => { load() }, [load])

  if (error) {
    return <EmptyState variant={error.status === 403 ? "denied" : "error"} title="Could not load user" description={error.message} />
  }
  if (!user) return <Skeleton className="h-96 w-full" />

  const act = (type, payload = {}) => setDialog({ type, ...payload })

  const dialogProps = {
    change_role: {
      title: "Change role",
      description: `Change ${user.email} from ${titleCase(user.role)} to ${titleCase(pendingRole || "")}${pendingRole === "admin" && pendingAdminRole ? ` (${titleCase(pendingAdminRole)})` : ""}.`,
      requireReason: true,
      confirmLabel: "Change role",
      onConfirm: async (reason) => {
        await api.patch(`/admin/users/${id}/role`, { role: pendingRole, adminRole: pendingRole === "admin" ? pendingAdminRole : null, reason })
        toast.success("Role updated")
        load()
      },
    },
    suspend: {
      title: "Suspend account",
      description: `${user.email} will be blocked from the platform and all sessions terminated.`,
      destructive: true, requireReason: true, confirmLabel: "Suspend",
      onConfirm: async (reason) => {
        await api.patch(`/admin/users/${id}/status`, { status: "suspended", reason })
        toast.success("Account suspended")
        load()
      },
    },
    deactivate: {
      title: "Deactivate account",
      description: `${user.email} will be deactivated. This is reversible via Restore.`,
      destructive: true, requireReason: true, confirmLabel: "Deactivate",
      onConfirm: async (reason) => {
        await api.patch(`/admin/users/${id}/status`, { status: "deactivated", reason })
        toast.success("Account deactivated")
        load()
      },
    },
    reactivate: {
      title: "Reactivate account",
      description: `${user.email} will regain access to the platform.`,
      requireReason: true, confirmLabel: "Reactivate",
      onConfirm: async (reason) => {
        await api.patch(`/admin/users/${id}/status`, { status: "active", reason })
        toast.success("Account reactivated")
        load()
      },
    },
    verify_email: {
      title: user.isEmailVerified ? "Remove email verification" : "Mark email as verified",
      description: `Applies to ${user.email}.`,
      requireReason: false, confirmLabel: "Confirm",
      onConfirm: async (reason) => {
        await api.patch(`/admin/users/${id}/email-verification`, { verified: !user.isEmailVerified, reason })
        toast.success("Verification updated")
        load()
      },
    },
    force_logout: {
      title: "Force logout from all devices",
      description: `All ${user.sessions?.length || 0} active sessions for ${user.email} will be revoked immediately.`,
      destructive: true, requireReason: true, confirmLabel: "Force logout",
      onConfirm: async (reason) => {
        await api.post(`/admin/users/${id}/force-logout`, { reason })
        toast.success("All sessions revoked")
        load()
      },
    },
    revoke_session: {
      title: "Revoke session",
      description: "The selected session will be terminated immediately.",
      destructive: true, requireReason: true, confirmLabel: "Revoke",
      onConfirm: async (reason) => {
        await api.delete(`/admin/users/${id}/sessions/${dialog.tokenPrefix}`, { reason })
        toast.success("Session revoked")
        load()
      },
    },
  }

  const active = dialog ? dialogProps[dialog.type] : null

  return (
    <PermissionGuard permission="users.view" showDenied>
      <div className="space-y-4">
        <PageHeader title={user.name} description={user.email}>
          <StatusBadge status={user.accountStatus || "active"} />
        </PageHeader>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2"><CardTitle className="text-base">Profile</CardTitle></CardHeader>
            <CardContent>
              <DetailRow label="User ID"><span className="font-mono text-xs">{user._id}</span></DetailRow>
              <DetailRow label="Role">{titleCase(user.role)}{user.adminRole ? ` · ${titleCase(user.adminRole)}` : ""}</DetailRow>
              <DetailRow label="Phone">{user.phone}</DetailRow>
              <DetailRow label="Company">{user.company}</DetailRow>
              <DetailRow label="Email verified">{user.isEmailVerified ? "Yes" : "No"}</DetailRow>
              <DetailRow label="Subscription">{titleCase(user.subscriptionStatus || "free")}</DetailRow>
              <DetailRow label="Registered">{formatDateTime(user.createdAt)}</DetailRow>
              <DetailRow label="Last login">{formatDateTime(user.lastLogin)}</DetailRow>
              <DetailRow label="Cases">{formatNumber(user.caseCount)}</DetailRow>
              <DetailRow label="Documents">{formatNumber(user.documentCount)}</DetailRow>
              {user.statusReason ? <DetailRow label="Status reason">{user.statusReason}</DetailRow> : null}
            </CardContent>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            {canManage ? (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Actions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={pendingRole || user.role} onValueChange={(v) => setPendingRole(v)}>
                      <SelectTrigger className="w-[130px]" aria-label="New role"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["client", "lawyer", "admin"].map((r) => <SelectItem key={r} value={r}>{titleCase(r)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {(pendingRole || user.role) === "admin" ? (
                      <Select value={pendingAdminRole || user.adminRole || "super_admin"} onValueChange={setPendingAdminRole}>
                        <SelectTrigger className="w-[190px]" aria-label="Admin sub-role"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ADMIN_ROLES.map((r) => <SelectItem key={r} value={r}>{titleCase(r)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : null}
                    <Button
                      size="sm"
                      disabled={(pendingRole || user.role) === user.role && ((pendingRole || user.role) !== "admin" || (pendingAdminRole || user.adminRole) === user.adminRole)}
                      onClick={() => {
                        if (!pendingRole) setPendingRole(user.role)
                        if (!pendingAdminRole) setPendingAdminRole(user.adminRole || "super_admin")
                        act("change_role")
                      }}
                    >
                      Change role
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => act("verify_email")}>
                      {user.isEmailVerified ? "Unverify email" : "Verify email"}
                    </Button>
                    {(user.accountStatus || "active") === "active" ? (
                      <>
                        <Button size="sm" variant="outline" className="text-amber-700" onClick={() => act("suspend")}>Suspend</Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => act("deactivate")}>Deactivate</Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" className="text-emerald-700" onClick={() => act("reactivate")}>Reactivate / Restore</Button>
                    )}
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => act("force_logout")}>
                      Force logout everywhere
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Active sessions ({user.sessions?.length || 0})</CardTitle></CardHeader>
              <CardContent>
                {(user.sessions || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active sessions.</p>
                ) : (
                  <ul className="space-y-2">
                    {user.sessions.map((session) => (
                      <li key={session.tokenPrefix} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                        <div>
                          <p className="font-mono text-xs">{session.tokenPrefix}…</p>
                          <p className="text-xs text-muted-foreground">
                            Started {formatDateTime(session.createdAt)} · last seen {formatDateTime(session.lastSeenAt)}
                          </p>
                        </div>
                        {canManage ? (
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => act("revoke_session", { tokenPrefix: session.tokenPrefix })}>
                            Revoke
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Login history</CardTitle></CardHeader>
              <CardContent>
                <ActivityTimeline events={user.loginHistory} emptyLabel="No login events recorded yet" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Internal notes</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(user.adminNotes || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notes.</p>
                ) : (
                  <ul className="space-y-2">
                    {user.adminNotes.map((entry, i) => (
                      <li key={i} className="rounded-md border p-2.5 text-sm">
                        <p>{entry.note}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(entry.addedAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
                {canManage ? (
                  <div className="space-y-2">
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note (visible to admins only)" rows={2} />
                    <Button
                      size="sm"
                      disabled={!note.trim()}
                      onClick={async () => {
                        try {
                          await api.post(`/admin/users/${id}/notes`, { note })
                          setNote("")
                          toast.success("Note added")
                          load()
                        } catch (err) {
                          toast.error(err.message)
                        }
                      }}
                    >
                      Add note
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>

        {active ? (
          <ConfirmActionDialog
            open={!!dialog}
            onOpenChange={(open) => !open && setDialog(null)}
            {...active}
          />
        ) : null}
      </div>
    </PermissionGuard>
  )
}
