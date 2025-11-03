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

const CASE_TYPES = [
  { value: "civil", label: "Civil" },
  { value: "criminal", label: "Criminal" },
  { value: "family", label: "Family" },
  { value: "labour", label: "Labour" },
  { value: "revenue", label: "Revenue" },
  { value: "motor_accident", label: "Motor Accident Claims" },
  { value: "commercial", label: "Commercial" },
  { value: "writ", label: "Writ Petition" },
  { value: "appeal", label: "Appeal" },
  { value: "revision", label: "Revision" },
  { value: "execution", label: "Execution" },
  { value: "arbitration", label: "Arbitration" },
  { value: "other", label: "Other" },
];

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

const BENCHES = [
  { value: "bengaluru", label: "Bengaluru" },
  { value: "dharwad", label: "Dharwad" },
  { value: "kalaburagi", label: "Kalaburagi" },
];

const OTHER_COURT_TYPES = [
  { value: "district_court", label: "District Court" },
  { value: "family_court", label: "Family Court" },
  { value: "consumer_court", label: "Consumer Court" },
  { value: "labour_court", label: "Labour Court" },
  { value: "sessions_court", label: "Sessions Court" },
  { value: "civil_court", label: "Civil Court" },
  { value: "magistrate_court", label: "Magistrate Court" },
  { value: "special_court", label: "Special Court" },
];

