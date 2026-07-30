"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function RegisterFormEmail({ defaultRole = "client", defaultOrganizationName = "" }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: defaultRole,
    organizationName: defaultOrganizationName,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { register } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      role: defaultRole || "client",
      organizationName: defaultOrganizationName || "",
    }))
  }, [defaultRole, defaultOrganizationName])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value) => {
    setFormData(prev => ({ ...prev, role: value }))
  }
const handleSubmit = async (e) => {
  e.preventDefault()
  setError("")

  // Validation
  if (formData.password !== formData.confirmPassword) {
    setError("Passwords do not match")
    return
  }

  if (formData.password.length < 6) {
    setError("Password must be at least 6 characters")
    return
  }

  if (formData.role === "organization_admin" && !formData.organizationName.trim()) {
    setError("Organization name is required")
    return
  }

  setIsLoading(true)

  try {
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      organizationName: formData.organizationName.trim(),
    })

    // Handle verification required
    if (result.needsVerification) {
      toast({
        title: "Registration successful!",
        description: "Please check your email for verification link before logging in.",
        variant: "default",
      })
      
      // Redirect to verification page or show message
      router.push("/auth/verification-sent?email=" + encodeURIComponent(formData.email))
      return
    }
    
    // If no verification needed (shouldn't happen with our current flow)
    toast({
      title: "Registration successful!",
      description: "Welcome to Adhivakta!",
    })
    router.push("/dashboard")
    
  } catch (err) {
    console.error("Registration error:", err)
    
    // Handle specific error messages
    if (err.code === "auth/email-already-in-use" || 
        err.message?.includes("already exists")) {
      setError("An account already exists with this email. Please sign in instead.")
      toast({
        variant: 'destructive',
        title: 'Email Already Registered',
        description: 'Please sign in instead.',
      })
    } else if (err.message?.includes("registered with Google")) {
      setError("This email is registered with Google. Please use Google login.")
    } else if (err.message?.includes("Invalid email")) {
      setError("Please enter a valid email address.")
    } else if (err.message?.includes("Password must be at least")) {
      setError("Password must be at least 6 characters long.")
    } else if (err.message?.includes("Invalid role")) {
      setError("Please select a valid account type.")
    } else if (err.message?.includes("Organization name")) {
      setError("Organization name is required.")
    } else if (err.message?.includes("verification email")) {
      // Handle case where verification email was resent
      setError(err.message)
      toast({
        title: "Verification Email Sent",
        description: err.message,
      })
    } else {
      setError(err.message || "Failed to create account. Please try again.")
      
      // Show toast only for non-validation errors
      if (!err.message?.includes("already exists") && 
          !err.message?.includes("Password must be") &&
          !err.message?.includes("Invalid")) {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: err.message || "Failed to create account",
        })
      }
    }
  } finally {
    setIsLoading(false)
  }
}

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="John Doe"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="name@example.com"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="role">Account Type</Label>
        <Select value={formData.role} onValueChange={handleRoleChange} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Select account type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="lawyer">Advocate</SelectItem>
            <SelectItem value="organization_admin">Organization Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.role === "organization_admin" && (
        <div className="space-y-2">
          <Label htmlFor="organizationName">Organization Name</Label>
          <Input
            id="organizationName"
            name="organizationName"
            placeholder="Your law firm or legal team"
            value={formData.organizationName}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="At least 6 characters"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Sign up with Email
          </>
        )}
      </Button>
    </form>
  )
}
