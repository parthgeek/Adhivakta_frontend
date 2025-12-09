'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FcGoogle } from 'react-icons/fc'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/components/ui/use-toast'
import { Separator } from '@/components/ui/separator'
import { RegisterFormEmail } from './register-form-email'

export function RegisterForm() {
  const [accountType, setAccountType] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(false)
  const router = useRouter()
  const { loginWithGoogle } = useAuth()

  const handleGoogleLogin = async () => {
    setError('')

    if (!accountType) {
      setError('Please select an account type before continuing with Google.')
      toast({
        variant: 'destructive',
        title: 'Account Type Required',
        description: 'Please choose whether you are a lawyer or client first.',
      })
      return
    }

    setIsLoading(true)
    try {
      await loginWithGoogle(accountType)
      toast({ title: 'Success!', description: 'You have successfully signed up with Google.' })
      router.push('/dashboard')
    } catch (err) {
      console.error('Google sign-up failed:', err)
      toast({ 
        variant: 'destructive', 
        title: 'Sign-up Failed', 
        description: err?.message || 'Could not complete Google sign-up. Try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignup = () => {
    if (!accountType) {
      setError('Please select an account type before continuing.')
      toast({
        variant: 'destructive',
        title: 'Account Type Required',
        description: 'Please choose whether you are a lawyer or client first.',
      })
      return
    }
    setShowEmailForm(true)
  }

  if (showEmailForm) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Email Registration</h3>
          <p className="text-sm text-muted-foreground">
            Creating {accountType === 'lawyer' ? 'lawyer' : 'client'} account
          </p>
        </div>
        <RegisterFormEmail defaultRole={accountType} />
        <Button 
          variant="ghost" 
          className="w-full" 
          onClick={() => setShowEmailForm(false)}
        >
          ← Back to signup options
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">
          Account Type
        </label>
        <Select value={accountType} onValueChange={setAccountType} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lawyer">Lawyer</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Button 
          type="button" 
          variant="outline" 
          className="w-full flex items-center justify-center" 
          onClick={handleGoogleLogin} 
          disabled={isLoading || !accountType}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Processing...
            </>
          ) : (
            <>
              <FcGoogle className="mr-2 h-4 w-4" /> 
              Continue with Google
            </>
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button 
          type="button" 
          className="w-full" 
          onClick={handleEmailSignup}
          disabled={!accountType}
        >
          Sign up with Email
        </Button>
      </div>

      {!accountType && (
        <p className="text-xs text-center text-muted-foreground">
          Please select your account type to continue
        </p>
      )}
    </div>
  )
}