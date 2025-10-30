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

export function RegisterForm() {
  const [accountType, setAccountType] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
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
      toast({ variant: 'destructive', title: 'Sign-up Failed', description: err?.message || 'Could not complete Google sign-up. Try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">Account Type</label>
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

      <Button type="button" variant="outline" className="w-full flex items-center justify-center" onClick={handleGoogleLogin} disabled={isLoading || !accountType}>
        {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>) : (<><FcGoogle className="mr-2 h-4 w-4" /> Continue with Google</>)}
      </Button>

      {!accountType && <p className="text-xs text-center text-muted-foreground">Please select your account type before using Google sign-up.</p>}
    </div>
  )
}
