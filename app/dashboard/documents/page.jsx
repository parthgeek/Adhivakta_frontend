"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import {
  FileTextIcon,
  FileIcon,
  ImageIcon,
  FileArchiveIcon,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Download,
  Trash2,
  Share2,
  Star,
  Grid,
  List,
  Folder,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import api from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Document categories
const DOCUMENT_CATEGORIES = [
  "All Categories",
  "Pleadings",
  "Evidence",
  "Contracts",
  "Agreements",
  "Court Orders",
  "Statements",
  "Correspondence",
  "Legal Research",
  "Billing",
];

// Document statuses
const DOCUMENT_STATUSES = ["All Statuses", "Approved", "Pending", "Rejected"];

// Function to get icon based on file type
const getFileIcon = (type) => {
  switch (type) {
    case "pdf":
      return <FileTextIcon className="h-6 w-6 text-red-500" />;
    case "docx":
      return <FileTextIcon className="h-6 w-6 text-blue-500" />;
    case "jpg":
    case "png":
      return <ImageIcon className="h-6 w-6 text-green-500" />;
    case "zip":
      return <FileArchiveIcon className="h-6 w-6 text-yellow-500" />;
    default:
      return <FileIcon className="h-6 w-6 text-gray-500" />;
  }
};

// Function to get status badge
const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Approved
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Pending
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          {status || "Unknown"}
        </Badge>
      );
  }
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLawyer, setIsLawyer] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateFilter, setDateFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [viewDocument, setViewDocument] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const [documents, setDocuments] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [uploadForm, setUploadForm] = useState({
    file: null,
    case: "",
    category: "",
    tags: "",
    description: "",
  });
  const [uploadProgress, setUploadProgress] = useState({});
  const [casesLoading, setCasesLoading] = useState(true);

