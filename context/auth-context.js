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
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth"
import { initializeApp } from "firebase/app"
import api from "@/services/api"
import { toast } from "@/components/ui/use-toast"

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
  const hasSentBeaconRef = useRef(false)

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

  // Best-effort logout when the tab/window is actually being closed
  useEffect(() => {
    if (typeof window === "undefined") return

    const logoutBeacon = () => {
      if (hasSentBeaconRef.current) return
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/logout-beacon`
      const payload = JSON.stringify({ token })
      const blob = new Blob([payload], { type: "application/json" })

      try {
        const sent = navigator.sendBeacon(url, blob)
        if (sent) {
          hasSentBeaconRef.current = true
          return
        }
      } catch (err) {
        console.warn("sendBeacon failed, falling back to fetch", err)
      }

      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }

    window.addEventListener("beforeunload", logoutBeacon)
    window.addEventListener("pagehide", logoutBeacon)

    return () => {
      window.removeEventListener("beforeunload", logoutBeacon)
      window.removeEventListener("pagehide", logoutBeacon)
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

  // Logout all other sessions but keep current one (requires valid auth token)
  const logoutOtherSessions = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) {
        throw new Error("No active session token")
      }

      await api.auth.logoutOtherSessions()
      toast({
        title: "Other sessions closed",
        description: "You have been kept signed in here.",
      })
      return true
    } catch (err) {
      console.error("logoutOtherSessions error:", err)
      toast({
        variant: "destructive",
        title: "Could not close other sessions",
        description: err.message || "Please try again",
      })
      throw err
    }
  }, [])

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

  // Login with email/password (auto-clears previous session server-side)
  const login = useCallback(async (email, password) => {
    try {
      // First try backend email/password login
      const response = await api.auth.login({ email, password })
      handleAuthSuccess(response)
      if (response.previousSessionTerminated) {
        toast({
          title: "Previous session closed",
          description: "We signed you out from other devices and kept you here.",
        })
      }
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
        if (response.previousSessionTerminated) {
          toast({
            title: "Previous session closed",
            description: "We signed you out from other devices and kept you here.",
          })
        }
        return response.user
      } catch (firebaseErr) {
        console.error("Firebase login failed:", firebaseErr)
        throw firebaseErr
      }
    }
  }, [handleAuthSuccess])


  // Register with email/password - UPDATED with proper Firebase handling
  const register = useCallback(async (userData) => {
    if (!['lawyer', 'client'].includes(userData.role)) {
      userData.role = 'client';
    }

    try {
      const { email, password, name } = userData;

      // Basic validation
      if (!email || !password || !name) {
        throw {
          code: 'auth/missing-fields',
          message: 'Please fill in all required fields'
        };
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw {
          code: 'auth/invalid-email',
          message: 'Please enter a valid email address'
        };
      }

      // Password length validation
      if (password.length < 6) {
        throw {
          code: 'auth/weak-password',
          message: 'Password must be at least 6 characters long'
        };
      }

      let firebaseUser = null;
      let firebaseAuth = null;

      try {
        firebaseAuth = getAuth();

        // First, try to create a new Firebase user
        console.log("Attempting to create Firebase user for:", email);
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        firebaseUser = userCredential.user;
        console.log("Firebase user created:", firebaseUser.uid);

        // Update profile with name
        if (name) {
          await updateProfile(firebaseUser, {
            displayName: name
          });
          console.log("Profile updated with name:", name);
        }

        // Send verification email
        await sendEmailVerification(firebaseUser);
        console.log("Verification email sent to:", email);

        // Get ID token for backend registration
        const idToken = await firebaseUser.getIdToken();
        userData.firebaseUID = firebaseUser.uid;
        userData.firebaseIdToken = idToken;

      } catch (firebaseError) {
        console.error("Firebase registration error:", firebaseError.code, firebaseError.message);

        // Handle specific Firebase errors
        switch (firebaseError.code) {
          case 'auth/email-already-in-use':
            // Check if this is an unverified account
            try {
              // Try to sign in to check if email is verified
              const auth = getAuth();
              const existingUserCredential = await signInWithEmailAndPassword(auth, email, password);
              const existingUser = existingUserCredential.user;

              if (!existingUser.emailVerified) {
                // Resend verification email
                await sendEmailVerification(existingUser);
                firebaseUser = existingUser;
                userData.firebaseUID = existingUser.uid;
                const idToken = await existingUser.getIdToken();
                userData.firebaseIdToken = idToken;
                console.log("Resent verification email to existing unverified user");
              } else {
                // Email is already verified - user should log in
                throw {
                  code: 'auth/email-already-in-use-verified',
                  message: 'An account already exists with this email. Please sign in.'
                };
              }
            } catch (signInError) {
              // Can't sign in - password might be different
              if (signInError.code === 'auth/wrong-password') {
                throw {
                  code: 'auth/account-exists-different-password',
                  message: 'An account already exists with this email. Please sign in or use a different email.'
                };
              } else {
                throw firebaseError;
              }
            }
            break;

          case 'auth/invalid-email':
            throw {
              code: 'auth/invalid-email',
              message: 'Please enter a valid email address'
            };

          case 'auth/weak-password':
            throw {
              code: 'auth/weak-password',
              message: 'Password must be at least 6 characters long'
            };

          default:
            throw {
              code: firebaseError.code,
              message: firebaseError.message || 'Registration failed. Please try again.'
            };
        }
      }

      // Register with backend
      try {
        console.log("Registering with backend:", {
          email,
          name,
          role: userData.role,
          hasFirebaseUID: !!userData.firebaseUID
        });

        const response = await api.auth.register({
          name: userData.name,
          email: userData.email,
          password: userData.password, // Still needed for backend
          role: userData.role,
          firebaseUID: userData.firebaseUID,
          // Don't send the token to backend register endpoint
        });

        console.log("Backend registration successful:", response);

        // Sign out from Firebase to prevent auto-login
        if (firebaseUser && firebaseAuth) {
          await firebaseSignOut(firebaseAuth);
          console.log("Signed out from Firebase");
        }

        // Return success
        return {
          success: true,
          needsVerification: true,
          message: "Registration successful! Please check your email for the verification link.",
          user: response.user || { email, name, role: userData.role },
          email: email,
        };

      } catch (backendError) {
        console.error("Backend registration error:", backendError);

        // Rollback: Delete Firebase user if backend registration failed
        if (firebaseUser) {
          try {
            await firebaseUser.delete();
            console.log("Rolled back Firebase user due to backend error");
          } catch (deleteError) {
            console.error("Failed to delete Firebase user:", deleteError);
          }
        }

        // Handle backend errors
        if (backendError.message?.includes("already exists")) {
          throw {
            code: 'auth/email-already-in-use',
            message: 'An account already exists with this email. Please sign in.'
          };
        } else if (backendError.message?.includes("Invalid email")) {
          throw {
            code: 'auth/invalid-email',
            message: 'Please enter a valid email address'
          };
        } else if (backendError.message?.includes("Password must be")) {
          throw {
            code: 'auth/weak-password',
            message: 'Password must be at least 6 characters long'
          };
        } else {
          throw backendError;
        }
      }

    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }, []);

  // Google login - UPDATED FUNCTION
  const loginWithGoogle = useCallback(async (options = {}) => {
    const auth = getAuth()
    const provider = new GoogleAuthProvider()
    let idToken = options.idToken || null

    try {
      if (!options.skipPopup) {
        const result = await signInWithPopup(auth, provider)
        if (!result || !result.user) throw new Error("No user returned")
        const fbUser = result.user
        idToken = await fbUser.getIdToken()
      }

      if (!idToken) throw new Error("Google ID token missing")

      // Build payload with optional parameters
      const payload = {
        idToken,
        role: options.role || null,
        isRegisterFlow: options.isRegisterFlow || false,
      }

      console.log("Sending Google login request with payload:", payload)

      const response = await api.auth.googleLogin(payload)
      console.log("Backend google-login response:", response)

      if (response && response.success) {
        handleAuthSuccess(response)
        if (response.previousSessionTerminated) {
          toast({
            title: "Previous session closed",
            description: "We signed you out from other devices and kept you here.",
          })
        }
        return response.user
      }

      throw new Error(response?.message || "Google login failed")
    } catch (err) {
      console.error("loginWithGoogle error:", err)

      // Check if role is required (for new users)
      if (err.message?.includes("Role required") ||
        err.response?.data?.message?.includes("role required")) {
        const roleError = new Error("Role selection required for new user")
        roleError.requiresRole = true
        throw roleError
      }

      // Handle specific backend errors
      if (err.response?.data?.message?.includes("Account not found")) {
        const notFoundError = new Error("Account not found. Please register first from the sign-up page.")
        notFoundError.code = "auth/user-not-found"
        throw notFoundError
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



  // Password reset - Check backend first, then use Firebase
  const resetPassword = useCallback(async (email) => {
    try {
      console.log("Checking if email exists in backend:", email);

      // First, check with backend to verify email exists
      try {
        const response = await api.auth.forgotPassword({ email });

        // If backend says success, email exists or we should proceed
        if (response.success) {
          console.log("Email verified or proceeding with reset");

          // Now send Firebase reset email
          const auth = getAuth();
          await sendPasswordResetEmail(auth, email);

          console.log("Password reset email sent via Firebase");
          return true;
        }
      } catch (backendError) {
        console.log("Backend check error:", backendError);
        // If backend fails, fall back to Firebase directly
        // But with error handling
      }

      // If backend check failed or returned false, try Firebase directly
      // (for backward compatibility during transition)
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      return true;

    } catch (error) {
      console.error("Password reset error:", error.code, error.message);

      // Map Firebase errors to user-friendly messages
      let userMessage = error.message;

      if (error.code === "auth/user-not-found") {
        userMessage = "No account found with this email address.";
      } else if (error.code === "auth/invalid-email") {
        userMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/too-many-requests") {
        userMessage = "Too many attempts. Please try again later.";
      } else if (error.code === "auth/network-request-failed") {
        userMessage = "Network error. Please check your connection and try again.";
      }

      throw {
        code: error.code || "auth/unknown-error",
        message: userMessage
      };
    }
  }, []);

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
