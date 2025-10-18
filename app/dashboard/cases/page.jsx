"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon, SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/services/api"

export default function CasesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLawyer, setIsLawyer] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [caseFilter, setCaseFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [statusFilter, setStatusFilter] = useState("All Statuses")
  const [dateFilter, setDateFilter] = useState("all")
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check if user is lawyer or client
    if (user) {
      setIsLawyer(user.role === "lawyer")
    }
  }, [user])

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true)
      try {
        // Prepare filter parameters
        const filters = {
          search: searchTerm,
          status: statusFilter !== "All Statuses" ? statusFilter.toLowerCase() : undefined,
          type: categoryFilter !== "All Categories" ? categoryFilter : undefined,
          date: dateFilter !== "all" ? dateFilter : undefined,
        }

        // API call to fetch cases
        const response = await api.cases.getAll(filters)
        console.log("API response:", response)
        console.log("Response type:", typeof response)
        console.log("Response length:", Array.isArray(response) ? response.length : "Not an array")

        // Check if response is an array directly
        if (Array.isArray(response)) {
          setCases(response)
          console.log("Set cases from array:", response.length)
        }
        // If response is an object with a data property that's an array
        else if (response && Array.isArray(response.data)) {
          setCases(response.data)
          console.log("Set cases from response.data:", response.data.length)
        }
        // If we have a data property but it's not an array
        else if (response && response.data) {
          const caseArray = [response.data].flat()
          setCases(caseArray)
          console.log("Set cases from flattened data:", caseArray.length)
        }
        // Fallback to sample data if no valid response
        else {
          console.warn("Invalid response format, using fallback data")
          setCases(isLawyer ? lawyerCases : clientCases)
        }
      } catch (error) {
        console.error("Error fetching cases:", error)
        setError("Failed to load cases. Please try again.")
        setCases([])
        // Fallback to sample data
        setCases(isLawyer ? lawyerCases : clientCases)
      } finally {
        setLoading(false)
      }
    }

    fetchCases()
  }, [isLawyer, searchTerm, caseFilter, categoryFilter, statusFilter, dateFilter])

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
      status: caseItem.status ? caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1) : "Active",
      nextHearing: caseItem.nextHearingDate,
    }
  }

  // Remove duplicates and map cases
  const uniqueCases = Array.from(new Map(cases.map((caseItem) => [caseItem._id || caseItem.id, caseItem])).values())
  const filteredCases = uniqueCases.map(mapCaseFields).filter((caseItem) => {
    const matchesSearch =
      caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (caseItem.number && caseItem.number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (caseItem.court && caseItem.court.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus =
      statusFilter === "All Statuses" ||
      (caseItem.status && caseItem.status.toLowerCase() === statusFilter.toLowerCase())

    const matchesType =
      categoryFilter === "All Categories" ||
      (caseItem.type && caseItem.type.toLowerCase() === categoryFilter.toLowerCase())

    return matchesSearch && matchesStatus && matchesType
  })

  // Get unique values for filters
  const caseTypes = ["All Categories", ...new Set(uniqueCases.map((c) => c.caseType || c.type).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cases</h1>
        <Link href="/dashboard/cases/new">
          <Button>
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
                {isLawyer ? "Manage and view all your legal cases" : "View your active legal cases"} 
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
                      {type === "All Categories" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-background z-10">
                <tr className="border-b">
                  <th className="py-3 text-left font-medium">Case Title</th>
                  <th className="py-3 text-left font-medium">Case Number</th>
                  <th className="py-3 text-left font-medium">Type</th>
                  {isLawyer && <th className="py-3 text-left font-medium">Client</th>}
                  <th className="py-3 text-left font-medium">Court</th>
                  <th className="py-3 text-left font-medium">Status</th>
                  <th className="py-3 text-left font-medium">Next Hearing</th>
                  <th className="py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.length > 0 ? (
                  filteredCases.map((caseItem) => {
                    // Fix client column: show client name if available, fallback to clients[0]?.name, else 'No Client'
                    let clientName = caseItem.client;
                    if (!clientName && Array.isArray(caseItem.clients) && caseItem.clients.length > 0) {
                      clientName = caseItem.clients[0]?.name;
                    }
                    if (!clientName) clientName = 'No Client';
                    return (
                    <tr key={caseItem.id} className="border-b hover:bg-muted/50">
                      <td className="py-3">
                        <Link
                          href={`/dashboard/cases/${caseItem.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {caseItem.title}
                        </Link>
                      </td>
                      <td className="py-3">{caseItem.number}</td>
                      <td className="py-3">{caseItem.type}</td>
                        {isLawyer && <td className="py-3">{clientName}</td>}
                      <td className="py-3">{caseItem.court}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            caseItem.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {caseItem.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {caseItem.nextHearing ? new Date(caseItem.nextHearing).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/cases/${caseItem.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isLawyer ? 8 : 7} className="py-6 text-center text-muted-foreground">
                      No cases found. Try adjusting your filters or{' '}
                      <Link href="/dashboard/cases/new" className="text-primary hover:underline">
                        add a new case
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
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
]

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
]