"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import CaseTabs from "@/components/cases/CaseTabs";
import SidebarGuide from "@/components/cases/SidebarGuide";
import { DISTRICTS } from "@/lib/constants/caseConstants";
import { toast } from "@/components/ui/use-toast";
import api from "@/services/api";

const normalizeValue = (value) =>
  typeof value === "string" ? value.trim() : "";

const normalizeEmail = (value) => normalizeValue(value).toLowerCase();

const getCurrentUserId = (currentUser) => currentUser?.id || currentUser?._id || null;

const getParticipantUserId = (participant) => {
  if (!participant) return null;

  if (participant.user && typeof participant.user === "object") {
    return participant.user._id || participant.user.id || null;
  }

  return participant.user || participant._id || participant.id || null;
};

const isSameUser = (participant, currentUser) => {
  const currentUserId = getCurrentUserId(currentUser);
  const currentUserEmail = normalizeEmail(currentUser?.email);
  const participantUserId = getParticipantUserId(participant);
  const participantEmail = normalizeEmail(participant?.email);

  return (
    (currentUserId &&
      participantUserId &&
      participantUserId.toString() === currentUserId.toString()) ||
    (currentUserEmail &&
      participantEmail &&
      participantEmail === currentUserEmail)
  );
};

const ensureCurrentUserPrimaryParticipant = (
  participants = [],
  currentUser,
  type
) => {
  const currentUserId = getCurrentUserId(currentUser);
  const currentUserEmail = normalizeEmail(currentUser?.email);

  if (!currentUserId && !currentUserEmail) {
    return Array.isArray(participants) ? participants : [];
  }

  let foundCurrentUser = false;
  const normalizedParticipants = [];

  (participants || []).forEach((participant) => {
    const isCurrentUser = isSameUser(participant, currentUser);

    if (isCurrentUser) {
      if (foundCurrentUser) {
        return;
      }

      foundCurrentUser = true;
      normalizedParticipants.push({
        ...participant,
        user: currentUserId || participant.user || null,
        name: normalizeValue(currentUser?.name) || normalizeValue(participant?.name),
        email:
          normalizeValue(currentUser?.email) || normalizeValue(participant?.email),
        contact:
          normalizeValue(participant?.contact) ||
          normalizeValue(currentUser?.phone) ||
          normalizeValue(currentUser?.contact),
        ...(type === "lawyer"
          ? {
              company:
                normalizeValue(participant?.company) ||
                normalizeValue(currentUser?.company),
              gst:
                normalizeValue(participant?.gst) || normalizeValue(currentUser?.gst),
              level: participant?.level || "Senior",
            }
          : {
              address:
                normalizeValue(participant?.address) ||
                normalizeValue(currentUser?.address),
            }),
        isPrimary: true,
      });
      return;
    }

    normalizedParticipants.push({
      ...participant,
      isPrimary: false,
    });
  });

  if (!foundCurrentUser) {
    normalizedParticipants.unshift({
      user: currentUserId || null,
      name: normalizeValue(currentUser?.name),
      email: normalizeValue(currentUser?.email),
      contact:
        normalizeValue(currentUser?.phone) || normalizeValue(currentUser?.contact),
      ...(type === "lawyer"
        ? {
            company: normalizeValue(currentUser?.company),
            gst: normalizeValue(currentUser?.gst),
            level: "Senior",
          }
        : {
            address: normalizeValue(currentUser?.address),
          }),
      isPrimary: true,
    });
  }

  return normalizedParticipants;
};

const removeCurrentUserFromParticipants = (participants = [], currentUser) =>
  (participants || []).filter((participant) => !isSameUser(participant, currentUser));

const validateRequiredLegalTeamFields = ({
  participants = [],
  roleLabel,
  tab,
  errors,
  requireAtLeastOne = false,
  emptyStateMessage,
}) => {
  if (!Array.isArray(participants) || participants.length === 0) {
    if (requireAtLeastOne && emptyStateMessage) {
      errors.push({ tab, message: emptyStateMessage });
    }
    return;
  }

  participants.forEach((participant, index) => {
    const participantNumber = `${roleLabel} ${index + 1}`;

    if (!normalizeValue(participant?.name)) {
      errors.push({ tab, message: `${participantNumber} name is required` });
    }

    if (!normalizeValue(participant?.company)) {
      errors.push({ tab, message: `${participantNumber} law firm is required` });
    }

    if (!normalizeValue(participant?.contact)) {
      errors.push({ tab, message: `${participantNumber} mobile number is required` });
    }

    if (!normalizeValue(participant?.email)) {
      errors.push({ tab, message: `${participantNumber} email ID is required` });
    }
  });
};

