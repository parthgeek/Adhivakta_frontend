"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState("")
  const { login, loginWithGoogle } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e, forceLogin = false) => {
    e?.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(email, password, forceLogin)
      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)

      // User-friendly error messages
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        setError("Invalid email or password. Please try again.")
      } else if (error.code === "auth/user-not-found") {
        setError("No account found with this email. Please sign up first.")
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.")
      } else if (error.code === "auth/email-not-verified") {
        setError("Please verify your email before logging in. Check your inbox.")
      } else if (error.code === "auth/user-disabled") {
        setError("This account has been disabled. Please contact support.")
      } else {
        setError(error.message || "Failed to sign in. Please try again.")
      }

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid email or password",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("")
    setIsLoading(true)

    try {
      await loginWithGoogle()
      toast({
        title: "Welcome!",
        description: "Successfully logged in with Google.",
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("Google login error:", error)
      // Handle specific error for new users
      if (error.message && error.message.includes("Please register first")) {
        setError("Account not found. Please register first from the sign-up page.")
        toast({
          variant: "destructive",
          title: "Account Not Found",
          description: "Please register first from the sign-up page.",
        })
        // Optionally redirect to register page after showing error
        setTimeout(() => {
          router.push("/auth/register")
        }, 2000)
      } else {
        setError(error.message || "Google login failed. Please try again.")
        toast({
          variant: "destructive",
          title: "Google Login Failed",
          description: error.message || "Could not sign in with Google",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast({
        variant: "destructive",
        title: "Selection Required",
        description: "Please select your role to continue.",
      })
      return
    }

    setIsLoading(true)
    try {
      await loginWithGoogle({ role: selectedRole, isRegisterFlow: true })
      setShowRoleDialog(false)
      toast({
        title: "Welcome!",
        description: "Account created successfully.",
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("Google login with role error:", error)
      setError("Failed to complete registration. Please try again.")
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: error.message || "Failed to complete registration",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{error}</div>}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              asChild
              type="button"
            >
              <Link href="/auth/forgot-password">
                Forgot password?
              </Link>
            </Button>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" checked={remember} onCheckedChange={setRemember} disabled={isLoading} />
            <Label htmlFor="remember" className="text-sm font-normal">
              Remember me
            </Label>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in with Email"
          )}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        <FcGoogle className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>

      {/* Role Selection Dialog for New Google Users */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Your Role</DialogTitle>
            <DialogDescription>
              Please select your role to complete your account setup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">I am a:</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lawyer">Lawyer</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleRoleSelection}
              className="w-full"
              disabled={isLoading || !selectedRole}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
