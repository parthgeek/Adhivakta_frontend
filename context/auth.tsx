"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  status: "loading" | "authenticated" | "unauthenticated"
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  register: (userData: any) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading")

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        // Simulate auth check
        const storedUser = localStorage.getItem("user")

        if (storedUser) {
          setUser(JSON.parse(storedUser))
          setStatus("authenticated")
        } else {
          setUser(null)
          setStatus("unauthenticated")
        }
      } catch (error) {
        console.error("Auth check error:", error)
        setUser(null)
        setStatus("unauthenticated")
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Simulate API call
      // In a real app, you would call your authentication API here
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // For demo purposes, any email/password combination works
      const user = {
        id: "user-1",
        name: "John Doe",
        email,
        role: "lawyer",
      }

      // Store user in localStorage
      localStorage.setItem("user", JSON.stringify(user))

      setUser(user)
      setStatus("authenticated")
      return true
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const register = async (userData: any) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // For demo purposes, registration always succeeds
      const user = {
        id: "user-" + Date.now(),
        name: userData.name || "New User",
        email: userData.email,
        role: userData.role || "lawyer",
      }

      // Store user in localStorage
      localStorage.setItem("user", JSON.stringify(user))

      setUser(user)
      setStatus("authenticated")
      return true
    } catch (error) {
      console.error("Registration error:", error)
      return false
    }
  }

  const logout = async () => {
    // Remove user from localStorage
    localStorage.removeItem("user")

    setUser(null)
    setStatus("unauthenticated")
    router.push("/auth/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
