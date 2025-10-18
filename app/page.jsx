import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ArrowRight, CheckCircle, Shield, Scale, BookOpen, Gavel, Users, ChevronDown, Star } from "lucide-react"
import { LogoAvatar } from "@/components/ui/avatar"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-24 items-center border-b bg-transparent backdrop-blur-sm px-4 md:px-8 shadow-none">
        <div className="flex items-center gap-3">
          <Image src="/adhi_logo_main.png" alt="Adhivakta Logo" width={96} height={96} style={{objectFit: 'contain'}} />
        </div>
        <nav className="ml-auto flex items-center gap-6">
          {[
            { href: "#features", label: "Features" },
            { href: "#testimonials", label: "Testimonials" },
            { href: "#pricing", label: "Pricing" },
          ].map((link) => (
            <div key={link.href}>
              <Link href={link.href} className="text-sm font-medium text-gray-700 hover:text-black transition-colors bg-white/80 hover:bg-white rounded-lg px-4 py-2 shadow-sm">
                {link.label}
              </Link>
            </div>
          ))}
          <div>
            <Link href="/auth/login">
              <Button variant="ghost" className="text-gray-700 hover:text-black bg-white/80 hover:bg-white rounded-lg px-4 py-2 shadow-sm">
                Login
              </Button>
            </Link>
          </div>
          <div>
            <Link href="/auth/register">
              <Button className="bg-black hover:bg-gray-800 text-white px-6">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full pt-24 pb-32 overflow-hidden">
          {/* Background image for the hero section only */}
          <div className="absolute inset-0 -z-10">
            <Image
              src="/images/bg_main.png"
              alt="Legal background"
              fill
              className="object-cover object-center"
              priority
            />
          </div>
          <div className="container relative z-20 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center text-center space-y-8 animate-fade-in-up">
              <div className="space-y-6 max-w-2xl mx-auto">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-white leading-tight drop-shadow-lg animate-fade-in">
                  Elevate Your <br />
                  <span className="text-gray-300">Legal Practice</span> <br />
                  with Precision
                </h1>
                <p className="text-lg md:text-xl text-gray-300 max-w-xl mx-auto animate-fade-in delay-100">
                  Adhivakta offers a sophisticated platform to manage cases, streamline documents, and enhance client
                  communication with unmatched efficiency.
                </p>
                <div className="flex gap-4 justify-center animate-fade-in delay-200">
                  <Link href="/auth/register">
                    <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 group">
                      Start Free Trial
                      <span className="ml-2">
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button
                      size="lg"
                      variant="outline"
                      className="px-8 border-gray-300 text-black hover:text-black hover:bg-gray-800/50"
                    >
                      Discover More
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-white animate-fade-in delay-300">
                  No credit card required. 30-day free trial for all plans.
                </p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-8 w-8 text-white" />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-24 bg-white animate-fade-in-up delay-200">
          <div className="container px-4 md:px-8 max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                Core Features for Modern Legal Practice
              </h2>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                Adhivakta is designed for both Lawyers and Clients, providing seamless case management, document handling, and secure collaboration.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {[{
                title: "User Roles: Lawyer & Client",
                description: "Distinct dashboards and permissions for lawyers and clients, ensuring secure and relevant access for every user.",
                icon: <Users className="h-8 w-8 text-primary" />,
              }, {
                title: "Comprehensive Case Management",
                description: "Upload and manage cases with all details: court, parties, lawyers, clients, and more. Keep everything organized in one place.",
                icon: <Gavel className="h-8 w-8 text-primary" />,
              }, {
                title: "Document Upload & Management",
                description: "Attach, organize, and manage documents for each case. Secure storage and easy access for authorized users.",
                icon: <BookOpen className="h-8 w-8 text-primary" />,
              }, {
                title: "Share Cases & Documents",
                description: "Easily share case and document details with other users in the application, with full control over access.",
                icon: <Scale className="h-8 w-8 text-primary" />,
              }, {
                title: "Event Alerts & Notifications",
                description: "Get alerts for next hearings, deadlines, and custom events. Stay updated with in-app notifications, email, and (soon) WhatsApp.",
                icon: <CheckCircle className="h-8 w-8 text-primary" />,
              }, {
                title: "Custom Events & Reminders",
                description: "Set your own events and reminders for any case. Never miss an important date or deadline again.",
                icon: <Shield className="h-8 w-8 text-primary" />,
              }].map((feature, index) => (
                <div
                  key={index}
                  className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl group animate-fade-in-up"
                  style={{ minHeight: 260 }}
                >
                  <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 animate-fade-in">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 animate-fade-in delay-100">{feature.title}</h3>
                  <p className="text-gray-700 text-base animate-fade-in delay-200">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-24 bg-gray-100">
          <div className="container px-4 md:px-8 max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Voices of Trust</h2>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                Discover how Adhivakta has transformed the practices of legal professionals across the globe.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {[
                {
                  quote:
                    "Adhivakta has revolutionized my workflow, saving hours with its intuitive case and document management tools.",
                  author: "Rajesh Sharma",
                  title: "Senior Advocate, Bangalore High Court",
                  rating: 5,
                  image: "/images/bg_1.jpg",
                },
                {
                  quote:
                    "The client portal enhances transparency, significantly reducing client inquiries and boosting satisfaction.",
                  author: "Priya Patel",
                  title: "Family Law Attorney",
                  rating: 5,
                  image: "/images/bg_2.jpg",
                },
                {
                  quote: "As a growing firm, Adhivakta's scalable solutions have been a perfect fit for our needs.",
                  author: "Vikram Singh",
                  title: "Managing Partner, Singh & Associates",
                  rating: 4,
                  image: "/images/bg_3.jpg",
                },
                {
                  quote:
                    "The analytics tools provide invaluable insights, helping us optimize our practice efficiently.",
                  author: "Anita Desai",
                  title: "Corporate Lawyer",
                  rating: 5,
                  image: "/images/bg_1.jpg",
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg p-6 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200/30 to-transparent opacity-50" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex justify-center mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-gray-900 text-gray-900" />
                      ))}
                    </div>
                    <p className="text-gray-700 italic text-center">"{testimonial.quote}"</p>
                    <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-200">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden">
                        <Image
                          src={testimonial.image || "/placeholder.svg"}
                          alt={testimonial.author}
                          fill
                          className="object-cover filter grayscale"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{testimonial.author}</p>
                        <p className="text-sm text-gray-500">{testimonial.title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-24 bg-white">
          <div className="container px-4 md:px-8 max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                Tailored Pricing for Every Practice
              </h2>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                Select a plan that aligns with your firm's size and ambitions, with flexible options to scale as you
                grow.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {[
                {
                  name: "Solo Practitioner",
                  price: "₹2,999",
                  description: "Designed for independent lawyers seeking efficiency and organization.",
                  features: [
                    "Manage up to 50 active cases",
                    "5GB secure document storage",
                    "Calendar integration with reminders",
                    "Basic reporting and insights",
                    "Email support with 48-hour response",
                  ],
                  popular: false,
                },
                {
                  name: "Small Firm",
                  price: "₹7,999",
                  description: "Perfect for small teams aiming to streamline operations and client engagement.",
                  features: [
                    "Up to 200 active cases",
                    "25GB secure document storage",
                    "Advanced calendar and email integration",
                    "Comprehensive reporting tools",
                    "Priority support with 24-hour response",
                    "Secure client portal access",
                  ],
                  popular: true,
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  description: "Tailored solutions for large firms with complex needs and high case volumes.",
                  features: [
                    "Unlimited case management",
                    "Unlimited document storage",
                    "Full API access for integrations",
                    "Custom workflows and integrations",
                    "Dedicated account manager",
                    "On-premise or cloud deployment options",
                  ],
                  popular: false,
                },
              ].map((plan, index) => (
                <div
                  key={index}
                  className={`relative bg-white rounded-xl shadow-lg p-8 flex flex-col ${
                    plan.popular ? "border-2 border-gray-900" : "border border-gray-200"
                  }`}
                >
                  {plan.popular && (
                    <div
                      className="absolute -top-4 left-0 right-0 mx-auto w-fit px-4 py-1 text-sm font-medium bg-gray-900 text-white rounded-full"
                    >
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-700">{plan.description}</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-gray-700"> / month</span>}
                  </div>
                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center text-gray-700"
                      >
                        <CheckCircle className="mr-2 h-5 w-5 text-gray-900" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`mt-auto ${plan.popular ? "bg-gray-900 hover:bg-black text-white" : "border-gray-300 text-gray-900 hover:bg-gray-100"}`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Get Started
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 bg-gray-900 text-white">
          <div className="container px-4 md:px-8 max-w-7xl mx-auto">
            <div
              className="text-center space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Redefine Your Legal Workflow</h2>
              <p className="text-lg max-w-2xl mx-auto">
                Join a global community of legal professionals who rely on Adhivakta to manage cases, streamline
                operations, and deliver exceptional client experiences.
              </p>
              <p className="text-sm text-gray-300">
                Trusted by over 5,000 firms worldwide. Start your journey today with a risk-free trial.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-200 px-8">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 px-8">
                    Schedule a Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-white">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/adhi_logo_main.png" alt="Adhivakta Logo" width={80} height={80} style={{objectFit: 'contain'}} />
          </div>
          <div className="flex gap-6">
            {['Terms', 'Privacy', 'Contact', 'Support'].map((item) => (
              <Link key={item} href="#" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                {item}
              </Link>
            ))}
          </div>
          <p className="text-sm text-gray-700">© 2025 Adhivakta Legal Solutions. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
