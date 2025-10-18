"use client";

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Clock, FileText, MapPin, User, Users, AlertTriangle, CheckCircle } from "lucide-react"
import api from "@/services/api"
import PartyDetails from "@/components/ui/party-details"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar as DatePicker } from "@/components/ui/calendar"
import { Calendar as CalendarIcon } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function CaseDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
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
  const [hearingDate, setHearingDate] = useState(null)
  const [scheduling, setScheduling] = useState(false)
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [outcomeValue, setOutcomeValue] = useState("")
  const [showViewOutcomeDialog, setShowViewOutcomeDialog] = useState(false)
  const [viewingEvent, setViewingEvent] = useState(null)
  const [viewingIndex, setViewingIndex] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [deleting, setDeleting] = useState(false)
  

  useEffect(() => {
    const fetchCaseDetails = async () => {
      setLoading(true)
      try {
        console.log("Fetching case details for ID:", id)
        // Fetch case details
        const response = await api.cases.getById(id)
        console.log("Case details response:", response)

        let rawData;
        if (response && response.data) {
          console.log('API response.data:', response.data);
          rawData = response.data;
        } else if (response) { // Should ideally not hit this if API is consistent
          console.log('API response (direct):', response);
          rawData = response;
        } else {
          throw new Error("Invalid response format");
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
        };
        console.log('Processed caseData.parties:', processedData.parties);
        console.log('Processed caseData.advocates:', processedData.advocates);
        console.log('Processed caseData.clients:', processedData.clients);
        setCaseData(processedData);

        // Fetch related documents if available
        try {
          const docsResponse = await api.documents.getByCaseId(id)
          console.log("Documents response:", docsResponse)
          if (docsResponse && Array.isArray(docsResponse.data)) {
            setDocuments(docsResponse.data)
          } else if (docsResponse && Array.isArray(docsResponse)) {
            setDocuments(docsResponse)
          }
        } catch (docError) {
          console.error("Error fetching documents:", docError)
          // Non-critical error, continue with case display
        }

        // Fetch related events if available
        try {
          const eventsResponse = await api.events.getByCaseId(id)
          console.log("Events response:", eventsResponse)
          if (eventsResponse && Array.isArray(eventsResponse.data)) {
            setEvents(eventsResponse.data)
          } else if (eventsResponse && Array.isArray(eventsResponse)) {
            setEvents(eventsResponse)
          }
        } catch (eventError) {
          console.error("Error fetching events:", eventError)
          // Non-critical error, continue with case display
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
      archived: "bg-blue-100 text-blue-800",
    }
    return statusMap[status?.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  const getPriorityColor = (priority) => {
    const priorityMap = {
      low: "bg-blue-100 text-blue-800",
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
    try {
      const formData = new FormData()
      formData.append("file", uploadForm.file)
      formData.append("description", uploadForm.description)
      formData.append("caseId", id)
      await api.documents.upload(formData)
      setShowUploadDialog(false)
      setUploadForm({ file: null, description: "" })
      // Optionally refresh documents list here
      toast({ title: "Success", description: "Document uploaded." })
    } catch (err) {
      toast({ title: "Error", description: "Failed to upload document." })
    } finally {
      setUploading(false)
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
        description: "Scheduled via case details page"
      }
      await api.events.create(eventPayload)
      setShowScheduleDialog(false)
      setHearingDate(null)
      // Refresh events list
      const eventsResponse = await api.events.getByCaseId(id)
      setEvents(eventsResponse)
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
      await api.events.update(editingEvent._id, { ...editingEvent, outcome: outcomeValue });
      setShowOutcomeDialog(false);
      setEditingEvent(null);
      setOutcomeValue("");
      // Refresh events list
      const eventsResponse = await api.events.getByCaseId(id);
      setEvents(eventsResponse);
      toast({ title: "Success", description: "Outcome updated." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update outcome." });
    }
  };

  const handleViewOutcome = (event, idx) => {
    setViewingEvent(event);
    setViewingIndex(idx);
    setShowViewOutcomeDialog(true);
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
  


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/cases")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{caseData.title}</h1>
        </div>
        {((isLawyer && (caseData?.lawyer?._id === user?.id || caseData?.lawyer === user?.id)) || 
          (user?.role === 'client' && (caseData?.client?._id === user?.id || caseData?.client === user?.id))) && (
          <Button onClick={() => router.push(`/dashboard/cases/${id}/edit`)}>Edit Case</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Case Details</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="hearings">Hearings</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Case Information</CardTitle>
                  <CardDescription>Details and status of the case</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Case Number</h3>
                      <p className="text-base">{caseData.caseNumber}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Case Type</h3>
                      <p className="text-base capitalize">{caseData.caseType}</p>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Filing Date</h3>
                      <p className="text-base flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatDate(caseData.filingDate)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">First Hearing</h3>
                      <p className="text-base flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatDate(caseData.hearingDate || caseData.nextHearingDate)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Case Stage</h3>
                      <p className="text-base capitalize">
                        {caseData.caseStage?.replace(/_/g, " ") || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Court Information</h3>
                    <div className="mt-2 space-y-2">
                      <p className="text-base flex items-center">
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

                  {caseData.description && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                        <p className="mt-2 text-base">{caseData.description}</p>
                      </div>
                    </>
                  )}

                  {caseData.actSections && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Act & Sections</h3>
                        <p className="mt-2 text-base">{caseData.actSections}</p>
                      </div>
                    </>
                  )}

                  {caseData.reliefSought && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Relief Sought</h3>
                        <p className="mt-2 text-base">{caseData.reliefSought}</p>
                      </div>
                    </>
                  )}

                  {caseData.notes && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Additional Notes</h3>
                        <p className="mt-2 text-base">{caseData.notes}</p>
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
                              <div key={`advocate-${idx}`} className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                <div className="flex justify-between items-start">
                                  <div className="w-full">
                                    <div className="flex items-center flex-wrap gap-2 mb-2">
                                      <User className="h-4 w-4 text-blue-600 mr-1 flex-shrink-0" />
                                      <p className="font-medium text-blue-800">
                                        {advocate.name || 'Advocate'}
                                      </p>
                                      {advocate.isLead && <Badge className="bg-blue-600 text-white text-xs">Lead Advocate</Badge>}
                                      {advocate.level && (
                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
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
                                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
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
                                          <Badge className="ml-1 bg-blue-100 text-blue-800 border-blue-200 text-xs">
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
                    
                    {/* Primary Client */}
                    {caseData.client && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-green-600 mr-2" />
                              <p className="font-medium">{caseData.client.name}</p>
                              <Badge variant="default" className="ml-2 bg-green-600">Primary</Badge>
                            </div>
                            {caseData.client.email && (
                              <p className="text-sm text-gray-600 ml-6 mt-1">{caseData.client.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Clients */}
                    {caseData.clients && caseData.clients.length > 0 && (
                      <div className="space-y-3 mt-4">
                        {caseData.clients.map((client, index) => (
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

                    {(!caseData.clients || caseData.clients.length === 0) && (
                      <p className="text-sm text-muted-foreground">No additional clients have been added to this case.</p>
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
                        {/* Group stakeholders by roleInCase */}
                        {['Witness', 'Expert', 'Beneficiary', 'Other', undefined, ''].map((role) => {
                          const filtered = caseData.stakeholders.filter(s => (s.roleInCase || '').toLowerCase().includes(role?.toLowerCase() || ''));
                          if (filtered.length === 0) return null;
                          return (
                            <div key={role || 'other'} className={`p-4 border rounded-lg ${role === 'Witness' ? 'bg-amber-50' : role === 'Expert' ? 'bg-green-50' : 'bg-blue-50'} md:col-span-1`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Users className={`h-4 w-4 ${role === 'Witness' ? 'text-amber-600' : role === 'Expert' ? 'text-green-600' : 'text-blue-600'}`} />
                                <h4 className="font-medium">{role || 'Other Stakeholders'}</h4>
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
                  <CardDescription>Documents related to this case</CardDescription>
                </CardHeader>
                <CardContent>
                  {documents && documents.length > 0 ? (
                    <div className="space-y-4">
                      {documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center">
                            <FileText className="mr-3 h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-muted-foreground">{doc.description || "No description"}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={doc.fileUrl || doc.signedUrl} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No documents found</h3>
                      <p className="text-sm text-muted-foreground">There are no documents attached to this case yet.</p>
                    </div>
                  )}
                </CardContent>
                {isLawyer && (
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
                  {(() => {
                    // Prepare the hearings list
                    const firstHearingDate = caseData.hearingDate || caseData.nextHearingDate;
                    let hearings = events
                      .filter(e => e.type === 'hearing')
                      .sort((a, b) => new Date(a.start) - new Date(b.start));
                    // Check if first hearing date is already in events
                    const firstHearingExists = hearings.some(e => {
                      const eventDate = new Date(e.start).toDateString();
                      const firstDate = firstHearingDate ? new Date(firstHearingDate).toDateString() : null;
                      return firstDate && eventDate === firstDate;
                    });
                    // If not, prepend a virtual hearing for the first hearing
                    if (firstHearingDate && !firstHearingExists) {
                      hearings = [
                        {
                          _id: 'first-hearing',
                          start: firstHearingDate,
                          description: 'Set during case creation',
                          outcome: '',
                          isVirtualFirst: true,
                        },
                        ...hearings,
                      ];
                    }
                    return hearings.length > 0 ? (
                      <ul className="space-y-3">
                        {hearings.map((event, idx) => (
                          <li key={event._id || `hearing-${idx}`} className="p-3 border rounded-md flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-bold mr-2">{idx + 1}.</span>
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">{event.start ? formatDate(event.start) : 'Not set'}</span>
                              <span className="ml-2 text-xs text-gray-500">({getOrdinal(idx + 1)} Hearing)</span>
                        </div>
                            <div className="flex-1 mt-2 md:mt-0 md:ml-6">
                              <span className="text-sm text-muted-foreground">{event.description || "No description"}</span>
                          </div>
                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                              <span className="text-xs text-gray-600">Outcome:</span>
                              <span className="text-sm font-semibold">{event.outcome || "-"}</span>
                              <Button size="sm" variant="outline" onClick={() => handleViewOutcome(event, idx)}>
                                View Outcome
                              </Button>
                              {((isLawyer && (caseData?.lawyer?._id === user?.id || caseData?.lawyer === user?.id)) || 
                                (user?.role === 'client' && (caseData?.client?._id === user?.id || caseData?.client === user?.id))) && !event.isVirtualFirst && (
                                <Button size="sm" variant="outline" onClick={() => handleEditOutcome(event)}>
                                  Edit Outcome
                                </Button>
                              )}
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
                    );
                  })()}
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
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Case Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Status</h3>
                  <Badge className={getStatusColor(caseData.status)}>
                    {caseData.status?.charAt(0).toUpperCase() + caseData.status?.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Case Type</h3>
                  <span className="text-sm capitalize">{caseData.caseType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Filing Date</h3>
                  <span className="text-sm">{formatDate(caseData.filingDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">First Hearing</h3>
                  <span className="text-sm">{formatDate(caseData.hearingDate || caseData.nextHearingDate)}</span>
                </div>
                {caseData.court && (
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Court</h3>
                    <span className="text-sm">{caseData.court}</span>
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
            {((isLawyer && (caseData?.lawyer?._id === user?.id || caseData?.lawyer === user?.id)) || 
              (user?.role === 'client' && (caseData?.client?._id === user?.id || caseData?.client === user?.id))) && (
              <CardFooter className="flex flex-col space-y-2">
                <Button className="w-full" variant="outline" onClick={() => router.push(`/dashboard/cases/${id}/edit`)}>
                  Edit Case
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/documents/upload?caseId=${id}`)}
                >
                  Upload Document
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/calendar/new?caseId=${id}`)}
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
            <Input type="file" onChange={handleFileChange} required />
            <Input type="text" placeholder="Description" value={uploadForm.description} onChange={e => setUploadForm(prev => ({ ...prev, description: e.target.value }))} />
            <Button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Upload"}</Button>
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
                const firstHearing = caseData.hearingDate ? new Date(caseData.hearingDate) : (caseData.nextHearingDate ? new Date(caseData.nextHearingDate) : null);
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
            <DialogTitle>Edit Hearing Outcome</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter outcome"
              value={outcomeValue}
              onChange={e => setOutcomeValue(e.target.value)}
            />
            <Button onClick={handleSaveOutcome} disabled={!outcomeValue}>Save Outcome</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showViewOutcomeDialog} onOpenChange={setShowViewOutcomeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Outcome{viewingIndex !== null ? `: ${getOrdinal(viewingIndex + 1)} Hearing` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-base">{viewingEvent?.outcome || "No outcome set for this hearing."}</div>
            <Button onClick={() => setShowViewOutcomeDialog(false)}>Close</Button>
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
