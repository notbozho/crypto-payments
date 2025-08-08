"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Loader2 } from "lucide-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./(components)/DashboardSidebar";
import { DashboardHeader } from "./(components)/DashboardHeader";

export default function DashboardLayoutPage({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isAuthenticated, loading, checkAuth } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/auth/signin");
        }
    }, [isAuthenticated, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <>
            <SidebarProvider>
                <DashboardSidebar />
                <SidebarInset>
                    <DashboardHeader />
                    <main className="flex-1 p-6">{children}</main>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
