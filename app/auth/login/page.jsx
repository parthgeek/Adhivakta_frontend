import { AuthForm } from "@/components/auth/auth-form"
import Image from "next/image"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      {/* Full page background image */}
      <Image
        src="/images/law-library.jpg"
        alt="Law library background"
        fill
        className="object-cover"
        priority
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md rounded-lg border bg-background shadow-xl p-8">
        <div className="flex justify-center items-center mb-8">
          <Link href="/">
            <Image
              src="/images/adhi_logo_main.png"
              alt="Adhivakta Logo"
              width={160}
              height={160}
              style={{ objectFit: 'contain' }}
              className="hover:opacity-90 transition-opacity"
            />
          </Link>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to continue to your legal case management dashboard
          </p>
        </div>

        <AuthForm />

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            By signing in, you agree to our{" "}
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

      {/* Text below card */}
      <div className="relative z-10 mt-6 text-center max-w-md">
        <h2 className="text-xl font-bold text-white">Streamline Your Legal Practice</h2>
        <p className="text-white/75 mt-1 text-sm">
          Join thousands of legal professionals who trust Adhivakta to manage their cases,
          documents, and client relationships efficiently.
        </p>
      </div>
    </div>
  )
}
