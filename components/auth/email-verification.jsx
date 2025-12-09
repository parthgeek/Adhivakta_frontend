// email-verification.jsx — improved component
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function EmailVerification() {
  const { sendVerificationEmail, checkEmailVerified, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isVerified, setIsVerified] = useState(null)
// Add this to your email-verification.jsx or register-form.jsx
const checkVerificationStatus = async () => {
  setCheckingVerification(true);
  try {
    const response = await api.auth.updateVerificationStatus();
    
    if (response.isVerified) {
      toast({
        title: "Email Verified!",
        description: "Your email has been verified successfully.",
      });
      
      // If this is during registration, redirect to login
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
      
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Not Verified Yet",
        description: "Please click the verification link in your email.",
      });
      return false;
    }
  } catch (error) {
    console.error("Verification check error:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Could not check verification status.",
    });
    return false;
  } finally {
    setCheckingVerification(false);
  }
};
  useEffect(() => {
    let mounted = true
    const check = async () => {
      if (!user) return
      const verified = await checkEmailVerified()
      if (mounted) setIsVerified(verified)
    }
    check()
    return () => { mounted = false }
  }, [user, checkEmailVerified])

  if (isVerified === true) {
    return null
  }

  const handleResendVerification = async () => {
    setLoading(true)
    setMessage('')
    try {
      await sendVerificationEmail()
      setMessage('Verification email sent! Please check your inbox.')
    } catch (error) {
      setMessage('Failed to send verification email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          Please verify your email address to access all features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            A verification email has been sent to {user?.email}. Please check your inbox and click the verification link.
          </AlertDescription>
        </Alert>

        {message && (
          <Alert variant={message.includes('Failed') ? 'destructive' : 'default'}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleResendVerification} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </Button>

          <Button
            onClick={async () => {
              setLoading(true)
              try {
                const verified = await checkEmailVerified()
                if (verified) {
                  setIsVerified(true)
                  setMessage('Email verified — you can login now.')
                } else {
                  setMessage('Email not verified yet. Please click the link in the email.')
                }
              } catch (e) {
                setMessage('Could not check verification status. Try again.')
              } finally {
                setLoading(false)
              }
            }}
            variant="outline"
            className="w-full"
          >
            Check verification status
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
