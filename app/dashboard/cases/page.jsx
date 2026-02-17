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
import { PlusIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/services/api";

export default function CasesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLawyer, setIsLawyer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [caseFilter, setCaseFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateFilter, setDateFilter] = useState("all");
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is lawyer or client
    if (user) {
      setIsLawyer(user.role === "lawyer");
    }
  }, [user]);

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      try {
        // Prepare filter parameters
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

        // API call to fetch cases
        const response = await api.cases.getAll(filters);
        console.log("API response:", response);
        console.log("Response type:", typeof response);
        console.log(
          "Response length:",
          Array.isArray(response) ? response.length : "Not an array"
        );

        // Check if response is an array directly
        if (Array.isArray(response)) {
          setCases(response);
          console.log("Set cases from array:", response.length);
        }
        // If response is an object with a data property that's an array
        else if (response && Array.isArray(response.data)) {
          setCases(response.data);
          console.log("Set cases from response.data:", response.data.length);
        }
        // If we have a data property but it's not an array
        else if (response && response.data) {
          const caseArray = [response.data].flat();
          setCases(caseArray);
          console.log("Set cases from flattened data:", caseArray.length);
        }
        // Fallback to sample data if no valid response
        else {
          console.warn("Invalid response format, using fallback data");
          setCases(isLawyer ? lawyerCases : clientCases);
        }
      } catch (error) {
        console.error("Error fetching cases:", error);
        setError("Failed to load cases. Please try again.");
        setCases([]);
        // Fallback to sample data
        setCases(isLawyer ? lawyerCases : clientCases);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [
    isLawyer,
    searchTerm,
    caseFilter,
    categoryFilter,
    statusFilter,
    dateFilter,
  ]);

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
      caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (caseItem.number &&
        caseItem.number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (caseItem.court &&
        caseItem.court.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "All Statuses" ||
      (caseItem.status &&
        caseItem.status.toLowerCase() === statusFilter.toLowerCase());

    const matchesType =
      categoryFilter === "All Categories" ||
      (caseItem.type &&
        caseItem.type.toLowerCase() === categoryFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesType;
  });

  // Get unique values for filters
  const caseTypes = [
    "All Categories",
    ...new Set(uniqueCases.map((c) => c.caseType || c.type).filter(Boolean)),
  ];

  // Skeleton Component for Cases Table
  const CasesTableSkeleton = () => (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
            <div className="h-10 w-full md:w-[200px] bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-full md:w-[150px] bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-full md:w-[150px] bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-4 border-b pb-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4 py-3 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const CasesPageSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-9 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <CasesTableSkeleton />
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cases</h1>
        <Link href="/dashboard/cases/new">
          <Button className="bg-[#1a2332] hover:bg-[#253345]">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Case
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle>{isLawyer ? "All Cases" : "My Cases"}</CardTitle>
              <CardDescription>
                {isLawyer
                  ? "Manage and view all your legal cases"
                  : "View your active legal cases"}
                {filteredCases.length > 0 && ` (${filteredCases.length} cases)`}
              </CardDescription>
            </div>
            <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search cases..."
                  className="pl-8 w-full md:w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Statuses">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Case Type" />
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
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
                const priority = rawCase.priority || "normal";

                // Fix client name
                let clientName = rawCase.client?.name || rawCase.client;
                if (!clientName && Array.isArray(rawCase.clients) && rawCase.clients.length > 0) {
                  clientName = rawCase.clients[0]?.name;
                }

                return (
                  <div
                    key={caseItem.id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 bg-white"
                  >
                    {/* Case Header */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-lg">
                          {caseItem.number || "N/A"}
                        </p>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider ${priority === "urgent" ? "bg-red-600 text-white" :
                            priority === "high" ? "bg-red-500 text-white" :
                              priority === "low" ? "bg-green-500 text-white" :
                                "bg-orange-400 text-white"
                          }`}>
                          {priority}
                        </span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider ${caseItem.status === "Active"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}>
                          {caseItem.status}
                        </span>
                        {(priority === "high" || priority === "urgent") && (
                          <span className="text-red-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                      </button>
                    </div>

                    {/* Case Title */}
                    <p className="text-sm text-gray-600 mb-1">{caseItem.title}</p>

                    {/* Type & Court */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-5">
                      {caseType && (
                        <span>
                          <span className="font-semibold text-gray-700">Type:</span>{" "}
                          <span className="capitalize">{caseType.replace("_", " ")}</span>
                        </span>
                      )}
                      <span>
                        <span className="font-semibold text-gray-700">Court:</span> {courtName}
                      </span>
                    </div>

                    {/* Parties Row */}
                    {(petitioners.length > 0 || respondents.length > 0) && (
                      <div className="grid grid-cols-2 gap-4 mb-5">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Plaintiff/Petitioner</p>
                          {petitioners.length > 0 ? (
                            petitioners.map((p, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-sm text-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                <span>{p.name}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 italic">Not specified</p>
                          )}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Defendant/Respondent</p>
                          {respondents.length > 0 ? (
                            respondents.map((r, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-sm text-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                <span>{r.name}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 italic">Not specified</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Legal Representation Comparison */}
                    {lawyers.length > 0 && (
                      <div className="mb-5">
                        <p className="text-sm font-semibold text-gray-800 mb-3">Legal Representation Comparison</p>
                        <div className="grid grid-cols-2 gap-6">
                          {(() => {
                            // Split lawyers into petitioner vs respondent based on index or isPrimary
                            const petitionerLawyers = lawyers.filter((_, i) => i % 2 === 0).slice(0, 1);
                            const respondentLawyers = lawyers.filter((_, i) => i % 2 !== 0).slice(0, 1);
                            // If only one lawyer, show them on petitioner side
                            if (lawyers.length === 1) {
                              return (
                                <>
                                  <div className="border-l-3 border-gray-800 pl-4" style={{ borderLeftWidth: '3px' }}>
                                    <p className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full bg-gray-800"></span>
                                      Legal Representation (Plaintiff/Petitioner)
                                    </p>
                                    <div className="space-y-2">
                                      {lawyers[0].company && (
                                        <div>
                                          <p className="text-xs text-gray-500">Office Name: <span className="text-red-500">*</span></p>
                                          <p className="text-sm text-gray-800 font-medium">{lawyers[0].company}</p>
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-xs text-gray-500">Advocate on Record: <span className="text-red-500">*</span></p>
                                        <p className="text-sm text-gray-800 font-medium">Adv. {lawyers[0].name}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Handled by: <span className="text-red-500">*</span></p>
                                        <p className="text-sm text-gray-800 font-medium">Adv. {lawyers[0].name}</p>
                                      </div>
                                      {lawyers[0].level && (
                                        <div>
                                          <p className="text-xs text-gray-500">Senior Advocate:</p>
                                          <p className="text-sm text-gray-800 font-medium">{lawyers[0].level === "Senior" ? `Sr. Adv. ${lawyers[0].name}` : "N/A"}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="border-l-3 border-red-400 pl-4 opacity-40" style={{ borderLeftWidth: '3px' }}>
                                    <p className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                                      Defendant Legal Representation
                                    </p>
                                    <p className="text-xs text-gray-400 italic">Not assigned</p>
                                  </div>
                                </>
                              );
                            }
                            return lawyers.slice(0, 2).map((lawyer, i) => (
                              <div key={i} className={`pl-4 ${i === 0 ? 'border-gray-800' : 'border-red-400'}`} style={{ borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: i === 0 ? '#1f2937' : '#f87171' }}>
                                <p className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-2">
                                  <span className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-gray-800' : 'bg-red-400'}`}></span>
                                  {i === 0 ? 'Legal Representation (Plaintiff/Petitioner)' : 'Defendant Legal Representation'}
                                </p>
                                <div className="space-y-2">
                                  {lawyer.company && (
                                    <div>
                                      <p className="text-xs text-gray-500">Office Name: <span className="text-red-500">*</span></p>
                                      <p className="text-sm text-gray-800 font-medium">{lawyer.company}</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-xs text-gray-500">Advocate on Record: <span className="text-red-500">*</span></p>
                                    <p className="text-sm text-gray-800 font-medium">Adv. {lawyer.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Handled by: <span className="text-red-500">*</span></p>
                                    <p className="text-sm text-gray-800 font-medium">Adv. {lawyer.name}</p>
                                  </div>
                                  {lawyer.level && (
                                    <div>
                                      <p className="text-xs text-gray-500">Senior Advocate:</p>
                                      <p className="text-sm text-gray-800 font-medium">{lawyer.level === "Senior" ? `Sr. Adv. ${lawyer.name}` : "N/A"}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Case Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      {nextHearing && (
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                          <span className="text-gray-400">Next Hearing:</span>
                          <span className="font-semibold text-gray-700">
                            {new Date(nextHearing).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                        </p>
                      )}
                      <div className="flex items-center gap-2 ml-auto">
                        <Link
                          href={`/dashboard/cases/${caseItem.id}`}
                          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
                        >
                          View Details
                        </Link>
                        <Link
                          href={`/dashboard/documents?case=${caseItem.id}`}
                          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                          Documents
                        </Link>
                        <Link
                          href={`/dashboard/cases/${caseItem.id}`}
                          className="px-4 py-2 text-sm font-medium text-white bg-[#1a2332] rounded-lg hover:bg-[#253345] transition-colors inline-flex items-center gap-1.5"
                        >
                          Update Status
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 mx-auto mb-3 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                <p className="font-medium text-gray-500">No cases found</p>
                <p className="text-sm mt-1">
                  Try adjusting your filters or{" "}
                  <Link href="/dashboard/cases/new" className="text-blue-600 hover:underline">
                    add a new case
                  </Link>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
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
