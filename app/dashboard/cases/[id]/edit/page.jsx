"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import api from "@/services/api";
import { Badge } from "@/components/ui/badge";
import {
  buildCaseNumber,
  getEcourtCaseTypeReference,
  normalizeFormattedCaseNumber,
  normalizeCaseNumber,
  parseCaseNumberParts,
} from "@/lib/caseTypeUtils";

const DEFAULT_CASE_YEAR = String(new Date().getFullYear());

const STATES = [
  { value: "karnataka", label: "Karnataka" },
  { value: "maharashtra", label: "Maharashtra" },
  { value: "tamil_nadu", label: "Tamil Nadu" },
  { value: "andhra_pradesh", label: "Andhra Pradesh" },
  { value: "kerala", label: "Kerala" },
  { value: "telangana", label: "Telangana" },
  { value: "goa", label: "Goa" },
];

const DISTRICTS = {
  karnataka: [
    { value: "bengaluru_urban", label: "Bengaluru Urban" },
    { value: "bengaluru_rural", label: "Bengaluru Rural" },
    { value: "mysuru", label: "Mysuru" },
    { value: "mangaluru", label: "Mangaluru" },
    { value: "belagavi", label: "Belagavi" },
    { value: "kalaburagi", label: "Kalaburagi" },
    { value: "dharwad", label: "Dharwad" },
    { value: "tumakuru", label: "Tumakuru" },
    { value: "shivamogga", label: "Shivamogga" },
    { value: "vijayapura", label: "Vijayapura" },
    { value: "davanagere", label: "Davanagere" },
    { value: "ballari", label: "Ballari" },
    { value: "udupi", label: "Udupi" },
    { value: "raichur", label: "Raichur" },
    { value: "hassan", label: "Hassan" },
  ],
  maharashtra: [
    { value: "mumbai", label: "Mumbai" },
    { value: "pune", label: "Pune" },
    { value: "nagpur", label: "Nagpur" },
  ],
  tamil_nadu: [
    { value: "chennai", label: "Chennai" },
    { value: "coimbatore", label: "Coimbatore" },
    { value: "madurai", label: "Madurai" },
  ],
  andhra_pradesh: [
    { value: "visakhapatnam", label: "Visakhapatnam" },
    { value: "vijayawada", label: "Vijayawada" },
    { value: "guntur", label: "Guntur" },
  ],
  kerala: [
    { value: "thiruvananthapuram", label: "Thiruvananthapuram" },
    { value: "kochi", label: "Kochi" },
    { value: "kottayam", label: "Kottayam" },
  ],
  telangana: [
    { value: "hyderabad", label: "Hyderabad" },
    { value: "warangal", label: "Warangal" },
    { value: "nizamabad", label: "Nizamabad" },
  ],
  goa: [
    { value: "panaji", label: "Panaji" },
    { value: "margao", label: "Margao" },
    { value: "vasco", label: "Vasco" },
  ],
};


const normalizeEmail = (value = "") =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const normalizeText = (value = "") =>
  typeof value === "string" ? value.trim() : "";

const getEntityId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    if (value._id) return value._id.toString();
    if (value.id) return value.id.toString();
    if (value.user) return getEntityId(value.user);
  }
  return value.toString();
};

const personMatchesUser = (person, user) => {
  const userId = getEntityId(user);
  const userEmail = normalizeEmail(user?.email);
  const personId = getEntityId(person);
  const personEmail = normalizeEmail(person?.email || person?.user?.email);

  return (
    (userId && personId && userId === personId) ||
    (userEmail && personEmail && userEmail === personEmail)
  );
};

