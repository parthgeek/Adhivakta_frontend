"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { SidebarProvider } from "@/context/sidebar-context";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import NyaAIWidget from "@/components/nyai/NyaAIWidget";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } else {
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [mounted]);

  // Inactivity auto-logout, driven by the user's saved "Session Timeout" security setting.
  useEffect(() => {
    if (!mounted || !user) return;

    let timer;
    const getTimeoutMs = () => {
      const minutes = parseInt(localStorage.getItem("sessionTimeout") || "30", 10);
      const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 30;
      return safeMinutes * 60 * 1000;
    };

    const doLogout = () => {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      sessionStorage.clear();
      window.location.href = "/auth/login?reason=timeout";
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(doLogout, getTimeoutMs());
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [mounted, user]);

  if (!mounted || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
        <NyaAIWidget />
      </div>
    </SidebarProvider>
  );
}
