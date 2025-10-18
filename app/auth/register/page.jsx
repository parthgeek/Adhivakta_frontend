import { RegisterForm } from "@/components/auth/register-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { LogoAvatar } from "@/components/ui/avatar"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="grid w-full max-w-[1000px] grid-cols-1 md:grid-cols-2 gap-8 rounded-lg border bg-background shadow">
        <div className="flex flex-col justify-center p-8">
          <div className="flex justify-center items-center my-8">
            <Image src="/adhi_logo_main.png" alt="Adhivakta Logo" width={160} height={160} style={{objectFit: 'contain'}} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Create an account</CardTitle>
              <CardDescription>Get started with Adhivakta legal case management</CardDescription>
            </CardHeader>
            <CardContent>
              <RegisterForm />
            </CardContent>
          </Card>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
        <div className="hidden md:flex items-center justify-center bg-muted rounded-r-lg p-8">
          <div className="max-w-md space-y-4 text-center">
            <div className="flex justify-center">
              <div className="relative h-40 w-40">
                <Image src="/images/bg_1.jpg" alt="Law document" fill className="object-cover" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">Elevate your legal practice</h2>
            <p className="text-muted-foreground">
              Join thousands of legal professionals who trust Adhivakta to manage their cases, documents, and client
              relationships.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
