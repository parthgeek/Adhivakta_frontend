"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { formatDateTime, titleCase } from "@/lib/admin/format"

// Mirrors backend STATUS_TRANSITIONS
const NEXT_STATUSES = {
  active: ["pending", "closed", "disposed"],
  pending: ["active", "closed", "disposed"],
  closed: ["active"],
  disposed: ["active"],
}

export default function CaseDetailPage() {
  const { id } = useParams()
  const { hasPermission } = useAuth()
  const [caseDoc, setCaseDoc] = useState(null)
  const [error, setError] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [nextStatus, setNextStatus] = useState("")
  const [nextPriority, setNextPriority] = useState("")
  const [newOwnerId, setNewOwnerId] = useState("")
  const canManage = hasPermission("cases.manage")

  const load = useCallback(() => {
    api.get(`/admin/cases/${id}`).then(({ data }) => setCaseDoc(data)).catch(setError)
  }, [id])

  useEffect(() => { load() }, [load])

  if (error) {
    return <EmptyState variant={error.status === 403 ? "denied" : "error"} title="Could not load case" description={error.message} />
  }
  if (!caseDoc) return <Skeleton className="h-96 w-full" />

  const dialogProps = {
    status: {
      title: `Change status to ${titleCase(nextStatus)}`,
      description: `Case "${caseDoc.title}" will move from ${titleCase(caseDoc.status)} to ${titleCase(nextStatus)}.`,
      requireReason: true, confirmLabel: "Change status",
      onConfirm: async (reason) => {
        await api.patch(`/admin/cases/${id}/status`, { status: nextStatus, reason })
        toast.success("Status updated")
        load()
      },
    },
    priority: {
      title: `Set priority to ${titleCase(nextPriority)}`,
      requireReason: false, confirmLabel: "Set priority",
      onConfirm: async (reason) => {
        await api.patch(`/admin/cases/${id}/priority`, { priority: nextPriority, reason })
        toast.success("Priority updated")
        load()
      },
    },
    owner: {
      title: "Reassign case ownership",
      description: "Enter the target user's ID. The new owner gains full control of this case.",
      destructive: true, requireReason: true, confirmLabel: "Reassign",
      onConfirm: async (reason) => {
        await api.patch(`/admin/cases/${id}/owner`, { userId: newOwnerId.trim(), reason })
        toast.success("Ownership reassigned")
        load()
      },
    },
  }
  const active = dialog ? dialogProps[dialog] : null

  return (
    <PermissionGuard permission="cases.view" showDenied>
      <div className="space-y-4">
        <PageHeader title={caseDoc.title} description={`${caseDoc.caseNumber}${caseDoc.cnrNumber ? ` · CNR ${caseDoc.cnrNumber}` : ""}`}>
          <StatusBadge status={caseDoc.status} />
          <StatusBadge status={caseDoc.priority} />
        </PageHeader>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent>
              <DetailRow label="Type">{titleCase(caseDoc.caseType)}</DetailRow>
              <DetailRow label="Stage">{titleCase(caseDoc.caseStage || "")}</DetailRow>
              <DetailRow label="Court">{titleCase(caseDoc.courtType || "")}</DetailRow>
              <DetailRow label="State">{titleCase(caseDoc.courtState || "")}</DetailRow>
              <DetailRow label="District">{titleCase(caseDoc.district || "")}</DetailRow>
              <DetailRow label="Owner">
                {caseDoc.createdBy ? (
                  <Link href={`/superduper-admin/users/${caseDoc.createdBy._id}`} className="text-primary hover:underline">
                    {caseDoc.createdBy.email}
                  </Link>
                ) : "—"}
              </DetailRow>
              <DetailRow label="Created">{formatDateTime(caseDoc.createdAt)}</DetailRow>
              <DetailRow label="Updated">{formatDateTime(caseDoc.updatedAt)}</DetailRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Legal team & clients</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="mb-1 font-medium text-muted-foreground text-xs uppercase">Lawyers ({(caseDoc.lawyers || []).length})</p>
                {(caseDoc.lawyers || []).length === 0 ? <p className="text-muted-foreground">Unassigned</p> : (
                  <ul className="space-y-1">
                    {caseDoc.lawyers.map((l, i) => (
                      <li key={i}>
                        {l.user ? (
                          <Link href={`/superduper-admin/users/${l.user._id}`} className="text-primary hover:underline">{l.user.name || l.user.email}</Link>
                        ) : (l.name || "Unknown")}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-1 font-medium text-muted-foreground text-xs uppercase">Clients ({(caseDoc.clients || []).length})</p>
                {(caseDoc.clients || []).length === 0 ? <p className="text-muted-foreground">None</p> : (
                  <ul className="space-y-1">
                    {caseDoc.clients.map((c, i) => (
                      <li key={i}>
                        {c.user ? (
                          <Link href={`/superduper-admin/users/${c.user._id}`} className="text-primary hover:underline">{c.user.name || c.user.email}</Link>
                        ) : (c.name || "Unknown")}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {caseDoc.chatGroup ? (
                <div>
                  <p className="mb-1 font-medium text-muted-foreground text-xs uppercase">Chat group</p>
                  <Link href={`/superduper-admin/chat?q=${encodeURIComponent(caseDoc.chatGroup.name)}`} className="text-primary hover:underline">
                    {caseDoc.chatGroup.name}
                  </Link>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {canManage ? (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Actions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Select value={nextStatus} onValueChange={setNextStatus}>
                    <SelectTrigger className="flex-1" aria-label="New status"><SelectValue placeholder="New status…" /></SelectTrigger>
                    <SelectContent>
                      {(NEXT_STATUSES[caseDoc.status] || []).map((s) => <SelectItem key={s} value={s}>{titleCase(s)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" disabled={!nextStatus} onClick={() => setDialog("status")}>Apply</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={nextPriority} onValueChange={setNextPriority}>
                    <SelectTrigger className="flex-1" aria-label="New priority"><SelectValue placeholder="New priority…" /></SelectTrigger>
                    <SelectContent>
                      {["low", "normal", "high", "urgent"].filter((p) => p !== caseDoc.priority).map((p) => (
                        <SelectItem key={p} value={p}>{titleCase(p)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" disabled={!nextPriority} onClick={() => setDialog("priority")}>Apply</Button>
                </div>
                <div className="space-y-2 border-t pt-3">
                  <Input value={newOwnerId} onChange={(e) => setNewOwnerId(e.target.value)} placeholder="New owner user ID" className="font-mono text-xs" />
                  <Button size="sm" variant="outline" className="text-destructive" disabled={!newOwnerId.trim()} onClick={() => setDialog("owner")}>
                    Reassign ownership
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Hearings ({(caseDoc.hearings || []).length})</CardTitle></CardHeader>
            <CardContent>
              {(caseDoc.hearings || []).length === 0 ? <p className="text-sm text-muted-foreground">No hearings.</p> : (
                <ul className="space-y-2">
                  {caseDoc.hearings.map((h) => (
                    <li key={h._id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                      <div>
                        <Link href={`/superduper-admin/hearings?q=${encodeURIComponent(h.title)}`} className="font-medium hover:underline">{h.title}</Link>
                        <p className="text-xs text-muted-foreground">{formatDateTime(h.start)}</p>
                      </div>
                      <StatusBadge status={h.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Documents ({(caseDoc.documents || []).length})</CardTitle></CardHeader>
            <CardContent>
              {(caseDoc.documents || []).length === 0 ? <p className="text-sm text-muted-foreground">No documents.</p> : (
                <ul className="space-y-2">
                  {caseDoc.documents.map((d) => (
                    <li key={d._id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                      <div className="min-w-0">
                        <Link href={`/superduper-admin/documents?q=${encodeURIComponent(d.name)}`} className="font-medium hover:underline truncate block">{d.name}</Link>
                        <p className="text-xs text-muted-foreground">{d.uploadedByName} · {formatDateTime(d.createdAt)}</p>
                      </div>
                      <StatusBadge status={d.approvalStatus} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Change history</CardTitle></CardHeader>
          <CardContent>
            <ActivityTimeline events={caseDoc.history} emptyLabel="No administrative changes recorded" />
          </CardContent>
        </Card>

        {active ? (
          <ConfirmActionDialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)} {...active} />
        ) : null}
      </div>
    </PermissionGuard>
  )
}
