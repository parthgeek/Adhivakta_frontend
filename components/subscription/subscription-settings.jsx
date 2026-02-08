"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Crown,
    Users,
    FileText,
    HardDrive,
    Calendar,
    CreditCard,
    CheckCircle,
    XCircle,
    Loader2,
    ArrowUpRight,
    Clock,
    AlertTriangle,
} from "lucide-react";
import api from "@/services/api";

export default function SubscriptionSettings() {
    const { user } = useAuth();
    const router = useRouter();
    const [subscription, setSubscription] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        fetchSubscriptionData();

        // Check for success parameter in URL
        const params = new URLSearchParams(window.location.search);
        if (params.get("success") === "true") {
            setShowSuccess(true);
            // Clean URL
            window.history.replaceState({}, "", window.location.pathname + "?tab=subscription");
            setTimeout(() => setShowSuccess(false), 5000);
        }
    }, []);

    const fetchSubscriptionData = async () => {
        try {
            const [subResponse, paymentsResponse] = await Promise.all([
                api.subscriptions.getCurrent(),
                api.subscriptions.getPaymentHistory(),
            ]);

            if (subResponse.success) {
                setSubscription(subResponse.data);
            }
            if (paymentsResponse.success) {
                setPayments(paymentsResponse.data || []);
            }
        } catch (error) {
            console.error("Error fetching subscription data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        setCancelling(true);
        try {
            const response = await api.subscriptions.cancel("User requested cancellation");
            if (response.success) {
                fetchSubscriptionData();
            }
        } catch (error) {
            console.error("Error cancelling subscription:", error);
        } finally {
            setCancelling(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatPrice = (amount) => {
        if (!amount) return "₹0";
        return `₹${(amount / 100).toLocaleString("en-IN")}`;
    };

    const getDaysRemaining = () => {
        if (!subscription?.endDate) return 0;
        const end = new Date(subscription.endDate);
        const now = new Date();
        const diff = end - now;
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const getUsagePercentage = (used, max) => {
        if (max === -1) return 0; // Unlimited
        return Math.min(100, (used / max) * 100);
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </CardContent>
            </Card>
        );
    }

    // No active subscription
    if (!subscription) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5" />
                        Subscription
                    </CardTitle>
                    <CardDescription>
                        You don't have an active subscription
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Active Plan</h3>
                        <p className="text-gray-600 mb-4">
                            Subscribe to a plan to unlock premium features including team accounts,
                            unlimited document storage, and priority support.
                        </p>
                        <Link href="/pricing">
                            <Button className="bg-black hover:bg-gray-800 text-white">
                                View Plans
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const plan = subscription.plan || {};
    const features = plan.features || {};
    const daysRemaining = getDaysRemaining();
    const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;

    return (
        <div className="space-y-6">
            {showSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Your subscription has been activated successfully!</span>
                </div>
            )}

            {/* Current Plan Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Crown className="h-5 w-5 text-amber-500" />
                                {plan.name} Plan
                            </CardTitle>
                            <CardDescription>
                                Your current subscription plan
                            </CardDescription>
                        </div>
                        <Badge
                            variant={subscription.status === "active" ? "default" : "secondary"}
                            className={subscription.status === "active" ? "bg-green-100 text-green-800" : ""}
                        >
                            {subscription.status === "active" ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                            ) : (
                                subscription.status
                            )}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Plan Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">Started</span>
                            </div>
                            <p className="font-semibold">{formatDate(subscription.startDate)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">Expires</span>
                            </div>
                            <p className={`font-semibold ${isExpiringSoon ? "text-amber-600" : ""}`}>
                                {formatDate(subscription.endDate)}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                                <CreditCard className="h-4 w-4" />
                                <span className="text-sm">Price</span>
                            </div>
                            <p className="font-semibold">{formatPrice(plan.price)}/year</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">Days Left</span>
                            </div>
                            <p className={`font-semibold ${isExpiringSoon ? "text-amber-600" : ""}`}>
                                {daysRemaining} days
                            </p>
                        </div>
                    </div>

                    {isExpiringSoon && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                                <div>
                                    <p className="font-medium text-amber-800">Subscription expiring soon</p>
                                    <p className="text-sm text-amber-600">Renew to continue enjoying premium features</p>
                                </div>
                            </div>
                            <Link href="/pricing">
                                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                                    Renew Now
                                </Button>
                            </Link>
                        </div>
                    )}

                    <Separator />

                    {/* Usage Stats */}
                    <div>
                        <h4 className="font-semibold mb-4">Usage</h4>
                        <div className="space-y-4">
                            {/* Accounts Usage */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-gray-500" />
                                        Team Accounts
                                    </span>
                                    <span>
                                        {subscription.accountsCreated} / {features.maxAccounts === -1 ? "Unlimited" : features.maxAccounts}
                                    </span>
                                </div>
                                {features.maxAccounts !== -1 && (
                                    <Progress
                                        value={getUsagePercentage(subscription.accountsCreated, features.maxAccounts)}
                                        className="h-2"
                                    />
                                )}
                            </div>

                            {/* Documents Usage */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-gray-500" />
                                        Documents
                                    </span>
                                    <span>
                                        {subscription.documentsUsed} / {features.maxDocuments === -1 ? "Unlimited" : features.maxDocuments}
                                    </span>
                                </div>
                                {features.maxDocuments !== -1 && (
                                    <Progress
                                        value={getUsagePercentage(subscription.documentsUsed, features.maxDocuments)}
                                        className="h-2"
                                    />
                                )}
                            </div>

                            {/* Storage */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="flex items-center gap-2">
                                        <HardDrive className="h-4 w-4 text-gray-500" />
                                        Storage
                                    </span>
                                    <span>{features.documentStorage}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Link href="/pricing">
                        <Button variant="outline">
                            Upgrade Plan
                        </Button>
                    </Link>

                    {subscription.status === "active" && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    Cancel Subscription
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Your subscription will remain active until {formatDate(subscription.endDate)}.
                                        After that, you'll lose access to premium features but your data will be preserved.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleCancelSubscription}
                                        className="bg-red-600 hover:bg-red-700"
                                        disabled={cancelling}
                                    >
                                        {cancelling ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelling...</>
                                        ) : (
                                            "Yes, Cancel"
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </CardFooter>
            </Card>

            {/* Payment History */}
            {payments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Payment History
                        </CardTitle>
                        <CardDescription>
                            Your recent transactions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {payments.slice(0, 5).map((payment) => (
                                <div
                                    key={payment._id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${payment.status === "paid" ? "bg-green-100" : "bg-gray-100"
                                            }`}>
                                            {payment.status === "paid" ? (
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">{payment.plan?.name || "Subscription"}</p>
                                            <p className="text-sm text-gray-500">{formatDate(payment.paidAt || payment.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">{formatPrice(payment.amount)}</p>
                                        <Badge
                                            variant="secondary"
                                            className={payment.status === "paid" ? "bg-green-100 text-green-800" : ""}
                                        >
                                            {payment.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
