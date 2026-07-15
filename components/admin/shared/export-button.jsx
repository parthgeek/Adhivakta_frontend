"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { buildQuery, downloadCsv } from "@/lib/admin/api"
import { useAuth } from "@/lib/admin/auth-context"

// Exports honour the current filters and the caller's permissions
export function ExportButton({ endpoint, filename, filters = {}, permission }) {
  const { hasPermission } = useAuth()
  const [busy, setBusy] = useState(false)

  if (permission && !hasPermission(permission)) return null

  const handleExport = async () => {
    setBusy(true)
    try {
      const { page, limit, ...rest } = filters
      await downloadCsv(`${endpoint}${buildQuery(rest)}`, filename)
      toast.success("Export downloaded")
    } catch (err) {
      toast.error(err.message || "Export failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={busy}>
      <Download className="mr-1.5 h-4 w-4" />
      {busy ? "Exporting…" : "Export CSV"}
    </Button>
  )
}
