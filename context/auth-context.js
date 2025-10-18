"use client"

import { createContext, useState, useEffect, useContext } from "react"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth"
import { initializeApp } from "firebase/app"
import api from "@/services/api"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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
      console.error("Firebase initialization error:", error)
    }
  }, [])

  useEffect(() => {
    // Check for user in localStorage first (for persistent sessions)
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user")
      const token = localStorage.getItem("auth_token")

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (e) {
          console.error("Error parsing stored user:", e)
          localStorage.removeItem("user")
          localStorage.removeItem("auth_token")
        }
      }

      // If we have a token, verify with backend
      const verifyToken = async () => {
        if (!token) {
          setLoading(false)
          return
        }

        try {
          const response = await api.auth.verifyToken()
          if (response && response.user) {
            setUser(response.user)
            localStorage.setItem("user", JSON.stringify(response.user))
          }
        } catch (error) {
          console.error("Token verification failed:", error)
          // Clear invalid token
          localStorage.removeItem("auth_token")
          localStorage.removeItem("user")
          setUser(null)
        } finally {
          setLoading(false)
        }
      }

      verifyToken()
    }
  }, [])

  const login = async (email, password) => {
    try {
      // First try to authenticate with Firebase
      const auth = getAuth()
      await signInWithEmailAndPassword(auth, email, password)
      const idToken = await auth.currentUser.getIdToken()

      // Call backend login API with the Firebase token
      const response = await api.auth.googleLogin({ idToken })

      handleAuthSuccess(response)
      return response.user
    } catch (firebaseError) {
      console.log("Firebase auth failed, trying regular login:", firebaseError)

      try {
        // If Firebase fails, try regular login
        const response = await api.auth.login({ email, password })
        handleAuthSuccess(response)
        return response.user
      } catch (error) {
        console.error("Login error:", error)
        throw error || new Error("Login failed")
      }
    }
  }

  const register = async (userData) => {
  // Ensure only 'lawyer' and 'client' roles
  if (!['lawyer', 'client'].includes(userData.role)) {
    userData.role = 'client';
  }
    try {
      const { email, password, name, role } = userData

      // Try to create Firebase account first if we have email/password
      if (email && password) {
        try {
          const auth = getAuth()
          await createUserWithEmailAndPassword(auth, email, password)
        } catch (firebaseError) {
          console.error("Firebase registration error:", firebaseError)
          // Continue with backend registration even if Firebase fails
        }
      }

      // Call backend registration API
      const response = await api.auth.register(userData)

      handleAuthSuccess(response)
      return response.user
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  const loginWithGoogle = async () => {
    try {
      const auth = getAuth()
      const provider = new GoogleAuthProvider()

      // Sign in with Google
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()

      // Call backend to verify and get user data
      const response = await api.auth.googleLogin({ idToken })

      handleAuthSuccess(response)
      return response.user
    } catch (error) {
      console.error("Google login error:", error)
      throw error
    }
  }

  const handleAuthSuccess = (response) => {
    if (response && response.token && response.user) {
      localStorage.setItem("auth_token", response.token)
      localStorage.setItem("user", JSON.stringify(response.user))
      setUser(response.user)
    } else {
      throw new Error("Invalid response from server")
    }
  }

  const logout = async () => {
    try {
      // Sign out from Firebase
      const auth = getAuth()
      await auth.signOut()

      // Call backend logout API
      await api.auth.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Always clear local storage
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user")
      setUser(null)
    }
  }

  // Add a method to refresh user from backend
  const refreshUser = async () => {
    try {
      const profile = await api.users.getProfile();
      if (profile && profile.data) {
        setUser(profile.data);
        localStorage.setItem("user", JSON.stringify(profile.data));
      }
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        loginWithGoogle,
        refreshUser, // Expose refreshUser
      }}
    >
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
