"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  FileText, 
  Clock,
  MessageSquare,
  Star,
  Award,
  Calendar,
  Building2,
  Search,
  Users,
  Scale,
  CheckCircle,
  FileCheck,
  FileX,
  Hash
} from "lucide-react";

// Skeleton Components
const LawyersListSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
      <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
    </CardHeader>
    <CardContent className="p-0">
      <div className="divide-y max-h-[600px] overflow-y-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-300 animate-pulse flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-5 w-40 bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-5 w-16 bg-gray-300 rounded animate-pulse"></div>
                </div>
                <div className="h-4 w-32 bg-gray-300 rounded animate-pulse mb-2"></div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="h-4 w-16 bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-5 w-12 bg-gray-300 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const LawyerDetailSkeleton = () => (
  <div className="space-y-4">
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-6 mb-6">
          <div className="w-24 h-24 rounded-full bg-gray-300 animate-pulse"></div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-48 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-6 w-20 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-32 bg-gray-300 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-300 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-300 rounded animate-pulse"></div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-28 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-6 w-16 bg-gray-300 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-10 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-100 rounded-lg">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-8 w-12 bg-gray-300 rounded animate-pulse mx-auto mb-1"></div>
              <div className="h-4 w-20 bg-gray-300 rounded animate-pulse mx-auto"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <div className="h-6 w-48 bg-gray-300 rounded animate-pulse"></div>
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-5 w-5 bg-gray-300 rounded animate-pulse mt-0.5"></div>
            <div>
              <div className="h-4 w-32 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-48 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

const CasesSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="h-6 w-32 bg-gray-300 rounded animate-pulse mb-1"></div>
      <div className="h-4 w-64 bg-gray-300 rounded animate-pulse"></div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="h-5 w-56 bg-gray-300 rounded animate-pulse mb-1"></div>
                <div className="h-4 w-32 bg-gray-300 rounded animate-pulse"></div>
              </div>
              <div className="h-6 w-16 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-32 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-4 w-40 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const ContactSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="h-6 w-40 bg-gray-300 rounded animate-pulse mb-1"></div>
      <div className="h-4 w-56 bg-gray-300 rounded animate-pulse"></div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="p-2 bg-gray-200 rounded-lg">
              <div className="h-5 w-5 bg-gray-300 rounded"></div>
            </div>
            <div className="flex-1">
              <div className="h-4 w-20 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-48 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t">
        <div className="h-5 w-28 bg-gray-300 rounded animate-pulse mb-3"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-10 bg-gray-300 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start gap-2">
          <div className="h-5 w-5 bg-gray-300 rounded mt-0.5"></div>
          <div>
            <div className="h-4 w-24 bg-gray-300 rounded animate-pulse mb-1"></div>
            <div className="space-y-1">
              <div className="h-3 w-48 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-3 w-52 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const MyLawyersPageSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="relative">
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <LawyersListSkeleton />
        </div>
        <div className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <LawyerDetailSkeleton />
        </div>
      </div>
    </div>
  </div>
);

// Helper to normalize case status
const normalizeStatus = (status) => {
  if (!status) return 'active';
  const s = status.toLowerCase().trim();
  
  const closedKeywords = ['closed', 'disposed', 'dismissed', 'settled', 'withdrawn', 'resolved', 'decided'];
  for (const kw of closedKeywords) {
    if (s.includes(kw)) return 'closed';
  }
  return 'active';
};

