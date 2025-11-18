"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { SidebarProvider } from "@/context/sidebar-context";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import NotificationListener from "@/components/NotificationListener";

import Toaster from "@/components/Toaster";

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
          // Not authenticated -> send to login
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
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Show loading spinner while checking auth / hydration
  if (!mounted || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  // If user is missing after auth check, return null (router.push will redirect)
  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>

      {/* Global Toaster for your project's toast UI (use-toast.ts) */}
      <Toaster />

      {/* Real-time socket listener to trigger popups; pass the current user */}
      <NotificationListener user={user} />
    </SidebarProvider>
  );
}