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
  sendEmailVerification,
} from "firebase/auth"
import { initializeApp } from "firebase/app"
import api from "@/services/api"


export const AuthContext = createContext()

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

  // Validate session with backend - LESS AGGRESSIVE
  const validateSession = useCallback(async (force = false) => {
    // Skip validation on auth pages
    if (pathname?.includes('/auth/')) {
      return isAuthenticated
    }

    // Prevent concurrent validations
    if (isValidatingRef.current && !force) {
      return isAuthenticated
    }

    // Rate limit validations (max once per 30 seconds unless forced)
    const now = Date.now()
    if (!force && (now - lastValidationRef.current) < 30000) {
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
  }, [isAuthenticated, logout, clearAuthData, pathname])

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

      // Then validate with backend only if not on auth pages
      if (!pathname?.includes('/auth/')) {
        await validateSession(true)
      } else {
        setLoading(false)
      }
    }

    initAuth()
  }, []) // Only run once on mount

  // Listen for visibility change (tab switching) - LESS AGGRESSIVE
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && !pathname?.includes('/auth/')) {
        // Only validate if away for more than 5 minutes
        const timeSinceLastValidation = Date.now() - lastValidationRef.current
        if (timeSinceLastValidation > 5 * 60 * 1000) {
          console.log("Tab became visible after long time, validating session...")
          validateSession(true)
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [isAuthenticated, validateSession, pathname])

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

  // Periodic session validation (every 10 minutes instead of 5)
  useEffect(() => {
    if (!isAuthenticated || pathname?.includes('/auth/')) return

    const interval = setInterval(() => {
      console.log("Periodic session validation...")
      validateSession(false)
    }, 10 * 60 * 1000) // 10 minutes

    return () => clearInterval(interval)
  }, [isAuthenticated, validateSession, pathname])

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

  // Login with email/password
  const login = useCallback(async (email, password) => {
    try {
      // First try backend email/password login
      const response = await api.auth.login({ email, password })
      handleAuthSuccess(response)
      return response.user
    } catch (backendErr) {
      console.log("Backend login failed, trying Firebase fallback if available:", backendErr.message)
      // Optional fallback to Firebase auth
      try {
        const auth = getAuth()
        await signInWithEmailAndPassword(auth, email, password)
        const idToken = await auth.currentUser.getIdToken()
        const response = await api.auth.googleLogin({ idToken })
        handleAuthSuccess(response)
        return response.user
      } catch (firebaseErr) {
        console.error("Firebase fallback login failed:", firebaseErr)
        throw firebaseErr
      }
    }
  }, [handleAuthSuccess])

const register = useCallback(async (userData) => {
  if (!['lawyer', 'client'].includes(userData.role)) {
    userData.role = 'client';
  }

  try {
    const { email, password } = userData;
    let firebaseUser = null;

    if (email && password) {
      try {
        const auth = getAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;

        console.log("Firebase user created:", firebaseUser.uid);

        // ✅ CRITICAL: Send verification email and wait a bit
        try {
          await sendEmailVerification(firebaseUser);
          console.log("✅ Verification email sent to:", email);
          
          // Small delay to ensure Firebase processes the request
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (verifErr) {
          console.error("❌ Failed to send verification email:", verifErr);
        }

        userData.firebaseUID = firebaseUser.uid;
        userData.idToken = await firebaseUser.getIdToken();

      } catch (firebaseError) {
        console.error("Firebase registration failed:", firebaseError);
        // Continue without Firebase - backend will handle it
      }
    }

    // Register with backend
    const response = await api.auth.register(userData);
    console.log("Backend registration response:", response);

    // Always treat as needing verification for new email/password users
    if (email && password) {
      return {
        success: true,
        needsVerification: true,
        message: "Please check your email for verification link",
        user: response.user,
        email: email,
      };
    }

    handleAuthSuccess(response);
    return {
      success: true,
      needsVerification: false,
      user: response.user,
    };

  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}, [handleAuthSuccess]);


  // Google login
  const loginWithGoogle = useCallback(async (role = null) => {
    const auth = getAuth()
    const provider = new GoogleAuthProvider()

    try {
      console.log("Starting Google signInWithPopup()")
      const result = await signInWithPopup(auth, provider)
      if (!result || !result.user) throw new Error("No user returned from signInWithPopup")

      const fbUser = result.user
      console.log("Firebase user:", { uid: fbUser.uid, email: fbUser.email })

      const idToken = await fbUser.getIdToken()
      if (!idToken) throw new Error("Could not obtain Firebase ID token")

      const payload = { idToken }
      if (role) payload.role = role

      const response = await api.auth.googleLogin(payload)
      console.log("Backend google-login response:", response)
      handleAuthSuccess(response)
      return response.user
    } catch (err) {
      console.error("loginWithGoogle error:", err)
      
      // Check if backend requires role for new user
      if (err.response?.data?.message?.includes("role required") || 
          err.message?.includes("role required")) {
        const roleError = new Error("Role selection required for new user")
        roleError.requiresRole = true
        throw roleError
      }
      
      throw err
    }
  }, [handleAuthSuccess])

  // Send email verification
  const sendVerificationEmail = useCallback(async () => {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        throw new Error("No user logged in")
      }

      await sendEmailVerification(currentUser)
      console.log("Verification email sent successfully")
      return true
    } catch (error) {
      console.error("Failed to send verification email:", error)
      // Also try backend endpoint
      try {
        await api.auth.resendVerificationEmail()
        return true
      } catch (backendError) {
        console.error("Backend verification email failed:", backendError)
        throw error
      }
    }
  }, [])

// Check if email is verified
const checkEmailVerified = useCallback(async () => {
  try {
    // Always check with backend first
    const response = await api.auth.checkEmailVerification();
    
    if (response?.isVerified) {
      return true;
    }

    // Also check Firebase directly
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      await currentUser.reload();
      if (currentUser.emailVerified) {
        // If Firebase says verified but backend doesn't, force backend update
        await api.auth.checkEmailVerification();
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Failed to check email verification:", error);
    return false;
  }
}, []);
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
    sendVerificationEmail,
    checkEmailVerified,
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