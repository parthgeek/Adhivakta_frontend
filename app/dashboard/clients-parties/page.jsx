"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/auth-context"  // ADD THIS
import api from "@/services/api"  // ADD THIS
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Plus, 
  Users, 
  User, 
  Briefcase, 
  Upload, 
  Hash, 
  Mail, 
  Phone, 
  FileText, 
  MapPin,
  FileCheck,
  FileX,
  Calendar,
  Building,
  Loader2,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

// Helper function to get initials from name
const getInitials = (name) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Normalize status to 'active' or 'closed'
const normalizeStatus = (rawStatus) => {
  if (!rawStatus) return 'unknown';
  const s = String(rawStatus).toLowerCase().trim();

  const closedKeywords = ['closed', 'disposed', 'dismissed', 'settled', 'withdrawn', 'resolved', 'decided', 'completed'];
  for (const kw of closedKeywords) {
    if (s.includes(kw)) return 'closed';
  }

  const activeKeywords = ['active', 'open', 'pending', 'listed', 'adjourned', 'in-progress', 'ongoing', 'hearing'];
  for (const kw of activeKeywords) {
    if (s.includes(kw)) return 'active';
  }

  return 'active';
};

// Process cases data to extract people
const processCasesData = (cases) => {
  const peopleMap = {
    clients: new Map(),
    lawyers: new Map()
  };

  cases.forEach((caseItem) => {
    if (!caseItem) return;
    
    const rawStatus = caseItem?.status || caseItem?.caseStatus || 'active';
    const status = normalizeStatus(rawStatus);

    const caseInfo = {
      caseId: caseItem._id,
      caseNumber: caseItem.caseNumber || 'N/A',
      role: 'Client',
      status,
      caseTitle: caseItem.title || caseItem.caseTitle || 'Untitled Case',
      courtName: caseItem.court || caseItem.courtName || 'Unknown Court',
      filingDate: caseItem.filingDate || caseItem.createdAt,
      caseType: caseItem.caseType || 'Unknown'
    };

    // Process primary client
    if (caseItem.client && typeof caseItem.client === 'object') {
      const clientId = caseItem.client._id;
      if (clientId) {
        const existing = peopleMap.clients.get(clientId) || {
          ...caseItem.client,
          _id: clientId,
          cases: [],
          type: 'client'
        };
        
        peopleMap.clients.set(clientId, {
          ...existing,
          cases: [...(existing.cases || []), caseInfo]
        });
      }
    }

    // Process additional clients
    if (Array.isArray(caseItem.clients)) {
      caseItem.clients.forEach(client => {
        if (client?.user && typeof client.user === 'object') {
          const clientId = client.user._id;
          const existing = peopleMap.clients.get(clientId) || {
            ...client.user,
            _id: clientId,
            cases: [],
            type: 'client'
          };
          
          peopleMap.clients.set(clientId, {
            ...existing,
            cases: [...(existing.cases || []), {
              ...caseInfo,
              role: client.isPrimary ? 'Primary Client' : 'Client'
            }]
          });
        }
      });
    }

    // Process primary lawyer
    if (caseItem.lawyer && typeof caseItem.lawyer === 'object') {
      const lawyerId = caseItem.lawyer._id;
      if (lawyerId) {
        const existing = peopleMap.lawyers.get(lawyerId) || {
          ...caseItem.lawyer,
          _id: lawyerId,
          cases: [],
          type: 'lawyer'
        };
        
        peopleMap.lawyers.set(lawyerId, {
          ...existing,
          cases: [...(existing.cases || []), {
            ...caseInfo,
            role: 'Primary Lawyer'
          }]
        });
      }
    }

    // Process additional lawyers
    if (Array.isArray(caseItem.lawyers)) {
      caseItem.lawyers.forEach(lawyer => {
        if (lawyer?.user && typeof lawyer.user === 'object') {
          const lawyerId = lawyer.user._id;
          const existing = peopleMap.lawyers.get(lawyerId) || {
            ...lawyer.user,
            _id: lawyerId,
            cases: [],
            type: 'lawyer'
          };
          
          peopleMap.lawyers.set(lawyerId, {
            ...existing,
            cases: [...(existing.cases || []), {
              ...caseInfo,
              role: lawyer.isPrimary ? 'Primary Lawyer' : 
                    lawyer.role === 'lead' ? 'Lead Advocate' : 'Advocate'
            }]
          });
        }
      });
    }

    // Process advocates (lawyers)
    if (Array.isArray(caseItem.advocates)) {
      caseItem.advocates.forEach(advocate => {
        if (advocate?._id) {
          const advocateId = advocate._id;
          const existing = peopleMap.lawyers.get(advocateId) || {
            ...advocate,
            _id: advocateId,
            name: advocate.name || 'Unknown Advocate',
            cases: [],
            type: 'lawyer'
          };
          
          peopleMap.lawyers.set(advocateId, {
            ...existing,
            cases: [...(existing.cases || []), {
              ...caseInfo,
              role: advocate.isLead ? 'Lead Advocate' : 'Advocate',
              level: advocate.level
            }]
          });
        }
      });
    }
  });

  // Convert maps to arrays and calculate counts
  const mapToArrayWithCounts = (map) => {
    return Array.from(map.values()).map(person => {
      const casesArr = Array.isArray(person.cases) ? person.cases : [];
      const activeCount = casesArr.filter(c => c.status === 'active').length;
      const closedCount = casesArr.filter(c => c.status === 'closed').length;
      
      return {
        ...person,
        name: person.name || 'Unnamed',
        email: person.email || '',
        contact: person.contact || '',
        company: person.company || '',
        gst: person.gst || '',
        address: person.address || '',
        cases: casesArr,
        caseCount: casesArr.length,
        activeCount,
        closedCount,
        totalCases: casesArr.length
      };
    });
  };

  return {
    clients: mapToArrayWithCounts(peopleMap.clients),
    lawyers: mapToArrayWithCounts(peopleMap.lawyers)
  };
};

