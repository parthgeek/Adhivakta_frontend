"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/auth-context";
import { RealTimeCountsProvider } from "@/context/realtime-counts-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import NotificationListener from "@/components/NotificationListener";
import { LanguageProvider } from "@/context/language-context";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export default function Providers({ children }: { children: ReactNode }) {
  const reCaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const content = (
    <LanguageProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        forcedTheme="light"
      >
        <AuthProvider>
          <RealTimeCountsProvider>
            {children}
            <NotificationListener />
            <SonnerToaster richColors position="top-right" />
          </RealTimeCountsProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );

  if (!reCaptchaKey) {
    return content;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={reCaptchaKey}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "head",
      }}
    >
      {content}
    </GoogleReCaptchaProvider>
  );
}
