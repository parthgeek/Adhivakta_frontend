
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import CaseTabs from "@/components/cases/CaseTabs";
import SidebarGuide from "@/components/cases/SidebarGuide";
import { CASE_TYPES, STATES, OTHER_COURT_TYPES, BENCHES, DISTRICTS } from "@/lib/constants/caseConstants";
import { toast } from "@/components/ui/use-toast";
import api from "@/services/api";

export default function NewCasePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLawyer, setIsLawyer] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [activeTab, setActiveTab] = useState("details");
  
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
    stakeholders: [],
    lawyers: [],
  });

  useEffect(() => {
    if (user) {
      const isLawyer = user?.role === "lawyer" || user?.role === "admin";
      setIsLawyer(isLawyer);
    }
  }, [user]);

  // Handle Next button click
  const handleNext = () => {
    const tabOrder = ["details", "court", "party", "documents", "associatedParties"];
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    }
  };

  // Handle Back button click
  const handleBack = () => {
    const tabOrder = ["details", "court", "party", "documents", "associatedParties"];
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  // Upload documents function
  async function uploadDocuments(caseId) {
    if (!caseId || selectedFiles.length === 0) return [];

    const uploadedDocs = [];

    for (const file of selectedFiles) {
      setUploadProgress((prev) => ({
        ...prev,
        [file.name]: 0,
      }));

      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      formData.append("description", `Document for case ${caseData.title || "Case"}`);
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

        if (response && response.data) {
          uploadedDocs.push(response.data);
        }
      } catch (err) {
        console.error(`Error uploading document ${file.name}:`, err);
      }
    }

    return uploadedDocs;
  }

  const handleSubmit = async (e, section = "all") => {
    e.preventDefault();

    // Validate required fields for the details section
    if (section === "all" || section === "details") {
      if (
        !caseData.title ||
        !caseData.caseNumber ||
        !caseData.caseType ||
        !caseData.status
      ) {
        toast({
          title: "Error",
          description:
            "Please fill in all required fields (Case Name, Case Number, Case Type, Status)",
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
    if (section === "all" || section === "party") {
      if (!caseData.petitioners || caseData.petitioners.length === 0) {
        toast({
          title: "Error",
          description:
            "Please add at least one petitioner/plaintiff/appellant/complainant",
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
            description: `Please enter a name for Petitioner/Plaintiff/Appellant/Complainant ${
              i + 1
            }`,
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
              description: `Please enter a name for Respondent/Defendant/Accused/Opponent ${
                i + 1
              }`,
              variant: "destructive",
            });
            return;
          }
        }
      }
    }

    // Validate lawyers if lawyer is creating the case
    if (isLawyer && (section === "all" || section === "associatedParties")) {
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
        if (!lawyer.name || lawyer.name.trim() === "") {
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
    if (isLawyer && (section === "all" || section === "associatedParties")) {
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
        filingDate: caseData.filingDate
          ? new Date(caseData.filingDate).toISOString()
          : null,
        nextHearingDate: caseData.nextHearingDate
          ? new Date(caseData.nextHearingDate).toISOString()
          : null,

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
          petitioner: (caseData.petitioners || []).map((petitioner) => {
            const obj = { name: petitioner.name };
            if (petitioner.type) obj.type = petitioner.type;
            if (petitioner.role) obj.role = petitioner.role;
            if (petitioner.email) obj.email = petitioner.email;
            if (petitioner.contact) obj.contact = petitioner.contact;
            if (petitioner.address) obj.address = petitioner.address;
            return obj;
          }),
          respondent: (caseData.respondents || []).map((respondent) => {
            const obj = { name: respondent.name };
            if (respondent.type) obj.type = respondent.type;
            if (respondent.role) obj.role = respondent.role;
            if (respondent.email) obj.email = respondent.email;
            if (respondent.contact) obj.contact = respondent.contact;
            if (respondent.address) obj.address = respondent.address;
            if (respondent.opposingCounsel)
              obj.opposingCounsel = respondent.opposingCounsel;
            return obj;
          }),
        },

        ...(isLawyer
          ? {
              lawyers: (caseData.lawyers || []).map((lawyer) => ({
                name: lawyer.name,
                email: lawyer.email,
                contact: lawyer.contact,
                company: lawyer.company,
                gst: lawyer.gst,
                role: lawyer.role,
                position: lawyer.position,
                isPrimary: lawyer.isPrimary,
                level: lawyer.level,
                chairPosition: lawyer.chairPosition,
              })),
              clients: (caseData.clients || []).map((client) => ({
                name: client.name,
                email: client.email,
                contact: client.contact,
                address: client.address,
              })),
              stakeholders: (caseData.stakeholders || []).map(
                (stakeholder) => ({
                  name: stakeholder.name,
                  email: stakeholder.email || "",
                  contact: stakeholder.contact || "",
                  address: stakeholder.address || "",
                  roleInCase: stakeholder.roleInCase || "",
                })
              ),
            }
          : {
              // For clients - add themselves
              clients: [
                {
                  name: user?.name || "",
                  email: user?.email || "",
                  contact: user?.phone || "",
                  address: user?.address || "",
                },
              ],
              // Add advocates
              lawyers: (caseData.advocates || []).map((adv) => ({
                name: adv.name,
                email: adv.email || "",
                contact: adv.contact || "",
                company: adv.company || "",
                gst: adv.gst || "",
                isLead: adv.isLead || false,
                level: adv.level || "",
                poc: adv.poc || "",
                spock: adv.spock || "",
              })),

              // Add stakeholders
              stakeholders: (caseData.stakeholders || []).map(
                (stakeholder) => ({
                  name: stakeholder.name,
                  email: stakeholder.email || "",
                  contact: stakeholder.contact || "",
                  address: stakeholder.address || "",
                  roleInCase: stakeholder.roleInCase || "",
                })
              ),
            }),
      };

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

      // Upload documents after case is created
      const caseId = response?.case?._id || response?._id || response?.data?._id;
      if (caseId && selectedFiles.length > 0) {
        await uploadDocuments(caseId);
      }

      // If this is a partial save, update the local state with the saved data
      if (section !== "all") {
        setCaseData((prev) => ({
          ...prev,
          ...(response.data || response),
          _id: response.data?._id || response._id || prev._id,
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
        const caseId =
          response?.data?.data?.case?._id ||
          response?.data?.data?._id ||
          response?.data?.case?._id ||
          response?.data?._id ||
          response?._id;
        if (caseId) router.push(`/dashboard/cases/${caseId}`);
        else router.push("/dashboard/cases");
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
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCaseData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    if (name === "courtState") {
      setCaseData((prev) => ({
        ...prev,
        courtState: value,
        district: DISTRICTS[value]?.[0]?.value || "bengaluru_urban",
        bench: "",
      }));
    } else if (name === "courtType") {
      setCaseData((prev) => ({
        ...prev,
        [name]: value,
        bench:
          value === "high_court" && prev.courtState === "karnataka"
            ? "bengaluru"
            : "",
      }));
    } else {
      setCaseData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (name, date) => {
    setCaseData((prev) => {
      const newData = { ...prev, [name]: date };

      // Validate that next hearing date is after filing date
      if (name === "nextHearingDate" && newData.filingDate && date) {
        if (new Date(date) <= new Date(newData.filingDate)) {
          toast({
            title: "Validation Error",
            description: "First hearing date must be after the filing date",
            variant: "destructive",
          });
          return prev;
        }
      }

      return newData;
    });
  };

  const handleCheckboxChange = (name, checked) => {
    setCaseData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  // Helper functions
  const updateClientField = (index, field, value) => {
    setCaseData((prev) => {
      const updatedClients = [...(prev.clients || [])];
      updatedClients[index] = { ...updatedClients[index], [field]: value };
      return { ...prev, clients: updatedClients };
    });
  };

  const removeClient = (index) => {
    setCaseData((prev) => ({
      ...prev,
      clients: prev.clients.filter((_, i) => i !== index),
    }));
  };

  const addClient = () => {
    setCaseData((prev) => ({
      ...prev,
      clients: [
        ...(prev.clients || []),
        { name: "", email: "", contact: "", address: "" },
      ],
    }));
  };

  const addStakeholder = () => {
    setCaseData((prev) => ({
      ...prev,
      stakeholders: [
        ...(prev.stakeholders || []),
        { name: "", email: "", contact: "", address: "", roleInCase: "" },
      ],
    }));
  };

  const updateStakeholderField = (index, field, value) => {
    setCaseData((prev) => {
      const updatedStakeholders = [...(prev.stakeholders || [])];
      updatedStakeholders[index] = {
        ...updatedStakeholders[index],
        [field]: value,
      };
      return { ...prev, stakeholders: updatedStakeholders };
    });
  };

  const removeStakeholder = (index) => {
    setCaseData((prev) => ({
      ...prev,
      stakeholders: prev.stakeholders.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">New Case</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <CaseTabs
            caseData={caseData}
            setCaseData={setCaseData}
            isSubmitting={isSubmitting}
            isLawyer={isLawyer}
            selectedFiles={selectedFiles}
            uploadProgress={uploadProgress}
            handleSubmit={handleSubmit}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            handleDateChange={handleDateChange}
            handleCheckboxChange={handleCheckboxChange}
            handleFileChange={handleFileChange}
            updateClientField={updateClientField}
            removeClient={removeClient}
            addClient={addClient}
            addStakeholder={addStakeholder}
            updateStakeholderField={updateStakeholderField}
            removeStakeholder={removeStakeholder}
            router={router}
            user={user}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleNext={handleNext}
            handleBack={handleBack}
          />
        </div>
        
        <div className="hidden md:block">
          <SidebarGuide />
        </div>
      </div>
    </div>
  );
}
