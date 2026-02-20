"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  User,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

const getPriorityColor = (priority) => {
  switch ((priority || "medium").toLowerCase()) {
    case "high":
      return "bg-red-500 text-white border-transparent";
    case "urgent":
      return "bg-red-600 text-white border-transparent";
    case "medium":
      return "bg-orange-400 text-white border-transparent";
    case "low":
      return "bg-green-500 text-white border-transparent";
    default:
      return "bg-gray-200 text-gray-700";
  }
};

const getStatusColor = (status) => {
  switch ((status || "active").toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-700 border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "closed":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export default function CasesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLawyer, setIsLawyer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [caseFilter, setCaseFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [priorityFilter, setPriorityFilter] = useState("All Priority");
  const [dateFilter, setDateFilter] = useState("all");
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setIsLawyer(user.role === "lawyer");
    }
  }, [user]);

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      try {
        const filters = {
          search: searchTerm,
          status:
            statusFilter !== "All Statuses"
              ? statusFilter.toLowerCase()
              : undefined,
          type:
            categoryFilter !== "All Categories" ? categoryFilter : undefined,
          date: dateFilter !== "all" ? dateFilter : undefined,
        };

        const response = await api.cases.getAll(filters);

        if (Array.isArray(response)) {
          setCases(response);
        } else if (response && Array.isArray(response.data)) {
          setCases(response.data);
        } else if (response && response.data) {
          const caseArray = [response.data].flat();
          setCases(caseArray);
        } else {
          setCases(isLawyer ? lawyerCases : clientCases);
        }
      } catch (error) {
        console.error("Error fetching cases:", error);
        setError("Failed to load cases. Please try again.");
        setCases(isLawyer ? lawyerCases : clientCases);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [isLawyer, searchTerm, caseFilter, categoryFilter, statusFilter, dateFilter]);

  // Helper function to map API case fields to UI fields
  const mapCaseFields = (caseItem) => {
    return {
      id: caseItem._id || caseItem.id,
      title: caseItem.title,
      number: caseItem.caseNumber || caseItem.number,
      type: caseItem.caseType || caseItem.type,
      client: caseItem.client?.name || caseItem.client,
      court: caseItem.court || caseItem.courtType || "Not specified",
      courtHall: caseItem.courtHall || "N/A",
      district: caseItem.district || "Not specified",
      status: caseItem.status
        ? caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)
        : "Active",
      nextHearing: caseItem.nextHearingDate,
      priority: caseItem.priority || "medium",
    };
  };

  // Remove duplicates and map cases
  const uniqueCases = Array.from(
    new Map(
      cases.map((caseItem) => [caseItem._id || caseItem.id, caseItem])
    ).values()
  );

  const filteredCases = uniqueCases.map(mapCaseFields).filter((caseItem) => {
    const matchesSearch =
      (caseItem.title && caseItem.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (caseItem.number && caseItem.number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (caseItem.court && caseItem.court.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "All Statuses" ||
      (caseItem.status &&
        caseItem.status.toLowerCase() === statusFilter.toLowerCase());

    const matchesType =
      categoryFilter === "All Categories" ||
      (caseItem.type &&
        caseItem.type.toLowerCase() === categoryFilter.toLowerCase());

    const matchesPriority =
      priorityFilter === "All Priority" ||
      (caseItem.priority &&
        caseItem.priority.toLowerCase() === priorityFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  // Get unique values for filters
  const caseTypes = [
    "All Categories",
    ...new Set(uniqueCases.map((c) => c.caseType || c.type).filter(Boolean)),
  ];

  // Skeleton Component for Cases
  const CasesPageSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
      </div>
      {/* Filter skeleton */}
      <Card>
        <CardHeader>
          <div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Cases skeleton */}
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                  <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="h-32 bg-gray-50 rounded-lg animate-pulse"></div>
                  <div className="h-32 bg-gray-50 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <CasesPageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cases</h1>
          <p className="text-muted-foreground">Manage all legal cases and proceedings</p>
        </div>
        <Link href="/dashboard/cases/new">
          <Button className="w-full sm:w-auto bg-[#1a2332] hover:bg-[#253345]">
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Cases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search cases..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Statuses">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Priority">All Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                {caseTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "All Categories"
                      ? "All Types"
                      : type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases Grid */}
      <div className="grid gap-6">
        {filteredCases.length > 0 ? (
          uniqueCases.map((rawCase) => {
            const caseItem = mapCaseFields(rawCase);
            const petitioners = rawCase.parties?.petitioner || [];
            const respondents = rawCase.parties?.respondent || [];
            const lawyers = rawCase.lawyers || [];
            const advocates = rawCase.advocates || [];
            const nextHearing = rawCase.nextHearingDate || rawCase.hearingDate;
            const courtName = rawCase.court || "Not specified";
            const caseType = rawCase.caseType || rawCase.type || "";
            const priority = rawCase.priority || "medium";

            let clientName = rawCase.client?.name || rawCase.client;
            if (!clientName && Array.isArray(rawCase.clients) && rawCase.clients.length > 0) {
              clientName = rawCase.clients[0]?.name;
            }

            return (
              <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-foreground">
                            {caseItem.number || "N/A"}
                          </h3>
                          <Badge className={getPriorityColor(priority)}>
                            {(priority || "MEDIUM").toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(caseItem.status)}>
                            {(caseItem.status || "Active").toUpperCase()}
                          </Badge>
                          {(priority === "high" || priority === "urgent") && (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <p className="text-base text-muted-foreground">{caseItem.title}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {caseType && (
                            <span>
                              <strong>Type:</strong>{" "}
                              <span className="capitalize">{caseType.replace("_", " ")}</span>
                            </span>
                          )}
                          <span>
                            <strong>Court:</strong> {courtName}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/cases/${caseItem.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/cases/${caseItem.id}/edit`)}>
                            Edit Case
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Parties */}
                    {(petitioners.length > 0 || respondents.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Plaintiff/Petitioner</p>
                          {petitioners.length > 0 ? (
                            petitioners.map((p, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{p.name}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Not specified</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Defendant/Respondent</p>
                          {respondents.length > 0 ? (
                            respondents.map((r, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{r.name}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Not specified</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Legal Representation - Side by Side Comparison */}
                    {lawyers.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-base font-semibold text-foreground border-b pb-2">Legal Representation Comparison</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {(() => {
                            if (lawyers.length === 1) {
                              return (
                                <>
                                  {/* Plaintiff/Petitioner Legal Representation */}
                                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                                    <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                      <span className="w-3 h-3 rounded-full bg-primary"></span>
                                      Legal Representation (Plaintiff/Petitioner)
                                    </h5>
                                    <div className="space-y-3 text-sm">
                                      {lawyers[0].company && (
                                        <div>
                                          <span className="text-muted-foreground">Office Name: <span className="text-destructive">*</span></span>
                                          <div className="font-medium">{lawyers[0].company}</div>
                                        </div>
                                      )}
                                      <div>
                                        <span className="text-muted-foreground">Advocate on Record: <span className="text-destructive">*</span></span>
                                        <div className="font-medium">Adv. {lawyers[0].name}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Handled by: <span className="text-destructive">*</span></span>
                                        <div className="font-medium">Adv. {lawyers[0].name}</div>
                                      </div>
                                      {lawyers[0].level && (
                                        <div>
                                          <span className="text-muted-foreground">Senior Advocate:</span>
                                          <div className="font-medium">
                                            {lawyers[0].level === "Senior" ? `Sr. Adv. ${lawyers[0].name}` : "N/A"}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Defendant/Respondent Legal Representation (not assigned) */}
                                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg border-l-4 border-destructive opacity-40">
                                    <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                      <span className="w-3 h-3 rounded-full bg-destructive"></span>
                                      Defendant Legal Representation
                                    </h5>
                                    <p className="text-xs text-muted-foreground italic">Not assigned</p>
                                  </div>
                                </>
                              );
                            }

                            return lawyers.slice(0, 2).map((lawyer, i) => (
                              <div
                                key={i}
                                className={`space-y-3 p-4 bg-muted/30 rounded-lg border-l-4 ${i === 0 ? "border-primary" : "border-destructive"}`}
                              >
                                <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                  <span className={`w-3 h-3 rounded-full ${i === 0 ? "bg-primary" : "bg-destructive"}`}></span>
                                  {i === 0
                                    ? "Legal Representation (Plaintiff/Petitioner)"
                                    : "Defendant Legal Representation"}
                                </h5>
                                <div className="space-y-3 text-sm">
                                  {lawyer.company && (
                                    <div>
                                      <span className="text-muted-foreground">Office Name: <span className="text-destructive">*</span></span>
                                      <div className="font-medium">{lawyer.company}</div>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-muted-foreground">Advocate on Record: <span className="text-destructive">*</span></span>
                                    <div className="font-medium">Adv. {lawyer.name}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Handled by: <span className="text-destructive">*</span></span>
                                    <div className="font-medium">Adv. {lawyer.name}</div>
                                  </div>
                                  {lawyer.level && (
                                    <div>
                                      <span className="text-muted-foreground">Senior Advocate:</span>
                                      <div className="font-medium">
                                        {lawyer.level === "Senior" ? `Sr. Adv. ${lawyer.name}` : "N/A"}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Details and Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
                      <div className="flex flex-wrap gap-4 text-sm">
                        {nextHearing && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Next Hearing:</span>
                            <span className="font-medium">
                              {new Date(nextHearing).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/cases/${caseItem.id}`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                        <Link href={`/dashboard/documents?case=${caseItem.id}`}>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Documents
                          </Button>
                        </Link>
                        <Link href={`/dashboard/cases/${caseItem.id}`}>
                          <Button size="sm" className="bg-[#1a2332] hover:bg-[#253345]">Update Status</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">No cases found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("All Statuses");
                    setPriorityFilter("All Priority");
                    setCategoryFilter("All Categories");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Sample case data for fallback
const lawyerCases = [
  {
    id: "case-1",
    title: "Smith v. Johnson",
    number: "CV-2023-1234",
    type: "Civil Litigation",
    client: "John Smith",
    status: "Active",
    court: "Bangalore Urban District Court",
    courtHall: "4",
    courtComplex: "City Civil Court Complex",
    district: "Bangalore Urban",
    nextHearing: "2023-12-15",
  },
  {
    id: "case-2",
    title: "Estate of Williams",
    number: "PR-2023-5678",
    type: "Probate",
    client: "Sarah Williams",
    status: "Active",
    court: "Karnataka High Court",
    courtHall: "7",
    courtComplex: "High Court Complex",
    district: "Bangalore Urban",
    nextHearing: null,
  },
  {
    id: "case-3",
    title: "Brown LLC v. Davis Corp",
    number: "CV-2023-9012",
    type: "Corporate",
    client: "Brown LLC",
    status: "Active",
    court: "Commercial Court",
    courtHall: "2",
    courtComplex: "Commercial Court Complex",
    district: "Bangalore Urban",
    nextHearing: "2023-12-20",
  },
  {
    id: "case-4",
    title: "Miller Divorce",
    number: "DR-2023-3456",
    type: "Family",
    client: "James Miller",
    status: "Active",
    court: "Family Court",
    courtHall: "3",
    courtComplex: "Family Court Complex",
    district: "Bangalore Urban",
    nextHearing: "2023-12-18",
  },
  {
    id: "case-5",
    title: "Thompson Bankruptcy",
    number: "BK-2023-7890",
    type: "Bankruptcy",
    client: "Robert Thompson",
    status: "Closed",
    court: "Debt Recovery Tribunal",
    courtHall: "1",
    courtComplex: "DRT Complex",
    district: "Bangalore Rural",
    nextHearing: null,
  },
];

const clientCases = [
  {
    id: "case-1",
    title: "Property Dispute",
    number: "CV-2023-4567",
    type: "Civil",
    status: "Active",
    court: "Bangalore Urban District Court",
    courtHall: "4",
    courtComplex: "City Civil Court Complex",
    district: "Bangalore Urban",
    nextHearing: "2023-06-15",
  },
  {
    id: "case-2",
    title: "Insurance Claim",
    number: "CC-2023-7890",
    type: "Consumer",
    status: "Active",
    court: "Consumer Court",
    courtHall: "2",
    courtComplex: "Consumer Court Complex",
    district: "Bangalore Urban",
    nextHearing: "2023-06-22",
  },
  {
    id: "case-3",
    title: "Employment Matter",
    number: "LC-2023-1234",
    type: "Labor",
    status: "Active",
    court: "Labor Court",
    courtHall: "5",
    courtComplex: "Labor Court Complex",
    district: "Bangalore Urban",
    nextHearing: "2023-07-05",
  },
];