// Skeleton Loaders
const PersonCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="flex items-start gap-5">
        <div className="bg-gray-200 p-2 rounded-full flex-shrink-0">
          <div className="h-16 w-16 rounded-full bg-gray-300"></div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-16" />
          </div>
          
          <div className="mt-2 space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
          
          <div className="mt-2 space-y-1.5">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-44" />
          </div>
          
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-12" />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between text-sm mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="bg-gray-200 rounded-lg p-3">
                  <Skeleton className="h-3 w-32 mb-1" />
                  <Skeleton className="h-3 w-48 mb-1" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ClientsPartiesPageSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex items-center justify-end gap-4">
        <div className="text-right">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-8 w-12" />
        </div>
        <div className="text-right">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-8 w-12" />
        </div>
      </div>
    </div>

    <Card>
      <CardContent className="p-0">
        <div className="border-b px-6 pt-6">
          <div className="grid w-full grid-cols-2 gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <PersonCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Main Component
export default function ClientsPartiesPage() {
  const router = useRouter();
  const { user } = useAuth();  // ADD THIS - Use auth context
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredClients, setFilteredClients] = useState([]);
  const [filteredLawyers, setFilteredLawyers] = useState([]);
  const [people, setPeople] = useState({
    clients: [],
    lawyers: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFetching, setIsFetching] = useState(false)

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the api service instead of manual fetch
        const cases = await api.cases.getAll();
        
        if (!Array.isArray(cases)) {
          throw new Error('Invalid data format received from API');
        }

        const processedPeople = processCasesData(cases);
        setPeople(processedPeople);
        
        toast.success('Data loaded successfully');
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data. Please try again later.");
        toast.error('Failed to load data');
        
        // If it's an auth error, redirect to login
        if (err.message?.includes('401') || err.message?.includes('authentication')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router])

  // Filter people based on search term
  const filterPeople = useCallback((person, searchTerm = '') => {
    if (!person || typeof person !== 'object') return false;
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = (person.name || '').toLowerCase().includes(searchLower);
    const emailMatch = (person.email || '').toLowerCase().includes(searchLower);
    const contactMatch = (person.contact || '').toLowerCase().includes(searchLower);
    const companyMatch = (person.company || '').toLowerCase().includes(searchLower);
    const gstMatch = (person.gst || '').toLowerCase().includes(searchLower);
    
    const caseMatch = Array.isArray(person.cases) && person.cases.some(c => 
      ((c?.caseNumber || '').toLowerCase().includes(searchLower)) ||
      ((c?.caseTitle || '').toLowerCase().includes(searchLower)) ||
      ((c?.courtName || '').toLowerCase().includes(searchLower))
    );
    
    return nameMatch || emailMatch || contactMatch || caseMatch || companyMatch || gstMatch;
  }, []);

  // Update filtered states when people or searchTerm changes
  useEffect(() => {
    if (!people) {
      setFilteredClients([]);
      setFilteredLawyers([]);
      return;
    }

    const filterBySearch = (items) => {
      if (!Array.isArray(items)) return [];
      return items.filter(person => filterPeople(person, searchTerm));
    };

    setFilteredClients(filterBySearch(people.clients));
    setFilteredLawyers(filterBySearch(people.lawyers));
  }, [people, searchTerm, filterPeople]);

  // Function to redirect to cases page with filters
  const openCasesForPerson = async (personId, personType, status) => {
    try {
      setIsFetching(true);

      // Redirect to cases page with query parameters
      const params = new URLSearchParams({
        personId,
        personType,
        status,
        view: 'filtered'
      });
      
      router.push(`/dashboard/cases?${params.toString()}`);
      
    } catch (error) {
      console.error("Error navigating to cases:", error);
      toast.error('Failed to load cases');
    } finally {
      setIsFetching(false);
    }
  };

  // Handle add new person
  const handleAddNew = () => {
    toast.info('Add new person feature coming soon');
  };



  // Show skeleton while loading
  if (loading) {
    return <ClientsPartiesPageSkeleton />;
  }

  const renderPersonCard = (person, type) => {
    if (!person) return null;
    
    const personType = type || person.type || 'person';
    const cases = Array.isArray(person.cases) ? person.cases : [];
    
    return (
      <Card key={`${person._id || Math.random()}-${personType}`} 
            className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            {/* Avatar with initials */}
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-2 rounded-full flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                {getInitials(person.name)}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Name and type badge */}
              <div className="flex items-start gap-2 mb-2">
                <h3 className="font-semibold text-base line-clamp-2 flex-1" title={person.name}>
                  {person.name || `Unnamed ${personType.charAt(0).toUpperCase() + personType.slice(1)}`}
                </h3>
                <Badge variant="outline" className="text-xs capitalize font-medium flex-shrink-0">
                  {personType}
                </Badge>
              </div>
              
              {/* Contact information */}
              {(person.email || person.contact) && (
                <div className="mt-1.5 space-y-1">
                  {person.email && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="break-all line-clamp-1" title={person.email}>{person.email}</span>
                    </div>
                  )}
                  {person.contact && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span>{person.contact}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Company and GST - Only for clients */}
              {personType === 'client' && (person.company || person.gst) && (
                <div className="mt-1.5 space-y-1">
                  {person.company && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building className="h-3 w-3 flex-shrink-0" />
                      <span className="line-clamp-1" title={person.company}>{person.company}</span>
                    </div>
                  )}
                  {person.gst && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3 flex-shrink-0" />
                      <span className="line-clamp-1" title={`GST: ${person.gst}`}>GST: {person.gst}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Address */}
              {person.address && (
                <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2" title={person.address}>{person.address}</span>
                </div>
              )}
              
              {/* Case Statistics - Active/Closed Buttons */}
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">Case Statistics</span>
                  <Badge variant="secondary" className="text-[10px] h-5 px-2">
                    {person.totalCases || 0} Total
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {/* Active Cases Button */}
                  <Button 
                    size="sm" 
                    variant="default"
                    className="flex items-center justify-between w-full h-9 text-xs"
                    onClick={() => openCasesForPerson(person._id, personType, 'active')}
                    disabled={(person.activeCount || 0) === 0 || isFetching}
                  >
                    <div className="flex items-center gap-1.5">
                      <FileCheck className="h-3.5 w-3.5" />
                      <span>Active</span>
                    </div>
                    <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px] font-bold">
                      {person.activeCount || 0}
                    </Badge>
                  </Button>
                  
                  {/* Closed/Disposed Cases Button */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex items-center justify-between w-full h-9 text-xs"
                    onClick={() => openCasesForPerson(person._id, personType, 'closed')}
                    disabled={(person.closedCount || 0) === 0 || isFetching}
                  >
                    <div className="flex items-center gap-1.5">
                      <FileX className="h-3.5 w-3.5" />
                      <span>Closed</span>
                    </div>
                    <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px] font-bold">
                      {person.closedCount || 0}
                    </Badge>
                  </Button>
                </div>
              </div>

              {/* Recent cases preview - Show for both clients and lawyers */}
              {cases.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="font-semibold text-gray-700">Recent Cases</span>
                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full font-medium">{cases.length} total</span>
                  </div>
                  <div className="space-y-2">
                    {cases.slice(0, 2).map((caseItem, idx) => (
                      <div key={idx} className="text-xs bg-gray-50 rounded-md p-3 hover:bg-gray-100 transition-colors border border-gray-200">
                        <div className="flex items-start gap-2 mb-2">
                          <Hash className="h-3 w-3 flex-shrink-0 text-gray-400 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-semibold text-gray-900 line-clamp-1 text-xs flex-1" title={caseItem.caseNumber}>
                                {caseItem.caseNumber || 'N/A'}
                              </span>
                              <Badge 
                                variant={caseItem.status === 'active' ? 'default' : 'secondary'}
                                className="text-[9px] px-1.5 py-0 h-4 flex-shrink-0 font-medium"
                              >
                                {caseItem.status}
                              </Badge>
                            </div>
                            {caseItem.caseTitle && caseItem.caseTitle !== 'ff' && (
                              <p className="text-[11px] text-gray-600 line-clamp-2 mb-2 leading-relaxed" title={caseItem.caseTitle}>
                                {caseItem.caseTitle}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 pl-5">
                          {caseItem.courtName && (
                            <span className="flex items-center gap-1 flex-1 min-w-0" title={caseItem.courtName}>
                              <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />
                              <span className="line-clamp-1">{caseItem.courtName}</span>
                            </span>
                          )}
                          {caseItem.filingDate && (
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <Calendar className="h-2.5 w-2.5" />
                              {new Date(caseItem.filingDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {cases.length > 2 && (
                      <div className="text-[10px] text-gray-500 text-center py-1 font-medium">
                        +{cases.length - 2} more case{cases.length - 2 !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients & Parties</h1>
          <p className="text-muted-foreground mt-1">
            Manage all clients, lawyers, and parties involved in cases
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/cases')}>
            <Briefcase className="mr-2 h-4 w-4" />
            View All Cases
          </Button>
         
          <Button onClick={handleAddNew} disabled={isFetching}>
            {isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add New
          </Button>
        </div>
      </div>

      {/* Search and Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search clients, lawyers by name, email, contact, case number, or court..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Clients</div>
            <div className="text-2xl font-bold">{people?.clients?.length || 0}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Lawyers</div>
            <div className="text-2xl font-bold">{people?.lawyers?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="clients" className="w-full">
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="clients" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Clients</span>
                  <Badge variant="secondary" className="ml-2">
                    {filteredClients.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="lawyers" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span>Lawyers</span>
                  <Badge variant="secondary" className="ml-2">
                    {filteredLawyers.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
              {/* Clients Tab */}
              <TabsContent value="clients" className="mt-0">
                {error ? (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5" />
                      <p className="font-medium">Error loading data</p>
                    </div>
                    <p className="text-sm mt-1">{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : filteredClients.length > 0 ? (
                  <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
                    {filteredClients.map(client => renderPersonCard(client, 'client'))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No clients found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? 'Try a different search term' : 'Add your first client to get started'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={handleAddNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Client
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Lawyers Tab */}
              <TabsContent value="lawyers" className="mt-0">
                {error ? (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5" />
                      <p className="font-medium">Error loading data</p>
                    </div>
                    <p className="text-sm mt-1">{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : filteredLawyers.length > 0 ? (
                  <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
                    {filteredLawyers.map(lawyer => renderPersonCard(lawyer, 'lawyer'))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
                    <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No lawyers found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Try a different search term' : 'No lawyers found in your cases'}
                    </p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}