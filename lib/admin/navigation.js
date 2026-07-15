import {
  LayoutDashboard, Users, Scale, FileText, CalendarDays, Landmark,
  MessagesSquare, Sparkles, CreditCard, FileBarChart, ShieldCheck, Settings,
} from "lucide-react"

// Single source of truth for admin navigation. `permission` gates both the
// sidebar entry and the command palette; pages enforce it again themselves.
export const NAV_ITEMS = [
  { href: "/superduper-admin/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
  { href: "/superduper-admin/users", label: "Users", icon: Users, permission: "users.view" },
  { href: "/superduper-admin/cases", label: "Cases", icon: Scale, permission: "cases.view" },
  { href: "/superduper-admin/documents", label: "Documents", icon: FileText, permission: "documents.view" },
  { href: "/superduper-admin/hearings", label: "Hearings & Calendar", icon: CalendarDays, permission: "hearings.view" },
  { href: "/superduper-admin/courts", label: "Cause Lists & Courts", icon: Landmark, permission: "courts.view" },
  { href: "/superduper-admin/chat", label: "Chat Oversight", icon: MessagesSquare, permission: "chat.view" },
  { href: "/superduper-admin/ai", label: "AI Administration", icon: Sparkles, permission: "ai.view" },
  { href: "/superduper-admin/billing", label: "Subscriptions & Billing", icon: CreditCard, permission: "billing.view" },
  { href: "/superduper-admin/reports", label: "Reports & Exports", icon: FileBarChart, permission: "reports.view" },
  { href: "/superduper-admin/security", label: "Security & Audit Logs", icon: ShieldCheck, permission: "audit.view" },
  { href: "/superduper-admin/settings", label: "Application Settings", icon: Settings, permission: "*" },
]