const fetchCases = async () => {
  setCasesLoading(true);
  try {
    const response = await api.cases.getAll();
    console.log("Cases API Response:", response);

    let casesData = [];
    
    if (Array.isArray(response)) {
      casesData = response;
    } else if (response && Array.isArray(response.data)) {
      casesData = response.data;
    } else if (response && response.data && Array.isArray(response.data.data)) {
      casesData = response.data.data;
    } else if (response && response.data) {
      casesData = [response.data].flat();
    }

    // Get user ID from JWT token or user object
    const userId = user?._id;
    
    // If no userId, we can't filter
    if (!userId) {
      console.log("No user ID, cannot filter cases");
      setCases(casesData); // Show all for now
      setCasesLoading(false);
      return;
    }

    console.log("Filtering cases for user ID:", userId);
    
    // Simple filter based on dashboard query structure
    const userCases = casesData.filter(caseItem => {
      // Check all possible ID fields
      const caseCreator = caseItem.creator;
      const caseLawyer = caseItem.lawyer;
      const caseClient = caseItem.client;
      
      // For debugging
      if (casesData.indexOf(caseItem) < 3) { // Log first 3 cases
        console.log(`Case "${caseItem.title}":`, {
          creator: caseCreator,
          lawyer: caseLawyer,
          client: caseClient,
          userId
        });
      }
      
      // Check if any field matches userId
      return caseCreator === userId || 
             caseLawyer === userId || 
             caseClient === userId;
    });

    console.log("Filtered cases:", userCases.length);
    
    setCases(userCases);
    
    // Auto-select first case if none selected
    if (!selectedCase && userCases.length > 0) {
      setSelectedCase(userCases[0]);
    }
    
  } catch (error) {
    console.error("Error fetching cases:", error);
    setCases([]);
  } finally {
    setCasesLoading(false);
  }
};

  // Fetch documents for the selected case
  const fetchDocuments = async () => {
    if (!selectedCase) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Prepare filter parameters
      const filters = {
        search: searchTerm,
        case: selectedCase._id || selectedCase.id,
        category: categoryFilter !== "All Categories" ? categoryFilter : undefined,
        status: statusFilter !== "All Statuses" ? statusFilter.toLowerCase() : undefined,
        date: dateFilter !== "all" ? dateFilter : undefined,
        tag: tagFilter || undefined,
        sortBy,
        sortOrder,
      };

      console.log("Fetching documents with filters:", filters);
      
      // API call to fetch documents for the selected case
      const response = await api.documents.getAll(filters);
      console.log("Documents API response:", response);
      
      const docs = response.data?.data || response.data || response || [];
      
      // Transform backend fields to frontend expected fields
      const transformedDocs = docs.map((doc) => ({
        id: doc._id || doc.id,
        name: doc.name || doc.fileName || "Unnamed Document",
        type: doc.fileType?.split("/")[1] || doc.type || "file",
        size: doc.fileSize || doc.size || 0,
        category: doc.category || "Uncategorized",
        status: doc.status || "pending",
        case: doc.case || selectedCase,
        uploadedBy: doc.uploadedBy || user,
        createdAt: doc.createdAt || new Date().toISOString(),
        tags: doc.tags || [],
        fileUrl: doc.filePath || doc.url,
        description: doc.description || "",
      }));

      console.log("Transformed documents:", transformedDocs);
      setDocuments(transformedDocs);
      setError(null);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setError("Failed to load documents. Please try again.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setIsLawyer(user.role === "lawyer");
    }
  }, [user]);

  useEffect(() => {
    fetchCases();
  }, [user]);

  useEffect(() => {
    if (selectedCase) {
      fetchDocuments();
    } else {
      setDocuments([]);
    }
  }, [
    selectedCase,
    searchTerm,
    categoryFilter,
    statusFilter,
    dateFilter,
    tagFilter,
    sortBy,
    sortOrder,
  ]);

  const handleCaseSelect = (caseItem) => {
    setSelectedCase(caseItem);
    setSelectedDocuments([]); // Clear selections when switching cases
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm({
        ...uploadForm,
        file: e.target.files[0],
      });
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!uploadForm.file || !uploadForm.case) {
      toast({
        title: "Missing required fields",
        description: "Please select a file and case",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("caseId", uploadForm.case);
      formData.append("name", uploadForm.file.name);
      formData.append(
        "description",
        uploadForm.description || `File for case ${uploadForm.case}`
      );

      if (uploadForm.category) {
        formData.append("category", uploadForm.category);
      }

      if (uploadForm.tags) {
        formData.append("tags", uploadForm.tags);
      }

      await api.documents.upload(formData, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress((prev) => ({
          ...prev,
          [uploadForm.file.name]: percentCompleted,
        }));
      });

      toast({
        title: "Document uploaded successfully",
        description:
          "Your document has been uploaded and attached to the case.",
      });

      // Refresh documents
      fetchDocuments();

      setShowUploadDialog(false);
      setUploadForm({
        file: null,
        case: "",
        category: "",
        tags: "",
        description: "",
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (id) => {
    try {
      await api.documents.delete(id);

      // Remove from state
      setDocuments(documents.filter((doc) => doc.id !== id));
      setShowDeleteDialog(false);
      setViewDocument(null);
      
      toast({
        title: "Document deleted",
        description: "The document has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedDocuments.map((id) => api.documents.delete(id))
      );

      // Remove from state
      setDocuments(
        documents.filter((doc) => !selectedDocuments.includes(doc.id))
      );
      setSelectedDocuments([]);
      
      toast({
        title: "Documents deleted",
        description: `${selectedDocuments.length} documents have been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting documents:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete documents. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleSelectDocument = (id) => {
    if (selectedDocuments.includes(id)) {
      setSelectedDocuments(selectedDocuments.filter((docId) => docId !== id));
    } else {
      setSelectedDocuments([...selectedDocuments, id]);
    }
  };

  const selectAllDocuments = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documents.map((doc) => doc.id));
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCaseDocumentCount = (caseId) => {
    // This would ideally come from the API, but for now we'll filter from current documents
    return documents.filter(doc => doc.case?._id === caseId || doc.case?.id === caseId).length;
  };

  // Show loading spinner only when cases are loading
  if (casesLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-3xl font-bold">Documents</h1>
          {selectedCase && (
            <>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-medium text-muted-foreground">
                {selectedCase.title}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex bg-muted rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="px-3"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {isLawyer && selectedCase && (
            <Button onClick={() => setShowUploadDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          )}
        </div>
      </div>

      {/* Case Selection Sidebar and Document Canvas */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Cases Sidebar */}
        <div className="lg:w-1/4">
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-4">Your Cases</h2>
              <div className="space-y-2">
                {cases.length > 0 ? (
                  cases.map((caseItem) => (
                    <div
                      key={caseItem._id || caseItem.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedCase?._id === caseItem._id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleCaseSelect(caseItem)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {selectedCase?._id === caseItem._id ? (
                            <FolderOpen className="h-4 w-4 text-primary" />
                          ) : (
                            <Folder className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium truncate">
                            {caseItem.title}
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {getCaseDocumentCount(caseItem._id || caseItem.id)}
                        </Badge>
                      </div>
                      {caseItem.client && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          Client: {caseItem.client.name}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No cases found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Canvas */}
        <div className="lg:w-3/4">
          {selectedCase ? (
            <>
              {/* Search and Filters */}
              <div className="mb-6">
                <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search documents in this case..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                  </div>
                </div>

                {showAdvancedFilters && (
                  <Card className="mt-4">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <Label htmlFor="category-filter">Category</Label>
                          <Select
                            value={categoryFilter}
                            onValueChange={setCategoryFilter}
                          >
                            <SelectTrigger id="category-filter">
                              <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                              {DOCUMENT_CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="status-filter">Status</Label>
                          <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                          >
                            <SelectTrigger id="status-filter">
                              <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                              {DOCUMENT_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="date-filter">Date</Label>
                          <Select
                            value={dateFilter}
                            onValueChange={setDateFilter}
                          >
                            <SelectTrigger id="date-filter">
                              <SelectValue placeholder="Filter by date" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Time</SelectItem>
                              <SelectItem value="today">Today</SelectItem>
                              <SelectItem value="week">This Week</SelectItem>
                              <SelectItem value="month">This Month</SelectItem>
                              <SelectItem value="year">This Year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="tag-filter">Tag</Label>
                          <Input
                            id="tag-filter"
                            placeholder="Filter by tag"
                            value={tagFilter}
                            onChange={(e) => setTagFilter(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="sort-by">Sort By</Label>
                          <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger id="sort-by">
                              <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="name">Name</SelectItem>
                              <SelectItem value="size">Size</SelectItem>
                              <SelectItem value="category">Category</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="sort-order">Order</Label>
                          <Select value={sortOrder} onValueChange={setSortOrder}>
                            <SelectTrigger id="sort-order">
                              <SelectValue placeholder="Sort order" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asc">Ascending</SelectItem>
                              <SelectItem value="desc">Descending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Bulk Actions Bar */}
              {selectedDocuments.length > 0 && (
                <div className="mb-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">
                      {selectedDocuments.length} document(s) selected
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDocuments([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}

              {/* Document Display */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <FileTextIcon className="h-12 w-12 mx-auto text-destructive mb-4" />
                    <h3 className="text-lg font-medium mb-2">Error Loading Documents</h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button onClick={fetchDocuments}>Try Again</Button>
                  </CardContent>
                </Card>
              ) : documents.length > 0 ? (
                viewMode === "grid" ? (
                  <DocumentsGrid
                    documents={documents}
                    selectedDocuments={selectedDocuments}
                    toggleSelectDocument={toggleSelectDocument}
                    setViewDocument={setViewDocument}
                    formatFileSize={formatFileSize}
                    formatDate={formatDate}
                    getFileIcon={getFileIcon}
                    getStatusBadge={getStatusBadge}
                    isLawyer={isLawyer}
                  />
                ) : (
                  <DocumentsTable
                    documents={documents}
                    selectedDocuments={selectedDocuments}
                    toggleSelectDocument={toggleSelectDocument}
                    selectAllDocuments={selectAllDocuments}
                    setViewDocument={setViewDocument}
                    formatFileSize={formatFileSize}
                    formatDate={formatDate}
                    getFileIcon={getFileIcon}
                    getStatusBadge={getStatusBadge}
                    isLawyer={isLawyer}
                  />
                )
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Documents Found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || categoryFilter !== "All Categories" || statusFilter !== "All Statuses"
                        ? "No documents match your search criteria. Try adjusting your filters."
                        : "This case doesn't have any documents yet."}
                    </p>
                    {isLawyer && (
                      <Button onClick={() => setShowUploadDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Upload First Document
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">Select a Case</h3>
                <p className="text-muted-foreground">
                  {cases.length === 0 
                    ? "You don't have any cases yet. Create a case to start uploading documents." 
                    : "Choose a case from the sidebar to view its documents"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document to attach to{" "}
              {selectedCase ? `"${selectedCase.title}"` : "the selected case"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Document File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  required
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx,.ppt,.pptx"
                />
                {uploadForm.file && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {uploadForm.file.name}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="case">Case *</Label>
                <Select
                  value={uploadForm.case || (selectedCase?._id || selectedCase?.id)}
                  onValueChange={(value) =>
                    setUploadForm({ ...uploadForm, case: value })
                  }
                  required
                >
                  <SelectTrigger id="case">
                    <SelectValue placeholder="Select case" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.length > 0 ? (
                      cases.map((caseItem) => (
                        <SelectItem
                          key={caseItem._id || caseItem.id}
                          value={caseItem._id || caseItem.id}
                        >
                          {caseItem.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-cases" disabled>
                        No cases available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {cases.length === 0 && (
                  <p className="text-sm text-red-500">
                    No cases found. Please create a case first.
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={uploadForm.category}
                  onValueChange={(value) =>
                    setUploadForm({ ...uploadForm, category: value })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.slice(1).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  placeholder="important, court-filing, etc."
                  value={uploadForm.tags}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, tags: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Document description"
                  value={uploadForm.description}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!uploadForm.file || !uploadForm.case}
              >
                Upload
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      {viewDocument && (
        <Dialog
          open={!!viewDocument}
          onOpenChange={() => setViewDocument(null)}
        >
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{viewDocument.name}</DialogTitle>
              <DialogDescription>
                Uploaded on {formatDate(viewDocument.createdAt)} by{" "}
                {viewDocument.uploadedBy?.name || "Unknown"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-center h-64 bg-muted rounded-md">
                <div className="text-center">
                  {getFileIcon(viewDocument.type)}
                  <p className="mt-2 font-medium">{viewDocument.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(viewDocument.size)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Case</Label>
                  <p>{viewDocument.case?.title || selectedCase?.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p>{viewDocument.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(viewDocument.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Size</Label>
                  <p>{formatFileSize(viewDocument.size)}</p>
                </div>
              </div>
              {viewDocument.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{viewDocument.description}</p>
                </div>
              )}
              {viewDocument.tags && viewDocument.tags.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {viewDocument.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setViewDocument(null)}>
                Close
              </Button>
              <Button onClick={() => window.open(viewDocument.fileUrl, '_blank')}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              {isLawyer && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDeleteDialog(true);
                    setViewDocument(null);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              {selectedDocuments.length > 0
                ? `${selectedDocuments.length} selected documents`
                : "this document"}
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedDocuments.length > 0) {
                  handleBulkDelete();
                } else if (viewDocument) {
                  handleDeleteDocument(viewDocument.id);
                }
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// DocumentsGrid Component
function DocumentsGrid({
  documents,
  selectedDocuments,
  toggleSelectDocument,
  setViewDocument,
  formatFileSize,
  formatDate,
  getFileIcon,
  getStatusBadge,
  isLawyer,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((doc) => (
        <Card
          key={doc.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedDocuments.includes(doc.id)
              ? "border-primary ring-2 ring-primary/20"
              : ""
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedDocuments.includes(doc.id)}
                  onCheckedChange={() => toggleSelectDocument(doc.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div onClick={(e) => e.stopPropagation()}>
                  {getStatusBadge(doc.status)}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setViewDocument(doc)}>
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(doc.fileUrl, '_blank')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Star className="mr-2 h-4 w-4" />
                    Add to Favorites
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  {isLawyer && (
                    <DropdownMenuItem className="text-red-600" onClick={() => {
                      // Handle delete action
                      if (confirm(`Are you sure you want to delete ${doc.name}?`)) {
                        // This should trigger the delete dialog
                      }
                    }}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div
              className="text-center mb-4"
              onClick={() => setViewDocument(doc)}
            >
              <div className="flex justify-center mb-3">
                {getFileIcon(doc.type)}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="font-semibold text-sm truncate" title={doc.name}>
                      {doc.name}
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{doc.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <p className="text-xs text-muted-foreground mt-1">
                {doc.category}
              </p>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatFileSize(doc.size)}</span>
                <span>{formatDate(doc.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// DocumentsTable Component
function DocumentsTable({
  documents,
  selectedDocuments,
  toggleSelectDocument,
  selectAllDocuments,
  setViewDocument,
  formatFileSize,
  formatDate,
  getFileIcon,
  getStatusBadge,
  isLawyer,
}) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-10">
        <FileTextIcon className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No documents found</h3>
        <p className="text-muted-foreground">
          Upload documents or adjust your filters to see results.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-2 text-left font-medium">
                <Checkbox
                  checked={
                    selectedDocuments.length === documents.length &&
                    documents.length > 0
                  }
                  onCheckedChange={selectAllDocuments}
                />
              </th>
              <th className="h-10 px-2 text-left font-medium">Name</th>
              <th className="h-10 px-2 text-left font-medium">Category</th>
              <th className="h-10 px-2 text-left font-medium">Status</th>
              <th className="h-10 px-2 text-left font-medium">Size</th>
              <th className="h-10 px-2 text-left font-medium">Date</th>
              <th className="h-10 px-2 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b hover:bg-muted/50">
                <td className="p-2">
                  <Checkbox
                    checked={selectedDocuments.includes(doc.id)}
                    onCheckedChange={() => toggleSelectDocument(doc.id)}
                  />
                </td>
                <td className="p-2">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(doc.type)}
                    <span
                      className="font-medium cursor-pointer hover:underline"
                      onClick={() => setViewDocument(doc)}
                    >
                      {doc.name}
                    </span>
                  </div>
                </td>
                <td className="p-2">{doc.category}</td>
                <td className="p-2">{getStatusBadge(doc.status)}</td>
                <td className="p-2">{formatFileSize(doc.size)}</td>
                <td className="p-2">{formatDate(doc.createdAt)}</td>
                <td className="p-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewDocument(doc)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(doc.fileUrl, '_blank')}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Star className="mr-2 h-4 w-4" />
                        Add to Favorites
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      {isLawyer && (
                        <DropdownMenuItem className="text-red-600" onClick={() => {
                          // Handle delete action
                          if (confirm(`Are you sure you want to delete ${doc.name}?`)) {
                            // This should trigger the delete dialog
                          }
                        }}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}