'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Mail } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/components/ui/use-toast'

export function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accountType, setAccountType] = useState('')
  const [terms, setTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)

  const { register, loginWithGoogle, sendVerificationEmail } = useAuth()
  const router = useRouter()

 
// In register-form.jsx - Update the handleSubmit function
const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')

  // Validate inputs
  if (!name || !email || !password || !confirmPassword) {
    setError('Please fill in all fields')
    return
  }

  if (password !== confirmPassword) {
    setError('Passwords do not match')
    return
  }

  if (password.length < 6) {
    setError('Password must be at least 6 characters long')
    return
  }

  if (!accountType) {
    setError('Please select an account type')
    return
  }

  if (!terms) {
    setError('Please accept the terms of service')
    return
  }

  setIsLoading(true)

  try {
    const userData = {
      name,
      email: email.toLowerCase(), // Normalize email
      password,
      role: accountType,
    }

    console.log("Registering user:", userData);
    const result = await register(userData)
    
    if (result.success) {
      toast({
        title: "Registration Successful!",
        description: result.message || "Your account has been created successfully.",
      })
      
      if (result.needsVerification) {
        setShowVerificationMessage(true)
      } else {
        // If no verification needed, redirect to dashboard
        router.push('/dashboard')
      }
    } else {
      throw new Error(result.message || 'Registration failed')
    }
  } catch (err) {
    console.error('Registration error:', err)
    const errorMessage = err?.message || 'Registration failed. Please try again.'
    setError(errorMessage)
    toast({
      variant: "destructive",
      title: "Registration Failed",
      description: errorMessage,
    })
  } finally {
    setIsLoading(false)
  }
}

// Update the Google login function in register-form.jsx
const handleGoogleLogin = async () => {
  setError('')

  if (!accountType) {
    setError('Please select an account type before continuing with Google login.')
    toast({
      variant: "destructive",
      title: "Account Type Required",
      description: "Please select whether you're a lawyer or client first.",
    })
    return
  }

  setIsLoading(true)
  try {
    await loginWithGoogle(accountType)
    toast({
      title: "Success!",
      description: "Account created with Google successfully!",
    })
    router.push('/dashboard')
  } catch (err) {
    console.error('Google login failed:', err)
    
    // Handle role requirement for Google signup
    if (err.requiresRole) {
      setError('Please select your account type first')
    } else {
      const errorMessage = err?.message || 'Google login failed. Please try again.'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Google Login Failed",
        description: errorMessage,
      })
    }
  } finally {
    setIsLoading(false)
  }
}



  const handleResendVerification = async () => {
    setIsLoading(true)
    try {
      await sendVerificationEmail()
      toast({
        title: "Email Sent",
        description: "Verification email has been resent.",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to Send Email",
        description: "Could not resend verification email. Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (showVerificationMessage) {
    return (
      <div className="space-y-4">
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Check your email!</p>
              <p className="text-sm">
                We've sent a verification link to <strong>{email}</strong>.
                Please check your inbox and click the link to verify your account.
              </p>
            </div>
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleResendVerification} 
            variant="outline" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend Verification Email'
            )}
          </Button>
          
          <Button 
            onClick={() => router.push('/dashboard')} 
            variant="default"
          >
            Continue to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          disabled={isLoading}
          placeholder="John Doe"
        />
      </div>

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
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          placeholder="At least 6 characters"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isLoading}
          placeholder="Re-enter your password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountType">Account Type</Label>
        <Select value={accountType} onValueChange={setAccountType}>
          <SelectTrigger aria-label="Account type">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lawyer">Lawyer</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="terms" 
          checked={terms} 
          onCheckedChange={setTerms} 
          required 
          disabled={isLoading} 
        />
        <Label htmlFor="terms" className="text-sm font-normal">
          I agree to the terms of service and privacy policy
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !terms}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center"
        onClick={handleGoogleLogin}
        disabled={isLoading || !accountType}
        aria-disabled={isLoading || !accountType}
        title={!accountType ? 'Select account type first' : 'Continue with Google'}
      >
        <FcGoogle className="mr-2 h-4 w-4" />
        {isLoading ? 'Processing...' : 'Sign up with Google'}
      </Button>

      {!accountType && (
        <p className="text-xs text-center text-muted-foreground">
          Please select your account type above before using Google sign-up
        </p>
      )}
    </form>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white border rounded-2xl shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">Create an account</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Choose whether you're signing up as a lawyer or a client
        </p>
        <RegisterForm />
      </div>
    </div>
  )
}