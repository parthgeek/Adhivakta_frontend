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
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
} from "firebase/auth"
import { initializeApp } from "firebase/app"
import api from "@/services/api"

export const AuthContext = createContext()

const isTokenExpired = (token) => {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expiry = payload.exp * 1000
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
      const token = localStorage.getItem("auth_token")
      if (token && !isTokenExpired(token)) {
        try {
          await api.auth.logout()
        } catch (err) {
          console.log("Backend logout failed (continuing anyway):", err.message)
        }
      }

      try {
        const auth = getAuth()
        await firebaseSignOut(auth)
      } catch (err) {
        console.log("Firebase signout failed (continuing anyway):", err.message)
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      clearAuthData()
      
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login"
      }
    }
  }, [clearAuthData])

  // Validate session with backend
  const validateSession = useCallback(async (force = false) => {
    if (isValidatingRef.current && !force) {
      return false
    }

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

      if (isTokenExpired(token)) {
        console.log("Token expired, logging out")
        await logout()
        return false
      }

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
        if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
          console.log("Token invalid, logging out")
          await logout()
          return false
        }
        
        console.error("Session validation failed:", error)
        return isAuthenticated
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

      if (isTokenExpired(token)) {
        await logout()
        return
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
          setIsAuthenticated(true)
        } catch (e) {
          console.error("Error parsing stored user:", e)
        }
      }

      await validateSession(true)
    }

    initAuth()
  }, [])

  // Listen for visibility change
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

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "auth_token") {
        if (!e.newValue) {
          console.log("Token removed in another tab, logging out...")
          clearAuthData()
          if (pathname !== "/auth/login") {
            window.location.href = "/auth/login"
          }
        } else if (e.oldValue !== e.newValue) {
          validateSession(true)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [pathname, clearAuthData, validateSession])

  // Periodic session validation
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      console.log("Periodic session validation...")
      validateSession(false)
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, validateSession])

  // Setup API interceptor for 401
  useEffect(() => {
    const handleUnauthorized = async () => {
      console.log("Received 401, logging out...")
      await logout()
    }

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

  

const register = useCallback(async (userData) => {
  try {
    // Validate input
    if (!userData.email || !userData.password || !userData.name) {
      throw new Error("Please provide name, email and password");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error("Please provide a valid email address");
    }

    // Validate password strength
    if (userData.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Ensure role is set
    if (!['lawyer', 'client'].includes(userData.role)) {
      userData.role = 'client';
    }

    console.log("Starting registration process...");

    // Register with backend ONLY (Firebase will be handled by backend)
    const response = await api.auth.register(userData);
    console.log("Registration response:", response);
    
    if (response && response.success) {
      // Store token and user data
      if (response.token && response.user) {
        localStorage.setItem("auth_token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        setUser(response.user);
        setIsAuthenticated(true);
      }
      
      return {
        success: true,
        user: response.user,
        needsVerification: response.requiresVerification || false,
        message: response.message || "Registration successful!"
      };
    } else {
      throw new Error(response?.message || "Registration failed");
    }
  } catch (error) {
    console.error("Registration error:", error);
    throw new Error(error.message || "Registration failed. Please try again.");
  }
}, [handleAuthSuccess]);

const login = useCallback(async (email, password) => {
  try {
    // Validate input
    if (!email || !password) {
      throw new Error("Please provide email and password");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Please provide a valid email address");
    }

    console.log("Attempting login for:", email);

    // Try backend login
    const response = await api.auth.login({ email, password });
    console.log("Login response:", response);
    
    if (response && response.success) {
      handleAuthSuccess(response);
      
      // Check if there's a warning about email verification
      if (response.warning) {
        console.warn("Login warning:", response.warning);
      }
      
      return response.user;
    } else {
      throw new Error("Invalid email or password");
    }
  } catch (error) {
    console.error("Login error:", error);
    
    // Provide more specific error messages
    let errorMessage = "Invalid email or password";
    if (error.message?.includes('email') || error.message?.includes('Email')) {
      errorMessage = "Please check your email and try again";
    } else if (error.message?.includes('password') || error.message?.includes('Password')) {
      errorMessage = "Invalid password. Please try again.";
    } else if (error.message?.includes('verify') || error.message?.includes('Verify')) {
      errorMessage = "Please verify your email before logging in";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}, [handleAuthSuccess]);
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
      
      if (err.response?.data?.message?.includes("role required") || 
          err.message?.includes("role required")) {
        const roleError = new Error("Role selection required for new user")
        roleError.requiresRole = true
        throw roleError
      }
      
      throw err
    }
  }, [handleAuthSuccess])

  // Send verification email
  const sendVerificationEmail = useCallback(async () => {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser

      if (!currentUser) {
        throw new Error("No user is currently logged in")
      }

      await sendEmailVerification(currentUser)
      return { success: true, message: "Verification email sent successfully" }
    } catch (error) {
      console.error("Send verification email error:", error)
      throw new Error(error.message || "Failed to send verification email")
    }
  }, [])

  // Check if email is verified
  const checkEmailVerified = useCallback(async () => {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser

      if (!currentUser) {
        return false
      }

      await currentUser.reload()
      return currentUser.emailVerified
    } catch (error) {
      console.error("Check email verified error:", error)
      return false
    }
  }, [])

  // Request password reset
  const resetPassword = useCallback(async (email) => {
    try {
      // Validate email
      if (!email) {
        throw new Error("Please provide an email address")
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error("Please provide a valid email address")
      }

      // Call backend to send reset email
      const response = await api.auth.forgotPassword({ email })
      
      return {
        success: true,
        message: "If your email is registered, you will receive a password reset link"
      }
    } catch (error) {
      console.error("Reset password error:", error)
      throw new Error(error.response?.data?.message || error.message || "Failed to send reset email")
    }
  }, [])

  // Confirm password reset with token
  const confirmPasswordReset = useCallback(async (token, newPassword) => {
    try {
      // Validate password
      if (!newPassword || newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long")
      }

      // Call backend to reset password
      const response = await api.auth.resetPassword(token, { password: newPassword })
      
      if (response && response.token) {
        handleAuthSuccess(response)
      }

      return {
        success: true,
        message: "Password has been reset successfully"
      }
    } catch (error) {
      console.error("Confirm password reset error:", error)
      throw new Error(error.response?.data?.message || error.message || "Failed to reset password")
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
    sendVerificationEmail,
    checkEmailVerified,
    resetPassword,
    confirmPasswordReset,
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