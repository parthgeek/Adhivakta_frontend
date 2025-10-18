"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
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
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import api from "@/services/api"
import { useToast } from "@/components/ui/use-toast"

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
]

// Document statuses
const DOCUMENT_STATUSES = ["All Statuses", "Approved", "Pending", "Rejected"]

// Function to get icon based on file type
const getFileIcon = (type) => {
  switch (type) {
    case "pdf":
      return <FileTextIcon className="h-6 w-6 text-red-500" />
    case "docx":
      return <FileTextIcon className="h-6 w-6 text-blue-500" />
    case "jpg":
    case "png":
      return <ImageIcon className="h-6 w-6 text-green-500" />
    case "zip":
      return <FileArchiveIcon className="h-6 w-6 text-yellow-500" />
    default:
      return <FileIcon className="h-6 w-6 text-gray-500" />
  }
}

// Function to get status badge
const getStatusBadge = (status) => {
  switch (status.toLowerCase()) {
    case "approved":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
    default:
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>
  }
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLawyer, setIsLawyer] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [caseFilter, setCaseFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [statusFilter, setStatusFilter] = useState("All Statuses")
  const [dateFilter, setDateFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [viewDocument, setViewDocument] = useState(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [tagFilter, setTagFilter] = useState("")
  const [documents, setDocuments] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploadForm, setUploadForm] = useState({
    file: null,
    case: "",
    category: "",
    tags: "",
    description: "",
  })
  const [uploadProgress, setUploadProgress] = useState({})

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      // Prepare filter parameters
      const filters = {
        search: searchTerm,
        case: caseFilter !== "all" ? caseFilter : undefined,
        category: categoryFilter !== "All Categories" ? categoryFilter : undefined,
        status: statusFilter !== "All Statuses" ? statusFilter.toLowerCase() : undefined,
        date: dateFilter !== "all" ? dateFilter : undefined,
        tag: tagFilter || undefined,
        tab: activeTab !== "all" ? activeTab : undefined,
        sortBy,
        sortOrder,
      }

      // API calls to fetch documents and cases
      const [documentsResponse, casesResponse] = await Promise.all([api.documents.getAll(filters), api.cases.getAll()])

      setDocuments(documentsResponse.data || [])
      setCases(casesResponse.data || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
      setError("Failed to load documents. Please try again.")

      // Fallback to sample data
      setDocuments([
        {
          id: "1",
          name: "Complaint.pdf",
          type: "pdf",
          size: 1024000,
          category: "Pleadings",
          status: "Approved",
          case: { title: "Smith v. Johnson" },
          uploadedBy: { name: "John Lawyer" },
          createdAt: new Date().toISOString(),
          tags: ["important", "court-filing"],
        },
        {
          id: "2",
          name: "Evidence Photo.jpg",
          type: "jpg",
          size: 2048000,
          category: "Evidence",
          status: "Pending",
          case: { title: "Estate of Williams" },
          uploadedBy: { name: "John Lawyer" },
          createdAt: new Date().toISOString(),
          tags: ["photo", "evidence"],
        },
        {
          id: "3",
          name: "Contract Draft.docx",
          type: "docx",
          size: 512000,
          category: "Contracts",
          status: "Approved",
          case: { title: "Brown LLC v. Davis Corp" },
          uploadedBy: { name: "John Lawyer" },
          createdAt: new Date().toISOString(),
          tags: ["draft", "contract"],
        },
      ])

      setCases([
        { id: "1", title: "Smith v. Johnson" },
        { id: "2", title: "Estate of Williams" },
        { id: "3", title: "Brown LLC v. Davis Corp" },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check if user is lawyer or client
    if (user) {
      setIsLawyer(user.role === "lawyer")
    }
  }, [user])

  useEffect(() => {
    fetchDocuments()
  }, [
    isLawyer,
    searchTerm,
    caseFilter,
    categoryFilter,
    statusFilter,
    dateFilter,
    tagFilter,
    activeTab,
    sortBy,
    sortOrder,
  ])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm({
        ...uploadForm,
        file: e.target.files[0],
      })
    }
  }

  // Update the handleUploadSubmit function to properly handle file uploads
  const handleUploadSubmit = async (e) => {
    e.preventDefault()

    if (!uploadForm.file || !uploadForm.case) {
      toast({
        title: "Missing required fields",
        description: "Please select a file and case",
        variant: "destructive",
      })
      return
    }

    try {
      const formData = new FormData()
      formData.append("file", uploadForm.file)
      formData.append("caseId", uploadForm.case)
      formData.append("name", uploadForm.file.name)
      formData.append("description", uploadForm.description || `File for case ${uploadForm.case}`)

      if (uploadForm.category) {
        formData.append("category", uploadForm.category)
      }

      if (uploadForm.tags) {
        formData.append("tags", uploadForm.tags)
      }

      await api.documents.upload(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        setUploadProgress((prev) => ({ ...prev, [uploadForm.file.name]: percentCompleted }))
      })

      toast({
        title: "Document uploaded successfully",
        description: "Your document has been uploaded and attached to the case.",
      })

      // Refresh documents
      fetchDocuments()

      setShowUploadDialog(false)
      setUploadForm({
        file: null,
        case: "",
        category: "",
        tags: "",
        description: "",
      })
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDocument = async (id) => {
    try {
      await api.documents.delete(id)

      // Remove from state
      setDocuments(documents.filter((doc) => doc.id !== id))
      setShowDeleteDialog(false)
      setViewDocument(null)
    } catch (error) {
      console.error("Error deleting document:", error)
      alert("Failed to delete document. Please try again.")
    }
  }

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedDocuments.map((id) => api.documents.delete(id)))

      // Remove from state
      setDocuments(documents.filter((doc) => !selectedDocuments.includes(doc.id)))
      setSelectedDocuments([])
    } catch (error) {
      console.error("Error deleting documents:", error)
      alert("Failed to delete documents. Please try again.")
    }
  }

  const toggleSelectDocument = (id) => {
    if (selectedDocuments.includes(id)) {
      setSelectedDocuments(selectedDocuments.filter((docId) => docId !== id))
    } else {
      setSelectedDocuments([...selectedDocuments, id])
    }
  }

  const selectAllDocuments = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(documents.map((doc) => doc.id))
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Documents</h1>
        {isLawyer && (
          <Button onClick={() => setShowUploadDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        )}
      </div>

      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <Select value={caseFilter} onValueChange={setCaseFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by case" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cases</SelectItem>
                {cases.map((caseItem) => (
                  <SelectItem key={caseItem.id} value={caseItem.id}>
                    {caseItem.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {showAdvancedFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="category-filter">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                  <Select value={dateFilter} onValueChange={setDateFilter}>
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

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="shared">Shared with Me</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
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
          </TabsContent>
          <TabsContent value="recent" className="mt-4">
            <DocumentsTable
              documents={documents.filter((doc) => {
                const docDate = new Date(doc.createdAt)
                const sevenDaysAgo = new Date()
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
                return docDate >= sevenDaysAgo
              })}
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
          </TabsContent>
          <TabsContent value="shared" className="mt-4">
            <DocumentsTable
              documents={documents.filter((doc) => doc.sharedWith?.includes(user?.id))}
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
          </TabsContent>
          <TabsContent value="favorites" className="mt-4">
            <DocumentsTable
              documents={documents.filter((doc) => doc.favoritedBy?.includes(user?.id))}
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a document to associate with a case</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Document File</Label>
                <Input id="file" type="file" onChange={handleFileChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="case">Case</Label>
                <Select
                  value={uploadForm.case}
                  onValueChange={(value) => setUploadForm({ ...uploadForm, case: value })}
                  required
                >
                  <SelectTrigger id="case">
                    <SelectValue placeholder="Select case" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((caseItem) => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={uploadForm.category}
                  onValueChange={(value) => setUploadForm({ ...uploadForm, category: value })}
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
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Upload</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      {viewDocument && (
        <Dialog open={!!viewDocument} onOpenChange={() => setViewDocument(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{viewDocument.name}</DialogTitle>
              <DialogDescription>
                Uploaded on {formatDate(viewDocument.createdAt)} by {viewDocument.uploadedBy?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-center h-64 bg-muted rounded-md">
                {getFileIcon(viewDocument.type)}
                <span className="ml-2">{viewDocument.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Case</Label>
                  <p>{viewDocument.case?.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p>{viewDocument.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>{getStatusBadge(viewDocument.status)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Size</Label>
                  <p>{formatFileSize(viewDocument.size)}</p>
                </div>
              </div>
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDocument(null)}>
                Close
              </Button>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              {isLawyer && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDeleteDialog(true)
                    setViewDocument(null)
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
              {selectedDocuments.length > 0 ? `${selectedDocuments.length} documents` : "this document"}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedDocuments.length > 0) {
                  handleBulkDelete()
                } else if (viewDocument) {
                  handleDeleteDocument(viewDocument.id)
                }
                setShowDeleteDialog(false)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
        <p className="text-muted-foreground">Upload documents or adjust your filters to see results.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-2 text-left font-medium">
                <Checkbox
                  checked={selectedDocuments.length === documents.length && documents.length > 0}
                  onCheckedChange={selectAllDocuments}
                />
              </th>
              <th className="h-10 px-2 text-left font-medium">Name</th>
              <th className="h-10 px-2 text-left font-medium">Case</th>
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
                    <span className="font-medium cursor-pointer hover:underline" onClick={() => setViewDocument(doc)}>
                      {doc.name}
                    </span>
                  </div>
                </td>
                <td className="p-2">{doc.case?.title}</td>
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
                      <DropdownMenuItem onClick={() => setViewDocument(doc)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem>
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
                        <DropdownMenuItem className="text-red-600">
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
  )
}
