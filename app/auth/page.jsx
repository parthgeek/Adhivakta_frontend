import { AuthForm } from "@/components/auth/auth-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="grid w-full max-w-[1000px] grid-cols-1 md:grid-cols-2 gap-8 rounded-lg border bg-background shadow">
        <div className="flex flex-col justify-center p-8">
          <div className="flex justify-center items-center mb-8">
            <Link href="/">
              <Image 
                src="/adhi_logo_main.png" 
                alt="Adhivakta Logo" 
                width={160} 
                height={160} 
                style={{ objectFit: 'contain' }} 
                className="hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Get Started</h1>
            <p className="text-muted-foreground mt-2">
              Create your account and elevate your legal practice
            </p>
          </div>
          
          <AuthForm />
          
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
        
        <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-muted rounded-r-lg p-12">
          <div className="max-w-md space-y-8 text-center">
            <div className="relative h-64 w-64 mx-auto">
              <Image 
                src="/images/bg_1.jpg" 
                alt="Legal document" 
                fill 
                className="object-cover rounded-lg shadow-lg"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Why Choose Adhivakta?</h2>
              <ul className="space-y-3 text-left">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Complete case management system</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Secure document storage and sharing</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Client communication portal</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Court date and deadline tracking</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Already trusted by 500+ law firms and 10,000+ clients nationwide
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}