"use client"

import { createContext, useContext, useState, useEffect } from "react"

export const SidebarContext = createContext({})

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    // Initialize from localStorage if available, default to false
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed')
      return saved === 'true'
    }
    return false
  })

  // Save to localStorage when collapsed state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', collapsed)
    }
  }, [collapsed])

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
