"use client"

import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/admin/shared/page-header"
import { FilterBar } from "@/components/admin/shared/filter-bar"
import { DataTable } from "@/components/admin/shared/data-table"
import { StatusBadge } from "@/components/admin/shared/status-badge"
import { ExportButton } from "@/components/admin/shared/export-button"
import { PermissionGuard } from "@/components/admin/shared/permission-guard"
import { Skeleton } from "@/components/ui/skeleton"
import { useServerTable } from "@/hooks/use-admin-table"
import { formatDateTime, titleCase } from "@/lib/admin/format"

const COLUMNS = [
  { key: "name", label: "Name", sortable: true, render: (u) => (
    <div>
      <p className="font-medium">{u.name}</p>
      <p className="text-xs text-muted-foreground">{u.email}</p>
    </div>
  )},
  { key: "role", label: "Role", sortable: true, render: (u) => (
    <span>{titleCase(u.role)}{u.adminRole ? <span className="text-xs text-muted-foreground"> · {titleCase(u.adminRole)}</span> : null}</span>
  )},
  { key: "accountStatus", label: "Status", render: (u) => <StatusBadge status={u.accountStatus || "active"} /> },
  { key: "isEmailVerified", label: "Verified", render: (u) => <StatusBadge status={u.isEmailVerified ? "verified" : "unverified"} tone={u.isEmailVerified ? "green" : "amber"} /> },
  { key: "subscriptionStatus", label: "Subscription", render: (u) => <StatusBadge status={u.subscriptionStatus} tone="neutral" /> },
  { key: "lastLogin", label: "Last login", sortable: true, render: (u) => formatDateTime(u.lastLogin) },
  { key: "createdAt", label: "Registered", sortable: true, render: (u) => formatDateTime(u.createdAt) },
]

function UsersContent() {
  const router = useRouter()
  const table = useServerTable({ endpoint: "/admin/users", defaultSort: "-createdAt" })

  return (
    <div className="space-y-4">
      <PageHeader title="Users" description="Search, review and manage every account on the platform">
        <ExportButton endpoint="/admin/users/export" filename="users-export.csv" filters={table.filters} permission="users.view" />
      </PageHeader>

      <FilterBar
        table={table}
        searchPlaceholder="Search name, email, phone or user ID…"
        dateRange
        selects={[
          { key: "role", label: "Role", options: ["client", "lawyer", "admin"] },
          { key: "status", label: "Status", options: ["active", "suspended", "deactivated"] },
          { key: "verified", label: "Verified", options: [{ value: "true", label: "Verified" }, { value: "false", label: "Unverified" }] },
          { key: "subscriptionStatus", label: "Subscription", options: ["free", "trial", "active", "expired"] },
        ]}
      />

      <DataTable
        columns={COLUMNS}
        table={table}
        onRowClick={(user) => router.push(`/superduper-admin/users/${user._id}`)}
        emptyTitle="No users match these filters"
      />
    </div>
  )
}

export default function UsersPage() {
  return (
    <PermissionGuard permission="users.view" showDenied>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <UsersContent />
      </Suspense>
    </PermissionGuard>
  )
}
