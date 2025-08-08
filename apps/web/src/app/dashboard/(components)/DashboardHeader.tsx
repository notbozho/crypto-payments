"use client";

import { useState } from "react";
import { Bell, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mockNotifications = [
    {
        id: "1",
        type: "payment_received",
        title: "Payment Received",
        message: "0.5 ETH received from 0x1234...5678",
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    },
    {
        id: "2",
        type: "link_expired",
        title: "Payment Link Expiring",
        message: "Payment link will expire in 24 hours",
        read: false,
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    },
    {
        id: "3",
        type: "link_created",
        title: "Payment Link Created",
        message: "New payment link created successfully",
        read: true,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    },
];

function NotificationsDropdown() {
    const [notifications, setNotifications] = useState(mockNotifications);
    const [open, setOpen] = useState(false);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const dismissNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const getNotificationIcon = (type: string) => {
        return "🔔";
    };

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60)
        );

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440)
            return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Notifications</h4>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {unreadCount} new
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 border-b border-border hover:bg-muted/50 cursor-pointer ${
                                    !notification.read ? "bg-muted/30" : ""
                                }`}
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">
                                                {getNotificationIcon(
                                                    notification.type
                                                )}
                                            </span>
                                            <p className="font-medium text-sm">
                                                {notification.title}
                                            </p>
                                            {!notification.read && (
                                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatTimeAgo(
                                                notification.createdAt
                                            )}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dismissNotification(
                                                notification.id
                                            );
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="p-2 border-t">
                        <Button variant="ghost" className="w-full text-xs">
                            Mark all as read
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function DashboardHeader() {
    const [showCreateLink, setShowCreateLink] = useState(false);

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <h1 className="text-lg font-semibold">Dashboard</h1>

                <div className="ml-auto flex items-center gap-2">
                    <Button
                        onClick={() => setShowCreateLink(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">
                            New Payment Link
                        </span>
                    </Button>

                    <NotificationsDropdown />
                </div>
            </header>

            {/* <CreatePaymentLinkDialog */}
            {/* open={showCreateLink} */}
            {/* onOpenChange={setShowCreateLink} */}
            {/* /> */}
        </>
    );
}
