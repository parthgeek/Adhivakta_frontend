"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { api, getToken, setToken } from "@/lib/admin/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const router = useRouter()
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    setToken(null)
    setAdmin(null)
    router.push("/superduper-admin/login")
  }, [router])

  useEffect(() => {
    window.__adminLogout = logout
    return () => {
      delete window.__adminLogout
    }
  }, [logout])

  useEffect(() => {
    const bootstrap = async () => {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get("/admin/me")
        setAdmin(data)
      } catch {
        setToken(null)
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [])

  const login = useCallback(async (email, password) => {
    const result = await api.post("/auth/login", { email, password, forceLogin: true })
    if (result.user?.role !== "admin") {
      throw new Error("This portal is restricted to administrators")
    }
    setToken(result.token)
    const { data } = await api.get("/admin/me")
    setAdmin(data)
    return data
  }, [])

  const hasPermission = useCallback(
    (permission) => {
      if (!admin) return false
      const perms = admin.permissions || []
      return perms.includes("*") || perms.includes(permission)
    },
    [admin]
  )

  const value = useMemo(
    () => ({ admin, loading, login, logout, hasPermission }),
    [admin, loading, login, logout, hasPermission]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
