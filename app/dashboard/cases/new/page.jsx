"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Check, ChevronsUpDown, Edit3, Eye, Filter, FolderOpen, PlusCircle, Search, Trash2, UploadCloud, User, Users, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import api from "@/services/api"

// Karnataka Judiciary Case Types
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
]

// Karnataka Benches (used only when courtType is High Court and state is Karnataka)
const BENCHES = [
  { value: "bengaluru", label: "Bengaluru" },
  { value: "dharwad", label: "Dharwad" },
  { value: "kalaburagi", label: "Kalaburagi" },
]

// Court Types (excluding High Court)
const OTHER_COURT_TYPES = [
  { value: "district_court", label: "District Court" },
  { value: "family_court", label: "Family Court" },
  { value: "consumer_court", label: "Consumer Court" },
  { value: "labour_court", label: "Labour Court" },
  { value: "sessions_court", label: "Sessions Court" },
  { value: "civil_court", label: "Civil Court" },
  { value: "magistrate_court", label: "Magistrate Court" },
  { value: "special_court", label: "Special Court" },
]

// All States
const STATES = [
  { value: "karnataka", label: "Karnataka" },
  { value: "maharashtra", label: "Maharashtra" },
  { value: "tamil_nadu", label: "Tamil Nadu" },
  { value: "andhra_pradesh", label: "Andhra Pradesh" },
  { value: "kerala", label: "Kerala" },
  { value: "telangana", label: "Telangana" },
  { value: "goa", label: "Goa" },
]

// Districts for each state
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
}

