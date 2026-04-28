"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  MoreVertical,
  FolderOpen,
  FileText,
  X,
  ShieldCheck,
} from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import {
  formatDisplayCaseNumber,
  getCaseIdentifier,
} from "@/lib/caseTypeUtils";
import { getDocumentOpenUrl } from "@/lib/document-url";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "pleading", label: "Pleadings" },
  { value: "evidence", label: "Evidence" },
  { value: "order", label: "Orders" },
  { value: "correspondence", label: "Correspondence" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

const getCategoryColor = (category) => {
  switch (category) {
    case "pleading":
      return "bg-[#03234b] text-white border-transparent";
    case "evidence":
      return "bg-green-500 text-white border-transparent";
    case "order":
      return "bg-violet-500 text-white border-transparent";
    case "correspondence":
      return "bg-orange-500 text-white border-transparent";
    case "other":
      return "bg-gray-500 text-white border-transparent";
    default:
      return "bg-muted text-foreground border-transparent";
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "approved":
      return "border-transparent bg-green-100 text-green-700";
    case "pending":
      return "border-transparent bg-amber-100 text-amber-700";
    case "rejected":
      return "border-transparent bg-red-100 text-red-700";
    default:
      return "border-border bg-muted text-foreground";
  }
};

const normalizeCategory = (category) => {
  const value = (category || "").toLowerCase();

  if (value === "pleading" || value === "affidavit") return "pleading";
  if (value === "evidence" || value === "report") return "evidence";
  if (value === "order" || value === "judgment") return "order";
  if (value === "correspondence" || value === "notice" || value === "memo") {
    return "correspondence";
  }

  return "other";
};

const normalizeStatus = (status) => {
  const value = (status || "").toLowerCase();

  if (value === "approved" || value === "active") return "approved";
  if (value === "pending" || value === "draft") return "pending";
  if (value === "rejected" || value === "archived" || value === "deleted") {
    return "rejected";
  }

  return "pending";
};

const formatFileSize = (size) => {
  if (typeof size === "string") return size;
  if (typeof size !== "number" || Number.isNaN(size)) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (date) => {
  if (!date) return "-";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString();
};

const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const toTitleCase = (value = "") =>
  value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : "Other";

const getPersonName = (person) => {
  if (!person) return "";
  if (typeof person === "string") return person;
  return person.name || person.title || person.fullName || "";
};

const buildVersusLabel = (caseItem = {}) => {
  const petitioners = Array.isArray(caseItem.parties?.petitioner)
    ? caseItem.parties.petitioner.map((party) => getPersonName(party)).filter(Boolean)
    : [];
  const respondents = Array.isArray(caseItem.parties?.respondent)
    ? caseItem.parties.respondent.map((party) => getPersonName(party)).filter(Boolean)
    : [];

  if (petitioners.length === 0 || respondents.length === 0) {
    return "";
  }

  return `${petitioners.join(", ")} vs. ${respondents.join(", ")}`;
};

const personMatchesUser = (person, user) => {
  if (!person || !user) return false;

  const userId = user._id || user.id;
  const personId =
    person._id ||
    person.id ||
    person.user?._id ||
    person.user?.id ||
    person.user;

  return Boolean(userId && personId && personId === userId);
};

const canReviewCaseDocuments = (caseItem, user) => {
  if (!caseItem || !user) return false;
  if (user.role === "admin") return true;
  if (user.role !== "lawyer") return false;

  const userId = user._id || user.id;

  return (
    caseItem.lawyer?._id === userId ||
    caseItem.lawyer?.id === userId ||
    caseItem.lawyer === userId ||
    (Array.isArray(caseItem.lawyers) &&
      caseItem.lawyers.some((lawyer) => personMatchesUser(lawyer, user)))
  );
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const caseFromQuery = searchParams.get("case") || "";

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [cases, setCases] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [groupByCase, setGroupByCase] = useState(true);

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanPassed, setScanPassed] = useState(false);
  const [reviewingDocumentId, setReviewingDocumentId] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    caseId: caseFromQuery,
    category: "",
    tags: "",
    description: "",
  });

  const [selectedCaseForDocuments, setSelectedCaseForDocuments] = useState(null);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [casesResponse, documentsResponse] = await Promise.all([
        api.cases.getAll(),
        api.documents.getAll({
          limit: 200,
          sortBy: "createdAt",
          sortOrder: "desc",
          ...(caseFromQuery ? { caseId: caseFromQuery } : {}),
        }),
      ]);

      const allCases = extractArray(casesResponse);
      const allDocuments = extractArray(documentsResponse);

      const userId = user?._id || user?.id;
      const visibleCases = userId
        ? allCases.filter((caseItem) => {
            const creator = caseItem.createdBy || caseItem.creator;
            const lawyer = caseItem.lawyer;
            const client = caseItem.client;

            const lawyersArrayMatch = Array.isArray(caseItem.lawyers)
              ? caseItem.lawyers.some(
                  (entry) =>
                    entry?.user === userId ||
                    entry?.user?._id === userId ||
                    entry?.user?.id === userId
                )
              : false;

            const clientsArrayMatch = Array.isArray(caseItem.clients)
              ? caseItem.clients.some(
                  (entry) =>
                    entry?.user === userId ||
                    entry?.user?._id === userId ||
                    entry?.user?.id === userId
                )
              : false;

            const creatorId = creator?._id || creator?.id || creator;
            const lawyerId = lawyer?._id || lawyer?.id || lawyer;
            const clientId = client?._id || client?.id || client;

            return (
              creatorId === userId ||
              lawyerId === userId ||
              clientId === userId ||
              lawyersArrayMatch ||
              clientsArrayMatch
            );
          })
        : allCases;

      const caseMap = new Map(
        visibleCases.map((caseItem) => [caseItem._id || caseItem.id, caseItem])
      );

      const transformedDocuments = allDocuments.map((doc) => {
        const caseObject = doc.case && typeof doc.case === "object" ? doc.case : null;
        const caseId =
          caseObject?._id ||
          caseObject?.id ||
          doc.caseId ||
          (typeof doc.case === "string" ? doc.case : null) ||
          "unassigned";

        const mappedCase = caseMap.get(caseId);
        const resolvedCase = mappedCase || caseObject || {};
        const caseTitle =
          resolvedCase?.title || resolvedCase?.name || caseObject?.title || "Untitled case";
        const caseNumber =
          formatDisplayCaseNumber({
            caseNumber:
              resolvedCase?.caseNumber ||
              caseObject?.caseNumber ||
              mappedCase?.caseNumber ||
              "",
            caseTypeName:
              resolvedCase?.caseSubType ||
              resolvedCase?.eCourt?.caseTypeName ||
              resolvedCase?.type ||
              "",
            caseTypeCode:
              resolvedCase?.eCourt?.caseTypeCode || resolvedCase?.caseCode || "",
          }) ||
          caseTitle ||
          "Unassigned";
        const caseIdentifier = getCaseIdentifier(resolvedCase) || caseNumber;
        const caseVersus = buildVersusLabel(resolvedCase);

        const createdAt = doc.createdAt || doc.uploadDate || doc.updatedAt;

        return {
          id: doc._id || doc.id,
          name: doc.name || doc.originalName || "Untitled Document",
          type: (doc.type || doc.extension || "file").toString().toUpperCase(),
          caseId,
          caseNumber,
          caseTitle,
          caseIdentifier,
          caseVersus,
          canReview: canReviewCaseDocuments(resolvedCase, user),
          uploadDate: createdAt,
          size: formatFileSize(doc.size || doc.fileSize),
          uploadedBy:
            doc.uploadedBy?.name || doc.uploadedByName || doc.owner?.name || "Unknown",
          category: normalizeCategory(doc.category),
          status: normalizeStatus(doc.approvalStatus || doc.status),
          fileUrl: doc.downloadUrl || doc.fileUrl || doc.signedUrl || doc.url || null,
          raw: doc,
        };
      });

      setCases(visibleCases);
      setDocuments(transformedDocuments);
    } catch (error) {
      console.error("Error loading documents page data:", error);
      toast({
        title: "Failed to load documents",
        description: "Please refresh and try again.",
        variant: "destructive",
      });
      setCases([]);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, caseFromQuery]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.caseIdentifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.caseVersus.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
      const matchesStatus = filterStatus === "all" || doc.status === filterStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [documents, searchTerm, filterCategory, filterStatus]);

  const documentsByCase = useMemo(() => {
    return filteredDocuments.reduce((acc, doc) => {
      const key = doc.caseId || doc.caseNumber;

      if (!acc[key]) {
        acc[key] = {
          caseId: doc.caseId,
          caseNumber: doc.caseNumber,
          caseTitle: doc.caseTitle,
          caseIdentifier: doc.caseIdentifier,
          caseVersus: doc.caseVersus,
          documents: [],
        };
      }
      acc[key].documents.push(doc);
      return acc;
    }, {});
  }, [filteredDocuments]);

  const caseGroups = useMemo(
    () =>
      Object.values(documentsByCase).sort((a, b) =>
        (a.caseIdentifier || a.caseNumber || "").localeCompare(
          b.caseIdentifier || b.caseNumber || ""
        )
      ),
    [documentsByCase]
  );

  const stats = useMemo(
    () => ({
      totalDocuments: documents.length,
      pendingReview: documents.filter((doc) => doc.status === "pending").length,
      pleadings: documents.filter((doc) => doc.category === "pleading").length,
      evidence: documents.filter((doc) => doc.category === "evidence").length,
    }),
    [documents]
  );

  const caseModalDocuments = selectedCaseForDocuments
    ? documentsByCase[selectedCaseForDocuments]?.documents || []
    : [];

  const handleUpload = () => {
    if (cases.length === 0) {
      toast({
        title: "No case available",
        description: "Create a case first to upload documents.",
        variant: "destructive",
      });
      return;
    }

    setShowUploadDialog(true);
  };

  const openDocument = (doc, mode = "view") => {
    const url = getDocumentOpenUrl(doc);

    if (!url) {
      toast({
        title: "Document link unavailable",
        description: "This document does not have a valid file URL.",
        variant: "destructive",
      });
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");

    toast({
      title: mode === "download" ? "Download Started" : "View Document",
      description:
        mode === "download" ? `Downloading ${doc.name}` : `Opening ${doc.name}`,
    });
  };

  const handleView = (doc) => openDocument(doc, "view");
  const handleDownload = (doc) => openDocument(doc, "download");

  const handleDelete = async (doc) => {
    const confirmed = window.confirm(`Delete \"${doc.name}\"?`);
    if (!confirmed) return;

    try {
      await api.documents.delete(doc.id);
      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));

      toast({
        title: "Document deleted",
        description: `${doc.name} has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete this document.",
        variant: "destructive",
      });
    }
  };

  const handleReviewDocument = async (doc, decision) => {
    const reviewNotes =
      decision === "rejected"
        ? window.prompt("Add rejection reason (optional):", "") ?? ""
        : "";

    try {
      setReviewingDocumentId(doc.id);

      const result = await api.documents.review(doc.id, {
        decision,
        reviewNotes,
      });

      await fetchData();

      toast({
        title: decision === "approved" ? "Document approved" : "Document rejected",
        description:
          result?.message ||
          (decision === "approved"
            ? `${doc.name} was approved successfully.`
            : `${doc.name} was rejected successfully.`),
      });
    } catch (error) {
      console.error("Error reviewing document:", error);
      toast({
        title: "Review failed",
        description: error.message || "Failed to review document.",
        variant: "destructive",
      });
    } finally {
      setReviewingDocumentId(null);
    }
  };

  const handleUploadSubmit = async (event) => {
    event.preventDefault();

    if (!uploadForm.file || !uploadForm.caseId) {
      toast({
        title: "Missing required fields",
        description: "Please select a file and case.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      setScanning(false);

      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("caseId", uploadForm.caseId);
      formData.append("name", uploadForm.file.name);
      formData.append(
        "description",
        uploadForm.description || `File for case ${uploadForm.caseId}`
      );

      if (uploadForm.category) {
        formData.append("category", uploadForm.category);
      }

      if (uploadForm.tags) {
        formData.append("tags", uploadForm.tags);
      }

      const result = await api.documents.upload(formData, (event) => {
        if (event.loaded === event.total) {
          setScanning(true);
        }
      });

      setScanning(false);
      setScanPassed(true);

      await fetchData();

      await new Promise((resolve) => setTimeout(resolve, 1400));

      setScanPassed(false);
      setShowUploadDialog(false);
      setUploadForm({
        file: null,
        caseId: caseFromQuery,
        category: "",
        tags: "",
        description: "",
      });

      toast({
        title: "Document uploaded",
        description: result?.message || "Your document has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setScanning(false);
      setScanPassed(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pt-3 px-6 pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Documents</h1>
            <p className="text-muted-foreground">
              Manage case documents and files - organized by case
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={groupByCase ? "default" : "outline"}
              onClick={() => setGroupByCase(true)}
              size="sm"
            >
              Group by Case
            </Button>
            <Button
              variant={!groupByCase ? "default" : "outline"}
              onClick={() => setGroupByCase(false)}
              size="sm"
            >
              List View
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                  <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold">{stats.pendingReview}</p>
                </div>
                <FolderOpen className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pleadings</p>
                  <p className="text-2xl font-bold">{stats.pleadings}</p>
                </div>
                <FileText className="h-8 w-8 text-[#03234b]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Evidence</p>
                  <p className="text-2xl font-bold">{stats.evidence}</p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search documents..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  toast({
                    title: "Advanced Filters",
                    description: "Advanced filter options can be added here.",
                  })
                }
              >
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <Card key={item}>
                <CardContent className="p-6">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse mb-3"></div>
                  <div className="h-3 w-56 bg-muted rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groupByCase ? (
          <div className="space-y-6">
            {caseGroups.map((caseGroup) => (
              <Card key={caseGroup.caseId || caseGroup.caseNumber}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Case Name</p>
                        <CardTitle className="text-lg">{caseGroup.caseTitle}</CardTitle>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Filing Number</p>
                        <p className="text-sm font-semibold text-foreground">
                          {caseGroup.caseNumber}
                        </p>
                      </div>
                  
                      {caseGroup.caseVersus && (
                        <p className="text-sm text-muted-foreground">
                          {caseGroup.caseVersus}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {caseGroup.documents.length} document(s)
                      </p>
                    </div>
                    {caseGroup.caseId && caseGroup.caseId !== "unassigned" && (
                      <Link href={`/dashboard/cases/${caseGroup.caseId}?tab=documents`}>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Open Case
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {caseGroup.documents.map((document) => {
                    const isPending = document.status === "pending";
                    const isReviewing = reviewingDocumentId === document.id;

                    return (
                      <div
                        key={document.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg gap-3"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-foreground truncate">
                                {document.name}
                              </span>
                              <Badge className={getCategoryColor(document.category)} variant="secondary">
                                {toTitleCase(document.category)}
                              </Badge>
                              <Badge variant="outline" className={getStatusColor(document.status)}>
                                {document.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                              <span>Size: {document.size}</span>
                              <span>Uploaded: {formatDate(document.uploadDate)}</span>
                              <span>By: {document.uploadedBy}</span>
                            </div>
                            {document.raw?.reviewNotes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Review note: {document.raw.reviewNotes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {document.canReview && isPending && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isReviewing}
                                onClick={() => handleReviewDocument(document, "approved")}
                              >
                                {isReviewing ? "Saving..." : "Approve"}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isReviewing}
                                onClick={() => handleReviewDocument(document, "rejected")}
                              >
                                {isReviewing ? "Saving..." : "Reject"}
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleView(document)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(document)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(document)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>Share Document</DropdownMenuItem>
                              <DropdownMenuItem>Move to Case</DropdownMenuItem>
                              <DropdownMenuItem>Version History</DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(document)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDocuments.map((document) => {
              const isPending = document.status === "pending";
              const isReviewing = reviewingDocumentId === document.id;

              return (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-3 bg-muted rounded-lg">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>

                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-semibold text-foreground truncate">
                              {document.name}
                            </h3>
                            <Badge className={getCategoryColor(document.category)}>
                              {toTitleCase(document.category)}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(document.status)}>
                              {document.status.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Case Name:</span> {document.caseTitle}
                            </div>
                            <div>
                              <span className="font-medium">Filing Number:</span> {document.caseNumber}
                            </div>
                            <div>
                              <span className="font-medium">Size:</span> {document.size}
                            </div>
                            <div>
                              <span className="font-medium">Uploaded:</span>{" "}
                              {formatDate(document.uploadDate)}
                            </div>
                            <div>
                              <span className="font-medium">By:</span> {document.uploadedBy}
                            </div>
                          </div>
                          <div className="space-y-1 text-sm">
                            {document.caseIdentifier &&
                              document.caseIdentifier !== document.caseNumber && (
                                <p className="text-muted-foreground">
                                  Identifier: {document.caseIdentifier}
                                </p>
                              )}
                            {document.caseVersus && (
                              <p className="text-muted-foreground">{document.caseVersus}</p>
                            )}
                            {document.raw?.reviewNotes && (
                              <p className="text-xs text-muted-foreground">
                                Review note: {document.raw.reviewNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {document.canReview && isPending && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isReviewing}
                              onClick={() => handleReviewDocument(document, "approved")}
                            >
                              {isReviewing ? "Saving..." : "Approve"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isReviewing}
                              onClick={() => handleReviewDocument(document, "rejected")}
                            >
                              {isReviewing ? "Saving..." : "Reject"}
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(document)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(document)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(document)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>Share Document</DropdownMenuItem>
                            <DropdownMenuItem>Move to Case</DropdownMenuItem>
                            <DropdownMenuItem>Version History</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(document)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && filteredDocuments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">No documents found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterCategory("all");
                    setFilterStatus("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedCaseForDocuments && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background border rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Document Management - {selectedCaseForDocuments}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedCaseForDocuments(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-6 space-y-3">
                {caseModalDocuments.length > 0 ? (
                  caseModalDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{document.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {document.size} • {formatDate(document.uploadDate)} • {document.uploadedBy}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleView(document)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(document)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No documents found for this case.</div>
                )}
              </div>
            </div>
          </div>
        )}

        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a new document and attach it to a case.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <Input
                type="file"
                onChange={(event) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    file: event.target.files?.[0] || null,
                  }))
                }
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.zip"
                required
              />

              <Select
                value={uploadForm.caseId}
                onValueChange={(value) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    caseId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Case" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((caseItem) => (
                    <SelectItem key={caseItem._id || caseItem.id} value={caseItem._id || caseItem.id}>
                      {caseItem.caseNumber || caseItem.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={uploadForm.category || "none"}
                onValueChange={(value) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    category: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  <SelectItem value="pleading">Pleading</SelectItem>
                  <SelectItem value="evidence">Evidence</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Tags (comma separated)"
                value={uploadForm.tags}
                onChange={(event) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    tags: event.target.value,
                  }))
                }
              />

              <Input
                placeholder="Description"
                value={uploadForm.description}
                onChange={(event) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />

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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadDialog(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading || !uploadForm.file || !uploadForm.caseId}>
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
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
