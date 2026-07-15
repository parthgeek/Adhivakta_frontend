// Admin section root: provides the admin auth context and its scoped theme.
// The customer app's root layout still supplies <html>/<body>, fonts and the
// global Sonner toaster, so those are not re-declared here.
import { AuthProvider as AdminAuthProvider } from "@/lib/admin/auth-context"
import "./admin-theme.css"

export const metadata = {
  title: "Adhivakta Admin",
  description: "Administration portal for the Adhivakta legal platform",
}

export default function SuperduperAdminLayout({ children }) {
  return (
    <AdminAuthProvider>
      <div className="admin-scope min-h-screen font-body antialiased">{children}</div>
    </AdminAuthProvider>
  )
}