export default function NewCasePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLawyer, setIsLawyer] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [parties, setParties] = useState([])

  useEffect(() => {
    if (user) {
      const isLawyer = user?.role === 'lawyer' || user?.role === 'admin';
      setIsLawyer(isLawyer);
    }
  }, [user])

  // Helper functions for managing associated clients (if user is a lawyer)
  const updateClientField = (index, field, value) => {
    setCaseData(prev => {
      const updatedClients = [...(prev.clients || [])];
      updatedClients[index] = { ...updatedClients[index], [field]: value };
      return { ...prev, clients: updatedClients };
    });
  };

  const removeClient = (index) => {
    setCaseData(prev => ({ ...prev, clients: prev.clients.filter((_, i) => i !== index) }));
  };

  // Stakeholder Management Functions
  const addStakeholder = () => {
    setCaseData(prev => ({
      ...prev,
      stakeholders: [...(prev.stakeholders || []), { name: '', email: '', contact: '', address: '', roleInCase: '' }]
    }));
  };

  const updateStakeholderField = (index, field, value) => {
    setCaseData(prev => {
      const updatedStakeholders = [...(prev.stakeholders || [])];
      updatedStakeholders[index] = { ...updatedStakeholders[index], [field]: value };
      return { ...prev, stakeholders: updatedStakeholders };
    });
  };

  const removeStakeholder = (index) => {
    setCaseData(prev => ({ ...prev, stakeholders: prev.stakeholders.filter((_, i) => i !== index) }));
  };



  const addClient = () => {
    setCaseData(prev => ({
      ...prev,
      clients: [...(prev.clients || []), { name: '', email: '', contact: '', address: '' }]
    }));
  };

  // Helper function for adding an advocate (if user is a client)
  const addAdvocate = () => {
    setCaseData(prev => ({
      ...prev,
      advocates: [...(prev.advocates || []), { name: '', email: '', contact: '', company: '', gst: '', isLead: false, level: '', poc: '', spock: '' }]
    }));
  };

  // Define district options
  const districtOptions = [
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
    { value: "mumbai", label: "Mumbai" },
    { value: "pune", label: "Pune" },
    { value: "nagpur", label: "Nagpur" },
    { value: "chennai", label: "Chennai" },
    { value: "coimbatore", label: "Coimbatore" },
    { value: "madurai", label: "Madurai" },
  ];

  const [caseData, setCaseData] = useState({
    title: "",
    caseNumber: "",
    caseType: "",
    courtState: "karnataka",
    district: "bengaluru_urban",
    bench: "",
    courtType: "district_court",
    court: "",
    courtHall: "",
    courtComplex: "",
    filingDate: new Date(),
    nextHearingDate: null,
    petitionerRole: "Petitioner",
    petitionerType: "Individual",
    petitionerLabel: "Petitioner",
    petitioners: [],
    respondentRole: "Defendant",
    respondents: [],
    description: "",
    status: "active",
    priority: "normal",
    isUrgent: false,
    caseStage: "filing",
    actSections: "",
    reliefSought: "",
    notes: "",
    advocates: [],
    clients: [],
    stakeholders: [], // Initialize stakeholders
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setCaseData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    if (name === "courtState") {
      setCaseData((prev) => ({
        ...prev,
        courtState: value,
        district: DISTRICTS[value][0].value,
        bench: "",
      }))
    } else if (name === "courtType") {
      setCaseData((prev) => ({
        ...prev,
        [name]: value,
        bench: value === "high_court" && prev.courtState === "karnataka" ? "bengaluru" : "",
      }))
    } else if (name === "petitionerRole" || name === "respondentRole" || name === "petitionerType") {
      setCaseData((prev) => ({ ...prev, [name]: value }))
    } else {
      setCaseData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleDateChange = (name, date) => {
    setCaseData((prev) => {
      const newData = { ...prev, [name]: date };
      
      // Validate that next hearing date is after filing date
      if (name === 'nextHearingDate' && newData.filingDate && date) {
        if (new Date(date) <= new Date(newData.filingDate)) {
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
  }

  const handleCheckboxChange = (name, checked) => {
    setCaseData((prev) => ({ ...prev, [name]: checked }))
  }

  const handlePartyAdd = (side) => {
    const nameInput = document.getElementById(`new${side}Name`).value
    const role = caseData[`${side}Role`] || (side === 'petitioner' ? 'Petitioner' : 'Defendant')
    const type = side === 'petitioner' ? caseData.petitionerType : 'Individual'
    
    if (nameInput) {
      const newParty = {
        name: nameInput,
        role: role,
        type: type,
        email: "",
        contact: "",
        address: ""
      }
      
      setCaseData((prev) => ({
        ...prev,
        [side === 'petitioner' ? 'petitioners' : 'respondents']: [
          ...(prev[side === 'petitioner' ? 'petitioners' : 'respondents'] || []),
          newParty
        ]
      }))
      
      document.getElementById(`new${side}Name`).value = "" // Clear the input
    }
  }

  const handlePartyRemove = (side, index) => {
    const partyType = side === 'petitioner' ? 'petitioners' : 'respondents'
    setCaseData((prev) => ({
      ...prev,
      [partyType]: prev[partyType].filter((_, i) => i !== index)
    }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(files)
  }

  const uploadDocuments = async (caseId) => {
    if (selectedFiles.length === 0) return []

    const uploadedDocs = []

    try {
      // Create a single FormData object for all files
      const formData = new FormData()
      
      // Append all files with the same field name 'files'
      selectedFiles.forEach(file => {
        formData.append("files", file)
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))
      })
      
      // Add metadata
      formData.append("name", "Files for " + caseData.title)
      formData.append("description", `Documents for case ${caseData.title}`)
      formData.append("category", caseData.caseType)

      // Upload all documents in a single request
      const response = await api.documents.uploadToCaseId(caseId, formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        // Update progress for all files
        const newProgress = {}
        selectedFiles.forEach(file => {
          newProgress[file.name] = percentCompleted
        })
        setUploadProgress(prev => ({ ...prev, ...newProgress }))
      })

      if (response && response.data) {
        uploadedDocs.push(...(Array.isArray(response.data) ? response.data : [response.data]))
      }
    } catch (error) {
      console.error(`Error uploading documents:`, error)
    }

    return uploadedDocs;
  };

  const handleSubmit = async (e, section = 'all') => {
    e.preventDefault();
    
    // Validate required fields for the details section
    if (section === 'all' || section === 'details') {
      if (!caseData.title || !caseData.caseNumber || !caseData.caseType || !caseData.status) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (Case Name, Case Number, Case Type, Status)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate next hearing date is mandatory
      if (!caseData.nextHearingDate) {
        toast({
          title: "Error",
          description: "Next Hearing Date is mandatory. Please select a date.",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate party section
    if (section === 'all' || section === 'party') {
      if (!caseData.petitioners || caseData.petitioners.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one petitioner/plaintiff/appellant/complainant",
          variant: "destructive",
        });
        return;
      }

      // Validate petitioner data
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
        }
      }
    }

    // Validate lawyers if lawyer is creating the case
    if (isLawyer && (section === 'all' || section === 'associatedParties')) {
      // Ensure at least one lawyer is present
      if (!caseData.lawyers || caseData.lawyers.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one lawyer to the case.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate lawyer names
      for (let i = 0; i < caseData.lawyers.length; i++) {
        const lawyer = caseData.lawyers[i];
        if (!lawyer.name || lawyer.name.trim() === '') {
          toast({
            title: "Error",
            description: `Please enter a name for Lawyer ${i + 1}.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    // Validate associated clients if lawyer is creating the case
    if (isLawyer && (section === 'all' || section === 'associatedParties')) {
      if (!caseData.clients || caseData.clients.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one client for the case.",
          variant: "destructive",
        });
        return;
      }
      for (let i = 0; i < caseData.clients.length; i++) {
        const client = caseData.clients[i];
        if (!client.name) {
          toast({
            title: "Error",
            description: `Please enter a name for Client ${i + 1}.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    // Validate advocates if client is adding them (optional, but if added, name is required)
    if (!isLawyer && (section === 'all' || section === 'associatedParties')) {
      if (caseData.advocates && caseData.advocates.length > 0) {
        for (let i = 0; i < caseData.advocates.length; i++) {
          const advocate = caseData.advocates[i];
          if (!advocate.name) {
            toast({
              title: "Error",
              description: `Please enter a name for Advocate ${i + 1}.`,
              variant: "destructive",
            });
            return;
          }
        }
      }
    }

    try {
      setIsSubmitting(true);
      
      // Format the data according to the API schema
      const formattedData = {
        // Basic case info
        title: caseData.title,
        caseNumber: caseData.caseNumber,
        caseType: caseData.caseType,
        status: caseData.status || "active",
        
        // Court information
        courtState: caseData.courtState,
        district: caseData.district,
        bench: caseData.bench,
        courtType: caseData.courtType,
        court: caseData.court,
        courtHall: caseData.courtHall,
        courtComplex: caseData.courtComplex,
        
        // Dates
        filingDate: caseData.filingDate ? new Date(caseData.filingDate).toISOString() : null,
        nextHearingDate: caseData.nextHearingDate ? new Date(caseData.nextHearingDate).toISOString() : null,
        
        // Additional details
        description: caseData.description || "",
        priority: caseData.priority || "normal",
        isUrgent: caseData.isUrgent || false,
        caseStage: caseData.caseStage || "filing",
        actSections: caseData.actSections || "",
        reliefSought: caseData.reliefSought || "",
        notes: caseData.notes || "",
        
        // Format parties data
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
        
        // Set advocates and clients based on user role
        ...(isLawyer 
          ? {
              // For lawyers, they can add other lawyers to the legal team
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
              // Add clients
              clients: (caseData.clients || []).map(client => ({
                name: client.name,
                email: client.email || "",
                contact: client.contact || "",
                address: client.address || ""
              })),
              // Add stakeholders
              stakeholders: (caseData.stakeholders || []).map(stakeholder => ({
                name: stakeholder.name,
                email: stakeholder.email || "",
                contact: stakeholder.contact || "",
                address: stakeholder.address || "",
                roleInCase: stakeholder.roleInCase || ""
              }))
            }
          : { 
              // For clients, they can add advocates
              client: {
                _id: user._id,
                name: user.name,
                email: user.email,
                contact: user.phone || "",
                role: "Primary Client",
                isPrimary: true
              },
              // Add advocates
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
              // Add any additional lawyers
              lawyers: (caseData.lawyers || []),
              // Add stakeholders
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

      // Debug log the formatted data
      console.log('Sending formatted data:', JSON.stringify(formattedData, null, 2));
      
      let response;
      
      if (caseData._id) {
        // Update existing case
        response = await api.cases.update(caseData._id, formattedData);
      } else {
        // Create new case
        response = await api.cases.create(formattedData);
      }
      
      if (response.error) {
        throw new Error(response.error);
      }



      // If this is a partial save, update the local state with the saved data
      if (section !== 'all') {
        setCaseData(prev => ({
          ...prev,
          ...(response.data || response),
          _id: response.data?._id || response._id || prev._id
        }));
        
        toast({
          title: "Success",
          description: `Case ${section} saved successfully`,
        });
      } else {
        // If this is a final submission, redirect to the case details page
        toast({
          title: "Success",
          description: "Case created successfully",
        });
        
        // Redirect to the newly created case details page
        const caseId = response.data?.case?._id || response.data?._id || response._id;
        if (caseId) {
          router.push(`/dashboard/cases/${caseId}`);
        } else {
          router.push('/dashboard/cases');
        }
      }
      
      return response;
    } catch (error) {
      console.error("Error saving case:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save case. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  const addParty = () => {
    setParties([...parties, { role: '', type: '', name: '', email: '', phone: '' }]);
  };

  const updateParty = (index, field, value) => {
    const updatedParties = parties.map((party, i) =>
      i === index ? { ...party, [field]: value } : party
    );
    setParties(updatedParties);
  };

  const removeParty = (index) => {
    setParties(parties.filter((_, i) => i !== index));
  };

  const saveCase = async () => {
    try {
      const caseData = {
        title: '',
        caseNumber: '',
        caseType: '',
        status: '',
        parties,
      };

      const response = await api.post('/api/cases', caseData);
      toast.success('Case created successfully');
    } catch (error) {
      toast.error('Error creating case');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">New Case</h1>
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

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Case Information</CardTitle>
                  <CardDescription>Enter the basic details about the case</CardDescription>
                </CardHeader>
                <CardContent>
                  <form id="case-form" onSubmit={handleSubmit} className="space-y-4">
                    {/* ... (rest of the JSX) */}
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
                  <Button variant="outline" onClick={() => router.push("/dashboard/cases")}>
                    Cancel
                  </Button>
                  <Button type="submit" form="case-form" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Case"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

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
                                {districtOptions.map((district) => (
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
                  <Button variant="outline" onClick={() => router.push("/dashboard/cases")}>
                    Cancel
                  </Button>
                  <Button type="submit" form="case-form" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Case"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="party">
              <Card>
                <CardHeader>
                  <CardTitle>Party Section</CardTitle>
                  <CardDescription>Enter details for both legal sides</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Unified Party Type Dropdown for Petitioners */}
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
                    {/* Unified Party Type Dropdown for Respondents */}
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
                  <Button 
                    type="button" 
                    onClick={(e) => handleSubmit(e, 'associatedParties')} 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Case"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

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
                  <Button variant="outline" onClick={() => router.push("/dashboard/cases")}>
                    Cancel
                  </Button>
                  <Button type="submit" form="case-form" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Case"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
             <TabsContent value="associatedParties">
              <Card>
                {isLawyer ? (
                  // LAWYER VIEW: Adding Lawyers and Clients
                  <>
                    {/* Lawyers Section */}
                    <CardHeader>
                      <CardTitle>Legal Team</CardTitle>
                      <CardDescription>Add other lawyers working on this case (optional).</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(caseData.lawyers || []).map((lawyer, idx) => (
                          <div key={`lawyer-${idx}`} className="space-y-4 border p-4 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
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
                                <Trash2 className="h-4 w-4 mr-1" /> Remove
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Basic Info */}
                              <div className="space-y-1">
                                <Label htmlFor={`lawyer-name-${idx}`} className="text-sm font-medium">Full Name <span className="text-red-500">*</span></Label>
                                <Input 
                                  id={`lawyer-name-${idx}`} 
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
                                <Label htmlFor={`lawyer-email-${idx}`} className="text-sm font-medium">Email</Label>
                                <Input 
                                  id={`lawyer-email-${idx}`} 
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
                                <Label htmlFor={`lawyer-contact-${idx}`} className="text-sm font-medium">Contact Number</Label>
                                <Input 
                                  id={`lawyer-contact-${idx}`} 
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
                                <Label htmlFor={`lawyer-company-${idx}`} className="text-sm font-medium">Law Firm</Label>
                                <Input 
                                  id={`lawyer-company-${idx}`} 
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
                                <Label htmlFor={`lawyer-gst-${idx}`} className="text-sm font-medium">GST Number</Label>
                                <Input 
                                  id={`lawyer-gst-${idx}`} 
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
                                <Label htmlFor={`lawyer-level-${idx}`} className="text-sm font-medium">Level</Label>
                                <Select
                                  value={lawyer.level || ''}
                                  onValueChange={value => {
                                    const arr = [...caseData.lawyers];
                                    arr[idx].level = value;
                                    setCaseData(prev => ({ ...prev, lawyers: arr }));
                                  }}
                                >
                                  <SelectTrigger id={`lawyer-level-${idx}`} className="h-9 text-sm">
                                    <SelectValue placeholder="Select level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Senior">Senior</SelectItem>
                                    <SelectItem value="Junior">Junior</SelectItem>
                                    <SelectItem value="Associate">Associate</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-1">
                                <Label htmlFor={`lawyer-chair-${idx}`} className="text-sm font-medium">Chair Position</Label>
                                <Select
                                  value={lawyer.chairPosition || 'supporting'}
                                  onValueChange={value => {
                                    const arr = [...caseData.lawyers];
                                    arr[idx].chairPosition = value;
                                    setCaseData(prev => ({ ...prev, lawyers: arr }));
                                  }}
                                >
                                  <SelectTrigger id={`lawyer-chair-${idx}`} className="h-9 text-sm">
                                    <SelectValue placeholder="Select position" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="first_chair">First Chair</SelectItem>
                                    <SelectItem value="second_chair">Second Chair</SelectItem>
                                    <SelectItem value="supporting">Supporting Counsel</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-1 md:col-span-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`lawyer-primary-${idx}`}
                                    checked={lawyer.isPrimary || false}
                                    onCheckedChange={(checked) => {
                                      const arr = [...caseData.lawyers];
                                      // Only one primary lawyer allowed
                                      arr.forEach((_, i) => {
                                        arr[i].isPrimary = i === idx ? checked : false;
                                      });
                                      setCaseData(prev => ({ ...prev, lawyers: arr }));
                                    }}
                                  />
                                  <Label htmlFor={`lawyer-primary-${idx}`} className="text-sm font-medium">
                                    Set as Primary Lawyer
                                  </Label>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  The primary lawyer will be the main point of contact for this case.
                                </p>
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
                                chairPosition: 'supporting',
                                isPrimary: (prev.lawyers || []).length === 0, // Set as primary if first lawyer
                                addedBy: user._id
                              }
                            ]
                          }))} 
                          variant="outline" 
                          className="mt-2 w-full border-dashed border-gray-300 hover:border-primary hover:bg-primary/5"
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Lawyer to Case
                        </Button>
                      </div>
                    </CardContent>

                    {/* Clients Section */}
                    <CardHeader className="border-t">
                      <CardTitle>Associated Clients</CardTitle>
                      <CardDescription>Add clients associated with this case. At least one client is required if you are creating the case.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {(caseData.clients || []).map((client, idx) => (
                          <div key={idx} className="space-y-3 border p-4 rounded-lg shadow">
                            <div className="flex justify-between items-center">
                                <h4 className="font-medium">Client {idx + 1}</h4>
                                <Button variant="ghost" size="sm" onClick={() => removeClient(idx)}>Remove</Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor={`client-name-${idx}`}>Name <span className="text-red-500">*</span></Label>
                                    <Input id={`client-name-${idx}`} value={client.name || ''} onChange={e => updateClientField(idx, 'name', e.target.value)} placeholder="Full Name" required />
                                </div>
                                <div>
                                    <Label htmlFor={`client-email-${idx}`}>Email</Label>
                                    <Input id={`client-email-${idx}`} type="email" value={client.email || ''} onChange={e => updateClientField(idx, 'email', e.target.value)} placeholder="email@example.com" />
                                </div>
                                <div>
                                    <Label htmlFor={`client-contact-${idx}`}>Contact Number</Label>
                                    <Input id={`client-contact-${idx}`} type="tel" value={client.contact || ''} onChange={e => updateClientField(idx, 'contact', e.target.value)} placeholder="+91 XXXXXXXXXX" />
                                </div>
                                <div className="md:col-span-2">
                                    <Label htmlFor={`client-address-${idx}`}>Address</Label>
                                    <Textarea id={`client-address-${idx}`} value={client.address || ''} onChange={e => updateClientField(idx, 'address', e.target.value)} placeholder="Full Address" rows={2}/>
                                </div>
                            </div>
                          </div>
                        ))}
                        <Button type="button" onClick={addClient} variant="outline" className="mt-4">
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Client
                        </Button>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  // CLIENT VIEW: Adding Advocates
                  <>
                    <CardHeader>
                      <CardTitle>Legal Team</CardTitle>
                      <CardDescription>Add your lead and associate advocates for this case (optional)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(caseData.advocates || []).map((advocate, idx) => (
                          <div key={`advocate-${idx}`} className="space-y-4 border p-4 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                Advocate {idx + 1}
                              </h4>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setCaseData(prev => ({
                                  ...prev,
                                  advocates: prev.advocates.filter((_, i) => i !== idx)
                                }))}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" /> Remove
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Basic Info */}
                              <div className="space-y-1">
                                <Label htmlFor={`adv-name-${idx}`} className="text-sm font-medium">Full Name <span className="text-red-500">*</span></Label>
                                <Input 
                                  id={`adv-name-${idx}`} 
                                  value={advocate.name || ''} 
                                  onChange={e => {
                                    const arr = [...caseData.advocates];
                                    arr[idx].name = e.target.value;
                                    setCaseData(prev => ({ ...prev, advocates: arr }));
                                  }} 
                                  placeholder="Full Name" 
                                  className="h-9 text-sm"
                                  required 
                                />
                              </div>
                              
                              <div className="space-y-1">
                                <Label htmlFor={`adv-email-${idx}`} className="text-sm font-medium">Email</Label>
                                <Input 
                                  id={`adv-email-${idx}`} 
                                  type="email" 
                                  value={advocate.email || ''} 
                                  onChange={e => {
                                    const arr = [...caseData.advocates];
                                    arr[idx].email = e.target.value;
                                    setCaseData(prev => ({ ...prev, advocates: arr }));
                                  }} 
                                  placeholder="email@example.com"
                                  className="h-9 text-sm"
                                />
                              </div>
                              
                              <div className="space-y-1">
                                <Label htmlFor={`adv-contact-${idx}`} className="text-sm font-medium">Contact Number</Label>
                                <Input 
                                  id={`adv-contact-${idx}`} 
                                  value={advocate.contact || ''} 
                                  onChange={e => {
                                    const arr = [...caseData.advocates];
                                    arr[idx].contact = e.target.value;
                                    setCaseData(prev => ({ ...prev, advocates: arr }));
                                  }} 
                                  placeholder="+91 XXXXXXXXXX"
                                  className="h-9 text-sm"
                                />
                              </div>
                              
                              <div className="space-y-1">
                                <Label htmlFor={`adv-company-${idx}`} className="text-sm font-medium">Law Firm</Label>
                                <Input 
                                  id={`adv-company-${idx}`} 
                                  value={advocate.company || ''} 
                                  onChange={e => {
                                    const arr = [...caseData.advocates];
                                    arr[idx].company = e.target.value;
                                    setCaseData(prev => ({ ...prev, advocates: arr }));
                                  }} 
                                  placeholder="Law Firm Name"
                                  className="h-9 text-sm"
                                />
                              </div>
                              
                              <div className="space-y-1">
                                <Label htmlFor={`adv-gst-${idx}`} className="text-sm font-medium">GST Number</Label>
                                <Input 
                                  id={`adv-gst-${idx}`} 
                                  value={advocate.gst || ''} 
                                  onChange={e => {
                                    const arr = [...caseData.advocates];
                                    arr[idx].gst = e.target.value;
                                    setCaseData(prev => ({ ...prev, advocates: arr }));
                                  }} 
                                  placeholder="22AAAAA0000A1Z5"
                                  className="h-9 text-sm"
                                />
                              </div>
                              
                              <div className="space-y-1">
                                <Label htmlFor={`adv-level-${idx}`} className="text-sm font-medium">Level</Label>
                                <Select
                                  value={advocate.level || ''}
                                  onValueChange={value => {
                                    const arr = [...caseData.advocates];
                                    arr[idx].level = value;
                                    setCaseData(prev => ({ ...prev, advocates: arr }));
                                  }}
                                >
                                  <SelectTrigger id={`adv-level-${idx}`} className="h-9 text-sm">
                                    <SelectValue placeholder="Select level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Senior">Senior</SelectItem>
                                    <SelectItem value="Junior">Junior</SelectItem>
                                    <SelectItem value="Associate">Associate</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-1">
                                <Label htmlFor={`adv-chair-${idx}`} className="text-sm font-medium">Chair Position</Label>
                                <Select
                                  value={advocate.chairPosition || 'supporting'}
                                  onValueChange={value => {
                                    const arr = [...caseData.advocates];
                                    arr[idx].chairPosition = value;
                                    setCaseData(prev => ({ ...prev, advocates: arr }));
                                  }}
                                >
                                  <SelectTrigger id={`adv-chair-${idx}`} className="h-9 text-sm">
                                    <SelectValue placeholder="Select position" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="first_chair">First Chair</SelectItem>
                                    <SelectItem value="second_chair">Second Chair</SelectItem>
                                    <SelectItem value="supporting">Supporting Counsel</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-1">
                                <Label htmlFor={`adv-poc-${idx}`} className="text-sm font-medium">Point of Contact</Label>
                                <Input 
                                  id={`adv-poc-${idx}`} 
                                  value={advocate.poc || ''} 
                                  onChange={e => {
                                    const arr = [...caseData.advocates];
                                    arr[idx].poc = e.target.value;
                                    setCaseData(prev => ({ ...prev, advocates: arr }));
                                  }} 
                                  placeholder="Point of Contact"
                                  className="h-9 text-sm"
                                />
                              </div>
                              
                              <div className="space-y-1 md:col-span-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`adv-isLead-${idx}`}
                                    checked={!!advocate.isLead}
                                    onCheckedChange={(checked) => {
                                      const arr = [...caseData.advocates];
                                      // Only one lead advocate allowed
                                      arr.forEach((_, i) => {
                                        arr[i].isLead = i === idx ? checked : false;
                                      });
                                      setCaseData(prev => ({ ...prev, advocates: arr }));
                                    }}
                                  />
                                  <Label htmlFor={`adv-isLead-${idx}`} className="text-sm font-medium">
                                    Set as Lead Advocate
                                  </Label>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  The lead advocate will be the main point of contact for this case.
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <Button 
                          type="button" 
                          onClick={() => setCaseData(prev => ({
                            ...prev,
                            advocates: [
                              ...(prev.advocates || []),
                              {
                                name: '',
                                email: '',
                                contact: '',
                                company: '',
                                gst: '',
                                poc: '',
                                level: 'Senior',
                                chairPosition: 'first_chair',
                                isLead: (prev.advocates || []).length === 0 // Set as lead if first advocate
                              }
                            ]
                          }))} 
                          variant="outline" 
                          className="mt-2 w-full border-dashed border-gray-300 hover:border-primary hover:bg-primary/5"
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Advocate to Case
                        </Button>
                      </div>
                    </CardContent>
                  </>
                )}
                {/* Stakeholder Section - Common for both Lawyer and Client */}
                <div className="mt-6 pt-6 border-t">
                  <CardHeader>
                    <CardTitle>Stakeholders</CardTitle>
                    <CardDescription>Add other parties involved in the case (e.g., witnesses, experts, beneficiaries).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {(caseData.stakeholders || []).map((stakeholder, idx) => (
                        <div key={idx} className="space-y-3 border p-4 rounded-lg shadow">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Stakeholder {idx + 1}</h4>
                            <Button variant="ghost" size="sm" onClick={() => removeStakeholder(idx)}>Remove</Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`stakeholder-name-${idx}`}>Name <span className="text-red-500">*</span></Label>
                              <Input id={`stakeholder-name-${idx}`} value={stakeholder.name || ''} onChange={e => updateStakeholderField(idx, 'name', e.target.value)} placeholder="Full Name" required />
                            </div>
                            <div>
                              <Label htmlFor={`stakeholder-role-${idx}`}>Role/Relation in Case</Label>
                              <Input id={`stakeholder-role-${idx}`} value={stakeholder.roleInCase || ''} onChange={e => updateStakeholderField(idx, 'roleInCase', e.target.value)} placeholder="e.g., Witness, Expert" />
                            </div>
                            <div>
                              <Label htmlFor={`stakeholder-email-${idx}`}>Email</Label>
                              <Input id={`stakeholder-email-${idx}`} type="email" value={stakeholder.email || ''} onChange={e => updateStakeholderField(idx, 'email', e.target.value)} placeholder="email@example.com" />
                            </div>
                            <div>
                              <Label htmlFor={`stakeholder-contact-${idx}`}>Contact Number</Label>
                              <Input id={`stakeholder-contact-${idx}`} type="tel" value={stakeholder.contact || ''} onChange={e => updateStakeholderField(idx, 'contact', e.target.value)} placeholder="+91 XXXXXXXXXX" />
                            </div>
                            <div className="md:col-span-2">
                              <Label htmlFor={`stakeholder-address-${idx}`}>Address</Label>
                              <Textarea id={`stakeholder-address-${idx}`} value={stakeholder.address || ''} onChange={e => updateStakeholderField(idx, 'address', e.target.value)} placeholder="Full Address" rows={2}/>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button type="button" onClick={addStakeholder} variant="outline" className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Stakeholder
                      </Button>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="flex justify-between mt-6 pt-6 border-t">
                    <Button variant="outline" onClick={() => router.push("/dashboard/cases")}>Cancel</Button>
                    <Button 
                      type="button" 
                      onClick={(e) => handleSubmit(e, 'details')} 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Case"}
                    </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden md:block">
          <Card>
            <CardHeader>
              <CardTitle>Case Filing Guide</CardTitle>
              <CardDescription>Tips for filing a new case</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative h-40 w-full">
                <Image
                  src="/images/law-library.jpg"
                  alt="Legal documents"
                  fill
                  className="object-cover rounded-md hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Required Information</h3>
                <ul className="text-sm space-y-1 list-disc pl-4">
                  <li>Complete case title</li>
                  <li>Court details including hall number</li>
                  <li>Client (Petitioner) information</li>
                  <li>Filing date</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Document Checklist</h3>
                <ul className="text-sm space-y-1 list-disc pl-4">
                  <li>Petition/Complaint</li>
                  <li>Supporting affidavits</li>
                  <li>Evidence documents</li>
                  <li>Court fee receipts</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
