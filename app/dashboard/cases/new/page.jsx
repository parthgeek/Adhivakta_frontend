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

  // Validate all fields
  const validateAllFields = () => {
    const errors = [];

    // Case Details validation
    if (!caseData.title || caseData.title.trim() === '') {
      errors.push({ tab: 'details', message: 'Case title is required' });
    } else if (caseData.title.length < 3) {
      errors.push({ tab: 'details', message: 'Case title must be at least 3 characters' });
    }

    if (!caseData.caseNumber || caseData.caseNumber.trim() === '') {
      errors.push({ tab: 'details', message: 'Case number is required' });
    }

    if (!caseData.caseType) {
      errors.push({ tab: 'details', message: 'Case type is required' });
    }

    if (!caseData.status) {
      errors.push({ tab: 'details', message: 'Case status is required' });
    }

    // Court Name validation
    if (!caseData.court || caseData.court.trim() === '') {
      errors.push({ tab: 'court', message: 'Court name is required' });
    }

    // First Hearing Date validation (MANDATORY)
    if (!caseData.nextHearingDate) {
      errors.push({ tab: 'details', message: 'First hearing date is required' });
    } else {
      const hearingDate = new Date(caseData.nextHearingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (hearingDate < today) {
        errors.push({ tab: 'details', message: 'First hearing date must be in the future' });
      }

      if (caseData.filingDate) {
        const filingDate = new Date(caseData.filingDate);
        filingDate.setHours(0, 0, 0, 0);

        if (hearingDate <= filingDate) {
          errors.push({ tab: 'details', message: 'First hearing date must be after the filing date' });
        }
      }
    }

    // Petitioner validation (MANDATORY - at least one)
    if (!caseData.petitioners || caseData.petitioners.length === 0) {
      errors.push({ tab: 'party', message: 'At least one petitioner/plaintiff/appellant is required' });
    } else {
      caseData.petitioners.forEach((petitioner, index) => {
        if (!petitioner.name || petitioner.name.trim() === '') {
          errors.push({ tab: 'party', message: `Petitioner ${index + 1} name is required` });
        }
      });
    }

    // Respondent validation (if provided)
    if (caseData.respondents && caseData.respondents.length > 0) {
      caseData.respondents.forEach((respondent, index) => {
        if (!respondent.name || respondent.name.trim() === '') {
          errors.push({ tab: 'party', message: `Respondent ${index + 1} name is required` });
        }
      });
    }

    // Lawyer-specific validation
    if (isLawyer) {
      if (!caseData.clients || caseData.clients.length === 0) {
        errors.push({ tab: 'associatedParties', message: 'At least one client is required when a lawyer creates a case' });
      } else {
        caseData.clients.forEach((client, index) => {
          if (!client.name || client.name.trim() === '') {
            errors.push({ tab: 'associatedParties', message: `Client ${index + 1} name is required` });
          }
        });
      }

      if (caseData.lawyers && caseData.lawyers.length > 0) {
        caseData.lawyers.forEach((lawyer, index) => {
          if (!lawyer.name || lawyer.name.trim() === '') {
            errors.push({ tab: 'associatedParties', message: `Lawyer ${index + 1} name is required` });
          }
        });
      }
    } else {
      // Client-specific validation
      if (caseData.advocates && caseData.advocates.length > 0) {
        caseData.advocates.forEach((advocate, index) => {
          if (!advocate.name || advocate.name.trim() === '') {
            errors.push({ tab: 'associatedParties', message: `Advocate ${index + 1} name is required` });
          }
        });
      }
    }

    // Stakeholders validation (if provided)
    if (caseData.stakeholders && caseData.stakeholders.length > 0) {
      caseData.stakeholders.forEach((stakeholder, index) => {
        if (!stakeholder.name || stakeholder.name.trim() === '') {
          errors.push({ tab: 'associatedParties', message: `Stakeholder ${index + 1} name is required` });
        }
      });
    }

    return errors;
  };

  // Handle Next button click with validation
  const handleNext = () => {
    const tabOrder = ["details", "court", "party", "documents", "associatedParties"];
    const currentIndex = tabOrder.indexOf(activeTab);

    // Validate all fields and filter for current tab
    const allErrors = validateAllFields();
    const currentTabErrors = allErrors.filter(error => error.tab === activeTab);

    if (currentTabErrors.length > 0) {
      const errorMessage = currentTabErrors.map(e => e.message).join('\n');
      toast({
        title: "Validation Errors",
        description: `Please fix the following errors before proceeding:\n${errorMessage}`,
        variant: "destructive",
      });
      return;
    }

    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle Back button click
  const handleBack = () => {
    const tabOrder = ["details", "court", "party", "documents", "associatedParties"];
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

    try {
      // Perform comprehensive validation
      const errors = validateAllFields();

      if (errors.length > 0) {
        // Group errors by tab
        const errorsByTab = {};
        errors.forEach(error => {
          if (!errorsByTab[error.tab]) {
            errorsByTab[error.tab] = [];
          }
          errorsByTab[error.tab].push(error.message);
        });

        // Create formatted error message
        const errorSummary = Object.entries(errorsByTab)
          .map(([tab, messages]) => {
            const tabName = tab.charAt(0).toUpperCase() + tab.slice(1);
            return `${tabName}:\n${messages.map(m => `• ${m}`).join('\n')}`;
          })
          .join('\n\n');

        toast({
          title: `${errors.length} Validation ${errors.length === 1 ? 'Error' : 'Errors'} Found`,
          description: errorSummary,
          variant: "destructive",
          duration: 8000,
        });

        // Switch to first tab with errors
        const firstErrorTab = errors[0]?.tab;
        if (firstErrorTab && firstErrorTab !== activeTab) {
          setActiveTab(firstErrorTab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        return;
      }

      setIsSubmitting(true);

      // Format the data according to the API schema
      const formattedData = {
        // Basic case info
        title: caseData.title.trim(),
        caseNumber: caseData.caseNumber.trim(),
        caseType: caseData.caseType,
        status: caseData.status || "active",

        // Court information
        courtState: caseData.courtState,
        district: caseData.district,
        bench: caseData.bench,
        courtType: caseData.courtType,
        court: caseData.court.trim(),
        courtHall: caseData.courtHall?.trim() || "",
        courtComplex: caseData.courtComplex?.trim() || "",

        // Dates
        filingDate: caseData.filingDate
          ? new Date(caseData.filingDate).toISOString()
          : new Date().toISOString(),
        nextHearingDate: caseData.nextHearingDate
          ? new Date(caseData.nextHearingDate).toISOString()
          : null,

        // Parties Section
        parties: {
          petitioner: (caseData.petitioners || []).map((p) => ({
            name: p.name.trim(),
            type: p.type || "Individual",
            role: p.label || caseData.petitionerLabel || "Petitioner",
            email: p.email?.trim() || "",
            contact: p.contact?.trim() || "",
            address: p.address?.trim() || "",
          })),
          respondent: (caseData.respondents || []).map((r) => ({
            name: r.name.trim(),
            type: r.type || "Individual",
            role: r.label || caseData.respondentLabel || "Defendant",
            email: r.email?.trim() || "",
            contact: r.contact?.trim() || "",
            address: r.address?.trim() || "",
          })),
        },

        // Case Management
        priority: caseData.priority || "normal",
        isUrgent: caseData.isUrgent || false,
        caseStage: caseData.caseStage || "filing",
        actSections: caseData.actSections?.trim() || "",
        reliefSought: caseData.reliefSought?.trim() || "",
        description: caseData.description?.trim() || "",
        notes: caseData.notes?.trim() || "",

        // Role-specific data
        ...(isLawyer
          ? {
            // For lawyers
            clients: (caseData.clients || []).map((client) => ({
              name: client.name.trim(),
              email: client.email?.trim() || "",
              contact: client.contact?.trim() || "",
              address: client.address?.trim() || "",
              isPrimary: client.isPrimary || false,
            })),

            lawyers: (caseData.lawyers || []).map((lawyer) => ({
              name: lawyer.name.trim(),
              email: lawyer.email?.trim() || "",
              contact: lawyer.contact?.trim() || "",
              company: lawyer.company?.trim() || "",
              gst: lawyer.gst?.trim() || "",
              isLead: lawyer.isLead || false,
              level: lawyer.level || "",

              isPrimary: lawyer.isPrimary || false,
              poc: lawyer.poc?.trim() || "",
              spock: lawyer.spock?.trim() || "",
            })),

            stakeholders: (caseData.stakeholders || []).map(
              (stakeholder) => ({
                name: stakeholder.name.trim(),
                email: stakeholder.email?.trim() || "",
                contact: stakeholder.contact?.trim() || "",
                address: stakeholder.address?.trim() || "",
                roleInCase: stakeholder.roleInCase?.trim() || "",
              })
            ),
          }
          : {
            // For clients
            clients: [
              {
                name: user?.name || "",
                email: user?.email || "",
                contact: user?.phone || "",
                address: user?.address || "",
              },
            ],

            lawyers: (caseData.advocates || []).map((adv) => ({
              name: adv.name.trim(),
              email: adv.email?.trim() || "",
              contact: adv.contact?.trim() || "",
              company: adv.company?.trim() || "",
              gst: adv.gst?.trim() || "",
              isLead: adv.isLead || false,
              level: adv.level || "",
              poc: adv.poc?.trim() || "",
              spock: adv.spock?.trim() || "",
            })),

            stakeholders: (caseData.stakeholders || []).map(
              (stakeholder) => ({
                name: stakeholder.name.trim(),
                email: stakeholder.email?.trim() || "",
                contact: stakeholder.contact?.trim() || "",
                address: stakeholder.address?.trim() || "",
                roleInCase: stakeholder.roleInCase?.trim() || "",
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

      // Handle backend validation errors
      if (response.errors && Array.isArray(response.errors)) {
        const formattedErrors = response.errors.map(err => err.message).join('\n');
        toast({
          title: "Validation Error",
          description: formattedErrors,
          variant: "destructive",
          duration: 8000,
        });
        setIsSubmitting(false);
        return;
      }

      // Upload documents after case is created
      const caseId = response?.case?._id || response?._id || response?.data?._id || response?.data?.case?._id;
      if (caseId && selectedFiles.length > 0) {
        await uploadDocuments(caseId);
      }

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
        // Final submission - show success message
        toast({
          title: "Success",
          description: "Case created successfully!",
        });

        // Extract case ID
        const createdCaseId =
          response?.data?.data?.case?._id ||
          response?.data?.data?._id ||
          response?.data?.case?._id ||
          response?.data?._id ||
          response?.case?._id ||
          response?._id;

        // Redirect
        setTimeout(() => {
          if (createdCaseId) {
            router.push(`/dashboard/cases/${createdCaseId}`);
          } else {
            router.push("/dashboard/cases");
            router.refresh();
          }
        }, 1000);
      }

      return response;
    } catch (error) {
      console.error("Error saving case:", error);

      // Handle specific error types
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors
          .map(err => err.message)
          .join('\n');

        toast({
          title: "Validation Error",
          description: backendErrors,
          variant: "destructive",
          duration: 8000,
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to save case. Please try again.",
          variant: "destructive",
        });
      }

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

      // Validate that filing date is not in the future
      if (name === "filingDate" && date) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (new Date(date) > today) {
          toast({
            title: "Validation Error",
            description: "Filing date cannot be in the future",
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
        { name: "", email: "", contact: "", address: "", isPrimary: (prev.clients || []).length === 0 },
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
        <div>
          <h1 className="text-3xl font-bold">New Case</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Fill in all required fields marked with <span className="text-red-500">*</span>
          </p>
        </div>
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