export default function NewCasePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [activeTab, setActiveTab] = useState("details");
  const isLawyer = user?.role === "lawyer" || user?.role === "admin";

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
    if (!user) return;

    setCaseData((prev) => {
      const nextLawyers = isLawyer
        ? ensureCurrentUserPrimaryParticipant(prev.lawyers || [], user, "lawyer")
        : removeCurrentUserFromParticipants(prev.lawyers || [], user);

      const nextClients = isLawyer
        ? removeCurrentUserFromParticipants(prev.clients || [], user)
        : ensureCurrentUserPrimaryParticipant(prev.clients || [], user, "client");

      const lawyersChanged =
        JSON.stringify(nextLawyers) !== JSON.stringify(prev.lawyers || []);
      const clientsChanged =
        JSON.stringify(nextClients) !== JSON.stringify(prev.clients || []);

      if (!lawyersChanged && !clientsChanged) {
        return prev;
      }

      return {
        ...prev,
        lawyers: nextLawyers,
        clients: nextClients,
      };
    });
  }, [user, isLawyer]);

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
      validateRequiredLegalTeamFields({
        participants: caseData.lawyers,
        roleLabel: "Lawyer",
        tab: "associatedParties",
        errors,
        requireAtLeastOne: true,
        emptyStateMessage: "Primary lawyer details are required",
      });

      if (!caseData.clients || caseData.clients.length === 0) {
        errors.push({ tab: 'associatedParties', message: 'At least one client is required when a lawyer creates a case' });
      } else {
        caseData.clients.forEach((client, index) => {
          if (!client.name || client.name.trim() === '') {
            errors.push({ tab: 'associatedParties', message: `Client ${index + 1} name is required` });
          }
        });
      }
    } else {
      // Client-specific validation
      if (!caseData.clients || caseData.clients.length === 0) {
        errors.push({ tab: 'associatedParties', message: 'Primary client details are required' });
      } else {
        caseData.clients.forEach((client, index) => {
          if (!client.name || client.name.trim() === '') {
            errors.push({ tab: 'associatedParties', message: `Client ${index + 1} name is required` });
          }
        });
      }

      validateRequiredLegalTeamFields({
        participants: caseData.advocates,
        roleLabel: "Advocate",
        tab: "associatedParties",
        errors,
        requireAtLeastOne: true,
        emptyStateMessage: "At least one lawyer is required when creating a case",
      });
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
          uploadedDocs.push({
            message: response.message,
            document: response.data,
          });
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: 100,
          }));
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

      const normalizedLawyers = isLawyer
        ? ensureCurrentUserPrimaryParticipant(caseData.lawyers || [], user, "lawyer")
        : removeCurrentUserFromParticipants(
            (caseData.advocates || []).map((adv) => ({
              name: normalizeValue(adv?.name),
              email: normalizeValue(adv?.email),
              contact: normalizeValue(adv?.contact),
              company: normalizeValue(adv?.company),
              gst: normalizeValue(adv?.gst),
              isLead: !!adv?.isLead,
              level: adv?.level || "",
              poc: normalizeValue(adv?.poc),
              spock: normalizeValue(adv?.spock),
            })),
            user
          );

      const normalizedClients = isLawyer
        ? removeCurrentUserFromParticipants(caseData.clients || [], user)
        : ensureCurrentUserPrimaryParticipant(caseData.clients || [], user, "client");

      // Format the data according to the API schema
      const formattedData = {
        // Basic case info
        title: normalizeValue(caseData.title),
        caseNumber: normalizeValue(caseData.caseNumber),
        caseType: caseData.caseType,
        status: caseData.status || "active",

        // Court information
        courtState: caseData.courtState,
        district: caseData.district,
        bench: caseData.bench,
        courtType: caseData.courtType,
        court: normalizeValue(caseData.court),
        courtHall: normalizeValue(caseData.courtHall),
        courtComplex: normalizeValue(caseData.courtComplex),

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
            name: normalizeValue(p.name),
            type: p.type || "Individual",
            role: p.label || caseData.petitionerLabel || "Petitioner",
            email: normalizeValue(p.email),
            contact: normalizeValue(p.contact),
            address: normalizeValue(p.address),
          })),
          respondent: (caseData.respondents || []).map((r) => ({
            name: normalizeValue(r.name),
            type: r.type || "Individual",
            role: r.label || caseData.respondentLabel || "Defendant",
            email: normalizeValue(r.email),
            contact: normalizeValue(r.contact),
            address: normalizeValue(r.address),
          })),
        },

        // Case Management
        priority: caseData.priority || "normal",
        isUrgent: caseData.isUrgent || false,
        caseStage: caseData.caseStage || "filing",
        actSections: normalizeValue(caseData.actSections),
        reliefSought: normalizeValue(caseData.reliefSought),
        description: normalizeValue(caseData.description),
        notes: normalizeValue(caseData.notes),

        // Role-specific data
        ...(isLawyer
          ? {
            // For lawyers
            clients: normalizedClients.map((client) => ({
              name: normalizeValue(client.name),
              email: normalizeValue(client.email),
              contact: normalizeValue(client.contact),
              address: normalizeValue(client.address),
              isPrimary: !!client.isPrimary,
            })),

            lawyers: normalizedLawyers.map((lawyer) => ({
              name: normalizeValue(lawyer.name),
              email: normalizeValue(lawyer.email),
              contact: normalizeValue(lawyer.contact),
              company: normalizeValue(lawyer.company),
              gst: normalizeValue(lawyer.gst),
              isLead: !!lawyer.isLead,
              level: lawyer.level || "",

              isPrimary: !!lawyer.isPrimary,
              poc: normalizeValue(lawyer.poc),
              spock: normalizeValue(lawyer.spock),
            })),

            stakeholders: (caseData.stakeholders || []).map(
              (stakeholder) => ({
                name: normalizeValue(stakeholder.name),
                email: normalizeValue(stakeholder.email),
                contact: normalizeValue(stakeholder.contact),
                address: normalizeValue(stakeholder.address),
                roleInCase: normalizeValue(stakeholder.roleInCase),
              })
            ),
          }
          : {
            // For clients
            clients: normalizedClients.map((client) => ({
              name: normalizeValue(client.name),
              email: normalizeValue(client.email),
              contact: normalizeValue(client.contact),
              address: normalizeValue(client.address),
              isPrimary: !!client.isPrimary,
            })),

            lawyers: normalizedLawyers.map((lawyer) => ({
              name: normalizeValue(lawyer.name),
              email: normalizeValue(lawyer.email),
              contact: normalizeValue(lawyer.contact),
              company: normalizeValue(lawyer.company),
              gst: normalizeValue(lawyer.gst),
              isLead: !!lawyer.isLead,
              level: lawyer.level || "",
              poc: normalizeValue(lawyer.poc),
              spock: normalizeValue(lawyer.spock),
            })),

            stakeholders: (caseData.stakeholders || []).map(
              (stakeholder) => ({
                name: normalizeValue(stakeholder.name),
                email: normalizeValue(stakeholder.email),
                contact: normalizeValue(stakeholder.contact),
                address: normalizeValue(stakeholder.address),
                roleInCase: normalizeValue(stakeholder.roleInCase),
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
      let uploadedDocs = [];
      if (caseId && selectedFiles.length > 0) {
        uploadedDocs = await uploadDocuments(caseId);
      }

      const hasPendingReviewDocuments = uploadedDocs.some(
        (item) => item?.document?.approvalStatus === "pending"
      );

      if (uploadedDocs.length > 0) {
        setSelectedFiles([]);
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
        toast({
          title: "Success",
          description: hasPendingReviewDocuments
            ? "Case created. Uploaded documents are pending lawyer approval."
            : "Case created successfully!",
        });

        const createdCaseId =
          response?.data?.data?.case?._id ||
          response?.data?.data?._id ||
          response?.data?.case?._id ||
          response?.data?._id ||
          response?.case?._id ||
          response?._id;

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
          <h1 className="text-3xl font-bold">Add Case</h1>
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
