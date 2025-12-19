"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  BriefcaseBusiness, 
  FileText, 
  MapPin,
  FileCheck,
  FileX
} from "lucide-react"

// Mock API for demonstration - replace with your actual API
const api = {
  cases: {
    getAll: async () => {
      // Simulate API call
      return [
        {
          _id: "1",
          caseNumber: "CRL-001/2024",
          status: "active",
          clients: [{ _id: "c1", name: "John Doe", email: "john@example.com", contact: "9876543210" }],
          lawyer: { _id: "l1", name: "Adv. Sarah Smith", email: "sarah@lawfirm.com", contact: "9123456789" }
        },
        {
          _id: "2",
          caseNumber: "CIV-002/2024",
          status: "closed",
          clients: [{ _id: "c1", name: "John Doe", email: "john@example.com", contact: "9876543210" }],
          lawyer: { _id: "l2", name: "Adv. Michael Brown", email: "michael@lawfirm.com", contact: "9234567890" }
        },
        {
          _id: "3",
          caseNumber: "CRL-003/2024",
          status: "active",
          clients: [{ _id: "c2", name: "Jane Smith", email: "jane@example.com", contact: "9345678901" }],
          lawyer: { _id: "l1", name: "Adv. Sarah Smith", email: "sarah@lawfirm.com", contact: "9123456789" }
        }
      ]
    }
  }
}

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

  const closedKeywords = ['closed', 'disposed', 'dismissed', 'settled', 'withdrawn', 'resolved', 'decided'];
  for (const kw of closedKeywords) {
    if (s.includes(kw)) return 'closed';
  }

  const activeKeywords = ['active', 'open', 'pending', 'listed', 'adjourned', 'in-progress'];
  for (const kw of activeKeywords) {
    if (s.includes(kw)) return 'active';
  }

  return 'active';
};

