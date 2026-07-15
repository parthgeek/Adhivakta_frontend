"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/admin/shared/page-header"
import { StatusBadge } from "@/components/admin/shared/status-badge"
import { PermissionGuard } from "@/components/admin/shared/permission-guard"
import { ConfirmActionDialog } from "@/components/admin/shared/confirm-action-dialog"
import { ActivityTimeline } from "@/components/admin/shared/activity-timeline"
import { api } from "@/lib/admin/api"
import { formatDateTime, titleCase } from "@/lib/admin/format"

function SettingRow({ setting, onSaved }) {
  const initial = setting.valueType === "list" ? (setting.value || []).join(", ") : setting.value
  const [draft, setDraft] = useState(initial)
  const [confirming, setConfirming] = useState(false)
  const dirty = String(draft) !== String(initial)

  const parseDraft = () => {
    switch (setting.valueType) {
      case "number": return Number(draft)
      case "boolean": return Boolean(draft)
      case "list":
        return String(draft)
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
          .map((v) => (Number.isNaN(Number(v)) ? v : Number(v)))
      default: return draft
    }
  }

  const save = async (reason) => {
    await api.patch(`/admin/settings/${encodeURIComponent(setting.key)}`, { value: parseDraft(), reason })
    toast.success(`${setting.label} saved`)
    onSaved()
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0">
      <div className="min-w-0 max-w-md">
        <p className="text-sm font-medium">{setting.label}</p>
        <p className="text-xs text-muted-foreground">{setting.description}</p>
        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{setting.key}</p>
      </div>
      <div className="flex items-center gap-2">
        {setting.valueType === "boolean" ? (
          <Switch checked={!!draft} onCheckedChange={setDraft} aria-label={setting.label} />
        ) : (
          <Input
            value={draft ?? ""}
            type={setting.valueType === "number" ? "number" : "text"}
            onChange={(e) => setDraft(setting.valueType === "number" ? e.target.valueAsNumber : e.target.value)}
            className="w-[200px]"
            aria-label={setting.label}
          />
        )}
        <Button size="sm" disabled={!dirty} onClick={() => setConfirming(true)}>Save</Button>
      </div>

      <ConfirmActionDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Update "${setting.label}"`}
        description={`Value changes from ${JSON.stringify(setting.value)} to ${JSON.stringify(parseDraft())}.`}
        requireReason={setting.group === "maintenance"}
        confirmLabel="Save setting"
        destructive={setting.group === "maintenance"}
        onConfirm={save}
      />
    </div>
  )
}

function FlagsTab({ flags, reload }) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [form, setForm] = useState({ key: "", name: "", description: "", rolloutPercentage: 100 })

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setEditorOpen(true)}>New flag</Button>
      </div>
      {flags.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No feature flags defined.</p>
      ) : (
        flags.map((flag) => (
          <div key={flag.key} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{flag.name} <span className="font-mono text-xs text-muted-foreground">({flag.key})</span></p>
              <p className="text-xs text-muted-foreground">
                {flag.description || "No description"} · rollout {flag.rolloutPercentage}%
                {(flag.targetRoles || []).length ? ` · roles: ${flag.targetRoles.join(", ")}` : ""}
              </p>
            </div>
            <Switch
              checked={flag.enabled}
              aria-label={`Toggle ${flag.name}`}
              onCheckedChange={async (enabled) => {
                try {
                  await api.patch(`/admin/settings/flags/${flag.key}`, { enabled })
                  toast.success(`${flag.name} ${enabled ? "enabled" : "disabled"}`)
                  reload()
                } catch (err) {
                  toast.error(err.message)
                }
              }}
            />
          </div>
        ))
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create feature flag</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="flag-key">Key</Label>
              <Input id="flag-key" placeholder="new_dashboard" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="flag-name">Name</Label>
              <Input id="flag-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="flag-desc">Description</Label>
              <Input id="flag-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="flag-pct">Rollout percentage</Label>
              <Input id="flag-pct" type="number" min="0" max="100" value={form.rolloutPercentage} onChange={(e) => setForm({ ...form, rolloutPercentage: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button
              disabled={!form.key.trim() || !form.name.trim()}
              onClick={async () => {
                try {
                  await api.post("/admin/settings/flags", form)
                  toast.success("Flag created (disabled by default)")
                  setEditorOpen(false)
                  setForm({ key: "", name: "", description: "", rolloutPercentage: 100 })
                  reload()
                } catch (err) {
                  toast.error(err.message)
                }
              }}
            >
              Create flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AnnouncementsTab({ announcements, reload }) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [form, setForm] = useState({ title: "", body: "", severity: "info", startsAt: "", endsAt: "" })

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setEditorOpen(true)}>New announcement</Button>
      </div>
      {announcements.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No announcements yet.</p>
      ) : (
        announcements.map((a) => (
          <div key={a._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
            <div className="min-w-0 max-w-lg">
              <p className="flex items-center gap-2 text-sm font-medium">{a.title} <StatusBadge status={a.severity} /></p>
              <p className="truncate text-xs text-muted-foreground">{a.body}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(a.startsAt)} → {a.endsAt ? formatDateTime(a.endsAt) : "no end"}
              </p>
            </div>
            <Switch
              checked={a.active}
              aria-label={`Toggle ${a.title}`}
              onCheckedChange={async (active) => {
                try {
                  await api.patch(`/admin/settings/announcements/${a._id}`, { active })
                  toast.success(active ? "Announcement activated" : "Announcement deactivated")
                  reload()
                } catch (err) {
                  toast.error(err.message)
                }
              }}
            />
          </div>
        ))
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Create announcement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title">Title</Label>
              <Input id="ann-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann-body">Body</Label>
              <Textarea id="ann-body" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["info", "warning", "critical"].map((s) => <SelectItem key={s} value={s}>{titleCase(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ann-start">Starts</Label>
                <Input id="ann-start" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ann-end">Ends</Label>
                <Input id="ann-end" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </div>
            </div>
            {form.title || form.body ? (
              <div className="rounded-md border p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Preview</p>
                <p className="flex items-center gap-2 text-sm font-medium">{form.title || "Untitled"} <StatusBadge status={form.severity} /></p>
                <p className="text-sm text-muted-foreground">{form.body}</p>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button
              disabled={!form.title.trim() || !form.body.trim()}
              onClick={async () => {
                try {
                  await api.post("/admin/settings/announcements", {
                    ...form,
                    startsAt: form.startsAt || undefined,
                    endsAt: form.endsAt || undefined,
                  })
                  toast.success("Announcement created (inactive until toggled on)")
                  setEditorOpen(false)
                  setForm({ title: "", body: "", severity: "info", startsAt: "", endsAt: "" })
                  reload()
                } catch (err) {
                  toast.error(err.message)
                }
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(null)
  const [flags, setFlags] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [history, setHistory] = useState([])
  const [query, setQuery] = useState("")

  const load = useCallback(() => {
    api.get("/admin/settings").then(({ data }) => setSettings(data)).catch(() => setSettings([]))
    api.get("/admin/settings/flags").then(({ data }) => setFlags(data)).catch(() => {})
    api.get("/admin/settings/announcements").then(({ data }) => setAnnouncements(data)).catch(() => {})
    api.get("/admin/settings/history").then(({ data }) => setHistory(data)).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = (settings || []).filter(
      (s) => !q || s.key.toLowerCase().includes(q) || s.label.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q)
    )
    return filtered.reduce((acc, s) => {
      ;(acc[s.group] = acc[s.group] || []).push(s)
      return acc
    }, {})
  }, [settings, query])

  return (
    <PermissionGuard permission="*" showDenied>
      <div className="space-y-4">
        <PageHeader title="Application Settings" description="Platform configuration — every change is validated, confirmed and audited (Super Admin only)" />

        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="flags">Feature flags</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="history">Change history</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 pt-2">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search settings…" className="pl-8" aria-label="Search settings" />
            </div>
            {!settings ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              Object.entries(grouped).map(([group, items]) => (
                <Card key={group}>
                  <CardHeader className="pb-1"><CardTitle className="text-base">{titleCase(group)}</CardTitle></CardHeader>
                  <CardContent>
                    {items.map((setting) => (
                      <SettingRow key={setting.key} setting={setting} onSaved={load} />
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="flags" className="pt-2">
            <FlagsTab flags={flags} reload={load} />
          </TabsContent>

          <TabsContent value="announcements" className="pt-2">
            <AnnouncementsTab announcements={announcements} reload={load} />
          </TabsContent>

          <TabsContent value="history" className="pt-2">
            <Card>
              <CardContent className="pt-4">
                <ActivityTimeline events={history} emptyLabel="No settings changes yet" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  )
}
