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
  sendPasswordResetEmail, // Add this
  updateProfile,
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
          console.log("Backend logout failed:", err.message)
        }
      }

      try {
        const auth = getAuth()
        await firebaseSignOut(auth)
      } catch (err) {
        console.log("Firebase signout failed:", err.message)
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

  // Validate session
  const validateSession = useCallback(async (force = false) => {
    if (pathname?.includes('/auth/')) {
      return isAuthenticated
    }

    if (isValidatingRef.current && !force) {
      return isAuthenticated
    }

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

      if (!pathname?.includes('/auth/')) {
        await validateSession(true)
      } else {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

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
      console.log("Backend login failed, trying Firebase:", backendErr.message)
      try {
        const auth = getAuth()
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const fbUser = userCredential.user
        
        // Check if email is verified
        if (!fbUser.emailVerified) {
          throw {
            code: 'auth/email-not-verified',
            message: 'Please verify your email before logging in'
          }
        }
        
        const idToken = await fbUser.getIdToken()
        const response = await api.auth.googleLogin({ idToken })
        handleAuthSuccess(response)
        return response.user
      } catch (firebaseErr) {
        console.error("Firebase login failed:", firebaseErr)
        throw firebaseErr
      }
    }
  }, [handleAuthSuccess])

  // Register with email/password
const register = useCallback(async (userData) => {
  if (!['lawyer', 'client'].includes(userData.role)) {
    userData.role = 'client';
  }

  try {
    const { email, password, name } = userData;
    let firebaseUser = null;

    if (email && password) {
      try {
        const auth = getAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;

        // Update profile with name
        if (name) {
          await updateProfile(firebaseUser, {
            displayName: name
          });
        }

        // Send verification email
        await sendEmailVerification(firebaseUser);
        console.log("Verification email sent to:", email);

        userData.firebaseUID = firebaseUser.uid;
        // Don't need idToken for registration

      } catch (firebaseError) {
        console.error("Firebase registration failed:", firebaseError);
        if (firebaseError.code === 'auth/email-already-in-use') {
          throw {
            code: 'auth/email-already-in-use',
            message: 'An account already exists with this email. Please sign in.'
          }
        }
        throw firebaseError;
      }
    }

    // Register with backend
    const response = await api.auth.register(userData);
    console.log("Backend registration response:", response);

    // Sign out from Firebase immediately after registration
    // User needs to verify email before logging in
    if (firebaseUser) {
      const auth = getAuth();
      await firebaseSignOut(auth);
    }

    // Always return success with verification needed
    return {
      success: true,
      needsVerification: true,
      message: "Please check your email for verification link",
      user: response.user,
      email: email,
    };

  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}, []);

  // Google login
  const loginWithGoogle = useCallback(async (role = null) => {
    const auth = getAuth()
    const provider = new GoogleAuthProvider()

    try {
      const result = await signInWithPopup(auth, provider)
      if (!result || !result.user) throw new Error("No user returned")

      const fbUser = result.user
      const idToken = await fbUser.getIdToken()

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
      try {
        await api.auth.resendVerification()
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
      const response = await api.auth.getMe();
      
      if (response?.user?.emailVerified) {
        return true;
      }

      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        await currentUser.reload();
        if (currentUser.emailVerified) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Failed to check email verification:", error);
      return false;
    }
  }, []);

  // Password reset
  const resetPassword = useCallback(async (email) => {
    try {
      const auth = getAuth()
      await sendPasswordResetEmail(auth, email)
      return true
    } catch (error) {
      console.error("Password reset error:", error)
      throw error
    }
  }, [])

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const response = await api.auth.changePassword({
        currentPassword,
        newPassword
      })
      return response
    } catch (error) {
      console.error("Change password error:", error)
      throw error
    }
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    loginWithGoogle,
    resetPassword,
    changePassword,
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