export default function ClientsPartiesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredClients, setFilteredClients] = useState([]);
  const [filteredLawyers, setFilteredLawyers] = useState([]);
  const [people, setPeople] = useState({
    clients: [],
    lawyers: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.cases.getAll();
        const cases = Array.isArray(response) ? response : [];
        
        const peopleMap = {
          clients: new Map(),
          lawyers: new Map()
        };

        // Process each case
        cases.forEach((caseItem) => {
          const rawStatus = caseItem.status || caseItem.caseStatus || caseItem.currentStatus || 
                           (caseItem.disposed ? 'disposed' : undefined) || caseItem.case_state;
          const status = normalizeStatus(rawStatus);

          // Process clients
          if (caseItem.clients && Array.isArray(caseItem.clients)) {
            caseItem.clients.forEach((client, clientIndex) => {
              const clientId = client?._id || `temp-${caseItem._id}-client-${clientIndex}`;
              const existing = peopleMap.clients.get(clientId) || {
                ...client,
                _id: clientId,
                cases: [],
                type: 'client'
              };
              peopleMap.clients.set(clientId, {
                ...existing,
                cases: [...(existing.cases || []), {
                  caseId: caseItem._id,
                  caseNumber: caseItem.caseNumber,
                  role: 'Client',
                  status
                }]
              });
            });
          }

          // Process primary lawyer
          if (caseItem.lawyer && (caseItem.lawyer._id || caseItem.lawyer.id)) {
            const lid = caseItem.lawyer._id || caseItem.lawyer.id;
            const existing = peopleMap.lawyers.get(lid) || {
              ...caseItem.lawyer,
              cases: [],
              type: 'lawyer'
            };
            peopleMap.lawyers.set(lid, {
              ...existing,
              cases: [...(existing.cases || []), {
                caseId: caseItem._id,
                caseNumber: caseItem.caseNumber,
                role: 'Primary Lawyer',
                status
              }]
            });
          }

          // Process additional advocates
          if (caseItem.advocates && Array.isArray(caseItem.advocates)) {
            caseItem.advocates.forEach(advocate => {
              if (!advocate?._id) return;
              const existing = peopleMap.lawyers.get(advocate._id) || {
                ...advocate,
                cases: [],
                type: 'lawyer'
              };
              peopleMap.lawyers.set(advocate._id, {
                ...existing,
                cases: [...(existing.cases || []), {
                  caseId: caseItem._id,
                  caseNumber: caseItem.caseNumber,
                  role: advocate.isLead ? 'Lead Advocate' : 'Advocate',
                  level: advocate.level,
                  status
                }]
              });
            });
          }
        });

        // Convert maps to arrays and add case counts (active / closed)
        const mapToArrayWithCounts = (map) => Array.from(map.values()).map(p => {
          const casesArr = p.cases || [];
          const activeCount = casesArr.filter(c => c.status === 'active').length;
          const closedCount = casesArr.filter(c => c.status === 'closed').length;
          return {
            ...p,
            caseCount: casesArr.length,
            activeCount,
            closedCount
          };
        });

        setPeople({
          clients: mapToArrayWithCounts(peopleMap.clients),
          lawyers: mapToArrayWithCounts(peopleMap.lawyers)
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [])

  // Filter people based on search term
  const filterPeople = useCallback((person, searchTerm = '') => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = person.name?.toLowerCase().includes(searchLower) || false;
    const emailMatch = person.email?.toLowerCase().includes(searchLower) || false;
    const contactMatch = person.contact?.toLowerCase().includes(searchLower) || false;
    const companyMatch = person.company?.toLowerCase().includes(searchLower) || false;
    
    const caseMatch = person.cases?.some(c => 
      (c.caseNumber?.toLowerCase().includes(searchLower) || '')
    ) || false;
    
    return nameMatch || emailMatch || contactMatch || caseMatch || companyMatch;
  }, []);

  // Update filtered states when people or searchTerm changes
  useEffect(() => {
    if (!people) return;

    const filterBySearch = (items) => (items || []).filter(person => filterPeople(person, searchTerm));

    setFilteredClients(filterBySearch(people.clients));
    setFilteredLawyers(filterBySearch(people.lawyers));
  }, [people, searchTerm, filterPeople]);

  // Function to redirect to cases page with filters
  const openCasesForPerson = (personId, personType, status) => {
    const params = new URLSearchParams({ personId, personType, status });
    router.push(`/cases?${params.toString()}`);
  };

  const renderPersonCard = (person, type) => {
    const personType = type || person.type || person.personType || 'person';
    const cases = person.cases || [];
    
    return (
      <Card key={`${person._id}-${personType}`} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar with initials */}
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-3 rounded-full flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-semibold">
                {getInitials(person.name)}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Name and type badge */}
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg truncate">
                  {person.name || `Unnamed ${personType.charAt(0).toUpperCase() + personType.slice(1)}`}
                </h3>
                <Badge variant="outline" className="text-xs capitalize font-medium">
                  {personType}
                </Badge>
              </div>
              
              {/* Contact information */}
              {(person.email || person.contact) && (
                <div className="mt-2 space-y-1.5">
                  {person.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate" title={person.email}>{person.email}</span>
                    </div>
                  )}
                  {person.contact && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{person.contact}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Company and GST */}
              {(person.company || person.gst) && (
                <div className="mt-2 space-y-1.5">
                  {person.company && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BriefcaseBusiness className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{person.company}</span>
                    </div>
                  )}
                  {person.gst && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>GST: {person.gst}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Address */}
              {person.address && (
                <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{person.address}</span>
                </div>
              )}
              
              {/* Case Statistics - Active/Closed Buttons */}
              <div className="mt-4 pt-3 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Case Statistics:</span>
                  <Badge variant="secondary" className="text-xs">
                    {person.caseCount ?? 0} Total
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Active Cases Button */}
                  <Button 
                    size="sm" 
                    variant="default"
                    className="flex-1 gap-2"
                    onClick={() => openCasesForPerson(person._id, personType, 'active')}
                  >
                    <FileCheck className="h-4 w-4" />
                    Active
                    <Badge variant="secondary" className="ml-auto">
                      {person.activeCount ?? 0}
                    </Badge>
                  </Button>
                  
                  {/* Closed Cases Button */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => openCasesForPerson(person._id, personType, 'closed')}
                  >
                    <FileX className="h-4 w-4" />
                    Closed
                    <Badge variant="secondary" className="ml-auto">
                      {person.closedCount ?? 0}
                    </Badge>
                  </Button>
                </div>
              </div>

              {/* Recent cases preview - ONLY show for clients, not for lawyers */}
              {personType === 'client' && cases.length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span className="font-medium">Recent Cases</span>
                  </div>
                  <div className="space-y-1.5">
                    {cases.slice(0, 2).map((caseItem, idx) => (
                      <div key={idx} className="text-xs bg-muted/50 rounded-lg px-3 py-2 flex items-center gap-2">
                        <Hash className="h-3 w-3 flex-shrink-0 opacity-50" />
                        <div className="flex-1 truncate">
                          <span className="font-medium">{caseItem.caseNumber || 'Case'}</span>
                        </div>
                        <Badge 
                          variant={caseItem.status === 'active' ? 'default' : 'secondary'}
                          className="text-[10px] px-2"
                        >
                          {caseItem.status}
                        </Badge>
                      </div>
                    ))}
                    {cases.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center py-1">
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
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, contact, or case number..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="clients">
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
            
            <div className="mt-6">
              {/* Clients Tab */}
              <TabsContent value="clients" className="mt-0">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                    <p className="font-medium">Error loading data</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                ) : filteredClients.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Client
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Lawyers Tab */}
              <TabsContent value="lawyers" className="mt-0">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                    <p className="font-medium">Error loading data</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                ) : filteredLawyers.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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