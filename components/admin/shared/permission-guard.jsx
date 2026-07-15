"use client"

import { useAuth } from "@/lib/admin/auth-context"
import { EmptyState } from "@/components/admin/shared/empty-state"

// Hides (or replaces with a denied state) content the current admin role
// cannot access. Server-side enforcement remains the source of truth.
export function PermissionGuard({ permission, fallback = null, showDenied = false, children }) {
  const { hasPermission, loading } = useAuth()
  if (loading) return null
  if (!hasPermission(permission)) {
    if (showDenied) {
      return (
        <EmptyState
          variant="denied"
          title="Permission required"
          description={`Your admin role does not include the '${permission}' permission.`}
        />
      )
    }
    return fallback
  }
  return children
}
