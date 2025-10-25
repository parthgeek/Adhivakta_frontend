"use client"

import { createContext, useState, useEffect, useContext, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { initializeApp } from "firebase/app"
import api from "@/services/api"

export const AuthContext = createContext()

// Token expiration check
const isTokenExpired = (token) => {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expiry = payload.exp * 1000
    // Add 30 second buffer before actual expiry
    return Date.now() >= (expiry - 30000)
  } catch (error) {
    console.error("Error checking token expiry:", error)
    return true
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isValidatingRef = useRef(false)
  const lastValidationRef = useRef(0)

  // Initialize Firebase
  useEffect(() => {
    try {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      }
      initializeApp(firebaseConfig)
    } catch (error) {
      // Firebase already initialized or config missing
      console.log("Firebase initialization skipped:", error.message)
    }
  }, [])

  // Clear all auth data
  const clearAuthData = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user")
      sessionStorage.clear()
    }
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Try to call backend logout (ignore errors)
      const token = localStorage.getItem("auth_token")
      if (token && !isTokenExpired(token)) {
        try {
          await api.auth.logout()
        } catch (err) {
          console.log("Backend logout failed (continuing anyway):", err.message)
        }
      }

      // Sign out from Firebase
      try {
        const auth = getAuth()
        await firebaseSignOut(auth)
      } catch (err) {
        console.log("Firebase signout failed (continuing anyway):", err.message)
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Always clear auth data and redirect
      clearAuthData()
      
      // Force hard redirect to clear any cached state
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login"
      }
    }
  }, [clearAuthData])

  // Validate session with backend
  const validateSession = useCallback(async (force = false) => {
    // Prevent concurrent validations
    if (isValidatingRef.current && !force) {
      return false
    }

    // Rate limit validations (max once per 10 seconds unless forced)
    const now = Date.now()
    if (!force && (now - lastValidationRef.current) < 10000) {
      return isAuthenticated
    }

    isValidatingRef.current = true
    lastValidationRef.current = now

    try {
      const token = localStorage.getItem("auth_token")
      
      if (!token) {
        clearAuthData()
        return false
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        console.log("Token expired, logging out")
        await logout()
        return false
      }

      // Verify token with backend
      try {
        const response = await api.auth.verifyToken()
        
        if (response && response.user) {
          setUser(response.user)
          setIsAuthenticated(true)
          localStorage.setItem("user", JSON.stringify(response.user))
          return true
        } else {
          throw new Error("Invalid response from server")
        }
      } catch (error) {
        // If 401, token is invalid
        if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
          console.log("Token invalid, logging out")
          await logout()
          return false
        }
        
        // For other errors, don't logout immediately (might be network issue)
        console.error("Session validation failed:", error)
        return isAuthenticated // Keep current state
      }
    } finally {
      isValidatingRef.current = false
      setLoading(false)
    }
  }, [isAuthenticated, logout, clearAuthData])

  // Initial auth check
  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === "undefined") return

      const token = localStorage.getItem("auth_token")
      const storedUser = localStorage.getItem("user")

      if (!token) {
        setLoading(false)
        return
      }

      // Quick check: if token is expired, logout immediately
      if (isTokenExpired(token)) {
        await logout()
        return
      }

      // Set user from storage first for faster UI
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
          setIsAuthenticated(true)
        } catch (e) {
          console.error("Error parsing stored user:", e)
        }
      }

      // Then validate with backend
      await validateSession(true)
    }

    initAuth()
  }, []) // Only run once on mount

  // Listen for visibility change (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        console.log("Tab became visible, validating session...")
        validateSession(true)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [isAuthenticated, validateSession])

  // Listen for storage changes (logout from another tab)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "auth_token") {
        if (!e.newValue) {
          // Token removed in another tab
          console.log("Token removed in another tab, logging out...")
          clearAuthData()
          if (pathname !== "/auth/login") {
            window.location.href = "/auth/login"
          }
        } else if (e.oldValue !== e.newValue) {
          // Token changed in another tab, revalidate
          validateSession(true)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [pathname, clearAuthData, validateSession])

  // Periodic session validation (every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      console.log("Periodic session validation...")
      validateSession(false)
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [isAuthenticated, validateSession])

  // Setup API interceptor for 401 responses
  useEffect(() => {
    // Add response interceptor to handle 401 globally
    const handleUnauthorized = async () => {
      console.log("Received 401, logging out...")
      await logout()
    }

    // Store the handler so we can access it from API errors
    if (typeof window !== "undefined") {
      window.__authLogout = handleUnauthorized
    }

    return () => {
      if (typeof window !== "undefined") {
        delete window.__authLogout
      }
    }
  }, [logout])

  // Handle successful authentication
  const handleAuthSuccess = useCallback((response) => {
    if (response && response.token && response.user) {
      localStorage.setItem("auth_token", response.token)
      localStorage.setItem("user", JSON.stringify(response.user))
      setUser(response.user)
      setIsAuthenticated(true)
    } else {
      throw new Error("Invalid response from server")
    }
  }, [])

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      // Try Firebase first
      try {
        const auth = getAuth()
        await signInWithEmailAndPassword(auth, email, password)
        const idToken = await auth.currentUser.getIdToken()
        const response = await api.auth.googleLogin({ idToken })
        handleAuthSuccess(response)
        return response.user
      } catch (firebaseError) {
        console.log("Firebase auth failed, trying regular login:", firebaseError.message)
      }

      // Fallback to regular login
      const response = await api.auth.login({ email, password })
      handleAuthSuccess(response)
      return response.user
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }, [handleAuthSuccess])

  // Register function
  const register = useCallback(async (userData) => {
    // Ensure only 'lawyer' and 'client' roles
    if (!['lawyer', 'client'].includes(userData.role)) {
      userData.role = 'client'
    }

    try {
      const { email, password } = userData

      // Try Firebase registration first
      if (email && password) {
        try {
          const auth = getAuth()
          await createUserWithEmailAndPassword(auth, email, password)
        } catch (firebaseError) {
          console.log("Firebase registration failed (continuing):", firebaseError.message)
        }
      }

      // Register with backend
      const response = await api.auth.register(userData)
      handleAuthSuccess(response)
      return response.user
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }, [handleAuthSuccess])

  // Google login function
  const loginWithGoogle = useCallback(async () => {
    try {
      const auth = getAuth()
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()

      const response = await api.auth.googleLogin({ idToken })
      handleAuthSuccess(response)
      return response.user
    } catch (error) {
      console.error("Google login error:", error)
      throw error
    }
  }, [handleAuthSuccess])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.users.getProfile()
      if (response && response.data) {
        setUser(response.data)
        localStorage.setItem("user", JSON.stringify(response.data))
      }
    } catch (error) {
      console.error("Failed to refresh user profile:", error)
      // If profile fetch fails with 401, logout
      if (error.message?.includes("401")) {
        await logout()
      }
    }
  }, [logout])

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    loginWithGoogle,
    refreshUser,
    validateSession: () => validateSession(true),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}