export default function EditCasePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLawyer, setIsLawyer] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    if (user) {
      setIsLawyer(user?.role === 'lawyer' || user?.role === 'admin');
    }
  }, [user]);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const response = await api.cases.getById(id);
        // Normalize data to match the new case form structure
        const d = response.data;
        setCaseData({
          ...d,
          courtState: d.courtState || "karnataka",
          district: d.district || "bengaluru_urban",
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
          status: d.status || "active",
          priority: d.priority || "normal",
          isUrgent: d.isUrgent || false,
          caseStage: d.caseStage || "filing",
          actSections: d.actSections || "",
          reliefSought: d.reliefSought || "",
          notes: d.notes || "",
          advocates: d.advocates || [],
          clients: d.clients || [],
          stakeholders: d.stakeholders || [],
        });
      } catch (err) {
        toast({ title: "Error", description: "Failed to load case details." });
      }
    };
    if (id) fetchCase();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCaseData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setCaseData((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caseData) return;

    // --- PARTY VALIDATION (like new case page) ---
    if (!caseData.petitioners || caseData.petitioners.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one petitioner/plaintiff/appellant/complainant",
        variant: "destructive",
      });
      return;
    }
    for (let i = 0; i < caseData.petitioners.length; i++) {
      const petitioner = caseData.petitioners[i];
      if (!petitioner.name) {
        toast({
          title: "Error",
          description: `Please enter a name for Petitioner/Plaintiff/Appellant/Complainant ${i + 1}`,
          variant: "destructive",
        });
        return;
      }
      if (!petitioner.type) {
        toast({
          title: "Error",
          description: `Please select a type for Petitioner ${i + 1}`,
          variant: "destructive",
        });
        return;
      }
    }
    // Validate respondent data if any
    if (caseData.respondents && caseData.respondents.length > 0) {
      for (let i = 0; i < caseData.respondents.length; i++) {
        const respondent = caseData.respondents[i];
        if (!respondent.name) {
          toast({
            title: "Error",
            description: `Please enter a name for Respondent/Defendant/Accused/Opponent ${i + 1}`,
            variant: "destructive",
          });
          return;
        }
        if (!respondent.role) {
          toast({
            title: "Error",
            description: `Please select a role for Respondent ${i + 1}`,
            variant: "destructive",
          });
          return;
        }
        if (!respondent.type) {
          toast({
            title: "Error",
            description: `Please select a type for Respondent ${i + 1}`,
            variant: "destructive",
          });
          return;
        }
      }
    }
    setIsSubmitting(true);
    try {
      // Debug: log parties and their arrays
      console.log('caseData.parties:', caseData.parties);
      console.log('caseData.petitioners:', caseData.petitioners);
      console.log('caseData.respondents:', caseData.respondents);
      // Format the data according to the API schema (same as new case page)
      const formattedData = {
        title: caseData.title,
        caseNumber: caseData.caseNumber,
        caseType: caseData.caseType,
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
        description: caseData.description || "",
        priority: caseData.priority || "normal",
        isUrgent: caseData.isUrgent || false,
        caseStage: caseData.caseStage || "filing",
        actSections: caseData.actSections || "",
        reliefSought: caseData.reliefSought || "",
        notes: caseData.notes || "",
        parties: {
          petitioner: (caseData.petitioners || []).map(petitioner => {
            const obj = { name: petitioner.name };
            if (petitioner.type) obj.type = petitioner.type;
            if (petitioner.role) obj.role = petitioner.role;
            if (petitioner.email) obj.email = petitioner.email;
            if (petitioner.contact) obj.contact = petitioner.contact;
            if (petitioner.address) obj.address = petitioner.address;
            return obj;
          }),
          respondent: (caseData.respondents || []).map(respondent => {
            const obj = { name: respondent.name };
            if (respondent.type) obj.type = respondent.type;
            if (respondent.role) obj.role = respondent.role;
            if (respondent.email) obj.email = respondent.email;
            if (respondent.contact) obj.contact = respondent.contact;
            if (respondent.address) obj.address = respondent.address;
            if (respondent.opposingCounsel) obj.opposingCounsel = respondent.opposingCounsel;
            return obj;
          })
        },
        ...(isLawyer 
          ? {
              // Ensure at least one lawyer (the logged-in user) is always included
              lawyers: (caseData.lawyers && caseData.lawyers.length > 0) 
                ? caseData.lawyers.map(lawyer => ({
                    name: lawyer.name,
                    email: lawyer.email || "",
                    contact: lawyer.contact || "",
                    company: lawyer.company || "",
                    gst: lawyer.gst || "",
                    role: lawyer.role || "associate",
                    position: lawyer.position || "supporting",
                    isPrimary: lawyer.isPrimary || false,
                    level: lawyer.level || "Senior",
                    chairPosition: lawyer.chairPosition || "supporting",
                    addedBy: user._id
                  }))
                : [{
                    name: user.name,
                    email: user.email || "",
                    contact: user.phone || "",
                    role: "lead",
                    position: "first_chair",
                    isPrimary: true,
                    level: "Senior",
                    chairPosition: "first_chair",
                    addedBy: user._id
                  }],
              clients: (caseData.clients || []).map(client => ({
                name: client.name,
                email: client.email || "",
                contact: client.contact || "",
                address: client.address || ""
              })),
              stakeholders: (caseData.stakeholders || []).map(stakeholder => ({
                name: stakeholder.name,
                email: stakeholder.email || "",
                contact: stakeholder.contact || "",
                address: stakeholder.address || "",
                roleInCase: stakeholder.roleInCase || ""
              }))
            }
          : { 
              client: {
                _id: user._id,
                name: user.name,
                email: user.email,
                contact: user.phone || "",
                role: "Primary Client",
                isPrimary: true
              },
              advocates: (caseData.advocates || []).map(adv => ({
                name: adv.name,
                email: adv.email || "",
                contact: adv.contact || "",
                company: adv.company || "",
                gst: adv.gst || "",
                isLead: adv.isLead || false,
                level: adv.level || "",
                poc: adv.poc || "",
                spock: adv.spock || ""
              })),
              lawyers: (caseData.lawyers || []),
              stakeholders: (caseData.stakeholders || []).map(stakeholder => ({
                name: stakeholder.name,
                email: stakeholder.email || "",
                contact: stakeholder.contact || "",
                address: stakeholder.address || "",
                roleInCase: stakeholder.roleInCase || ""
              }))
            }
        )
      };
      console.log('Submitting formattedData:', formattedData);
      await api.cases.update(id, formattedData);
      toast({ title: "Success", description: "Case updated successfully." });
      router.push(`/dashboard/cases/${id}`);
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to update case." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      lastModifiedDate: file.lastModifiedDate,
      webkitRelativePath: file.webkitRelativePath,
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  if (!caseData) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Case</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="details" className="w-full">
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
                  <CardDescription>Enter the basic details about the case</CardDescription>
                </CardHeader>
                <CardContent>
                  <form id="case-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="title">
                          Case Title <span className="text-red-500">*</span>
                        </Label>
                        <Input id="title" name="title" value={caseData.title} onChange={handleChange} required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="caseNumber">
                          Case Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="caseNumber"
                          name="caseNumber"
                          value={caseData.caseNumber}
                          onChange={handleChange}
                          placeholder="e.g., CRL/123/2023"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="caseType">
                          Case Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={caseData.caseType}
                          onValueChange={(value) => handleSelectChange("caseType", value)}
                          required
                        >
                          <SelectTrigger id="caseType">
                            <SelectValue placeholder="Select case type" />
                          </SelectTrigger>
                          <SelectContent>
                            {CASE_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

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
                      <Label htmlFor="description">Case Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={caseData.description}
                        onChange={handleChange}
                        rows={4}
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
                          <Select
                            value={caseData.courtState}
                            onValueChange={(value) => handleSelectChange("courtState", value)}
                          >
                            <SelectTrigger id="courtState">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {STATES.map((state) => (
                                <SelectItem key={state.value} value={state.value}>
                                  {state.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="district">District</Label>
                          <Select
                            value={caseData.district}
                            onValueChange={(value) => handleSelectChange("district", value)}
                          >
                            <SelectTrigger id="district">
                              <SelectValue placeholder="Select district" />
                            </SelectTrigger>
                            <SelectContent>
                              {DISTRICTS[caseData.courtState].map((district) => (
                                <SelectItem key={district.value} value={district.value}>
                                  {district.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="courtType">Court Type</Label>
                          <Select
                            value={caseData.courtType}
                            onValueChange={(value) => handleSelectChange("courtType", value)}
                          >
                            <SelectTrigger id="courtType">
                              <SelectValue placeholder="Select court type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high_court">High Court</SelectItem>
                              {OTHER_COURT_TYPES.map((court) => (
                                <SelectItem key={court.value} value={court.value}>
                                  {court.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {caseData.courtType === "high_court" && caseData.courtState === "karnataka" && (
                          <div className="space-y-2">
                            <Label htmlFor="bench">Bench</Label>
                            <Select
                              value={caseData.bench}
                              onValueChange={(value) => handleSelectChange("bench", value)}
                            >
                              <SelectTrigger id="bench">
                                <SelectValue placeholder="Select bench" />
                              </SelectTrigger>
                              <SelectContent>
                                {BENCHES.map((bench) => (
                                  <SelectItem key={bench.value} value={bench.value}>
                                    {bench.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
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
                      <div className="space-y-2">
                        <Label htmlFor="courtComplex">Court Complex</Label>
                        <Input
                          id="courtComplex"
                          name="courtComplex"
                          value={caseData.courtComplex}
                          onChange={handleChange}
                        />
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
                                address: ''
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
                                    value={lawyer.level || ''}
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
                                  addedBy: user._id
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
                                  }} placeholder="Full Address" rows={2}/>
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
                        {/* Advocates List for Clients */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Legal Team</h3>
                          {(caseData.advocates || []).map((advocate, idx) => (
                            <div key={`advocate-${idx}`} className="space-y-2 border p-4 rounded-lg shadow-sm">
                              <div className="font-medium">Advocate {idx + 1}</div>
                              <div>Name: {advocate.name || ''}</div>
                              <div>Email: {advocate.email || ''}</div>
                              <div>Contact: {advocate.contact || ''}</div>
                              <div>Law Firm: {advocate.company || ''}</div>
                            </div>
                          ))}
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