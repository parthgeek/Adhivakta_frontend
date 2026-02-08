"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Check,
    Crown,
    Users,
    FileText,
    HardDrive,
    Headphones,
    BarChart3,
    Code,
    Briefcase,
    Scale,
    ChevronDown,
    Loader2,
    ArrowLeft
} from "lucide-react";
import api from "@/services/api";
import Image from "next/image";

export default function PricingPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [plans, setPlans] = useState({ lawyer: [], client: [] });
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState("lawyer");
    const [processingPlan, setProcessingPlan] = useState(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    useEffect(() => {
        // Auto-select role based on user's role if logged in
        if (user?.role) {
            setSelectedRole(user.role);
        }
    }, [user]);

    const fetchPlans = async () => {
        try {
            const response = await api.subscriptions.getPlans();
            if (response.success) {
                const lawyerPlans = response.data.filter(p => p.role === 'lawyer');
                const clientPlans = response.data.filter(p => p.role === 'client');
                setPlans({ lawyer: lawyerPlans, client: clientPlans });
            }
        } catch (error) {
            console.error("Error fetching plans:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = async (plan) => {
        if (!isAuthenticated) {
            router.push(`/auth/register?redirect=/pricing&plan=${plan.slug}`);
            return;
        }

        if (plan.price === -1) {
            // Enterprise plan - contact sales
            window.location.href = "mailto:sales@adhivakta.net?subject=Enterprise Plan Inquiry";
            return;
        }

        setProcessingPlan(plan._id);

        try {
            // Create Razorpay order
            const orderResponse = await api.subscriptions.createOrder(plan._id);

            if (!orderResponse.success) {
                throw new Error(orderResponse.message || "Failed to create order");
            }

            // Load Razorpay script if not loaded
            if (!window.Razorpay) {
                await loadRazorpayScript();
            }

            // Open Razorpay checkout
            const options = {
                key: orderResponse.data.keyId,
                amount: orderResponse.data.amount,
                currency: orderResponse.data.currency,
                name: "Adhivakta",
                description: `${plan.name} - Yearly Subscription`,
                image: "/adhi_logo_main.png",
                order_id: orderResponse.data.orderId,
                handler: async function (response) {
                    try {
                        // Verify payment
                        const verifyResponse = await api.subscriptions.verifyPayment({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });

                        if (verifyResponse.success) {
                            router.push("/dashboard/settings?tab=subscription&success=true");
                        }
                    } catch (error) {
                        console.error("Payment verification failed:", error);
                        alert("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    name: orderResponse.data.user.name,
                    email: orderResponse.data.user.email,
                },
                theme: {
                    color: "#000000",
                },
                modal: {
                    ondismiss: function () {
                        setProcessingPlan(null);
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Error initiating payment:", error);
            alert(error.message || "Failed to initiate payment");
        } finally {
            setProcessingPlan(null);
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    };

    const formatPrice = (price) => {
        if (price === -1) return "Custom";
        if (price === 0) return "Free";
        return `₹${(price / 100).toLocaleString("en-IN")}`;
    };

    const getFeatureIcon = (feature) => {
        const icons = {
            maxAccounts: Users,
            maxDocuments: FileText,
            documentStorage: HardDrive,
            prioritySupport: Headphones,
            advancedReports: BarChart3,
            apiAccess: Code,
            unlimitedCases: Briefcase,
        };
        return icons[feature] || Check;
    };

    const formatFeatureValue = (key, value) => {
        if (value === -1) return "Unlimited";
        if (value === true) return "Included";
        if (value === false) return null;
        return value;
    };

    const featureLabels = {
        maxAccounts: "Team Accounts",
        maxDocuments: "Documents",
        documentStorage: "Storage",
        prioritySupport: "Priority Support",
        advancedReports: "Advanced Reports",
        apiAccess: "API Access",
        unlimitedCases: "Unlimited Cases",
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        );
    }

    const currentPlans = plans[selectedRole] || [];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="sticky top-0 z-50 flex h-20 items-center border-b bg-white/90 backdrop-blur-sm px-4 md:px-8">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Image
                            src="/adhi_logo_main.png"
                            alt="Adhivakta Logo"
                            width={80}
                            height={80}
                            style={{ objectFit: "contain" }}
                        />
                    </Link>
                </div>
                <nav className="ml-auto flex items-center gap-4">
                    {isAuthenticated ? (
                        <Link href="/dashboard">
                            <Button variant="ghost">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <>
                            <Link href="/auth/login">
                                <Button variant="ghost">Login</Button>
                            </Link>
                            <Link href="/auth/register">
                                <Button className="bg-black hover:bg-gray-800 text-white">
                                    Get Started
                                </Button>
                            </Link>
                        </>
                    )}
                </nav>
            </header>

            {/* Hero Section */}
            <section className="py-16 px-4 md:px-8 text-center">
                <div className="max-w-4xl mx-auto">
                    <Badge variant="secondary" className="mb-4">
                        <Crown className="h-3 w-3 mr-1" />
                        Pricing Plans
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
                        Choose the Perfect Plan for Your Practice
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                        Flexible pricing designed for solo practitioners, growing firms, and enterprises.
                        All plans include unlimited cases.
                    </p>

                    {/* Role Toggle */}
                    <Tabs value={selectedRole} onValueChange={setSelectedRole} className="w-full max-w-md mx-auto">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="lawyer" className="flex items-center gap-2">
                                <Scale className="h-4 w-4" />
                                For Lawyers
                            </TabsTrigger>
                            <TabsTrigger value="client" className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                For Clients
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-20 px-4 md:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="grid gap-8 md:grid-cols-3">
                        {currentPlans.map((plan, index) => (
                            <Card
                                key={plan._id}
                                className={`relative flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${plan.isPopular
                                        ? "border-2 border-black shadow-lg scale-105"
                                        : "border border-gray-200"
                                    }`}
                            >
                                {plan.isPopular && (
                                    <div className="absolute -top-4 left-0 right-0 mx-auto w-fit">
                                        <Badge className="bg-black text-white px-4 py-1">
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}

                                <CardHeader className="pb-4">
                                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                    <CardDescription className="min-h-[48px]">
                                        {plan.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1">
                                    <div className="mb-6">
                                        <span className="text-4xl font-bold text-gray-900">
                                            {formatPrice(plan.price)}
                                        </span>
                                        {plan.price !== -1 && plan.price !== 0 && (
                                            <span className="text-gray-600 ml-1">/year</span>
                                        )}
                                    </div>

                                    <ul className="space-y-3">
                                        {Object.entries(plan.features).map(([key, value]) => {
                                            const formattedValue = formatFeatureValue(key, value);
                                            if (formattedValue === null) return null;

                                            const IconComponent = getFeatureIcon(key);

                                            return (
                                                <li key={key} className="flex items-center gap-3">
                                                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${value === false ? "bg-gray-100" : "bg-green-100"
                                                        }`}>
                                                        <IconComponent className={`h-3 w-3 ${value === false ? "text-gray-400" : "text-green-600"
                                                            }`} />
                                                    </div>
                                                    <span className="text-sm text-gray-700">
                                                        <span className="font-medium">{formattedValue}</span>
                                                        {" "}
                                                        {featureLabels[key]}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </CardContent>

                                <CardFooter>
                                    <Button
                                        className={`w-full ${plan.isPopular
                                                ? "bg-black hover:bg-gray-800 text-white"
                                                : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                                            }`}
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={processingPlan === plan._id}
                                    >
                                        {processingPlan === plan._id ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : plan.price === -1 ? (
                                            "Contact Sales"
                                        ) : (
                                            "Get Started"
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Comparison */}
            <section className="py-16 px-4 md:px-8 bg-gray-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        All Plans Include
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { icon: Briefcase, label: "Unlimited Cases" },
                            { icon: FileText, label: "Document Management" },
                            { icon: Users, label: "Team Collaboration" },
                            { icon: Check, label: "Secure Platform" },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex flex-col items-center p-4">
                                <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center mb-3">
                                    <Icon className="h-6 w-6 text-gray-900" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 px-4 md:px-8">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "What payment methods do you accept?",
                                a: "We accept all major credit/debit cards, UPI, net banking, and digital wallets through Razorpay.",
                            },
                            {
                                q: "Can I upgrade my plan later?",
                                a: "Yes! You can upgrade your plan at any time. The difference will be prorated for the remaining period.",
                            },
                            {
                                q: "Is there a free trial?",
                                a: "Yes, all new users get a 30-day free trial to explore the platform before committing to a plan.",
                            },
                            {
                                q: "What happens when my subscription expires?",
                                a: "Your data remains safe. You'll have read-only access until you renew your subscription.",
                            },
                        ].map(({ q, a }, index) => (
                            <details
                                key={index}
                                className="group border border-gray-200 rounded-lg p-4 cursor-pointer"
                            >
                                <summary className="flex items-center justify-between font-medium text-gray-900 list-none">
                                    {q}
                                    <ChevronDown className="h-5 w-5 text-gray-500 transition-transform group-open:rotate-180" />
                                </summary>
                                <p className="mt-3 text-gray-600 text-sm">{a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-8 bg-white">
                <div className="container px-4 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/adhi_logo_main.png"
                            alt="Adhivakta Logo"
                            width={60}
                            height={60}
                            style={{ objectFit: "contain" }}
                        />
                    </div>
                    <p className="text-sm text-gray-600">
                        © 2025 Adhivakta Legal Solutions. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
