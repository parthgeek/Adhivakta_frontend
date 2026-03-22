"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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

const PACKAGE_TIERS = [
    { key: "base", name: "Bronze", limit: 10 },
    { key: "superior-20", name: "Silver", limit: 20 },
    { key: "superior-30", name: "Gold", limit: 30 },
    { key: "superior-40", name: "Platinum", limit: 40 },
    { key: "superior-50", name: "Diamond ", limit: 50 },
];
const getPlanKey = (plan) => plan?._id || plan?.slug;

export default function PricingPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [plans, setPlans] = useState({ lawyer: [], client: [] });
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState("lawyer");
    const [processingPlan, setProcessingPlan] = useState(null);
    const [selectedPlanKey, setSelectedPlanKey] = useState(null);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [quotePlan, setQuotePlan] = useState(null);
    const [quoteForm, setQuoteForm] = useState({
        name: "",
        contact: "",
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    useEffect(() => {
        // Auto-select role based on user's role if logged in
        if (user?.role === "lawyer" || user?.role === "client") {
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

    const openQuoteModal = (plan) => {
        setQuotePlan(plan);
        setSelectedPlanKey(getPlanKey(plan));
        setQuoteForm({
            name: user?.name || "",
            contact: user?.email || "",
        });
        setIsQuoteModalOpen(true);
    };

    const handleSelectPlan = async (plan) => {
        const planKey = getPlanKey(plan);
        setSelectedPlanKey(planKey);
        const isContactPlan = plan.price === -1 || !plan._id;

        if (isContactPlan) {
            openQuoteModal(plan);
            return;
        }

        if (!isAuthenticated) {
            router.push(`/auth/register?redirect=/pricing&plan=${plan.slug}`);
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
                image: "/images/adhi_logo_main.png",
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

    const handleQuoteSubmit = (e) => {
        e.preventDefault();
        const name = quoteForm.name.trim();
        const contact = quoteForm.contact.trim();

        if (!name || !contact) {
            return;
        }

        const packageName = quotePlan?.name || "Subscription Package";
        const userType = selectedRole === "lawyer" ? "Lawyer" : "Customer";
        const subject = encodeURIComponent(`Quote Request - ${packageName}`);
        const body = encodeURIComponent(
            `Package: ${packageName}\nUser Type: ${userType}\nName: ${name}\nEmail/Phone: ${contact}`
        );

        setIsQuoteModalOpen(false);
        window.location.href = `mailto:sales@adhivakta.net?subject=${subject}&body=${body}`;
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
        if (price === -1 || price === null || price === undefined) return null;
        if (price === 0) return "Free";
        return `₹${(price / 100).toLocaleString("en-IN")}`;
    };

    const getFeatureIcon = (feature) => {
        const icons = {
            maxAccounts: Users,
            maxCases: Briefcase,
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
        maxAccounts: "Users Allowed",
        maxCases: "Cases Allowed",
        maxDocuments: "Documents",
        documentStorage: "Storage",
        prioritySupport: "Priority Support",
        advancedReports: "Advanced Reports",
        apiAccess: "API Access",
        unlimitedCases: "Unlimited Cases",
    };

    const currentPlans = useMemo(() => {
        const rolePlans = plans[selectedRole] || [];
        const sortedPlans = [...rolePlans].sort((a, b) => {
            const aPrice = a.price === -1 ? Number.MAX_SAFE_INTEGER : a.price;
            const bPrice = b.price === -1 ? Number.MAX_SAFE_INTEGER : b.price;
            return aPrice - bPrice;
        });

        return PACKAGE_TIERS.map((tier, index) => {
            const sourcePlan = sortedPlans[index];
            const roleLabel = selectedRole === "lawyer" ? "lawyers" : "customers";
            const tierDescription = `Package for ${roleLabel} with up to ${tier.limit} active cases and ${tier.limit} users.`;
            const fallbackPlan = {
                _id: null,
                slug: `${selectedRole}-${tier.key}`,
                name: tier.name,
                description: tierDescription,
                price: -1,
                isPopular: tier.limit === 30,
                features: {
                    maxCases: tier.limit,
                    maxAccounts: tier.limit,
                    prioritySupport: tier.limit >= 30,
                    advancedReports: tier.limit >= 40,
                    apiAccess: tier.limit >= 50,
                    unlimitedCases: false,
                },
            };

            if (!sourcePlan) {
                return fallbackPlan;
            }

            return {
                ...sourcePlan,
                name: tier.name,
                description: tierDescription,
                isPopular: sourcePlan.isPopular ?? tier.limit === 30,
                features: {
                    ...(sourcePlan.features || {}),
                    maxCases: tier.limit,
                    maxAccounts: tier.limit,
                    unlimitedCases: false,
                },
            };
        });
    }, [plans, selectedRole]);

    useEffect(() => {
        if (!currentPlans.length) {
            setSelectedPlanKey(null);
            return;
        }

        const hasSelectedInCurrentRole = currentPlans.some((plan) => getPlanKey(plan) === selectedPlanKey);
        if (!hasSelectedInCurrentRole) {
            setSelectedPlanKey(getPlanKey(currentPlans[0]));
        }
    }, [currentPlans, selectedPlanKey]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="sticky top-0 z-50 flex h-20 items-center border-b bg-white/90 backdrop-blur-sm px-4 md:px-8">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Image
                            src="/images/adhi_logo_main.png"
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
                                <Button className="bg-[#03234b] hover:bg-[#03234b]/90 text-white">
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
                        Separate plans for lawyers and customers. Base packages start at 10 cases and 10 users, and
                        superior packages scale to 20, 30, 40, and 50.
                    </p>

                    {/* Role Toggle */}
                    <Tabs value={selectedRole} onValueChange={setSelectedRole} className="w-full max-w-md mx-auto">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="lawyer" className="flex items-center gap-2">
                                <Scale className="h-4 w-4" />
                                Lawyer Packages
                            </TabsTrigger>
                            <TabsTrigger value="client" className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                Customer Packages
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-20 px-4 md:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {selectedRole === "lawyer" ? "Lawyer Package Plans" : "Customer Package Plans"}
                        </h2>
                        <p className="text-gray-600 mt-2">
                            Base package allows 10 cases and 10 users. Superior package tiers increase to 20, 30, 40,
                            and 50.
                        </p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
                        {currentPlans.map((plan) => {
                            const planKey = getPlanKey(plan);
                            const isSelected = selectedPlanKey === planKey;
                            const isProcessing = Boolean(plan._id) && processingPlan === plan._id;
                            const displayPrice = formatPrice(plan.price);
                            const isContactPlan = plan.price === -1 || !plan._id;

                            return (
                                <Card
                                    key={planKey}
                                    onClick={() => setSelectedPlanKey(planKey)}
                                    className={`relative flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${plan.isPopular
                                            ? "border-2 border-black shadow-lg scale-105"
                                            : "border border-gray-200"
                                        } ${isSelected
                                            ? "ring-2 ring-black ring-offset-2 bg-white"
                                            : ""
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
                                            {displayPrice ? (
                                                <span className="text-4xl font-bold text-gray-900">
                                                    {displayPrice}
                                                </span>
                                            ) : (
                                                <span className="text-sm font-medium uppercase tracking-wide text-gray-500">
                                                    Pricing on request
                                                </span>
                                            )}
                                            {displayPrice && plan.price !== 0 && (
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
                                                    ? "bg-[#03234b] hover:bg-[#03234b]/90 text-white"
                                                    : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                                                }`}
                                            onClick={() => handleSelectPlan(plan)}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : isContactPlan ? (
                                                "Request Quote"
                                            ) : (
                                                "Get Started"
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            <Dialog open={isQuoteModalOpen} onOpenChange={setIsQuoteModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleQuoteSubmit}>
                        <DialogHeader>
                            <DialogTitle>Request Quote</DialogTitle>
                            <DialogDescription>
                                Share your details for {quotePlan?.name || "this package"} and our team will contact you.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="quote-name">Name</Label>
                                <Input
                                    id="quote-name"
                                    placeholder="Enter your full name"
                                    value={quoteForm.name}
                                    onChange={(e) =>
                                        setQuoteForm((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quote-contact">Email / Phone</Label>
                                <Input
                                    id="quote-contact"
                                    placeholder="Enter your email or phone"
                                    value={quoteForm.contact}
                                    onChange={(e) =>
                                        setQuoteForm((prev) => ({ ...prev, contact: e.target.value }))
                                    }
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsQuoteModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">Submit Request</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Features Comparison */}
            <section className="py-16 px-4 md:px-8 bg-gray-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        All Plans Include
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { icon: Briefcase, label: "Case Capacity Tiers" },
                            { icon: FileText, label: "Document Management" },
                            { icon: Users, label: "User Capacity Tiers" },
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
                            src="/images/adhi_logo_main.png"
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
