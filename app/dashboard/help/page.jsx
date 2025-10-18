"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Search, Mail, Phone, MessageSquare } from "lucide-react"
import Image from "next/image"
import api from "@/services/api"

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const handleContactChange = (e) => {
    const { name, value } = e.target
    setContactForm((prev) => ({ ...prev, [name]: value }))
  }

  const submitContactForm = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage("")

    try {
      // API call to submit contact form
      await api.support.contact(contactForm)
      setSuccessMessage("Your message has been sent. We'll get back to you soon.")
      setContactForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      })
    } catch (error) {
      console.error("Error submitting contact form:", error)
      alert("Failed to send message. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Help & Support</h1>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          type="search"
          placeholder="Search help articles..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="faqs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="guides">User Guides</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
        </TabsList>

        <TabsContent value="faqs">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Find answers to common questions about using Adhivakta</CardDescription>
            </CardHeader>
            <CardContent>
              {searchQuery && filteredFaqs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                  <p className="text-sm mt-2">Try a different search term or contact our support team</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {(searchQuery ? filteredFaqs : faqs).map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides">
          <Card>
            <CardHeader>
              <CardTitle>User Guides</CardTitle>
              <CardDescription>Step-by-step guides to help you use Adhivakta effectively</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {guides.map((guide, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div className="relative h-40 w-full">
                      <Image
                        src={guide.image || "/placeholder.svg"}
                        alt={guide.title}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium">{guide.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{guide.description}</p>
                      <Button variant="link" className="px-0 mt-2">
                        Read Guide
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>Get in touch with our support team for assistance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  {successMessage ? (
                    <div className="bg-green-50 text-green-800 p-6 rounded-lg text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Message Sent!</h3>
                      <p>{successMessage}</p>
                      <Button className="mt-4" onClick={() => setSuccessMessage("")}>
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={submitContactForm} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="name" className="text-sm font-medium">
                            Your Name
                          </label>
                          <Input
                            id="name"
                            name="name"
                            value={contactForm.name}
                            onChange={handleContactChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="email" className="text-sm font-medium">
                            Email Address
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={contactForm.email}
                            onChange={handleContactChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="subject" className="text-sm font-medium">
                          Subject
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          value={contactForm.subject}
                          onChange={handleContactChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="message" className="text-sm font-medium">
                          Message
                        </label>
                        <Textarea
                          id="message"
                          name="message"
                          rows={6}
                          value={contactForm.message}
                          onChange={handleContactChange}
                          required
                        />
                      </div>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  )}
                </div>
                <div>
                  <div className="bg-muted p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <Mail className="h-5 w-5 mr-3 text-primary" />
                        <div>
                          <p className="font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">support@adhivakta.com</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Phone className="h-5 w-5 mr-3 text-primary" />
                        <div>
                          <p className="font-medium">Phone</p>
                          <p className="text-sm text-muted-foreground">+91 80 4567 8901</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-2">Business Hours</h4>
                      <p className="text-sm text-muted-foreground">Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p className="text-sm text-muted-foreground">Saturday: 10:00 AM - 2:00 PM</p>
                      <p className="text-sm text-muted-foreground">Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Sample FAQs data
const faqs = [
  {
    question: "How do I add a new case?",
    answer:
      "To add a new case, navigate to the Cases section from the dashboard sidebar, then click on the 'New Case' button. Fill in the required details in the form and click 'Save Case'.",
  },
  {
    question: "How do I upload documents to a case?",
    answer:
      "You can upload documents to a case by navigating to the specific case details page, then clicking on the 'Documents' tab. From there, you can either drag and drop files or click the 'Upload Document' button to select files from your computer.",
  },
  {
    question: "How do I set up reminders for court dates?",
    answer:
      "Court date reminders are automatically set up when you add a hearing date to a case. You can manage your notification preferences in the Settings page under the 'Notifications' tab.",
  },
  {
    question: "Can I share case information with clients?",
    answer:
      "Yes, you can share case information with clients by adding them as users to the specific case. Navigate to the case details page, click on the 'Share' button, and enter the client's email address.",
  },
  {
    question: "How do I generate reports?",
    answer:
      "To generate reports, go to the Reports section from the dashboard sidebar. Select the type of report you want to generate, set the parameters, and click 'Generate Report'. You can download the report in various formats including PDF and Excel.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes, we take data security very seriously. All data is encrypted both in transit and at rest. We use industry-standard security protocols and regularly perform security audits to ensure your data remains protected.",
  },
  {
    question: "How do I change my password?",
    answer:
      "To change your password, go to the Settings page and select the 'Password' tab. Enter your current password and your new password, then click 'Update Password'.",
  },
  {
    question: "Can I access Adhivakta on mobile devices?",
    answer:
      "Yes, Adhivakta is fully responsive and can be accessed on mobile devices through your web browser. We also have dedicated mobile apps for iOS and Android which you can download from the respective app stores.",
  },
]

// Sample guides data
const guides = [
  {
    title: "Getting Started with Adhivakta",
    description: "Learn the basics of using Adhivakta for your legal practice",
    image: "/images/law-library.jpg",
  },
  {
    title: "Managing Cases Effectively",
    description: "Best practices for organizing and tracking your legal cases",
    image: "/images/gavel.jpg",
  },
  {
    title: "Document Management Guide",
    description: "How to organize, tag, and search your legal documents",
    image: "/images/law-library.jpg",
  },
  {
    title: "Calendar and Scheduling",
    description: "Setting up your calendar and managing court dates",
    image: "/images/gavel.jpg",
  },
]
