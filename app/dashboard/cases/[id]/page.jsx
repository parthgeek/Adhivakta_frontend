"use client";

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Clock, FileText, MapPin, User, Users, AlertTriangle, ShieldCheck } from "lucide-react"
import api from "@/services/api"
import PartyDetails from "@/components/ui/party-details"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as DatePicker } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar as CalendarIcon } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { formatCaseTypeLabel, formatDisplayCaseNumber } from "@/lib/caseTypeUtils"
import { getDocumentOpenUrl } from "@/lib/document-url"
import CaseTimeline from "@/components/cases/CaseTimeline"

const CASE_TAB_VALUES = new Set(["details", "people", "documents", "hearings", "transfer"])

const formatTransferDate = (d) => {
  if (!d) return "—"
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return "—"
  }
}

const personMatchesUser = (person, currentUser) => {
  if (!person || !currentUser) return false

  const userIdentifiers = [
    currentUser._id,
    currentUser.id,
    currentUser.user?._id,
    currentUser.user?.id,
    currentUser.email,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())

  const personIdentifiers = [
    person._id,
    person.id,
    person.user?._id,
    person.user?.id,
    person.userId,
    person.email,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())

  return personIdentifiers.some((identifier) => userIdentifiers.includes(identifier))
}

const toDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const isFutureHearing = (value) => {
  const date = toDate(value)
  return Boolean(date && date.getTime() > Date.now())
}