export default function MyLawyersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [lawyers, setLawyers] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLawyer, setSelectedLawyer] = useState(null);

  useEffect(() => {
    fetchLawyers();
  }, []);

  const fetchLawyers = async () => {
    try {
      setLoading(true);
      
      // Fetch all cases for the client from database
      const casesResponse = await api.cases.getAll();
      const clientCases = Array.isArray(casesResponse) ? casesResponse : [];
      setCases(clientCases);

      // Extract unique lawyers from all cases
      const lawyersMap = new Map();
      
      clientCases.forEach(caseItem => {
        const caseStatus = normalizeStatus(caseItem.status);
        
        // Check for lawyers array
        if (caseItem.lawyers && Array.isArray(caseItem.lawyers)) {
          caseItem.lawyers.forEach(lawyer => {
            const lawyerId = lawyer._id || lawyer.id;
            if (!lawyersMap.has(lawyerId)) {
              lawyersMap.set(lawyerId, {
                ...lawyer,
                cases: [{
                  ...caseItem,
                  normalizedStatus: caseStatus
                }],
                totalCases: 1,
                isPrimary: lawyer.isPrimary || false,
                activeCount: caseStatus === 'active' ? 1 : 0,
                closedCount: caseStatus === 'closed' ? 1 : 0
              });
            } else {
              const existingLawyer = lawyersMap.get(lawyerId);
              existingLawyer.cases.push({
                ...caseItem,
                normalizedStatus: caseStatus
              });
              existingLawyer.totalCases += 1;
              if (caseStatus === 'active') existingLawyer.activeCount += 1;
              if (caseStatus === 'closed') existingLawyer.closedCount += 1;
            }
          });
        }
        
        // Check for single lawyer field
        if (caseItem.lawyer) {
          const lawyer = caseItem.lawyer;
          const lawyerId = lawyer._id || lawyer.id;
          if (!lawyersMap.has(lawyerId)) {
            lawyersMap.set(lawyerId, {
              ...lawyer,
              cases: [{
                ...caseItem,
                normalizedStatus: caseStatus
              }],
              totalCases: 1,
              isPrimary: true,
              activeCount: caseStatus === 'active' ? 1 : 0,
              closedCount: caseStatus === 'closed' ? 1 : 0
            });
          } else {
            const existingLawyer = lawyersMap.get(lawyerId);
            existingLawyer.cases.push({
              ...caseItem,
              normalizedStatus: caseStatus
            });
            existingLawyer.totalCases += 1;
            if (caseStatus === 'active') existingLawyer.activeCount += 1;
            if (caseStatus === 'closed') existingLawyer.closedCount += 1;
          }
        }

        // Check for advocates array
        if (caseItem.advocates && Array.isArray(caseItem.advocates)) {
          caseItem.advocates.forEach(advocate => {
            const advocateId = advocate._id || advocate.id || advocate.name;
            if (!lawyersMap.has(advocateId)) {
              lawyersMap.set(advocateId, {
                ...advocate,
                cases: [{
                  ...caseItem,
                  normalizedStatus: caseStatus
                }],
                totalCases: 1,
                isPrimary: advocate.isLead || false,
                activeCount: caseStatus === 'active' ? 1 : 0,
                closedCount: caseStatus === 'closed' ? 1 : 0
              });
            } else {
              const existingAdvocate = lawyersMap.get(advocateId);
              existingAdvocate.cases.push({
                ...caseItem,
                normalizedStatus: caseStatus
              });
              existingAdvocate.totalCases += 1;
              if (caseStatus === 'active') existingAdvocate.activeCount += 1;
              if (caseStatus === 'closed') existingAdvocate.closedCount += 1;
            }
          });
        }
      });

      const uniqueLawyers = Array.from(lawyersMap.values());
      setLawyers(uniqueLawyers);
      
      // Set first lawyer as selected by default
      if (uniqueLawyers.length > 0) {
        setSelectedLawyer(uniqueLawyers[0]);
      }
    } catch (error) {
      console.error("Error fetching lawyers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to redirect to cases page with filters
  const viewCasesByStatus = (lawyerId, status) => {
    const params = new URLSearchParams({
      lawyerId,
      status,
      view: 'client-lawyer-cases'
    });
    router.push(`/dashboard/cases?${params.toString()}`);
  };

  const filteredLawyers = lawyers.filter(lawyer =>
    lawyer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lawyer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lawyer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show skeleton while loading
  if (loading) {
    return <MyLawyersPageSkeleton />;
  }

  if (lawyers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">My Advocates</h1>
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Lawyers Yet</h3>
                <p className="text-gray-600 mb-6">
                  You don't have any lawyers assigned to your cases yet. Once a lawyer is assigned to your case, they will appear here.
                </p>
                <Button onClick={() => router.push("/dashboard/cases")}>
                  View My Cases
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Advocates</h1>
            <p className="text-gray-600 mt-1">
              Legal professionals representing you ({lawyers.length} {lawyers.length === 1 ? 'advocate' : 'advocates'})
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search advocates by name, firm, or email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lawyers List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Legal Team</CardTitle>
                <CardDescription>
                  {filteredLawyers.length} {filteredLawyers.length === 1 ? 'advocate' : 'advocates'} found
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {filteredLawyers.map((lawyer) => (
                    <div
                      key={lawyer._id || lawyer.id || lawyer.name}
                      onClick={() => setSelectedLawyer(lawyer)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedLawyer?.name === lawyer.name ? 'bg-[#03234b]/10 border-l-4 border-[#03234b]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#03234b] to-[#03234b] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {lawyer.name?.charAt(0) || 'L'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {lawyer.name}
                            </h3>
                            {lawyer.isPrimary && (
                              <Badge className="bg-[#03234b] text-white text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>
                          {lawyer.company && (
                            <p className="text-sm text-gray-600 truncate">{lawyer.company}</p>
                          )}
                          {/* Case Statistics */}
                          <div className="flex items-center gap-3 mt-2">
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <FileCheck className="h-3 w-3 text-green-600" />
                              <span className="font-medium text-green-700">{lawyer.activeCount || 0}</span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <FileX className="h-3 w-3 text-gray-500" />
                              <span className="font-medium text-gray-700">{lawyer.closedCount || 0}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {lawyer.totalCases} total
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lawyer Details */}
          <div className="lg:col-span-2">
            {selectedLawyer ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="cases">Cases</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {/* Lawyer Profile Card */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-6 mb-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#03234b] to-[#03234b] flex items-center justify-center text-white font-bold text-4xl">
                          {selectedLawyer.name?.charAt(0) || 'L'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-gray-900">
                              {selectedLawyer.name}
                            </h2>
                            {selectedLawyer.isPrimary && (
                              <Badge className="bg-[#03234b] text-white">
                                <Award className="h-3 w-3 mr-1" />
                                Primary Lawyer
                              </Badge>
                            )}
                          </div>
                          {selectedLawyer.level && (
                            <p className="text-gray-600 mb-2">
                              {selectedLawyer.level} Counsel
                            </p>
                          )}
                          {selectedLawyer.company && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Building2 className="h-4 w-4" />
                              <span>{selectedLawyer.company}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => router.push("/dashboard/messages")}
                          className="flex items-center gap-2"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Message
                        </Button>
                      </div>

                      {/* Case Statistics Buttons */}
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Case Statistics</h3>
                          <Badge variant="secondary">
                            {selectedLawyer.totalCases || 0} Total Cases
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Button 
                            variant="default"
                            className="flex items-center justify-between w-full"
                            onClick={() => viewCasesByStatus(selectedLawyer._id || selectedLawyer.id, 'active')}
                            disabled={!selectedLawyer.activeCount}
                          >
                            <div className="flex items-center gap-2">
                              <FileCheck className="h-4 w-4" />
                              <span>Active Cases</span>
                            </div>
                            <Badge variant="secondary">
                              {selectedLawyer.activeCount || 0}
                            </Badge>
                          </Button>
                          
                          <Button 
                            variant="outline"
                            className="flex items-center justify-between w-full"
                            onClick={() => viewCasesByStatus(selectedLawyer._id || selectedLawyer.id, 'closed')}
                            disabled={!selectedLawyer.closedCount}
                          >
                            <div className="flex items-center gap-2">
                              <FileX className="h-4 w-4" />
                              <span>Closed/Disposed</span>
                            </div>
                            <Badge variant="secondary">
                              {selectedLawyer.closedCount || 0}
                            </Badge>
                          </Button>
                        </div>
                      </div>

                      {/* Stats Grid - REMOVED CHAIR POSITION */}
                      <div className="grid grid-cols-3 gap-4 p-4 bg-[#03234b]/10 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#03234b]">
                            {selectedLawyer.totalCases}
                          </div>
                          <div className="text-sm text-[#03234b]">Total Cases</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-900">
                            {selectedLawyer.activeCount || 0}
                          </div>
                          <div className="text-sm text-green-700">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {selectedLawyer.closedCount || 0}
                          </div>
                          <div className="text-sm text-gray-700">Closed</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Professional Info - REMOVED CHAIR POSITION SECTION */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Professional Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedLawyer.level && (
                        <div className="flex items-start gap-3">
                          <Scale className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-medium text-gray-900">Experience Level</div>
                            <div className="text-gray-600">{selectedLawyer.level} Counsel</div>
                          </div>
                        </div>
                      )}
                      
                      {selectedLawyer.barNumber && (
                        <div className="flex items-start gap-3">
                          <Award className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-medium text-gray-900">Bar Registration</div>
                            <div className="text-gray-600">{selectedLawyer.barNumber}</div>
                          </div>
                        </div>
                      )}
                      
                      {selectedLawyer.gst && (
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-medium text-gray-900">GST Number</div>
                            <div className="text-gray-600 font-mono">{selectedLawyer.gst}</div>
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Currently representing you</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="cases" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cases Handled</CardTitle>
                      <CardDescription>
                        All cases where {selectedLawyer.name} is representing you
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedLawyer.cases && selectedLawyer.cases.length > 0 ? (
                        <div className="space-y-3">
                          {selectedLawyer.cases.map((caseItem) => (
                            <div
                              key={caseItem._id || caseItem.id}
                              onClick={() => router.push(`/dashboard/cases/${caseItem._id || caseItem.id}`)}
                              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-gray-900">{caseItem.title}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Hash className="h-3 w-3 text-gray-400" />
                                    <p className="text-sm text-gray-600">{caseItem.caseNumber}</p>
                                  </div>
                                </div>
                                <Badge className={
                                  caseItem.normalizedStatus === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }>
                                  {caseItem.normalizedStatus === 'active' ? 'Active' : 'Closed'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {caseItem.nextHearingDate 
                                      ? new Date(caseItem.nextHearingDate).toLocaleDateString()
                                      : 'No hearing scheduled'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{caseItem.court || 'Court not specified'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No cases found</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                      <CardDescription>
                        Get in touch with {selectedLawyer.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Contact Details */}
                      <div className="space-y-4">
                        {selectedLawyer.email && (
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-[#03234b]/10 rounded-lg">
                              <Mail className="h-5 w-5 text-[#03234b]" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 mb-1">Email</div>
                              <a 
                                href={`mailto:${selectedLawyer.email}`}
                                className="text-[#03234b] hover:underline"
                              >
                                {selectedLawyer.email}
                              </a>
                            </div>
                          </div>
                        )}

                        {selectedLawyer.contact && (
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-50 rounded-lg">
                              <Phone className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 mb-1">Phone</div>
                              <a 
                                href={`tel:${selectedLawyer.contact}`}
                                className="text-green-600 hover:underline"
                              >
                                {selectedLawyer.contact}
                              </a>
                            </div>
                          </div>
                        )}

                        {selectedLawyer.company && (
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-50 rounded-lg">
                              <Building2 className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 mb-1">Law Firm</div>
                              <div className="text-gray-600">{selectedLawyer.company}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="pt-6 border-t">
                        <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => router.push("/dashboard/messages")}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Message
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => router.push("/dashboard/calendar")}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Meeting
                          </Button>
                        </div>
                      </div>

                      {/* Office Hours */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-medium text-gray-900 mb-1">Office Hours</div>
                            <div className="text-sm text-gray-600">
                              Monday - Friday: 9:00 AM - 6:00 PM<br />
                              Saturday: 10:00 AM - 2:00 PM
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12">
                  <div className="text-center text-gray-500">
                    <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Select a lawyer to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}