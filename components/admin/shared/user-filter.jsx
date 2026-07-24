"use client"

import { useEffect, useMemo, useState } from "react"
import { api } from "@/lib/admin/api"
import { titleCase } from "@/lib/admin/format"

const userLabel = (user) => {
  if (!user) return "Unknown user"
  const name = user.name?.trim()
  const email = user.email?.trim()
  if (name && email) return `${name} (${email})`
  return name || email || "Unknown user"
}

export function formatUserLabel(user) {
  if (!user) return "Unknown user"
  return userLabel(user)
}

export function useAdminUserFilter({ key = "user", label = "User" } = {}) {
  const [users, setUsers] = useState([])

  useEffect(() => {
    let active = true
    api
      .get("/admin/users/options?limit=300")
      .then(({ data }) => {
        if (active) setUsers(data || [])
      })
      .catch(() => {
        if (active) setUsers([])
      })
    return () => {
      active = false
    }
  }, [])

  const labelById = useMemo(
    () => Object.fromEntries(users.map((user) => [String(user._id), userLabel(user)])),
    [users]
  )

  return {
    select: {
      key,
      label,
      options: users.map((user) => ({
        value: String(user._id),
        label: `${userLabel(user)} · ${titleCase(user.role || "user")}`,
      })),
    },
    labelForUser: (id) => labelById[String(id)] || "Selected user",
  }
}
