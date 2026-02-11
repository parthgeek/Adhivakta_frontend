"use client";

import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/context/language-context";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export default function Providers({ children }) {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "head",
      }}
    >
      <LanguageProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          forcedTheme="light"
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </GoogleReCaptchaProvider>
  );
}
