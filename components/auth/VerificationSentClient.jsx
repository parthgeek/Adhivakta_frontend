"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Mail, ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function VerificationSentClient() {
  const [email, setEmail] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleResendEmail = async () => {
    // TODO: Implement resend verification email
    console.log("Resend verification email to:", email);
    alert("Verification email resent!");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image
              src="/images/adhi_logo_main.png"
              alt="Adhivakta Logo"
              width={120}
              height={120}
              style={{ objectFit: "contain" }}
              className="hover:opacity-90 transition-opacity"
            />
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Registration successful! Please check your inbox for the verification email.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-center p-4 border rounded-lg">
              <Mail className="h-8 w-8 text-muted-foreground mr-3" />
              <div>
                <p className="font-medium">Email sent to:</p>
                <p className="text-sm text-muted-foreground">{email || "your email address"}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-medium">What's next?</p>
              <ul className="space-y-1 text-muted-foreground list-disc pl-4">
                <li>Check your inbox for an email from Adhivakta</li>
                <li>Click the verification link in the email</li>
                <li>Once verified, you can sign in to your account</li>
              </ul>
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
              <p className="font-medium mb-1">Didn't receive the email?</p>
              <p>• Check your spam or junk folder</p>
              <p>• Make sure you entered the correct email address</p>
              <p>• Wait a few minutes and check again</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendEmail}
            >
              Resend verification email
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