export default function EditCasePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLawyer, setIsLawyer] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [hasEditAccess, setHasEditAccess] = useState(false);
  useEffect(() => {
    if (user) {
      setIsLawyer(user?.role === 'lawyer' || user?.role === 'admin');
    }
  }, [user]);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const response = await api.cases.getById(id);
        const d = response?.data || response;

        // Check if user has edit access
        const canEdit = checkEditAccess(d, user);
        setHasEditAccess(canEdit);

        if (!canEdit) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to edit this case.",
            variant: "destructive",
          });
          router.push(`/dashboard/cases/${id}`);
          return;
        }


        // Normalize data to match the new case form structure
        const ecourtCaseTypeName = d.eCourt?.caseTypeName || d.caseSubType || "";
        const ecourtCaseTypeCode = d.eCourt?.caseTypeCode || d.caseCode || "";
        const caseTypeReference = getEcourtCaseTypeReference({
          caseTypeName: ecourtCaseTypeName,
          caseTypeCode: ecourtCaseTypeCode,
        });
        const parsedCaseNumber = parseCaseNumberParts({
          caseNumber: d.caseNumber || d.number || "",
          caseTypeName: ecourtCaseTypeName,
          caseTypeCode: ecourtCaseTypeCode,
        });
        const caseYear = parsedCaseNumber.caseYear || DEFAULT_CASE_YEAR;
        const caseCode = parsedCaseNumber.caseCode || caseTypeReference.caseCode;

        setCaseData({
          ...d,
          caseNumber: buildCaseNumber({
            caseCode,
            caseNumberMiddle: parsedCaseNumber.caseNumberMiddle,
            caseYear,
          }) || normalizeFormattedCaseNumber(d.caseNumber || d.number || ""),
          caseNumberMiddle: parsedCaseNumber.caseNumberMiddle,
          caseYear,
          caseCode,
          caseTypeDisplay:
            [caseCode, caseTypeReference.caseTypeLabel || ecourtCaseTypeName.toUpperCase()]
              .filter(Boolean)
              .join(" - "),
          courtState: d.courtState || "",
          district: d.district || "",
          bench: d.bench || "",
          courtType: d.courtType || "district_court",
          court: d.court || "",
          courtHall: d.courtHall || "",
          courtComplex: d.courtComplex || "",
          filingDate: d.filingDate ? new Date(d.filingDate) : new Date(),
          nextHearingDate: d.nextHearingDate ? new Date(d.nextHearingDate) : null,
          petitionerRole: d.petitionerRole || "Petitioner",
          petitionerType: d.petitionerType || "Individual",
          petitioners: d.parties?.petitioner || [],
          respondentRole: d.respondentRole || "Defendant",
          respondents: d.parties?.respondent || [],
          description: d.description || "",
          caseSubType: d.caseSubType || ecourtCaseTypeName || "",
          status: d.status || "active",
          priority: d.priority || "normal",
          isUrgent: d.isUrgent || false,
          caseStage: d.caseStage || "filing",
          actSections: d.actSections || "",
          policeStation: d.policeStation || "",
          firNumber: d.firNumber || "",
          firYear: d.firYear || "",
          reliefSought: d.reliefSought || "",
          notes: d.notes || "",
          advocates: d.advocates || [],
          clients: d.clients || [],
          stakeholders: d.stakeholders || [],
          lawyers: d.lawyers || [],
        });
      } catch (err) {
        toast({
          title: "Error",
          description: err.message || "Failed to load case details.",
          variant: "destructive"
        });
        router.push("/dashboard/cases");
      }
    };

    if (id && user) fetchCase();
  }, [id, user]);
  // Check if user has edit access to this case
  const checkEditAccess = (caseData, user) => {
    if (!user || !caseData) return false;
    const role = (user.role || "").toLowerCase();
    if (role === "admin") return true;

    if (role === 'lawyer') {
      const caseLawyers = caseData.lawyers || [];
      return (
        getEntityId(caseData.lawyer) === getEntityId(user) ||
        caseLawyers.some((lawyer) => personMatchesUser(lawyer, user))
      );
    } else if (role === 'client') {
      const caseClients = caseData.clients || [];
      const partyPetitioners = caseData.parties?.petitioner || [];
      const partyRespondents = caseData.parties?.respondent || [];
      return (
        getEntityId(caseData.client) === getEntityId(user) ||
        caseClients.some((client) => personMatchesUser(client, user)) ||
        partyPetitioners.some((p) => personMatchesUser(p, user)) ||
        partyRespondents.some((r) => personMatchesUser(r, user))
      );
    }

    return false;
  };
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "caseNumberMiddle") {
      setCaseData((prev) => ({
        ...prev,
        caseNumberMiddle: normalizeCaseNumber(value),
        caseNumber: buildCaseNumber({
          caseCode: prev.caseCode,
          caseNumberMiddle: normalizeCaseNumber(value),
          caseYear: prev.caseYear,
        }),
      }));
      return;
    }

    setCaseData((prev) => ({
      ...prev,
      [name]: name === "caseNumber" ? normalizeFormattedCaseNumber(value) : value,
    }));
  };

  const handleSelectChange = (name, value) => {
    if (name === "caseYear") {
      setCaseData((prev) => ({
        ...prev,
        caseYear: value,
        caseNumber: buildCaseNumber({
          caseCode: prev.caseCode,
          caseNumberMiddle: prev.caseNumberMiddle,
          caseYear: value,
        }),
      }));
      return;
    }

    setCaseData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "caseType" ? { caseSubType: "" } : {}),
    }));
  };

  const handleDateChange = (name, value) => {
    setCaseData((prev) => {
      const newData = { ...prev, [name]: value };

      // Validate that next hearing date is after filing date
      if (name === 'nextHearingDate' && newData.filingDate && value) {
        if (new Date(value) <= new Date(newData.filingDate)) {
          toast({
            title: "Validation Error",
            description: "First hearing date must be after the filing date",
            variant: "destructive",
          });
          return prev; // Don't update if validation fails
        }
      }

      return newData;
    });
  };

  const handleCheckboxChange = (name, value) => {
    setCaseData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadDocuments = async (caseId) => {
    if (!caseId || selectedFiles.length === 0 || !caseData) return [];

    const uploadedDocs = [];

    for (const file of selectedFiles) {
      setUploadProgress((prev) => ({
        ...prev,
        [file.name]: 0,
      }));

      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      formData.append(
        "description",
        `Document for case ${caseData.title || "Case"}`
      );
      formData.append("category", caseData.caseType || "other");

      try {
        const response = await api.documents.uploadToCaseId(
          caseId,
          formData,
          (event) => {
            if (!event.lengthComputable) return;
            const percent = Math.round((event.loaded * 100) / event.total);
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: percent,
            }));
          }
        );

        if (response?.data) {
          uploadedDocs.push({
            message: response.message,
            document: response.data,
          });
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: 100,
          }));
        }
      } catch (error) {
        console.error(`Error uploading document ${file.name}:`, error);
        toast({
          title: "Document upload failed",
          description: error.message || `${file.name} could not be uploaded.`,
          variant: "destructive",
        });
      }
    }

    return uploadedDocs;
  };


  const handleSubmit = async (e, section = 'all') => {
    // prevent default when event provided
    if (e && e.preventDefault) e.preventDefault();
    if (!caseData) return;

    const normalizedDescription = normalizeText(caseData.description);
    const normalizedCaseNumber = normalizeFormattedCaseNumber(caseData.caseNumber);
    if (!normalizedDescription) {
      setActiveTab("details");
      toast({
        title: "Error",
        description: "Case description is required.",
        variant: "destructive",
      });
      return;
    }

    if (!normalizedCaseNumber) {
      setActiveTab("details");
      toast({
        title: "Error",
        description: "Case number must use the format TYPE/NUMBER/YEAR.",
        variant: "destructive",
      });
      return;
    }

    // When saving details/party/all -> validate petitioners/respondents (same rules as before)
    if (section === 'all' || section === 'details' || section === 'party') {
      if (!caseData.petitioners || caseData.petitioners.length === 0) {
        toast({ title: "Error", description: "Please add at least one petitioner/plaintiff/appellant/complainant", variant: "destructive" });
        return;
      }
      for (let i = 0; i < caseData.petitioners.length; i++) {
        const petitioner = caseData.petitioners[i];
        if (!petitioner.name) {
          toast({ title: "Error", description: `Please enter a name for Petitioner ${i + 1}`, variant: "destructive" });
          return;
        }
        if (!petitioner.type) {
          toast({ title: "Error", description: `Please select a type for Petitioner ${i + 1}`, variant: "destructive" });
          return;
        }
      }

      if (caseData.respondents && caseData.respondents.length > 0) {
        for (let i = 0; i < caseData.respondents.length; i++) {
          const respondent = caseData.respondents[i];
          if (!respondent.name) {
            toast({ title: "Error", description: `Please enter a name for Respondent ${i + 1}`, variant: "destructive" });
            return;
          }
          if (!respondent.role) {
            toast({ title: "Error", description: `Please select a role for Respondent ${i + 1}`, variant: "destructive" });
            return;
          }
          if (!respondent.type) {
            toast({ title: "Error", description: `Please select a type for Respondent ${i + 1}`, variant: "destructive" });
            return;
          }
        }
      }
    }

    // Validate lawyers/clients only if saving associated parties or everything
    if ((isLawyer && (section === 'all' || section === 'associatedParties'))) {
      if (!caseData.lawyers || caseData.lawyers.length === 0) {
        toast({ title: "Error", description: "Please add at least one lawyer to the case.", variant: "destructive" });
        return;
      }
      for (let i = 0; i < caseData.lawyers.length; i++) {
        const lawyer = caseData.lawyers[i];
        if (!lawyer.name || lawyer.name.trim() === '') {
          toast({ title: "Error", description: `Please enter a name for Lawyer ${i + 1}.`, variant: "destructive" });
          return;
        }
        if (!(lawyer.email || lawyer.user?.email || "").trim()) {
          toast({ title: "Error", description: `Please enter an email for Lawyer ${i + 1}.`, variant: "destructive" });
          return;
        }
      }
    }

    if (isLawyer && (section === 'all' || section === 'associatedParties')) {
      if (!caseData.clients || caseData.clients.length === 0) {
        toast({ title: "Error", description: "Please add at least one client for the case.", variant: "destructive" });
        return;
      }
      for (let i = 0; i < (caseData.clients || []).length; i++) {
        const client = caseData.clients[i];
        if (!client.name) {
          toast({ title: "Error", description: `Please enter a name for Client ${i + 1}.`, variant: "destructive" });
          return;
        }
        if (!(client.email || client.user?.email || "").trim()) {
          toast({ title: "Error", description: `Please enter an email for Client ${i + 1}.`, variant: "destructive" });
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      // Build formattedData but include only relevant sections for smaller saves
      const formattedData = {
        // Always include basic fields only when saving details/all
        ...(section === 'all' || section === 'details' ? {
          title: caseData.title,
          caseNumber: normalizedCaseNumber,
          caseType: caseData.caseType,
          caseSubType: caseData.caseSubType || "",
          status: caseData.status || "active",
          courtState: caseData.courtState,
          district: caseData.district,
          bench: caseData.bench,
          courtType: caseData.courtType,
          court: caseData.court,
          courtHall: caseData.courtHall,
          courtComplex: caseData.courtComplex,
          filingDate: caseData.filingDate ? new Date(caseData.filingDate).toISOString() : null,
          nextHearingDate: caseData.nextHearingDate ? new Date(caseData.nextHearingDate).toISOString() : null,
          description: normalizedDescription,
          priority: caseData.priority || "normal",
          isUrgent: caseData.isUrgent || false,
          caseStage: caseData.caseStage || "filing",
          actSections: caseData.actSections || "",
          policeStation: normalizeText(caseData.policeStation),
          firNumber: normalizeText(caseData.firNumber),
          firYear: normalizeText(caseData.firYear),
          reliefSought: caseData.reliefSought || "",
          notes: caseData.notes || ""
        } : {}),

        // Include party arrays only when saving party/all
        ...(section === 'all' || section === 'party' ? {
          parties: {
            petitioner: (caseData.petitioners || []).map(p => {
              const obj = { name: p.name };
              if (p.type) obj.type = p.type;
              if (p.role) obj.role = p.role;
              if (p.email) obj.email = p.email;
              if (p.contact) obj.contact = p.contact;
              if (p.address) obj.address = p.address;
              return obj;
            }),
            respondent: (caseData.respondents || []).map(r => {
              const obj = { name: r.name };
              if (r.type) obj.type = r.type;
              if (r.role) obj.role = r.role;
              if (r.email) obj.email = r.email;
              if (r.contact) obj.contact = r.contact;
              if (r.address) obj.address = r.address;
              if (r.opposingCounsel) obj.opposingCounsel = r.opposingCounsel;
              return obj;
            })
          }
        } : {}),

        // Include associated parties only when saving them or all
        ...(section === 'all' || section === 'associatedParties' ? (isLawyer ? {
          lawyers: (caseData.lawyers || []).map(l => ({
            ...(l.user ? { user: typeof l.user === 'object' ? l.user._id || l.user.id : l.user } : {}),
            name: l.name,
            email: l.email || "",
            contact: l.contact || "",
            company: l.company || "",
            gst: l.gst || "",
            isPrimary: l.isPrimary || false,
            level: l.level || undefined,
            addedBy: l.addedBy ? (typeof l.addedBy === 'object' ? l.addedBy._id || l.addedBy.id : l.addedBy) : (user?.id || user?._id),
          })),
          clients: (caseData.clients || []).map(c => ({
            ...(c.user ? { user: typeof c.user === 'object' ? c.user._id || c.user.id : c.user } : {}),
            name: c.name,
            email: c.email || "",
            contact: c.contact || "",
            address: c.address || "",
            isPrimary: c.isPrimary || false,
            addedBy: c.addedBy ? (typeof c.addedBy === 'object' ? c.addedBy._id || c.addedBy.id : c.addedBy) : (user?.id || user?._id),
          })),
          stakeholders: (caseData.stakeholders || []).map(s => ({ name: s.name, email: s.email || "", contact: s.contact || "", address: s.address || "", roleInCase: s.roleInCase || "" }))
        } : {
          // For clients, only send the fields the update API accepts.
          advocates: (caseData.advocates || []).map(a => ({ name: a.name, email: a.email || "", contact: a.contact || "", company: a.company || "", gst: a.gst || "", isLead: a.isLead || false, level: a.level || "", poc: a.poc || "", spock: a.spock || "" })),
          stakeholders: (caseData.stakeholders || []).map(s => ({ name: s.name, email: s.email || "", contact: s.contact || "", address: s.address || "", roleInCase: s.roleInCase || "" }))
        }) : {})
      };

      await api.cases.update(id, formattedData);

      let uploadedDocs = [];
      if (selectedFiles.length > 0) {
        uploadedDocs = await uploadDocuments(id);
      }

      const hasPendingReviewDocuments = uploadedDocs.some(
        (item) => item?.document?.approvalStatus === "pending"
      );

      if (uploadedDocs.length > 0) {
        setSelectedFiles([]);
      }

      toast({
        title: "Success",
        description:
          hasPendingReviewDocuments && section === "all"
            ? "Case updated. Uploaded documents are pending lawyer approval."
            : section === "all"
              ? "Case updated successfully."
              : `Section "${section}" saved.`,
      });

      if (section === 'all') router.push(`/dashboard/cases/${id}`);
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to update case." });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  if (!caseData) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Case</h1>
      </div>
      <div className="w-full">
        <div className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details">Case Details</TabsTrigger>
              <TabsTrigger value="court">Court Information</TabsTrigger>
              <TabsTrigger value="party">Party Section</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="associatedParties">People</TabsTrigger>
            </TabsList>

            {/* --- Case Details Tab --- */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Case Information</CardTitle>
                  <CardDescription>
                    Update the case details. Case type is shown in plain language,
                    and the final case ID is built automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form id="case-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">
                        Case Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={caseData.title}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_140px]">
                        <div className="space-y-2">
                          <Label htmlFor="caseTypeDisplay">
                            Case Type <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="caseTypeDisplay"
                            value={caseData.caseTypeDisplay || ""}
                            readOnly
                            placeholder="Case type"
                            className="bg-muted text-muted-foreground cursor-default"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="caseNumberMiddle">
                            Filing Number <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="caseNumberMiddle"
                            name="caseNumberMiddle"
                            value={caseData.caseNumberMiddle || ""}
                            onChange={handleChange}
                            placeholder="Filing Number"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="caseYear">
                            Year <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={caseData.caseYear || DEFAULT_CASE_YEAR}
                            onValueChange={(value) => handleSelectChange("caseYear", value)}
                          >
                            <SelectTrigger id="caseYear">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 21 }, (_, index) =>
                                String(new Date().getFullYear() - index)
                              ).map((year) => (
                                <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {caseData.caseCode
                          ? `Final format: ${caseData.caseCode}/CASE_NUMBER/${caseData.caseYear || "YEAR"}`
                          : "Case type code will appear here once loaded."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                      <div className="space-y-2">
                        <Label htmlFor="status">
                          Status <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={caseData.status}
                          onValueChange={(value) => handleSelectChange("status", value)}
                          required
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="filingDate">Filing Date</Label>
                        <DatePicker
                          id="filingDate"
                          selected={caseData.filingDate}
                          onSelect={(date) => handleDateChange("filingDate", date)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nextHearingDate">First Hearing Date <span className="text-red-500">*</span></Label>
                        <DatePicker
                          id="nextHearingDate"
                          selected={caseData.nextHearingDate}
                          onSelect={(date) => handleDateChange("nextHearingDate", date)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={caseData.priority}
                          onValueChange={(value) => handleSelectChange("priority", value)}
                        >
                          <SelectTrigger id="priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="caseStage">Case Stage</Label>
                        <Select
                          value={caseData.caseStage}
                          onValueChange={(value) => handleSelectChange("caseStage", value)}
                        >
                          <SelectTrigger id="caseStage">
                            <SelectValue placeholder="Select case stage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="filing">Filing</SelectItem>
                            <SelectItem value="pre_trial">Pre-Trial</SelectItem>
                            <SelectItem value="trial">Trial</SelectItem>
                            <SelectItem value="arguments">Arguments</SelectItem>
                            <SelectItem value="judgment">Judgment</SelectItem>
                            <SelectItem value="appeal">Appeal</SelectItem>
                            <SelectItem value="execution">Execution</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isUrgent"
                        checked={caseData.isUrgent}
                        onCheckedChange={(checked) => handleCheckboxChange("isUrgent", checked)}
                      />
                      <Label htmlFor="isUrgent">Mark as urgent case</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">
                        Case Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={caseData.description}
                        onChange={handleChange}
                        rows={4}
                        required
                        placeholder="Enter a clear summary of the case"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="actSections">Act & Sections</Label>
                      <Textarea
                        id="actSections"
                        name="actSections"
                        value={caseData.actSections}
                        onChange={handleChange}
                        rows={2}
                        placeholder="e.g., IPC Section 302, CrPC Section 161"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="policeStation">Police Station</Label>
                        <Input
                          id="policeStation"
                          name="policeStation"
                          value={caseData.policeStation || ""}
                          onChange={handleChange}
                          placeholder="Enter police station"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="firNumber">FIR Number</Label>
                        <Input
                          id="firNumber"
                          name="firNumber"
                          value={caseData.firNumber || ""}
                          onChange={handleChange}
                          placeholder="Enter FIR number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="firYear">Year</Label>
                        <Input
                          id="firYear"
                          name="firYear"
                          value={caseData.firYear || ""}
                          onChange={handleChange}
                          placeholder="Enter FIR year"
                          inputMode="numeric"
                          maxLength={4}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reliefSought">Relief Sought</Label>
                      <Textarea
                        id="reliefSought"
                        name="reliefSought"
                        value={caseData.reliefSought}
                        onChange={handleChange}
                        rows={2}
                        placeholder="Describe the relief sought in this case"
                      />
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push("/dashboard/cases")}>Cancel</Button>
                  <Button type="submit" form="case-form" disabled={isSubmitting} onClick={handleSubmit}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* --- Court Information Tab --- */}
            <TabsContent value="court">
              <Card>
                <CardHeader>
                  <CardTitle>Court Information</CardTitle>
                  <CardDescription>Enter details about the court where the case is filed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="courtState">State</Label>
                          <Input
                            id="courtState"
                            name="courtState"
                            value={caseData.courtState || ""}
                            onChange={handleChange}
                            placeholder="e.g. Uttarakhand"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="district">District</Label>
                          <Input
                            id="district"
                            name="district"
                            value={caseData.district || ""}
                            onChange={handleChange}
                            placeholder="e.g. Dehradun"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="court">Court Name</Label>
                          <Input id="court" name="court" value={caseData.court} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="courtHall">Court Hall Number</Label>
                          <Input id="courtHall" name="courtHall" value={caseData.courtHall} onChange={handleChange} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={caseData.notes}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Any additional notes about the court or proceedings"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push("/dashboard/cases")}>Cancel</Button>
                  <Button type="button" disabled={isSubmitting} onClick={handleSubmit}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* --- Party Section Tab --- */}
            <TabsContent value="party">
              <Card>
                <CardHeader>
                  <CardTitle>Party Section</CardTitle>
                  <CardDescription>Enter details for both legal sides</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Petitioners Section */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Select
                          value={caseData.petitionerLabel || 'Petitioner'}
                          onValueChange={val => setCaseData(prev => ({ ...prev, petitionerLabel: val }))}
                        >
                          <SelectTrigger className="w-56">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Petitioner">Petitioner</SelectItem>
                            <SelectItem value="Appellant">Appellant</SelectItem>
                            <SelectItem value="Plaintiff">Plaintiff</SelectItem>
                            <SelectItem value="Complainant">Complainant</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          onClick={() => setCaseData(prev => ({
                            ...prev,
                            petitioners: [
                              ...(prev.petitioners || []),
                              {
                                label: prev.petitionerLabel || 'Petitioner',
                                type: 'Individual',
                                name: '',
                                email: '',
                                contact: '',
                                address: ''
                              }
                            ]
                          }))}
                        >
                          Add {caseData.petitionerLabel || 'Petitioner'}
                        </Button>
                      </div>
                      {caseData.petitioners && caseData.petitioners.length > 0 && (
                        <div className="space-y-4">
                          {caseData.petitioners.map((petitioner, idx) => (
                            <div key={idx} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{petitioner.label || 'Petitioner'} {idx + 1}</h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCaseData(prev => ({
                                    ...prev,
                                    petitioners: prev.petitioners.filter((_, i) => i !== idx)
                                  }))}
                                >
                                  Remove
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Name</Label>
                                  <Input
                                    value={petitioner.name}
                                    onChange={e => {
                                      const arr = [...caseData.petitioners];
                                      arr[idx].name = e.target.value;
                                      setCaseData(prev => ({ ...prev, petitioners: arr }));
                                    }}
                                    placeholder="Full name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Type</Label>
                                  <Select
                                    value={petitioner.type}
                                    onValueChange={val => {
                                      const arr = [...caseData.petitioners];
                                      arr[idx].type = val;
                                      setCaseData(prev => ({ ...prev, petitioners: arr }));
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Individual">Individual</SelectItem>
                                      <SelectItem value="Corporation">Corporation</SelectItem>
                                      <SelectItem value="Organization">Organization</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Email</Label>
                                  <Input
                                    type="email"
                                    value={petitioner.email}
                                    onChange={e => {
                                      const arr = [...caseData.petitioners];
                                      arr[idx].email = e.target.value;
                                      setCaseData(prev => ({ ...prev, petitioners: arr }));
                                    }}
                                    placeholder="email@example.com"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Contact Number</Label>
                                  <Input
                                    type="tel"
                                    value={petitioner.contact}
                                    onChange={e => {
                                      const arr = [...caseData.petitioners];
                                      arr[idx].contact = e.target.value;
                                      setCaseData(prev => ({ ...prev, petitioners: arr }));
                                    }}
                                    placeholder="+91 XXXXXXXXXX"
                                  />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Address</Label>
                                  <Textarea
                                    value={petitioner.address}
                                    onChange={e => {
                                      const arr = [...caseData.petitioners];
                                      arr[idx].address = e.target.value;
                                      setCaseData(prev => ({ ...prev, petitioners: arr }));
                                    }}
                                    placeholder="Full address"
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Respondents Section */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Select
                          value={caseData.respondentLabel || 'Defendant'}
                          onValueChange={val => setCaseData(prev => ({ ...prev, respondentLabel: val }))}
                        >
                          <SelectTrigger className="w-56">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Defendant">Defendant</SelectItem>
                            <SelectItem value="Accused">Accused</SelectItem>
                            <SelectItem value="Respondent">Respondent</SelectItem>
                            <SelectItem value="Opponent">Opponent</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          onClick={() => setCaseData(prev => ({
                            ...prev,
                            respondents: [
                              ...(prev.respondents || []),
                              {
                                label: prev.respondentLabel || 'Defendant',
                                type: 'Individual',
                                name: '',
                                email: '',
                                contact: '',
                                address: '',
                                opposingCounsel: '',
                              }
                            ]
                          }))}
                        >
                          Add {caseData.respondentLabel || 'Defendant'}
                        </Button>
                      </div>
                      {caseData.respondents && caseData.respondents.length > 0 && (
                        <div className="space-y-4">
                          {caseData.respondents.map((respondent, idx) => (
                            <div key={idx} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{respondent.label || 'Defendant'} {idx + 1}</h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCaseData(prev => ({
                                    ...prev,
                                    respondents: prev.respondents.filter((_, i) => i !== idx)
                                  }))}
                                >
                                  Remove
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Name</Label>
                                  <Input
                                    value={respondent.name}
                                    onChange={e => {
                                      const arr = [...caseData.respondents];
                                      arr[idx].name = e.target.value;
                                      setCaseData(prev => ({ ...prev, respondents: arr }));
                                    }}
                                    placeholder="Full name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Type</Label>
                                  <Select
                                    value={respondent.type}
                                    onValueChange={val => {
                                      const arr = [...caseData.respondents];
                                      arr[idx].type = val;
                                      setCaseData(prev => ({ ...prev, respondents: arr }));
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Individual">Individual</SelectItem>
                                      <SelectItem value="Corporation">Corporation</SelectItem>
                                      <SelectItem value="Organization">Organization</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Email</Label>
                                  <Input
                                    type="email"
                                    value={respondent.email}
                                    onChange={e => {
                                      const arr = [...caseData.respondents];
                                      arr[idx].email = e.target.value;
                                      setCaseData(prev => ({ ...prev, respondents: arr }));
                                    }}
                                    placeholder="email@example.com"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Contact Number</Label>
                                  <Input
                                    type="tel"
                                    value={respondent.contact}
                                    onChange={e => {
                                      const arr = [...caseData.respondents];
                                      arr[idx].contact = e.target.value;
                                      setCaseData(prev => ({ ...prev, respondents: arr }));
                                    }}
                                    placeholder="+91 XXXXXXXXXX"
                                  />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Address</Label>
                                  <Textarea
                                    value={respondent.address}
                                    onChange={e => {
                                      const arr = [...caseData.respondents];
                                      arr[idx].address = e.target.value;
                                      setCaseData(prev => ({ ...prev, respondents: arr }));
                                    }}
                                    placeholder="Full address"
                                    rows={2}
                                  />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Defending Lawyer</Label>
                                  <Input
                                    value={respondent.opposingCounsel || ""}
                                    onChange={e => {
                                      const arr = [...caseData.respondents];
                                      arr[idx].opposingCounsel = e.target.value;
                                      setCaseData(prev => ({ ...prev, respondents: arr }));
                                    }}
                                    placeholder="e.g. Adv. Neha Sharma"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push("/dashboard/cases")}>Cancel</Button>
                  <Button type="button" disabled={isSubmitting} onClick={handleSubmit}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* --- Documents Tab --- */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Case Documents</CardTitle>
                  <CardDescription>Upload and manage documents related to this case</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-12">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Drag and drop files here, or click to select files
                        </p>
                        <div className="mt-4">
                          <input
                            type="file"
                            id="document-upload"
                            className="hidden"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.zip"
                            onChange={handleFileChange}
                          />
                          <Button variant="outline" onClick={() => document.getElementById("document-upload").click()}>
                            Select Files
                          </Button>
                        </div>
                      </div>
                    </div>
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Selected Files</h3>
                        <div className="space-y-2">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({(file.size / 1024).toFixed(2)} KB)
                                </span>
                              </div>
                              {uploadProgress[file.name] > 0 && uploadProgress[file.name] < 100 && (
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary"
                                    style={{ width: `${uploadProgress[file.name]}%` }}
                                  ></div>
                                </div>
                              )}
                              {uploadProgress[file.name] === 100 && (
                                <span className="text-xs text-green-600">Uploaded</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Required Documents</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="doc1" />
                          <Label htmlFor="doc1" className="text-sm">
                            Petition/Complaint
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="doc2" />
                          <Label htmlFor="doc2" className="text-sm">
                            Affidavit
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="doc3" />
                          <Label htmlFor="doc3" className="text-sm">
                            Power of Attorney
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="doc4" />
                          <Label htmlFor="doc4" className="text-sm">
                            Evidence Documents
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="doc5" />
                          <Label htmlFor="doc5" className="text-sm">
                            Court Fee Receipt
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push("/dashboard/cases")}>Cancel</Button>
                  <Button type="button" disabled={isSubmitting} onClick={handleSubmit}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* --- People Tab --- */}
            <TabsContent value="associatedParties">
              <Card>
                <CardHeader>
                  <CardTitle>People</CardTitle>
                  <CardDescription>Add or edit lawyers, clients, or advocates associated with this case.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {isLawyer ? (
                      <>
                        {/* Lawyers Section */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Legal Team</h3>
                          {(caseData.lawyers || []).map((lawyer, idx) => (
                            <div key={`lawyer-${idx}`} className="space-y-4 border p-4 rounded-lg shadow-sm">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium flex items-center gap-2">
                                  Lawyer {idx + 1}
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCaseData(prev => ({
                                    ...prev,
                                    lawyers: prev.lawyers.filter((_, i) => i !== idx)
                                  }))}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  Remove
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label>Full Name</Label>
                                  <Input
                                    value={lawyer.name || ''}
                                    onChange={e => {
                                      const arr = [...caseData.lawyers];
                                      arr[idx].name = e.target.value;
                                      setCaseData(prev => ({ ...prev, lawyers: arr }));
                                    }}
                                    placeholder="Full Name"
                                    className="h-9 text-sm"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label>Email</Label>
                                  <Input
                                    type="email"
                                    value={lawyer.email || ''}
                                    onChange={e => {
                                      const arr = [...caseData.lawyers];
                                      arr[idx].email = e.target.value;
                                      setCaseData(prev => ({ ...prev, lawyers: arr }));
                                    }}
                                    placeholder="email@example.com"
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label>Contact Number</Label>
                                  <Input
                                    value={lawyer.contact || ''}
                                    onChange={e => {
                                      const arr = [...caseData.lawyers];
                                      arr[idx].contact = e.target.value;
                                      setCaseData(prev => ({ ...prev, lawyers: arr }));
                                    }}
                                    placeholder="+91 XXXXXXXXXX"
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label>Law Firm</Label>
                                  <Input
                                    value={lawyer.company || ''}
                                    onChange={e => {
                                      const arr = [...caseData.lawyers];
                                      arr[idx].company = e.target.value;
                                      setCaseData(prev => ({ ...prev, lawyers: arr }));
                                    }}
                                    placeholder="Law Firm Name"
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label>GST Number</Label>
                                  <Input
                                    value={lawyer.gst || ''}
                                    onChange={e => {
                                      const arr = [...caseData.lawyers];
                                      arr[idx].gst = e.target.value;
                                      setCaseData(prev => ({ ...prev, lawyers: arr }));
                                    }}
                                    placeholder="22AAAAA0000A1Z5"
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label>Level</Label>
                                  <Select
                                    value={lawyer.level || undefined}
                                    onValueChange={value => {
                                      const arr = [...caseData.lawyers];
                                      arr[idx].level = value;
                                      setCaseData(prev => ({ ...prev, lawyers: arr }));
                                    }}
                                  >
                                    <SelectTrigger className="h-9 text-sm">
                                      <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Senior">Senior</SelectItem>
                                      <SelectItem value="Junior">Junior</SelectItem>
                                      <SelectItem value="Associate">Associate</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button
                            type="button"
                            onClick={() => setCaseData(prev => ({
                              ...prev,
                              lawyers: [
                                ...(prev.lawyers || []),
                                {
                                  name: '',
                                  email: '',
                                  contact: '',
                                  company: '',
                                  gst: '',
                                  level: 'Associate',
                                  addedBy: user?.id || user?._id
                                }
                              ]
                            }))}
                            variant="outline"
                            className="mt-2 w-full border-dashed border-gray-300 hover:border-primary hover:bg-primary/5"
                          >
                            Add Lawyer to Case
                          </Button>
                        </div>
                        {/* Clients Section for Lawyers */}
                        <div className="space-y-4 mt-8">
                          <h3 className="text-lg font-semibold">Associated Clients</h3>
                          {(caseData.clients || []).map((client, idx) => (
                            <div key={idx} className="space-y-3 border p-4 rounded-lg shadow">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium">Client {idx + 1}</h4>
                                <Button variant="ghost" size="sm" onClick={() => setCaseData(prev => ({ ...prev, clients: prev.clients.filter((_, i) => i !== idx) }))}>Remove</Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Name</Label>
                                  <Input value={client.name || ''} onChange={e => {
                                    const arr = [...caseData.clients];
                                    arr[idx].name = e.target.value;
                                    setCaseData(prev => ({ ...prev, clients: arr }));
                                  }} placeholder="Full Name" required />
                                </div>
                                <div>
                                  <Label>Email</Label>
                                  <Input type="email" value={client.email || ''} onChange={e => {
                                    const arr = [...caseData.clients];
                                    arr[idx].email = e.target.value;
                                    setCaseData(prev => ({ ...prev, clients: arr }));
                                  }} placeholder="email@example.com" />
                                </div>
                                <div>
                                  <Label>Contact Number</Label>
                                  <Input type="tel" value={client.contact || ''} onChange={e => {
                                    const arr = [...caseData.clients];
                                    arr[idx].contact = e.target.value;
                                    setCaseData(prev => ({ ...prev, clients: arr }));
                                  }} placeholder="+91 XXXXXXXXXX" />
                                </div>
                                <div className="md:col-span-2">
                                  <Label>Address</Label>
                                  <Textarea value={client.address || ''} onChange={e => {
                                    const arr = [...caseData.clients];
                                    arr[idx].address = e.target.value;
                                    setCaseData(prev => ({ ...prev, clients: arr }));
                                  }} placeholder="Full Address" rows={2} />
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button type="button" onClick={() => setCaseData(prev => ({ ...prev, clients: [...(prev.clients || []), { name: '', email: '', contact: '', address: '' }] }))} variant="outline" className="mt-4">
                            Add Client
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Lawyers (read-only for clients) */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Legal Team</h3>
                          {(caseData.lawyers || []).length > 0 ? (
                            (caseData.lawyers || []).map((lawyer, idx) => (
                              <div key={`lawyer-${idx}`} className="space-y-2 border p-4 rounded-lg shadow-sm bg-muted/30">
                                <div className="font-medium">Lawyer {idx + 1}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div><span className="text-muted-foreground">Name:</span> {lawyer.name || (lawyer.user?.name) || 'N/A'}</div>
                                  <div><span className="text-muted-foreground">Email:</span> {lawyer.email || (lawyer.user?.email) || 'N/A'}</div>
                                  <div><span className="text-muted-foreground">Contact:</span> {lawyer.contact || (lawyer.user?.contact) || 'N/A'}</div>
                                  <div><span className="text-muted-foreground">Law Firm:</span> {lawyer.company || (lawyer.user?.company) || 'N/A'}</div>
                                  {lawyer.level && <div><span className="text-muted-foreground">Level:</span> {lawyer.level}</div>}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No lawyers assigned to this case.</p>
                          )}
                        </div>

                        {/* Clients (read-only for clients) */}
                        <div className="space-y-4 mt-6">
                          <h3 className="text-lg font-semibold">Associated Clients</h3>
                          {(caseData.clients || []).length > 0 ? (
                            (caseData.clients || []).map((client, idx) => (
                              <div key={`client-${idx}`} className="space-y-2 border p-4 rounded-lg shadow-sm bg-muted/30">
                                <div className="font-medium">Client {idx + 1}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div><span className="text-muted-foreground">Name:</span> {client.name || (client.user?.name) || 'N/A'}</div>
                                  <div><span className="text-muted-foreground">Email:</span> {client.email || (client.user?.email) || 'N/A'}</div>
                                  <div><span className="text-muted-foreground">Contact:</span> {client.contact || (client.user?.contact) || 'N/A'}</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No clients assigned to this case.</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push("/dashboard/cases")}>Cancel</Button>
                  <Button type="button" disabled={isSubmitting} onClick={handleSubmit}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        {/* Optionally, add a Case Filing Guide or sidebar as in the new case page */}
      </div>
    </div>
  );
} 
