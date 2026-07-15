"use client"

import { Suspense, useEffect, useState } from "react"
import { Sparkles, Users, MessageSquare, Gauge } from "lucide-react"
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, CartesianGrid,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/admin/shared/page-header"
import { MetricCard } from "@/components/admin/shared/metric-card"
import { StatusBadge } from "@/components/admin/shared/status-badge"
import { ExportButton } from "@/components/admin/shared/export-button"
import { PermissionGuard } from "@/components/admin/shared/permission-guard"
import { DataTable } from "@/components/admin/shared/data-table"
import { FilterBar } from "@/components/admin/shared/filter-bar"
import { useServerTable } from "@/hooks/use-admin-table"
import { api } from "@/lib/admin/api"
import { formatDateTime, formatNumber, titleCase } from "@/lib/admin/format"

const CONVERSATION_COLUMNS = [
  { key: "title", label: "Conversation", render: (c) => (
    <span className="max-w-[260px] truncate block font-medium">{c.title}</span>
  )},
  { key: "user", label: "User", render: (c) => c.user?.email || "—" },
  { key: "role", label: "Role", render: (c) => titleCase(c.user?.role || "") },
  { key: "messageCount", label: "Messages", render: (c) => formatNumber(c.messageCount) },
  { key: "updatedAt", label: "Last active", render: (c) => formatDateTime(c.updatedAt) },
]

function AiContent() {
  const [overview, setOverview] = useState(null)
  const [health, setHealth] = useState(null)
  const table = useServerTable({ endpoint: "/admin/ai/conversations" })

  useEffect(() => {
    api.get("/admin/ai/overview?days=30").then(({ data }) => setOverview(data)).catch(() => {})
    api.get("/admin/ai/health").then(({ data }) => setHealth(data)).catch(() => setHealth({ status: "degraded", components: [] }))
  }, [])

  return (
    <div className="space-y-4">
      <PageHeader title="AI Administration" description="NyaAI service health, usage analytics and quota monitoring">
        <ExportButton endpoint="/admin/ai/export" filename="ai-usage-export.csv" filters={{ days: 30 }} permission="ai.view" />
      </PageHeader>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="AI metrics">
        <MetricCard title="Conversations (30d)" value={formatNumber(overview?.conversations)} icon={Sparkles} loading={!overview} />
        <MetricCard title="Messages (30d)" value={formatNumber(overview?.messages)} icon={MessageSquare} loading={!overview} />
        <MetricCard title="Active users (30d)" value={formatNumber(overview?.activeUsers)} icon={Users} loading={!overview} />
        <MetricCard
          title="Completion rate"
          value={overview?.completionRate != null ? `${Math.round(overview.completionRate * 100)}%` : "—"}
          hint="Assistant replies per user message"
          icon={Gauge}
          loading={!overview}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Daily conversations (30d)</CardTitle></CardHeader>
          <CardContent className="h-56">
            {!overview ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overview.daily} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <ChartTooltip />
                  <Bar dataKey="conversations" name="Conversations" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Service health</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {!health ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Overall</span>
                    <StatusBadge status={health.status} />
                  </div>
                  {health.dbLatencyMs != null ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">DB latency</span>
                      <span className="tabular-nums">{health.dbLatencyMs} ms</span>
                    </div>
                  ) : null}
                  {(health.components || []).map((component) => (
                    <div key={component.name} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{component.name}</span>
                      <StatusBadge status={component.configured ? "operational" : "failed"} />
                    </div>
                  ))}
                  {health.note ? <p className="pt-1 text-xs text-muted-foreground">{health.note}</p> : null}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Token usage (estimated)</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {!overview ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Input tokens</span>
                    <span className="tabular-nums">{formatNumber(overview.tokenEstimates.inputTokens)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Output tokens</span>
                    <span className="tabular-nums">{formatNumber(overview.tokenEstimates.outputTokens)}</span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span>Total</span>
                    <span className="tabular-nums">{formatNumber(overview.tokenEstimates.totalTokens)}</span>
                  </div>
                  <p className="pt-1 text-xs text-muted-foreground">{overview.tokenEstimates.note}</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Conversations (metadata only)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FilterBar table={table} searchPlaceholder="Filtering by content is intentionally unsupported" dateRange />
          <DataTable columns={CONVERSATION_COLUMNS} table={table} emptyTitle="No conversations in this range" />
          <p className="text-xs text-muted-foreground">
            Prompts, replies and document content are never shown here. Failed-request inspection and per-model
            breakdowns require provider-side telemetry that is not persisted yet.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AiPage() {
  return (
    <PermissionGuard permission="ai.view" showDenied>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AiContent />
      </Suspense>
    </PermissionGuard>
  )
}
