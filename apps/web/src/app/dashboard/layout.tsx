"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./components/DashboardSidebar";
import { DashboardHeader } from "./components/DashboardHeader";

export default function DashboardLayoutPage({
    children,
}: {
    children: React.ReactNode;
}) {
    const checkAuth = useAuthStore((s) => s.checkAuth);
    const authStatus = useAuthStore((s) => s.authStatus);
    const loading = useAuthStore((s) => s.loading);

    useEffect(() => {
        if (authStatus === "unknown" && !loading) {
            checkAuth();
        }
    }, [authStatus, loading, checkAuth]);

    return (
        <>
            <SidebarProvider>
                <DashboardSidebar />
                <SidebarInset>
                    <DashboardHeader />
                    {authStatus === "authenticated" && (
                        <main className="flex-1 p-6">{children}</main>
                    )}
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
