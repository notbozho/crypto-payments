"use client";

import { JSX, useEffect } from "react";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    CreditCard,
    Activity,
    Clock,
    CheckCircle,
    AlertTriangle,
    Copy,
    ExternalLink,
    Filter,
    Download,
    RefreshCw,
    AlertCircle,
    Loader2,
} from "lucide-react";

import { useDashboardStore } from "@/store/dashboard";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    getTokenByAddress,
    getNativeToken,
    ChainType,
} from "@crypto-payments/shared";
import { toast } from "sonner";

function StatsCards() {
    const { stats, loading, errors, fetchPaymentLinks } = useDashboardStore();

    if (loading.paymentLinks) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array(4)
                    .fill(0)
                    .map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-4 bg-muted rounded w-20"></div>
                                <div className="h-8 bg-muted rounded w-24"></div>
                            </CardHeader>
                            <CardFooter>
                                <div className="h-4 bg-muted rounded w-16"></div>
                            </CardFooter>
                        </Card>
                    ))}
            </div>
        );
    }

    if (errors.paymentLinks) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error loading stats</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                    <span>{errors.paymentLinks}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchPaymentLinks}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    const statsData = [
        {
            title: "Total Revenue",
            value: stats?.totalRevenue?.value || "$0.00",
            change: stats?.totalRevenue?.change || "0%",
            changeType: stats?.totalRevenue?.changeType || "increase",
            icon: DollarSign,
            description: "Total earnings this month",
        },
        {
            title: "Active Links",
            value: stats?.activeLinks?.value?.toString() || "0",
            change: stats?.activeLinks?.change || "0",
            changeType: stats?.activeLinks?.changeType || "increase",
            icon: CreditCard,
            description: "Currently active payment links",
        },
        {
            title: "Total Transactions",
            value: stats?.totalTransactions?.value?.toString() || "0",
            change: stats?.totalTransactions?.change || "0%",
            changeType: stats?.totalTransactions?.changeType || "increase",
            icon: Activity,
            description: "Completed payments",
        },
        {
            title: "Success Rate",
            value: stats?.successRate?.value || "0%",
            change: stats?.successRate?.change || "0%",
            changeType: stats?.successRate?.changeType || "increase",
            icon: TrendingUp,
            description: "Payment completion rate",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardDescription>{stat.title}</CardDescription>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                    <CardFooter className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                        >
                            {stat.changeType === "increase" ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            {stat.change}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                            {stat.description}
                        </p>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

function PaymentLinksTable() {
    const { paymentLinks, loading, errors, fetchPaymentLinks } =
        useDashboardStore();

    type StatusType = "pending" | "paid" | "confirmed" | "failed" | "expired";
    const getStatusBadge = (status: StatusType | string) => {
        const variants: Record<
            StatusType,
            "default" | "secondary" | "destructive" | "outline"
        > = {
            pending: "outline",
            paid: "default",
            confirmed: "default",
            failed: "destructive",
            expired: "secondary",
        };

        const icons: Record<StatusType, JSX.Element> = {
            pending: <Clock className="h-3 w-3" />,
            paid: <CheckCircle className="h-3 w-3" />,
            confirmed: <CheckCircle className="h-3 w-3" />,
            failed: <AlertTriangle className="h-3 w-3" />,
            expired: <Clock className="h-3 w-3" />,
        };

        return (
            <Badge
                variant={variants[status as StatusType] || "outline"}
                className="flex items-center gap-1"
            >
                {icons[status as StatusType] || <Clock className="h-3 w-3" />}
                <span className="capitalize">{status}</span>
            </Badge>
        );
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getTokenInfo = (chainType: string, tokenAddress: string) => {
        const token =
            getTokenByAddress(chainType as ChainType, tokenAddress) ||
            getNativeToken(chainType as ChainType);
        return token?.symbol || "Unknown";
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Payment Links</CardTitle>
                        <CardDescription>
                            Your created payment links and their status
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchPaymentLinks}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading.paymentLinks ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : errors.paymentLinks ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error loading payment links</AlertTitle>
                        <AlertDescription className="flex items-center justify-between">
                            <span>{errors.paymentLinks}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchPaymentLinks}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Wallet Address</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paymentLinks.length > 0 ? (
                                paymentLinks.map((link) => (
                                    <TableRow key={link.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <p className="font-medium">
                                                    {link.description ||
                                                        "Payment Link"}
                                                </p>
                                                <p className="text-sm text-muted-foreground font-mono">
                                                    ID: {link.id}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <p className="font-medium">
                                                    {link.amount}{" "}
                                                    {getTokenInfo(
                                                        link.chainType,
                                                        link.tokenAddress
                                                    )}
                                                </p>
                                                <p className="text-sm text-muted-foreground capitalize">
                                                    {link.chainType}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    copyToClipboard(
                                                        link.walletAddress
                                                    )
                                                }
                                                className="justify-start p-0 h-auto font-mono text-sm"
                                            >
                                                {link.walletAddress.slice(0, 6)}
                                                ...
                                                {link.walletAddress.slice(-4)}
                                                <Copy className="ml-1 h-3 w-3" />
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(link.status)}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(link.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            `${window.location.origin}/pay/${link.id}`
                                                        )
                                                    }
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() =>
                                                        window.open(
                                                            `/pay/${link.id}`,
                                                            "_blank"
                                                        )
                                                    }
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center text-muted-foreground py-8"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <CreditCard className="h-8 w-8 opacity-50" />
                                            <p>No payment links yet</p>
                                            <p className="text-sm">
                                                Create your first payment link
                                                to get started
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    const { fetchPaymentLinks } = useDashboardStore();
    const { isAuthenticated, loading } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated && !loading) {
            fetchPaymentLinks();
        }
    }, [isAuthenticated, loading, fetchPaymentLinks]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <StatsCards />
            <PaymentLinksTable />
        </div>
    );
}
