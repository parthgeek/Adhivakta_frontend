"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { CreditCard, TrendingUp, UserMinus, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/admin/shared/page-header"
import { MetricCard } from "@/components/admin/shared/metric-card"
import { StatusBadge } from "@/components/admin/shared/status-badge"
import { ExportButton } from "@/components/admin/shared/export-button"
import { PermissionGuard } from "@/components/admin/shared/permission-guard"
import { ConfirmActionDialog } from "@/components/admin/shared/confirm-action-dialog"
import { DataTable } from "@/components/admin/shared/data-table"
import { FilterBar } from "@/components/admin/shared/filter-bar"
import { useServerTable } from "@/hooks/use-admin-table"
import { api } from "@/lib/admin/api"
import { useAuth } from "@/lib/admin/auth-context"
import { formatDateTime, formatMoney, formatNumber, titleCase } from "@/lib/admin/format"

function PlanEditorDialog({ open, onOpenChange, plan, onSaved }) {
  const isNew = !plan?._id
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      name: plan?.name || "",
      code: plan?.code || "",
      description: plan?.description || "",
      priceRupees: plan ? String((plan.priceAmount ?? 0) / 100) : "",
      billingInterval: plan?.billingInterval || "monthly",
      trialDays: plan?.trialDays ?? 0,
      active: plan?.active ?? true,
      features: (plan?.features || []).join("\n"),
    })
  }, [plan, open])

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        priceAmount: Math.round(parseFloat(form.priceRupees || "0") * 100),
        billingInterval: form.billingInterval,
        trialDays: Number(form.trialDays) || 0,
        active: form.active,
        features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
      }
      if (isNew) {
        await api.post("/admin/billing/plans", { ...payload, code: form.code })
        toast.success("Plan created")
      } else {
        await api.patch(`/admin/billing/plans/${plan._id}`, payload)
        toast.success("Plan updated")
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "Create plan" : `Edit plan — ${plan?.name}`}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="plan-name">Name</Label>
            <Input id="plan-name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-code">Code {isNew ? "" : "(fixed)"}</Label>
            <Input id="plan-code" value={form.code || ""} disabled={!isNew} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-price">Price (₹)</Label>
            <Input id="plan-price" type="number" min="0" step="0.01" value={form.priceRupees || ""} onChange={(e) => setForm({ ...form, priceRupees: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Interval</Label>
            <Select value={form.billingInterval} onValueChange={(v) => setForm({ ...form, billingInterval: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["monthly", "quarterly", "yearly", "one_time"].map((i) => (
                  <SelectItem key={i} value={i}>{titleCase(i)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-trial">Trial days</Label>
            <Input id="plan-trial" type="number" min="0" max="90" value={form.trialDays ?? 0} onChange={(e) => setForm({ ...form, trialDays: e.target.value })} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch id="plan-active" checked={!!form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            <Label htmlFor="plan-active">Active</Label>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="plan-features">Features (one per line)</Label>
            <textarea
              id="plan-features"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px]"
              value={form.features || ""}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.name || (isNew && !form.code)}>
            {saving ? "Saving…" : "Save plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BillingContent() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission("billing.manage")
  const table = useServerTable({ endpoint: "/admin/billing/subscriptions" })
  const [insights, setInsights] = useState(null)
  const [plans, setPlans] = useState(null)
  const [planEditor, setPlanEditor] = useState(null) // { plan } | { plan: null } for new
  const [subAction, setSubAction] = useState(null) // { sub, action, days? }
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignForm, setAssignForm] = useState({ userId: "", planId: "" })

  const loadStatic = useCallback(() => {
    api.get("/admin/billing/insights").then(({ data }) => setInsights(data)).catch(() => {})
    api.get("/admin/billing/plans").then(({ data }) => setPlans(data)).catch(() => setPlans([]))
  }, [])
  useEffect(() => { loadStatic() }, [loadStatic])

  const columns = [
    { key: "user", label: "User", render: (s) => s.user?.email || "—" },
    { key: "plan", label: "Plan", render: (s) => s.plan ? `${s.plan.name} (${formatMoney(s.plan.priceAmount, s.plan.currency)}/${s.plan.billingInterval})` : "—" },
    { key: "status", label: "Status", render: (s) => <StatusBadge status={s.status} /> },
    { key: "currentPeriodEnd", label: "Period ends", render: (s) => formatDateTime(s.currentPeriodEnd) },
    { key: "trialEndsAt", label: "Trial ends", render: (s) => formatDateTime(s.trialEndsAt) },
    { key: "createdAt", label: "Started", render: (s) => formatDateTime(s.createdAt) },
    ...(canManage
      ? [{
          key: "_actions", label: "",
          render: (s) => (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              {["active", "trialing", "past_due"].includes(s.status) ? (
                <>
                  <Button size="sm" variant="outline" className="h-7" onClick={() => setSubAction({ sub: s, action: "extend_trial" })}>Extend trial</Button>
                  <Button size="sm" variant="outline" className="h-7 text-destructive" onClick={() => setSubAction({ sub: s, action: "cancel" })}>Cancel</Button>
                </>
              ) : s.status === "cancelled" ? (
                <Button size="sm" variant="outline" className="h-7 text-emerald-700" onClick={() => setSubAction({ sub: s, action: "reactivate" })}>Reactivate</Button>
              ) : null}
            </div>
          ),
        }]
      : []),
  ]

  const subDialog = subAction && {
    cancel: {
      title: "Cancel subscription",
      description: `${subAction.sub.user?.email}'s ${subAction.sub.plan?.name} subscription will end immediately.`,
      impact: `Financial impact: the user loses paid access worth ${formatMoney(subAction.sub.plan?.priceAmount)}/${subAction.sub.plan?.billingInterval}. No automatic refund is issued (no payment provider integrated).`,
      destructive: true, requireReason: true, confirmLabel: "Cancel subscription",
    },
    reactivate: {
      title: "Reactivate subscription",
      description: `${subAction.sub.user?.email} will regain ${subAction.sub.plan?.name} access.`,
      impact: `Financial impact: grants paid features worth ${formatMoney(subAction.sub.plan?.priceAmount)}/${subAction.sub.plan?.billingInterval} without a new charge.`,
      requireReason: true, confirmLabel: "Reactivate",
    },
    extend_trial: {
      title: "Extend trial by 14 days",
      description: `${subAction.sub.user?.email}'s trial will be extended by 14 days.`,
      impact: "Financial impact: delays conversion to a paid period by 14 days.",
      requireReason: true, confirmLabel: "Extend trial",
    },
  }[subAction.action]

  return (
    <div className="space-y-4">
      <PageHeader title="Subscriptions & Billing" description="Plans, subscriptions, revenue and payment recovery">
        <ExportButton endpoint="/admin/billing/export" filename="subscriptions-export.csv" filters={table.filters} permission="billing.view" />
        {canManage ? <Button size="sm" onClick={() => setAssignOpen(true)}>Assign plan</Button> : null}
      </PageHeader>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Billing metrics">
        <MetricCard title="MRR" value={formatMoney(insights?.mrr)} hint={`ARR ${formatMoney(insights?.arr)}`} icon={TrendingUp} loading={!insights} />
        <MetricCard title="Active subscriptions" value={formatNumber(insights?.byStatus?.filter((s) => ["active", "trialing"].includes(s._id)).reduce((a, b) => a + b.count, 0) || 0)} icon={CreditCard} loading={!insights} />
        <MetricCard title="Cancelled (30d)" value={formatNumber(insights?.cancelled30d)} hint={`${formatNumber(insights?.started30d)} started`} icon={UserMinus} loading={!insights} />
        <MetricCard title="Failed payments" value={formatNumber(insights?.failedPayments?.length)} icon={AlertCircle} loading={!insights} tone={insights?.failedPayments?.length > 0 ? "red" : undefined} />
      </section>

      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="failed">Failed payments</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4 pt-2">
          <FilterBar
            table={table}
            searchPlaceholder="Search by user name or email…"
            dateRange
            selects={[{ key: "status", label: "Status", options: ["trialing", "active", "past_due", "cancelled", "expired"] }]}
          />
          <DataTable columns={columns} table={table} emptyTitle="No subscriptions match these filters" />
          <p className="text-xs text-muted-foreground">
            No payment provider (Razorpay/Stripe) is integrated yet — subscriptions here are managed manually and card
            details are never stored or shown.
          </p>
        </TabsContent>

        <TabsContent value="plans" className="space-y-3 pt-2">
          {canManage ? (
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setPlanEditor({ plan: null })}>New plan</Button>
            </div>
          ) : null}
          {!plans ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan._id} className={!plan.active ? "opacity-60" : undefined}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      {plan.name}
                      {!plan.active ? <StatusBadge status="inactive" tone="neutral" /> : null}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-2xl font-semibold">
                      {formatMoney(plan.priceAmount, plan.currency)}
                      <span className="text-sm font-normal text-muted-foreground">/{titleCase(plan.billingInterval)}</span>
                    </p>
                    <p className="text-muted-foreground">{formatNumber(plan.activeSubscribers)} active subscribers{plan.trialDays ? ` · ${plan.trialDays}d trial` : ""}</p>
                    <ul className="list-inside list-disc text-xs text-muted-foreground">
                      {(plan.features || []).slice(0, 4).map((feature, i) => <li key={i}>{feature}</li>)}
                    </ul>
                    {canManage ? (
                      <Button size="sm" variant="outline" className="mt-1" onClick={() => setPlanEditor({ plan })}>Edit</Button>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="failed" className="pt-2">
          {!insights ? (
            <Skeleton className="h-48 w-full" />
          ) : (insights.failedPayments || []).length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No failed payments recorded.</p>
          ) : (
            <div className="space-y-2">
              {insights.failedPayments.map((entry) => (
                <Card key={entry._id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                    <div>
                      <p className="font-medium">{entry.user?.email}</p>
                      <p className="text-xs text-muted-foreground">{entry.plan?.name} · <StatusBadge status={entry.status} /></p>
                    </div>
                    <div className="text-right text-xs">
                      {entry.failures.map((failure, i) => (
                        <p key={i}>
                          {formatMoney(failure.amount, failure.currency)} failed {formatDateTime(failure.paidAt)}
                          {failure.failureReason ? ` — ${failure.failureReason}` : ""}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {planEditor ? (
        <PlanEditorDialog
          open={!!planEditor}
          onOpenChange={(open) => !open && setPlanEditor(null)}
          plan={planEditor.plan}
          onSaved={loadStatic}
        />
      ) : null}

      {subAction ? (
        <ConfirmActionDialog
          open={!!subAction}
          onOpenChange={(open) => !open && setSubAction(null)}
          {...subDialog}
          onConfirm={async (reason) => {
            await api.patch(`/admin/billing/subscriptions/${subAction.sub._id}`, {
              action: subAction.action,
              days: subAction.action === "extend_trial" ? 14 : undefined,
              reason,
            })
            toast.success("Subscription updated")
            table.refresh()
            loadStatic()
          }}
        />
      ) : null}

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Manually assign a plan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="assign-user">User ID</Label>
              <Input id="assign-user" className="font-mono text-xs" placeholder="Mongo user ID" value={assignForm.userId} onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={assignForm.planId} onValueChange={(v) => setAssignForm({ ...assignForm, planId: v })}>
                <SelectTrigger><SelectValue placeholder="Choose a plan" /></SelectTrigger>
                <SelectContent>
                  {(plans || []).filter((p) => p.active).map((p) => (
                    <SelectItem key={p._id} value={p._id}>{p.name} — {formatMoney(p.priceAmount)}/{p.billingInterval}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assign-reason">Reason (required, audited)</Label>
              <Input id="assign-reason" value={assignForm.reason || ""} onChange={(e) => setAssignForm({ ...assignForm, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button
              disabled={!assignForm.userId.trim() || !assignForm.planId || !assignForm.reason?.trim()}
              onClick={async () => {
                try {
                  await api.post("/admin/billing/subscriptions", assignForm)
                  toast.success("Plan assigned")
                  setAssignOpen(false)
                  setAssignForm({ userId: "", planId: "" })
                  table.refresh()
                  loadStatic()
                } catch (err) {
                  toast.error(err.message)
                }
              }}
            >
              Assign plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function BillingPage() {
  return (
    <PermissionGuard permission="billing.view" showDenied>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <BillingContent />
      </Suspense>
    </PermissionGuard>
  )
}
