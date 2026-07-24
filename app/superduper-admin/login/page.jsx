"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/admin/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { admin, loading, login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && admin) router.replace("/superduper-admin/dashboard")
  }, [admin, loading, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      router.replace("/superduper-admin/dashboard")
    } catch (err) {
      setError(err.message || "Login failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8fafc] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.10),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f4f7fb_100%)]" aria-hidden />
      <Card className="relative w-full max-w-sm border-[#d9e2ef] shadow-[0_24px_70px_rgba(3,35,75,0.14)]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-28 w-28 items-center justify-center">
            <Image
              src="/images/adhi_logo_main.png"
              alt="Adhivakta"
              width={112}
              height={112}
              priority
              className="h-28 w-28 object-contain"
            />
          </div>
          <CardTitle className="text-xl text-[#03234b]">Adhivakta Admin</CardTitle>
          <CardDescription>Sign in with an administrator account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