export default function CaseDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [caseData, setCaseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [documents, setDocuments] = useState([])
  const [events, setEvents] = useState([])
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [uploadForm, setUploadForm] = useState({ file: null, description: "" })
  const [uploading, setUploading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanPassed, setScanPassed] = useState(false)
  const [reviewingDocumentId, setReviewingDocumentId] = useState(null)
  const [hearingDate, setHearingDate] = useState(null)
  const [scheduling, setScheduling] = useState(false)
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [outcomeValue, setOutcomeValue] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [deleting, setDeleting] = useState(false)
  const requestedTab = searchParams.get("tab")
  const activeTab = CASE_TAB_VALUES.has(requestedTab) ? requestedTab : "details"

  const handleTabChange = (nextTab) => {
    const params = new URLSearchParams(searchParams.toString())

    if (nextTab === "details") {
      params.delete("tab")
    } else {
      params.set("tab", nextTab)
    }

    const query = params.toString()
    router.replace(query ? `/dashboard/cases/${id}?${query}` : `/dashboard/cases/${id}`)
  }

  const fetchCaseEvents = async () => {
    const eventsResponse = await api.events.getByCaseId(id)
    if (Array.isArray(eventsResponse)) {
      setEvents(eventsResponse)
      return
    }
    if (Array.isArray(eventsResponse?.data)) {
      setEvents(eventsResponse.data)
      return
    }
    setEvents([])
  }

  const fetchCaseDocuments = async () => {
    const docsResponse = await api.documents.getByCaseId(id)
    if (docsResponse && Array.isArray(docsResponse.data)) {
      setDocuments(docsResponse.data)
    } else if (docsResponse && Array.isArray(docsResponse)) {
      setDocuments(docsResponse)
    } else {
      setDocuments([])
    }
  }

  useEffect(() => {
    const fetchCaseDetails = async () => {
      setLoading(true)
      try {
        const response = await api.cases.getById(id)

        let rawData
        if (response && response.data) {
          rawData = response.data
        } else if (response) {
          rawData = response
        } else {
          throw new Error("Invalid response format")
        }

        const processedData = {
          ...rawData,
          clients: Array.isArray(rawData.clients) ? rawData.clients : [],
          advocates: Array.isArray(rawData.advocates) ? rawData.advocates : [],
          parties: {
            ...(rawData.parties || {}),
            petitioner: Array.isArray(rawData.parties?.petitioner) ? rawData.parties.petitioner : [],
            respondent: Array.isArray(rawData.parties?.respondent) ? rawData.parties.respondent : []
          }
        }
        setCaseData(processedData)

        try {
          await fetchCaseDocuments()
        } catch (docError) {
          console.error("Error fetching documents:", docError)
        }

        try {
          await fetchCaseEvents()
        } catch (eventError) {
          console.error("Error fetching events:", eventError)
        }
      } catch (error) {
        console.error("Error fetching case details:", error)
        setError("Failed to load case details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchCaseDetails()
    }
  }, [id])

  const formatDate = (dateString) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusColor = (status) => {
    const statusMap = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      closed: "bg-gray-100 text-gray-800",
      archived: "bg-[#03234b]/20 text-[#03234b]",
    }
    return statusMap[status?.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  const getDocumentApprovalStatus = (document) => {
    const value = (
      document?.approvalStatus ||
      document?.status ||
      "approved"
    ).toLowerCase()

    if (value === "active") return "approved"
    if (value === "archived") return "rejected"
    if (value === "draft") return "pending"
    return value
  }

  const getDocumentStatusColor = (status) => {
    if (status === "approved") return "bg-green-100 text-green-800"
    if (status === "pending") return "bg-yellow-100 text-yellow-800"
    if (status === "rejected") return "bg-red-100 text-red-800"
    return "bg-gray-100 text-gray-800"
  }

  const getPriorityColor = (priority) => {
    const priorityMap = {
      low: "bg-[#03234b]/20 text-[#03234b]",
      normal: "bg-green-100 text-green-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    }
    return priorityMap[priority?.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  const handleFileChange = (e) => {
    setUploadForm((prev) => ({ ...prev, file: e.target.files[0] }))
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)
    setScanning(false)
    setScanPassed(false)
    try {
      const formData = new FormData()
      formData.append("file", uploadForm.file)
      formData.append("description", uploadForm.description)
      formData.append("caseId", id)
      const result = await api.documents.upload(formData, (event) => {
        if (event.loaded === event.total) {
          setScanning(true)
        }
      })

      setScanning(false)
      setScanPassed(true)

      await fetchCaseDocuments()
      await new Promise((resolve) => setTimeout(resolve, 1400))

      setScanPassed(false)
      setShowUploadDialog(false)
      setUploadForm({ file: null, description: "" })

      toast({
        title: "Success",
        description: result?.message || "Document uploaded.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to upload document.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setScanning(false)
      setScanPassed(false)
    }
  }

  const handleReviewDocument = async (document, decision) => {
    const reviewNotes =
      decision === "rejected"
        ? window.prompt("Add rejection reason (optional):", "") ?? ""
        : ""

    setReviewingDocumentId(document._id || document.id)

    try {
      const result = await api.documents.review(document._id || document.id, {
        decision,
        reviewNotes,
      })

      await fetchCaseDocuments()

      toast({
        title: "Success",
        description:
          result?.message ||
          (decision === "approved"
            ? "Document approved successfully."
            : "Document rejected successfully."),
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to review document.",
        variant: "destructive",
      })
    } finally {
      setReviewingDocumentId(null)
    }
  }

  const handleScheduleSubmit = async () => {
    setScheduling(true)
    try {
      if (!hearingDate || !caseData) throw new Error("Please select a date and ensure case data is loaded.");
      // Prepare event payload
      const start = new Date(hearingDate)
      const end = new Date(start.getTime() + 60 * 60 * 1000) // 1 hour duration
      const eventPayload = {
        title: `Hearing for ${caseData.title || caseData.caseNumber || "Case"}`,
        start: start.toISOString(),
        end: end.toISOString(),
        type: "hearing",
        case: caseData._id || caseData.id,
        location: caseData.court || "Courtroom",
        description: ""
      }
      await api.events.create(eventPayload)
      setShowScheduleDialog(false)
      setHearingDate(null)
      await fetchCaseEvents()
      toast({ title: "Success", description: "Event scheduled." })
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to schedule event." })
    } finally {
      setScheduling(false)
    }
  }

  const handleEditOutcome = (event) => {
    setEditingEvent(event);
    setOutcomeValue(event.outcome || "");
    setShowOutcomeDialog(true);
  };

  const handleSaveOutcome = async () => {
    if (!editingEvent) return;
    try {
      const hearingStart = editingEvent.start || editingEvent.date;
      const hearingStartDate = toDate(hearingStart);
      const hearingEnd =
        editingEvent.end ||
        (hearingStartDate
          ? new Date(hearingStartDate.getTime() + 60 * 60 * 1000).toISOString()
          : undefined);

      if (editingEvent._id && !editingEvent.isVirtualFirst) {
        await api.events.update(editingEvent._id, {
          ...editingEvent,
          outcome: outcomeValue,
          case: editingEvent.case?._id || editingEvent.case || caseData?._id || caseData?.id,
        });
      } else {
        if (!hearingStartDate || !caseData) {
          throw new Error("Hearing details are incomplete.");
        }

        await api.events.create({
          title: editingEvent.title || `Hearing for ${caseData.title || caseData.caseNumber || "Case"}`,
          start: hearingStartDate.toISOString(),
          end: hearingEnd,
          type: "hearing",
          case: caseData._id || caseData.id,
          location: editingEvent.location || caseData.court || "Courtroom",
          description: editingEvent.description || "",
          outcome: outcomeValue,
          status: editingEvent.status || "completed",
        });
      }

      setShowOutcomeDialog(false);
      setEditingEvent(null);
      setOutcomeValue("");
      await fetchCaseEvents();
      toast({ title: "Success", description: "Outcome updated." });
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to update outcome." });
    }
  };

  const handleViewDocument = (documentUrl) => {
    if (!documentUrl) {
      toast({ title: "Error", description: "Document link is unavailable." });
      return;
    }
    window.open(documentUrl, "_blank", "noopener,noreferrer");
  };

  // Helper for ordinal numbers
  const getOrdinal = (n) => {
    if (n === 1) return 'First';
    if (n === 2) return 'Second';
    if (n === 3) return 'Third';
    if (n === 4) return 'Fourth';
    if (n === 5) return 'Fifth';
    if (n === 6) return 'Sixth';
    if (n === 7) return 'Seventh';
    if (n === 8) return 'Eighth';
    if (n === 9) return 'Ninth';
    if (n === 10) return 'Tenth';
    return n + 'th';
  };

  const hearings = useMemo(() => {
    const firstHearingDate = caseData?.nextHearingDate || caseData?.hearingDate
    const eventHearings = events
      .filter((event) => event.type === "hearing")
      .sort((a, b) => new Date(a.start) - new Date(b.start))

    const firstHearingExists = eventHearings.some((event) => {
      const eventDate = toDate(event.start)?.toDateString()
      const firstDate = toDate(firstHearingDate)?.toDateString()
      return Boolean(firstDate && eventDate === firstDate)
    })

    if (firstHearingDate && !firstHearingExists) {
      return [
        {
          _id: "first-hearing",
          start: firstHearingDate,
          description: "Set during case creation",
          outcome: "",
          isVirtualFirst: true,
          location: caseData?.court || "Courtroom",
          title: `Hearing for ${caseData?.title || caseData?.caseNumber || "Case"}`,
        },
        ...eventHearings,
      ]
    }

    return eventHearings
  }, [caseData, events])

  const hearingHistory = useMemo(() => {
    return hearings.map((event, idx) => {
      const hearingStart = event.start || event.date
      const defaultPurpose = idx === 0 && event.isVirtualFirst
        ? "First hearing scheduled during case creation"
        : "Hearing"
      const genericTitle =
        typeof event.title === "string" && /^hearing for\b/i.test(event.title.trim())

      return {
        id: event._id || `hearing-history-${idx}`,
        serialNumber: idx + 1,
        date: hearingStart,
        purpose:
          event.description ||
          (!genericTitle ? event.title : "") ||
          defaultPurpose,
        proceedings: event.outcome || "",
        status:
          event.status ||
          (event.outcome ? "completed" : isFutureHearing(hearingStart) ? "scheduled" : "completed"),
      }
    })
  }, [hearings])

  const handleDeleteCase = async () => {
    if (deleteConfirmation !== caseData.title) {
      toast({
        title: "Error",
        description: "Case title does not match. Please enter the exact case title to confirm deletion.",
        variant: "destructive",
      });
      return;
    }

    setDeleting(true);
    try {
      await api.cases.delete(id);
      toast({
        title: "Success",
        description: "Case deleted successfully.",
      });
      router.push('/dashboard/cases');
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete case.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmation("");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">{error || "Case not found"}</p>
        <Button onClick={() => router.push("/dashboard/cases")}>Back to Cases</Button>
      </div>
    )
  }

  const isLawyer = user?.role === "lawyer"
  const userId = user?.id || user?._id
  const canReviewDocuments =
    user?.role === "admin" ||
    (user?.role === "lawyer" &&
      (caseData?.lawyer?._id === userId ||
        caseData?.lawyer === userId ||
        (caseData?.lawyers || []).some((lawyer) => personMatchesUser(lawyer, user))))
  const canUploadDocuments =
    canReviewDocuments ||
    (user?.role === "client" &&
      (caseData?.client?._id === userId ||
        caseData?.client === userId ||
        (caseData?.clients || []).some((client) => personMatchesUser(client, user))))
  const allClients = Array.from(
    new Map(
      [caseData?.client, ...(caseData?.clients || [])]
        .filter(Boolean)
        .map((client, index) => {
          const uniqueKey =
            client?._id ||
            client?.id ||
            client?.user?._id ||
            client?.user?.id ||
            client?.email ||
            `${client?.name || "client"}-${index}`;
          return [String(uniqueKey), client];
        })
    ).values()
  )
  const stakeholderGroups = [
    {
      key: "witness",
      label: "Witness",
      className: "bg-amber-50",
      iconClassName: "text-amber-600",
      matches: (stakeholder) => (stakeholder?.roleInCase || "").trim().toLowerCase() === "witness",
    },
    {
      key: "expert",
      label: "Expert",
      className: "bg-green-50",
      iconClassName: "text-green-600",
      matches: (stakeholder) => (stakeholder?.roleInCase || "").trim().toLowerCase() === "expert",
    },
    {
      key: "beneficiary",
      label: "Beneficiary",
      className: "bg-[#03234b]/10",
      iconClassName: "text-[#03234b]",
      matches: (stakeholder) => (stakeholder?.roleInCase || "").trim().toLowerCase() === "beneficiary",
    },
    {
      key: "other",
      label: "Other Stakeholders",
      className: "bg-[#03234b]/10",
      iconClassName: "text-[#03234b]",
      matches: (stakeholder) => {
        const normalizedRole = (stakeholder?.roleInCase || "").trim().toLowerCase();
        return !["witness", "expert", "beneficiary"].includes(normalizedRole);
      },
    },
  ]


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/cases")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{caseData.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details">Case Details</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="hearings">Hearings</TabsTrigger>
              <TabsTrigger value="transfer">Transfer & FIR</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Case Information</CardTitle>
                  <CardDescription>Details and status of the case</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Filing Number</h3>
                      <p className="text-base">{formatDisplayCaseNumber({ caseNumber: caseData.caseNumber, caseTypeName: caseData.caseSubType || caseData.caseType || "", caseTypeCode: caseData.eCourt?.caseTypeCode || caseData.caseCode || "" }) || caseData.caseNumber}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">CNR Number</h3>
                      <p className="text-base">{caseData.cnrNumber || "Not available"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Case Type</h3>
                      <p className="text-base">
                        {formatCaseTypeLabel(caseData.caseSubType || caseData.caseType)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                      <Badge className={getStatusColor(caseData.status)}>
                        {caseData.status?.charAt(0).toUpperCase() + caseData.status?.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Priority</h3>
                      <Badge className={getPriorityColor(caseData.priority)}>
                        {caseData.priority?.charAt(0).toUpperCase() + caseData.priority?.slice(1) || "Normal"}
                      </Badge>
                      {caseData.isUrgent && (
                        <Badge className="ml-2 bg-red-100 text-red-800">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Urgent
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Filing Date</h3>
                      <p className="text-base text-muted-foreground flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatDate(caseData.filingDate)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">First Hearing</h3>
                      <p className="text-base text-muted-foreground flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatDate(caseData.nextHearingDate || caseData.hearingDate)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Case Stage</h3>
                      <p className="text-base text-muted-foreground capitalize">
                        {caseData.caseStage?.replace(/_/g, " ") || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-foreground">Court Information</h3>
                    <div className="mt-2 space-y-2">
                      <p className="text-base text-muted-foreground flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        {caseData.court || "Not specified"}
                        {caseData.courtHall && `, Hall ${caseData.courtHall}`}
                      </p>
                      {caseData.district && (
                        <p className="text-sm text-muted-foreground pl-6">
                          District: {caseData.district?.replace(/_/g, " ")}
                        </p>
                      )}
                      {caseData.courtComplex && (
                        <p className="text-sm text-muted-foreground pl-6">Complex: {caseData.courtComplex}</p>
                      )}
                    </div>
                  </div>

                  <Separator />
   <div>
                      <h3 className="text-sm font-medium text-foreground">Case Description</h3>
                      <p className="mt-2 text-base text-muted-foreground">
                        {caseData.description || "No case description provided yet."}
                      </p>
                    </div>
                                        <Separator />

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Case History</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Hearing dates, purpose, proceedings, and current status.
                      </p>
                    </div>

                    {hearingHistory.length > 0 ? (
                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-14">#</TableHead>
                              <TableHead className="min-w-[140px]">Hearing Date</TableHead>
                              <TableHead className="min-w-[220px]">Purpose of Hearing</TableHead>
                              <TableHead className="min-w-[280px]">Proceedings</TableHead>
                              <TableHead className="min-w-[140px]">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {hearingHistory.map((hearing) => (
                              <TableRow key={hearing.id}>
                                <TableCell className="font-medium">{hearing.serialNumber}</TableCell>
                                <TableCell>{formatDate(hearing.date)}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {hearing.purpose || "Not specified"}
                                </TableCell>
                                <TableCell className="max-w-[420px] whitespace-pre-wrap text-muted-foreground">
                                  {hearing.proceedings || "No proceedings recorded yet."}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(hearing.status)}>
                                    {hearing.status?.charAt(0).toUpperCase() + hearing.status?.slice(1)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        No hearing history is available for this case yet.
                      </div>
                    )}
                  </div>

                  <>
                 
                  </>

                  {caseData.actSections && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Act & Sections</h3>
                        <p className="mt-2 text-base text-muted-foreground">{caseData.actSections}</p>
                      </div>
                    </>
                  )}

                  {caseData.reliefSought && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Relief Sought</h3>
                        <p className="mt-2 text-base text-muted-foreground">{caseData.reliefSought}</p>
                      </div>
                    </>
                  )}

                  {caseData.notes && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Additional Notes</h3>
                        <p className="mt-2 text-base text-muted-foreground">{caseData.notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="people">
              <Card>
                <CardHeader>
                  <CardTitle>People Involved</CardTitle>
                  <CardDescription>Key individuals and parties associated with the case.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Legal Team Section */}
                  <div className="mb-4 pb-4 border-b">
                    <h3 className="text-md font-semibold mb-3 text-gray-700">Legal Team</h3>
                    {(caseData.advocates && caseData.advocates.length > 0) || (caseData.lawyers && caseData.lawyers.length > 0) ? (
                      <>
                        {/* Advocates */}
                        {caseData.advocates && caseData.advocates.length > 0 && (
                          <div className="space-y-4">
                            {caseData.advocates.map((advocate, idx) => (
                              <div key={`advocate-${idx}`} className="mb-4 p-4 bg-[#03234b]/10 rounded-lg border-l-4 border-[#03234b]">
                                <div className="flex justify-between items-start">
                                  <div className="w-full">
                                    <div className="flex items-center flex-wrap gap-2 mb-2">
                                      <User className="h-4 w-4 text-[#03234b] mr-1 flex-shrink-0" />
                                      <p className="font-medium text-[#03234b]">
                                        {advocate.name || 'Advocate'}
                                      </p>
                                      {advocate.isLead && <Badge className="bg-[#03234b] text-white text-xs">Lead Advocate</Badge>}
                                      {advocate.level && (
                                        <Badge variant="outline" className="text-xs bg-[#03234b]/10 text-[#03234b] border-[#03234b]/30">
                                          {advocate.level}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="ml-5 space-y-1.5">
                                      {advocate.email && (
                                        <p className="text-sm text-gray-700 flex items-start">
                                          <span className="w-16 text-gray-500">Email:</span>
                                          <span className="flex-1">{advocate.email}</span>
                                        </p>
                                      )}
                                      {advocate.contact && (
                                        <p className="text-sm text-gray-700 flex items-start">
                                          <span className="w-16 text-gray-500">Contact:</span>
                                          <span className="flex-1">{advocate.contact}</span>
                                        </p>
                                      )}
                                      {advocate.company && (
                                        <p className="text-sm text-gray-700 flex items-start">
                                          <span className="w-16 text-gray-500">Firm:</span>
                                          <span className="flex-1">{advocate.company}</span>
                                        </p>
                                      )}
                                      {advocate.gst && (
                                        <p className="text-sm text-gray-700 flex items-start">
                                          <span className="w-16 text-gray-500">GST:</span>
                                          <span className="flex-1">{advocate.gst}</span>
                                        </p>
                                      )}
                                      {advocate.chairPosition && (
                                        <p className="text-sm text-gray-700 flex items-start">
                                          <span className="w-16 text-gray-500">Position:</span>
                                          <span className="flex-1 capitalize">
                                            {advocate.chairPosition
                                              .replace(/_/g, ' ')
                                              .split(' ')
                                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                              .join(' ')}
                                          </span>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Lawyers */}
                        {caseData.lawyers && caseData.lawyers.length > 0 && (
                          <div className="space-y-3 mt-4">
                            {caseData.lawyers.map((lawyer, index) => (
                              <div key={`lawyer-${index}`} className="p-3 border rounded-lg bg-white shadow-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex-1">
                                      <div className="flex items-center flex-wrap gap-2">
                                        <User className="h-4 w-4 text-gray-500 mr-1 flex-shrink-0" />
                                        <p className="font-medium text-sm">{lawyer.name}</p>
                                        {/* Role Badge */}
                                        {lawyer.role && (
                                          <Badge variant="outline" className="text-xs">
                                            {lawyer.role.charAt(0).toUpperCase() + lawyer.role.slice(1)}
                                          </Badge>
                                        )}
                                        {/* Level Badge */}
                                        {lawyer.level && (
                                          <Badge variant="outline" className="text-xs bg-[#03234b]/10 text-[#03234b] border-[#03234b]/30">
                                            {lawyer.level}
                                          </Badge>
                                        )}
                                        {/* Position Badge */}
                                        {lawyer.chairPosition && lawyer.chairPosition !== 'other' && (
                                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                            {lawyer.chairPosition.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                          </Badge>
                                        )}
                                        {/* Primary Badge */}
                                        {lawyer.isPrimary && (
                                          <Badge className="ml-1 bg-[#03234b]/20 text-[#03234b] border-[#03234b]/30 text-xs">
                                            Primary
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="ml-5 mt-2 space-y-1.5">
                                        {lawyer.email && (
                                          <p className="text-sm text-gray-600 flex items-start">
                                            <span className="w-16 text-gray-500 text-sm">Email:</span>
                                            <span className="flex-1">{lawyer.email}</span>
                                          </p>
                                        )}
                                        {lawyer.contact && (
                                          <p className="text-sm text-gray-600 flex items-start">
                                            <span className="w-16 text-gray-500 text-sm">Contact:</span>
                                            <span className="flex-1">{lawyer.contact}</span>
                                          </p>
                                        )}
                                        {lawyer.company && (
                                          <p className="text-sm text-gray-600 flex items-start">
                                            <span className="w-16 text-gray-500 text-sm">Firm:</span>
                                            <span className="flex-1">{lawyer.company}</span>
                                          </p>
                                        )}
                                        {lawyer.gst && (
                                          <p className="text-sm text-gray-600 flex items-start">
                                            <span className="w-16 text-gray-500 text-sm">GST:</span>
                                            <span className="flex-1">{lawyer.gst}</span>
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">No advocate or lawyer information available.</div>
                    )}
                  </div>

                  {/* Clients Section */}
                  <div className="mb-4 pb-4 border-b">
                    <h3 className="text-md font-semibold mb-3 text-gray-700">Clients</h3>
                    {allClients.length > 0 && (
                      <div className="space-y-3 mt-4">
                        {allClients.map((client, index) => (
                          <div key={`client-${index}`} className="p-3 border rounded-lg bg-white shadow-sm">
                            <p className="font-medium text-sm flex items-center">
                              <User className="h-4 w-4 text-gray-500 mr-2" />
                              {client.name}
                            </p>
                            <div className="ml-6 mt-1 space-y-1">
                              {client.email && (
                                <p className="text-xs text-gray-600 flex items-center">
                                  <span className="w-16 text-gray-500">Email:</span>
                                  {client.email}
                                </p>
                              )}
                              {client.contact && (
                                <p className="text-xs text-gray-600 flex items-center">
                                  <span className="w-16 text-gray-500">Contact:</span>
                                  {client.contact}
                                </p>
                              )}
                              {client.address && (
                                <p className="text-xs text-gray-600 flex items-center">
                                  <span className="w-16 text-gray-500">Address:</span>
                                  <span className="flex-1">{client.address}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {allClients.length === 0 && (
                      <p className="text-sm text-muted-foreground">No clients have been added to this case.</p>
                    )}
                  </div>

                  {/* Parties Section */}
                  {(caseData.parties?.petitioner?.length > 0 || caseData.parties?.respondent?.length > 0) && (
                    <div className="mb-6">
                      <h3 className="text-md font-semibold mb-3 text-gray-700">Case Parties</h3>
                      
                      {/* Petitioners */}
                      {caseData.parties.petitioner?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2 text-gray-600">Petitioners</h4>
                          <div className="space-y-2">
                            {caseData.parties.petitioner.map((party, index) => (
                              <div key={`petitioner-${index}`} className="p-3 border rounded-lg bg-white shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <User className="h-4 w-4 text-purple-600" />
                                      <p className="font-medium text-sm">{party.name}</p>
                                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                        {party.role}
                                      </Badge>
                                    </div>
                                    <div className="ml-6 space-y-1">
                                      <p className="text-xs text-gray-600">Type: {party.type}</p>
                                      {party.email && (
                                        <p className="text-xs text-gray-600">Email: {party.email}</p>
                                      )}
                                      {party.contact && (
                                        <p className="text-xs text-gray-600">Contact: {party.contact}</p>
                                      )}
                                      {party.address && (
                                        <p className="text-xs text-gray-600">Address: {party.address}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Respondents */}
                      {caseData.parties.respondent?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2 text-gray-600">Respondents</h4>
                          <div className="space-y-2">
                            {caseData.parties.respondent.map((party, index) => (
                              <div key={`respondent-${index}`} className="p-3 border rounded-lg bg-white shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <User className="h-4 w-4 text-red-600" />
                                      <p className="font-medium text-sm">{party.name}</p>
                                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                        {party.role}
                                      </Badge>
                                    </div>
                                    <div className="ml-6 space-y-1">
                                      <p className="text-xs text-gray-600">Type: {party.type}</p>
                                      {party.email && (
                                        <p className="text-xs text-gray-600">Email: {party.email}</p>
                                      )}
                                      {party.contact && (
                                        <p className="text-xs text-gray-600">Contact: {party.contact}</p>
                                      )}
                                      {party.address && (
                                        <p className="text-xs text-gray-600">Address: {party.address}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stakeholders Section */}
                  <div className="mt-6">
                    <h3 className="text-md font-semibold mb-3 text-gray-700">Stakeholders</h3>
                    {caseData.stakeholders && caseData.stakeholders.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stakeholderGroups.map((group) => {
                          const filtered = caseData.stakeholders.filter(group.matches);
                          if (filtered.length === 0) return null;
                          return (
                            <div key={group.key} className={`p-4 border rounded-lg ${group.className} md:col-span-1`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Users className={`h-4 w-4 ${group.iconClassName}`} />
                                <h4 className="font-medium">{group.label}</h4>
                              </div>
                              <div className="space-y-2">
                                {filtered.map((stakeholder, idx) => (
                                  <div key={idx} className="mb-2">
                                    <p className="font-medium text-sm">{stakeholder.name}</p>
                                    {stakeholder.roleInCase && <p className="text-xs text-gray-600">Role: {stakeholder.roleInCase}</p>}
                                    {stakeholder.email && <p className="text-xs text-gray-600">Email: {stakeholder.email}</p>}
                                    {stakeholder.contact && <p className="text-xs text-gray-600">Contact: {stakeholder.contact}</p>}
                                    {stakeholder.address && <p className="text-xs text-gray-600">Address: {stakeholder.address}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">No stakeholders added yet.</div>
                    )}
                  </div>

                  {/* Fallback if no people or parties at all */}
                  {!caseData.lawyer && !caseData.client && 
                    (!caseData.clients || caseData.clients.length === 0) && 
                    (!caseData.advocates || caseData.advocates.length === 0) && 
                    (!caseData.parties || 
                      (caseData.parties.petitioner?.length === 0 && 
                       caseData.parties.respondent?.length === 0)) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No people or party information available for this case.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Case Documents</CardTitle>
                  <CardDescription>Documents related to this case and their lawyer review status</CardDescription>
                </CardHeader>
                <CardContent>
                  {documents && documents.length > 0 ? (
                    <div className="space-y-4">
                      {documents.map((doc, index) => {
                        const documentUrl = getDocumentOpenUrl(doc);
                        const approvalStatus = getDocumentApprovalStatus(doc);
                        const documentId = doc._id || doc.id;
                        const isPending = approvalStatus === "pending";
                        const isRejected = approvalStatus === "rejected";
                        const isReviewing = reviewingDocumentId === documentId;

                        return (
                          <div key={documentId || index} className="flex items-center justify-between p-3 border rounded-md gap-4">
                            <div className="flex items-center min-w-0">
                              <FileText className="mr-3 h-5 w-5 text-muted-foreground" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium">{doc.name}</p>
                                  <Badge className={getDocumentStatusColor(approvalStatus)}>
                                    {approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{doc.description || "No description"}</p>
                                {doc.reviewNotes && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Review note: {doc.reviewNotes}
                                  </p>
                                )}
                                {doc.uploadedByName && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Uploaded by {doc.uploadedByName}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              {(isPending || isRejected) && !canReviewDocuments && (
                                <span className="text-xs text-muted-foreground">
                                  {isPending
                                    ? "Waiting for lawyer approval"
                                    : "Rejected by lawyer"}
                                </span>
                              )}
                              {canReviewDocuments && isPending && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isReviewing}
                                    onClick={() => handleReviewDocument(doc, "approved")}
                                  >
                                    {isReviewing ? "Saving..." : "Approve"}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={isReviewing}
                                    onClick={() => handleReviewDocument(doc, "rejected")}
                                  >
                                    {isReviewing ? "Saving..." : "Reject"}
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!documentUrl}
                                onClick={() => handleViewDocument(documentUrl)}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No documents found</h3>
                      <p className="text-sm text-muted-foreground">There are no documents attached to this case yet.</p>
                    </div>
                  )}
                </CardContent>
                {canUploadDocuments && (
                  <CardFooter>
                    <div className="flex gap-2">
                      <Button onClick={() => setShowUploadDialog(true)} variant="secondary">Upload Document</Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="hearings">
              <Card>
                <CardHeader>
                  <CardTitle>All Hearings</CardTitle>
                  <CardDescription>Chronological list of all hearings for this case</CardDescription>
                </CardHeader>
                <CardContent>
                  {hearings.length > 0 ? (
                      <ul className="space-y-3">
                        {hearings.map((event, idx) => (
                          <li
                            key={event._id || `hearing-${idx}`}
                            className="rounded-xl border bg-card px-4 py-4"
                          >
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0 flex-1 space-y-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#03234b]/10 text-sm font-semibold text-[#03234b]">
                                    {idx + 1}
                                  </div>
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#03234b]/5">
                                    <Calendar className="h-5 w-5 text-[#03234b]" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-medium text-base">
                                      {event.start ? formatDate(event.start) : 'Not set'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {getOrdinal(idx + 1)} Hearing
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-lg border bg-muted/30 p-3">
                                  <p className="text-sm font-medium text-foreground mb-1">
                                    Proceeding
                                  </p>
                                  <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                                    {event.outcome || "No proceedings recorded for this hearing."}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 md:justify-end">
                                {isLawyer && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isFutureHearing(event.start)}
                                    onClick={() => handleEditOutcome(event)}
                                  >
                                    {event.outcome ? "Edit Proceeding" : "Add Proceeding"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No hearings scheduled</h3>
                      <p className="text-sm text-muted-foreground">
                          There are no hearings set for this case yet.
                      </p>
                    </div>
                  )}
                </CardContent>
                {((isLawyer && (caseData?.lawyer?._id === user?.id || caseData?.lawyer === user?.id)) || 
                  (user?.role === 'client' && (caseData?.client?._id === user?.id || caseData?.client === user?.id))) && (
                  <CardFooter>
                    <div className="flex gap-2">
                      <Button onClick={() => setShowScheduleDialog(true)} variant="secondary">Schedule Hearing</Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="transfer">
              <Card>
                <CardHeader>
                  <CardTitle>FIR & Police Station</CardTitle>
                  <CardDescription>FIR details linked to this case</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Police Station</h3>
                      <p>{caseData.policeStation || "—"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">FIR Number</h3>
                      <p>{caseData.firNumber || "—"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">FIR Year</h3>
                      <p>{caseData.firYear || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Case Transfer History</CardTitle>
                  <CardDescription>
                    Every transfer between courts or judges. Latest entry reflects current court.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(caseData.transferHistory?.length || 0) === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No transfer entries.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="p-2">Reg. No</th>
                            <th className="p-2">Date</th>
                            <th className="p-2">From Court / Hall / Judge</th>
                            <th className="p-2">To Court / Hall / Judge</th>
                            <th className="p-2">Linked Hearing</th>
                            <th className="p-2">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...caseData.transferHistory]
                            .sort((a, b) => new Date(b.transferDate) - new Date(a.transferDate))
                            .map((t) => {
                              const hearing =
                                typeof t.hearing === "object" && t.hearing ? t.hearing : null
                              return (
                                <tr key={t._id} className="border-b align-top">
                                  <td className="p-2">{t.registrationNumber || "—"}</td>
                                  <td className="p-2">{formatTransferDate(t.transferDate)}</td>
                                  <td className="p-2">
                                    <div>{t.fromCourt || "—"}</div>
                                    <div className="text-xs text-muted-foreground">
                                      Hall {t.fromCourtHall || "—"} · {t.fromJudge || "—"}
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <div>{t.toCourt || "—"}</div>
                                    <div className="text-xs text-muted-foreground">
                                      Hall {t.toCourtHall || "—"} · {t.toJudge || "—"}
                                    </div>
                                  </td>
                                  <td className="p-2 text-xs">
                                    {hearing ? (
                                      <>
                                        {hearing.title || "Hearing"}
                                        <br />
                                        <span className="text-muted-foreground">
                                          {formatTransferDate(hearing.start)}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </td>
                                  <td className="p-2 max-w-xs text-xs">{t.remarks || "—"}</td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <CaseTimeline caseData={caseData} />

          <Card>
            <CardHeader>
              <CardTitle>Case Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-center gap-x-4 gap-y-1">
                  <h3 className="text-sm font-medium">Status</h3>
                  <Badge className={`justify-self-end ${getStatusColor(caseData.status)}`}>
                    {caseData.status?.charAt(0).toUpperCase() + caseData.status?.slice(1)}
                  </Badge>
                </div>
                <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-center gap-x-4 gap-y-1">
                  <h3 className="text-sm font-medium">Case Type</h3>
                  <span className="text-sm text-right break-words">
                    {formatCaseTypeLabel(caseData.caseSubType || caseData.caseType)}
                  </span>
                </div>
                <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-center gap-x-4 gap-y-1">
                  <h3 className="text-sm font-medium">Filing Date</h3>
                  <span className="text-sm text-right">{formatDate(caseData.filingDate)}</span>
                </div>
                <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-center gap-x-4 gap-y-1">
                  <h3 className="text-sm font-medium">First Hearing</h3>
                  <span className="text-sm text-right">{formatDate(caseData.nextHearingDate || caseData.hearingDate)}</span>
                </div>
                {caseData.court && (
                  <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-start gap-x-4 gap-y-1">
                    <h3 className="pt-0.5 text-sm font-medium">Court</h3>
                    <span className="min-w-0 text-sm text-right break-words">
                      {caseData.court}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Key Parties</h3>
                {caseData.petitionerNames && caseData.petitionerNames.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {caseData.petitionerRole?.charAt(0).toUpperCase() + caseData.petitionerRole?.slice(1) ||
                        "Petitioner"}
                    </p>
                    <p className="text-sm">{caseData.petitionerNames[0]}</p>
                  </div>
                )}
                {caseData.opposingPartyNames && caseData.opposingPartyNames.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      {caseData.opposingRole?.charAt(0).toUpperCase() + caseData.opposingRole?.slice(1) || "Defendant"}
                    </p>
                    <p className="text-sm">{caseData.opposingPartyNames[0]}</p>
                  </div>
                )}
              </div>

              {documents && documents.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium">Documents</h3>
                    <p className="text-sm">{documents.length} document(s) attached</p>
                  </div>
                </>
              )}

              {events && events.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium">Hearings</h3>
                    <p className="text-sm">{events.length} hearing(s) scheduled</p>
                  </div>
                </>
              )}
            </CardContent>
            {canUploadDocuments && (
              <CardFooter className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button className="w-full" variant="outline" onClick={() => router.push(`/dashboard/cases/${id}/edit`)}>
                  Edit Case
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setShowUploadDialog(true)}
                >
                  Upload Document
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setShowScheduleDialog(true)}
                >
                  Schedule Hearing
                </Button>
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Case
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.zip"
              onChange={handleFileChange}
              required
            />
            <Input type="text" placeholder="Description" value={uploadForm.description} onChange={e => setUploadForm(prev => ({ ...prev, description: e.target.value }))} />
            {/* Virus scan status banner */}
            {(scanning || scanPassed) && (
              <div className={`rounded-lg border-2 p-4 animate-scan-pop-in transition-colors duration-300 ${
                scanPassed ? "border-green-300 bg-green-50" : "border-yellow-300 bg-white"
              }`}>
                {scanning ? (
                  <div className="flex flex-col items-center gap-2 py-1">
                    <img
                      src="/scanner.gif"
                      alt="Scanning document"
                      className="h-20 w-20 object-contain"
                    />
                    <p className="font-semibold text-sm text-yellow-800">Scanning for Viruses</p>
                    <p className="text-xs text-yellow-600">ClamAV is checking your document for malware...</p>
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-yellow-200 mt-1">
                      <div className="h-full w-1/3 rounded-full bg-yellow-500 animate-scan-sweep" />
                    </div>
                    <p className="text-xs text-yellow-500">Do not close this window</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" className="animate-scan-check" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-green-800">Virus Scan Passed</p>
                      <p className="text-xs text-green-600">Document is clean — no threats detected</p>
                      <div className="w-full h-1.5 rounded-full overflow-hidden bg-green-200 mt-2">
                        <div className="h-full w-full rounded-full bg-green-500 transition-all duration-500" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button type="submit" disabled={uploading}>
              {scanPassed ? (
                <span className="flex items-center gap-2 text-green-700">
                  <ShieldCheck className="h-4 w-4" />
                  Done
                </span>
              ) : scanning ? (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 animate-pulse" />
                  Scanning...
                </span>
              ) : uploading ? (
                "Uploading..."
              ) : (
                "Upload"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Next Hearing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <DatePicker
              mode="single"
              selected={hearingDate}
              onSelect={setHearingDate}
              disabled={(date) => {
                const firstHearing = caseData.nextHearingDate ? new Date(caseData.nextHearingDate) : (caseData.hearingDate ? new Date(caseData.hearingDate) : null);
                return firstHearing ? date <= firstHearing : false;
              }}
            />
            <Button onClick={handleScheduleSubmit} disabled={scheduling || !hearingDate}>{scheduling ? "Scheduling..." : "Set Hearing Date"}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Hearing Proceedings</DialogTitle>
            <DialogDescription>
              Document what happened at this hearing — orders passed, adjournments, arguments made, etc.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Describe what happened at this hearing..."
              value={outcomeValue}
              onChange={e => setOutcomeValue(e.target.value)}
              rows={6}
            />
            <Button onClick={handleSaveOutcome}>Save Proceedings</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Case</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the case and all associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <h4 className="font-medium text-red-800">Warning</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Deleting this case will permanently remove all case data, documents, and hearing records. 
                    This action is not reversible.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                To confirm deletion, please type the exact case title: <strong>{caseData.title}</strong>
              </Label>
              <Input
                id="delete-confirmation"
                type="text"
                placeholder="Enter case title to confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteCase}
                disabled={deleting || deleteConfirmation !== caseData.title}
              >
                {deleting ? "Deleting..." : "Delete Case Permanently"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
