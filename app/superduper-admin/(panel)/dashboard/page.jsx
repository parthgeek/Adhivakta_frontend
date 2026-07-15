"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Users, Scale, CalendarDays, FileText, Sparkles, CreditCard, MessagesSquare, Landmark,
} from "lucide-react"
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip, CartesianGrid,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MetricCard } from "@/components/admin/shared/metric-card"
import { PageHeader } from "@/components/admin/shared/page-header"
import { StatusBadge } from "@/components/admin/shared/status-badge"
import { ActivityTimeline } from "@/components/admin/shared/activity-timeline"
import { PermissionGuard } from "@/components/admin/shared/permission-guard"
import { EmptyState } from "@/components/admin/shared/empty-state"
import { api } from "@/lib/admin/api"
import { formatBytes, formatDateTime, formatMoney, formatNumber, titleCase } from "@/lib/admin/format"

const statusCount = (list, key) => list?.find((s) => s._id === key)?.count || 0

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [trends, setTrends] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([api.get("/admin/dashboard/overview"), api.get("/admin/dashboard/trends?days=30")])
      .then(([overview, trend]) => {
        setData(overview.data)
        setTrends(trend.data)
      })
      .catch(setError)
  }, [])

  if (error) {
    return (
      <EmptyState
        variant={error.status === 403 ? "denied" : "error"}
        title={error.status === 403 ? "Permission denied" : "Failed to load dashboard"}
        description={error.message}
      />
    )
  }

  const loading = !data
  const trendData = (trends?.users || []).map((point) => ({
    date: point._id,
    users: point.count,
    cases: trends.cases?.find((c) => c._id === point._id)?.count || 0,
    ai: trends.aiConversations?.find((c) => c._id === point._id)?.count || 0,
  }))

  return (
    <PermissionGuard permission="dashboard.view" showDenied>
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Platform overview across users, cases, hearings, documents, AI and billing" />

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Key metrics">
          <MetricCard title="Total users" value={formatNumber(data?.users.total)} hint={`${formatNumber(data?.users.new30d)} new in 30d`} icon={Users} href="/superduper-admin/users" loading={loading} />
          <MetricCard title="Active users (30d)" value={formatNumber(data?.users.active30d)} hint={`${formatNumber(data?.users.verified)} verified`} icon={Users} href="/superduper-admin/users?verified=true" loading={loading} />
          <MetricCard title="Total cases" value={formatNumber(data?.cases.total)} hint={`${formatNumber(statusCount(data?.cases.byStatus, "active"))} active · ${formatNumber(statusCount(data?.cases.byStatus, "pending"))} pending`} icon={Scale} href="/superduper-admin/cases" loading={loading} />
          <MetricCard title="Overdue hearings" value={formatNumber(data?.hearings.overdue)} hint={`${formatNumber(data?.hearings.upcoming7d)} upcoming in 7d`} icon={CalendarDays} href="/superduper-admin/hearings?overdue=true" loading={loading} tone={data?.hearings.overdue > 0 ? "amber" : undefined} />
          <MetricCard title="Pending documents" value={formatNumber(data?.documents.pendingApproval)} hint={`${formatNumber(data?.documents.totalFiles)} files · ${formatBytes(data?.documents.totalBytes)}`} icon={FileText} href="/superduper-admin/documents?approvalStatus=pending" loading={loading} tone={data?.documents.pendingApproval > 0 ? "amber" : undefined} />
          <MetricCard title="AI conversations (30d)" value={formatNumber(data?.ai.conversations30d)} hint={`${formatNumber(data?.ai.activeUsers30d)} active users`} icon={Sparkles} href="/superduper-admin/ai" loading={loading} />
          <MetricCard title="MRR" value={formatMoney(data?.billing.mrr)} hint={`${formatNumber(data?.billing.failedPayments)} failed payments`} icon={CreditCard} href="/superduper-admin/billing" loading={loading} tone={data?.billing.failedPayments > 0 ? "red" : undefined} />
          <MetricCard title="Chat groups" value={formatNumber(data?.chat.totalGroups)} hint={`${formatNumber(data?.chat.orphanedGroups)} without a case`} icon={MessagesSquare} href="/superduper-admin/chat" loading={loading} />
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">30-day trend</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : trendData.length === 0 ? (
                <EmptyState title="No trend data yet" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <ChartTooltip />
                    <Area type="monotone" dataKey="users" name="New users" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1) / 0.15)" />
                    <Area type="monotone" dataKey="cases" name="New cases" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2) / 0.15)" />
                    <Area type="monotone" dataKey="ai" name="AI conversations" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3) / 0.15)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Needs attention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              ) : data.alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">All clear — nothing needs attention.</p>
              ) : (
                data.alerts.map((alert, i) => (
                  <Link
                    key={i}
                    href={alert.link || "#"}
                    className="flex items-start gap-2 rounded-md border p-2.5 text-sm hover:bg-muted/50"
                  >
                    <StatusBadge status={alert.level} />
                    <span className="min-w-0">{alert.message}</span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-4 w-4" aria-hidden /> Cause-list sync
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-20 w-full" />
              ) : data.courtSync ? (
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={data.courtSync.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last run</span>
                    <span>{formatDateTime(data.courtSync.startedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lists stored</span>
                    <span className="tabular-nums">{formatNumber(data.courtSync.causeListsStored)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Failures</span>
                    <span className="tabular-nums">{formatNumber(data.courtSync.failures)}</span>
                  </div>
                  <Link href="/superduper-admin/courts?tab=sync" className="block pt-1 text-xs text-primary hover:underline">
                    View sync jobs →
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No sync runs recorded yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Storage by file type</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {(data.documents.byType || []).slice(0, 6).map((entry) => (
                    <li key={entry._id} className="flex items-center justify-between">
                      <span className="uppercase text-muted-foreground">{entry._id}</span>
                      <span className="tabular-nums">
                        {formatNumber(entry.count)} files · {formatBytes(entry.bytes)}
                      </span>
                    </li>
                  ))}
                  {(data.documents.byType || []).length === 0 ? (
                    <p className="text-muted-foreground">No documents yet.</p>
                  ) : null}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Users by role</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {(data.users.byRole || []).map((entry) => (
                    <li key={entry._id} className="flex items-center justify-between">
                      <Link href={`/superduper-admin/users?role=${entry._id}`} className="text-muted-foreground hover:text-foreground hover:underline">
                        {titleCase(entry._id)}
                      </Link>
                      <span className="tabular-nums">{formatNumber(entry.count)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent administrative activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-32 w-full" /> : <ActivityTimeline events={data.recentActivity} />}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  )
}
