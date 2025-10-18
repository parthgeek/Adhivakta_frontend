"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Search, 
  Plus, 
  Users, 
  User, 
  Briefcase, 
  Building2, 
  Gavel, 
  UserPlus, 
  UserX, 
  UserCog, 
  BriefcaseBusiness, 
  FileText, 
  MapPin, 
  Mail, 
  Phone, 
  Hash, 
  Upload, 
  Filter, 
  ChevronDown, 
  ListFilter, 
  Scale, 
  UserCheck, 
  UserMinus, 
  UserCog2,
  UploadCloud,
  Landmark
} from "lucide-react"
import api from "@/services/api"

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

// Helper function to get icon for person type
const getPersonIcon = (type) => {
  switch(type) {
    case 'lawyer':
      return <Gavel className="h-4 w-4" />;
    case 'client':
      return <UserCheck className="h-4 w-4" />;
    case 'petitioner':
      return <UserPlus className="h-4 w-4" />;
    case 'respondent':
      return <UserX className="h-4 w-4" />;
    case 'stakeholder':
      return <UserCog className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
};

export default function ClientsPartiesPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  
  // Initialize all filtered states
  const [filteredClients, setFilteredClients] = useState([]);
  const [filteredLawyers, setFilteredLawyers] = useState([]);
  const [filteredPetitioners, setFilteredPetitioners] = useState([]);
  const [filteredAppellants, setFilteredAppellants] = useState([]);
  const [filteredPlaintiffs, setFilteredPlaintiffs] = useState([]);
  const [filteredComplainants, setFilteredComplainants] = useState([]);
  const [filteredRespondents, setFilteredRespondents] = useState([]);
  const [filteredDefendants, setFilteredDefendants] = useState([]);
  const [filteredAccused, setFilteredAccused] = useState([]);
  const [filteredOpponents, setFilteredOpponents] = useState([]);
  const [filteredStakeholders, setFilteredStakeholders] = useState([]);
  const [people, setPeople] = useState({
    clients: [],
    lawyers: [],
    petitioners: [],
    respondents: [],
    stakeholders: [],
    appellants: [],
    plaintiffs: [],
    complainants: [],
    defendants: [],
    accused: [],
    opponents: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching cases...');
        const response = await api.cases.getAll();
        console.log('API Response:', response);
        const cases = Array.isArray(response) ? response : [];
        console.log('Cases loaded:', cases.length);
        
        const peopleMap = {
          clients: new Map(),
          lawyers: new Map(),
          petitioners: new Map(),
          respondents: new Map(),
          stakeholders: new Map(),
          appellants: new Map(),
          plaintiffs: new Map(),
          complainants: new Map(),
          defendants: new Map(),
          accused: new Map(),
          opponents: new Map()
        };

        // Process each case
        cases.forEach((caseItem, index) => {
          console.log(`Processing case ${index + 1}/${cases.length}:`, caseItem.caseNumber);
          
          // Process clients
          console.log('Case clients:', caseItem.clients);
          if (caseItem.clients && Array.isArray(caseItem.clients)) {
            console.log(`Found ${caseItem.clients.length} clients`);
            caseItem.clients.forEach((client, clientIndex) => {
              // Generate a unique ID for the client if one doesn't exist
              const clientId = client?._id || `temp-${caseItem._id}-client-${clientIndex}`;
              if (!client?._id) {
                console.warn(`Client at index ${clientIndex} has no _id, using generated ID: ${clientId}`);
              }
              console.log(`Processing client ${clientIndex + 1}:`, client);
              const existing = peopleMap.clients.get(clientId) || {
                ...client,
                _id: clientId, // Ensure the client has an ID
                cases: [],
                type: 'client'
              };
              peopleMap.clients.set(clientId, {
                ...existing,
                cases: [...(existing.cases || []), {
                  caseId: caseItem._id,
                  caseNumber: caseItem.caseNumber,
                  role: 'Client'
                }]
              });
            });
          } else {
            console.log('No clients array found in case or it is not an array');
          }

          // Process primary lawyer
          if (caseItem.lawyer?._id) {
            const existing = peopleMap.lawyers.get(caseItem.lawyer._id) || {
              ...caseItem.lawyer,
              cases: [],
              type: 'lawyer'
            };
            peopleMap.lawyers.set(caseItem.lawyer._id, {
              ...existing,
              cases: [...(existing.cases || []), {
                caseId: caseItem._id,
                caseNumber: caseItem.caseNumber,
                role: 'Primary Lawyer'
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
                  level: advocate.level
                }]
              });
            });
          }

          // Process petitioners
          if (caseItem.petitioners && Array.isArray(caseItem.petitioners)) {
            caseItem.petitioners.forEach(petitioner => {
              if (!petitioner?._id) return;
              const existing = peopleMap.petitioners.get(petitioner._id) || {
                ...petitioner,
                cases: [],
                type: 'petitioner'
              };
              peopleMap.petitioners.set(petitioner._id, {
                ...existing,
                cases: [...(existing.cases || []), {
                  caseId: caseItem._id,
                  caseNumber: caseItem.caseNumber,
                  role: petitioner.role || 'Petitioner',
                  type: petitioner.type || 'Individual'
                }]
              });
            });
          }

          // Process respondents
          if (caseItem.respondents && Array.isArray(caseItem.respondents)) {
            caseItem.respondents.forEach(respondent => {
              if (!respondent?._id) return;
              const existing = peopleMap.respondents.get(respondent._id) || {
                ...respondent,
                cases: [],
                type: 'respondent'
              };
              peopleMap.respondents.set(respondent._id, {
                ...existing,
                cases: [...(existing.cases || []), {
                  caseId: caseItem._id,
                  caseNumber: caseItem.caseNumber,
                  role: respondent.role || 'Respondent',
                  type: respondent.type || 'Individual'
                }]
              });
            });
          }

          // Process stakeholders
          if (caseItem.stakeholders && Array.isArray(caseItem.stakeholders)) {
            caseItem.stakeholders.forEach(stakeholder => {
              if (!stakeholder?._id) return;
              const existing = peopleMap.stakeholders.get(stakeholder._id) || {
                ...stakeholder,
                cases: [],
                type: 'stakeholder'
              };
              peopleMap.stakeholders.set(stakeholder._id, {
                ...existing,
                cases: [...(existing.cases || []), {
                  caseId: caseItem._id,
                  caseNumber: caseItem.caseNumber,
                  role: stakeholder.roleInCase || 'Stakeholder'
                }]
              });
            });
          }

          // Process appellants
          if (caseItem.appellants && Array.isArray(caseItem.appellants)) {
            caseItem.appellants.forEach(appellant => {
              if (!appellant?._id) return;
              const existing = peopleMap.appellants.get(appellant._id) || {
                ...appellant,
                cases: [],
                type: 'appellant'
              };
              peopleMap.appellants.set(appellant._id, {
                ...existing,
                cases: [...(existing.cases || []), {
                  caseId: caseItem._id,
                  caseNumber: caseItem.caseNumber,
                  role: appellant.role || 'Appellant',
                  type: appellant.type || 'Individual'
                }]
              });
            });
          }

          // Process plaintiffs
          if (caseItem.plaintiffs && Array.isArray(caseItem.plaintiffs)) {
            caseItem.plaintiffs.forEach(plaintiff => {
              if (!plaintiff?._id) return;
              const existing = peopleMap.plaintiffs.get(plaintiff._id) || {
                ...plaintiff,
                cases: [],
                type: 'plaintiff'
              };
              peopleMap.plaintiffs.set(plaintiff._id, {
                ...existing,
                cases: [...(existing.cases || []), {
                  caseId: caseItem._id,
                  caseNumber: caseItem.caseNumber,
                  role: plaintiff.role || 'Plaintiff',
                  type: plaintiff.type || 'Individual'
                }]
              });
            });
          }

          // Process complainants
          if (caseItem.complainants && Array.isArray(caseItem.complainants)) {
            caseItem.complainants.forEach(complainant => {
              if (!complainant?._id) return;
              const existing = peopleMap.complainants.get(complainant._id) || {
                ...complainant,
                cases: [],
                type: 'complainant'
              };
              peopleMap.complainants.set(complainant._id, {
                ...existing,
                cases: [...(existing.cases || []), {
                  caseId: caseItem._id,
                  caseNumber: caseItem.caseNumber,
                  role: complainant.role || 'Complainant',
                  type: complainant.type || 'Individual'
                }]
              });
            });
          }

          // Process defendants
          if (caseItem.defendants && Array.isArray(caseItem.defendants)) {
            caseItem.defendants.forEach(defendant => {
              if (!defendant?._id) return;
              const existing = peopleMap.defendants.get(defendant._id) || {
                ...defendant,
                cases: [],
                type: 'defendant'
              };
              peopleMap.defendants.set(defendant._id, {
                ...existing,
                cases: [...(existing.cases || []), {
                  caseId: caseItem._id,
                  caseNumber: caseItem.caseNumber,
                  role: defendant.role || 'Defendant',
                  type: defendant.type || 'Individual'
                }]
              });
            });
          }

          // Process accused
          if (caseItem.accused && Array.isArray(caseItem.accused)) {
            caseItem.accused.forEach(accused => {
              if (!accused?._id) return;
              const existing = peopleMap.accused.get(accused._id) || {
                ...accused,
                cases: [],
                type: 'accused'
              };
              peopleMap.accused.set(accused._id, {
                ...existing,
                cases: [...(existing.cases || []), {
                  caseId: caseItem._id,
                  caseNumber: caseItem.caseNumber,
                  role: accused.role || 'Accused',
                  type: accused.type || 'Individual'
                }]
              });
            });
          }

          // Process opponents
          if (caseItem.opponents && Array.isArray(caseItem.opponents)) {
            caseItem.opponents.forEach(opponent => {
              if (!opponent?._id) return;
              const existing = peopleMap.opponents.get(opponent._id) || {
                ...opponent,
                cases: [],
                type: 'opponent'
              };
              peopleMap.opponents.set(opponent._id, {
                ...existing,
                cases: [...(existing.cases || []), {
                  caseId: caseItem._id,
                  caseNumber: caseItem.caseNumber,
                  role: opponent.role || 'Opponent',
                  type: opponent.type || 'Individual'
                }]
              });
            });
          }
        });

        // Convert maps to arrays and add case counts
        const newPeopleState = {
          clients: Array.from(peopleMap.clients.values()).map(p => ({
            ...p,
            caseCount: p.cases?.length || 0
          })),
          lawyers: Array.from(peopleMap.lawyers.values()).map(p => ({
            ...p,
            caseCount: p.cases?.length || 0
          })),
          petitioners: Array.from(peopleMap.petitioners.values()).map(p => ({
            ...p,
            caseCount: p.cases?.length || 0
          })),
          respondents: Array.from(peopleMap.respondents.values()).map(p => ({
            ...p,
            caseCount: p.cases?.length || 0
          })),
          stakeholders: Array.from(peopleMap.stakeholders.values()).map(p => ({
            ...p,
            caseCount: p.cases?.length || 0
          })),
          appellants: Array.from(peopleMap.appellants.values()).map(p => ({
            ...p,
            caseCount: p.cases?.length || 0
          })),
          plaintiffs: Array.from(peopleMap.plaintiffs.values()).map(p => ({
            ...p,
            caseCount: p.cases?.length || 0
          })),
          complainants: Array.from(peopleMap.complainants.values()).map(p => ({
            ...p,
            caseCount: p.cases?.length || 0
          })),
          defendants: Array.from(peopleMap.defendants.values()).map(p => ({
            ...p,
            caseCount: p.cases?.length || 0
          })),
          accused: Array.from(peopleMap.accused.values()).map(p => ({
            ...p,
            caseCount: p.cases?.length || 0
          })),
          opponents: Array.from(peopleMap.opponents.values()).map(p => ({
            ...p,
            caseCount: p.cases?.length || 0
          }))
        };

        console.log('Setting people state with:', {
          clientsCount: newPeopleState.clients.length,
          lawyersCount: newPeopleState.lawyers.length
        });
        
        setPeople(newPeopleState);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [])

  // Filter people based on search term and active tab
  const filterPeople = useCallback((person, searchTerm = '') => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = person.name?.toLowerCase().includes(searchLower) || false;
    const emailMatch = person.email?.toLowerCase().includes(searchLower) || false;
    const contactMatch = person.contact?.toLowerCase().includes(searchLower) || false;
    const companyMatch = person.company?.toLowerCase().includes(searchLower) || false;
    const addressMatch = person.address?.toLowerCase().includes(searchLower) || false;
    const roleMatch = person.roleInCase?.toLowerCase().includes(searchLower) || false;
    
    const caseMatch = person.cases?.some(c => 
      (c.caseNumber?.toLowerCase().includes(searchLower) || '') || 
      (c.role?.toLowerCase().includes(searchLower) || '')
    ) || false;
    
    return nameMatch || emailMatch || contactMatch || caseMatch || 
           companyMatch || addressMatch || roleMatch;
  }, []);

  // Update filtered states when people or searchTerm changes
  useEffect(() => {
    if (!people) return;

    const filterBySearch = (items) => (items || []).filter(person => filterPeople(person, searchTerm));

    setFilteredClients(filterBySearch(people.clients));
    setFilteredLawyers(filterBySearch(people.lawyers));
    setFilteredPetitioners(filterBySearch(people.petitioners));
    setFilteredAppellants(filterBySearch(people.appellants));
    setFilteredPlaintiffs(filterBySearch(people.plaintiffs));
    setFilteredComplainants(filterBySearch(people.complainants));
    setFilteredRespondents(filterBySearch(people.respondents));
    setFilteredDefendants(filterBySearch(people.defendants));
    setFilteredAccused(filterBySearch(people.accused));
    setFilteredOpponents(filterBySearch(people.opponents));
    setFilteredStakeholders(filterBySearch(people.stakeholders));
  }, [people, searchTerm, filterPeople]);

  // Combine all filtered people for the 'All' tab
  const allFilteredPeople = useMemo(() => [
    ...(filteredClients || []).map(p => ({ ...p, personType: 'client' })),
    ...(filteredLawyers || []).map(p => ({ ...p, personType: 'lawyer' })),
    ...(filteredPetitioners || []).map(p => ({ ...p, personType: 'petitioner' })),
    ...(filteredRespondents || []).map(p => ({ ...p, personType: 'respondent' })),
    ...(filteredAppellants || []).map(p => ({ ...p, personType: 'appellant' })),
    ...(filteredPlaintiffs || []).map(p => ({ ...p, personType: 'plaintiff' })),
    ...(filteredComplainants || []).map(p => ({ ...p, personType: 'complainant' })),
    ...(filteredDefendants || []).map(p => ({ ...p, personType: 'defendant' })),
    ...(filteredAccused || []).map(p => ({ ...p, personType: 'accused' })),
    ...(filteredOpponents || []).map(p => ({ ...p, personType: 'opponent' })),
    ...(filteredStakeholders || []).map(p => ({ ...p, personType: 'stakeholder' }))
  ], [
    filteredClients, filteredLawyers, filteredPetitioners, filteredRespondents,
    filteredAppellants, filteredPlaintiffs, filteredComplainants, filteredDefendants,
    filteredAccused, filteredOpponents, filteredStakeholders
  ]);

  const renderPersonCard = (person, type) => {
    const personType = type || person.type || person.personType || 'person';
    const cases = person.cases || [];
    
    return (
      <Card key={`${person._id}-${personType}`} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                {getInitials(person.name)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{person.name || `Unnamed ${personType.charAt(0).toUpperCase() + personType.slice(1)}`}</h3>
                <Badge variant="outline" className="text-xs capitalize">
                  {personType}
                </Badge>
              </div>
              
              {(person.email || person.contact) && (
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {person.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[180px]" title={person.email}>
                        {person.email}
                      </span>
                    </span>
                  )}
                  {person.contact && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{person.contact}</span>
                    </span>
                  )}
                </div>
              )}
              
              {(person.company || person.gst) && (
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {person.company && (
                    <span className="flex items-center gap-1">
                      <BriefcaseBusiness className="h-3.5 w-3.5" />
                      <span>{person.company}</span>
                    </span>
                  )}
                  {person.gst && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      <span>GST: {person.gst}</span>
                    </span>
                  )}
                </div>
              )}
              
              {person.address && (
                <div className="mt-2 flex items-start gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{person.address}</span>
                </div>
              )}
              
              {cases.length > 0 && (
                <div className="mt-3 pt-2 border-t">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                    <span className="font-medium">Involved in {cases.length} case{cases.length !== 1 ? 's' : ''}</span>
                    <span className="text-xs">Click to view</span>
                  </div>
                  <div className="space-y-1.5">
                    {cases.slice(0, 2).map((caseItem, idx) => (
                      <div key={idx} className="text-xs bg-muted/50 rounded px-2 py-1 flex items-center gap-2">
                        <Hash className="h-3 w-3 flex-shrink-0 opacity-50" />
                        <div className="truncate">
                          <span className="font-medium">{caseItem.caseNumber || 'Case'}</span>
                          <span className="text-muted-foreground ml-2">({caseItem.role})</span>
                        </div>
                      </div>
                    ))}
                    {cases.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">
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

  const renderClientCard = (client) => {
    return renderPersonCard(client, 'client');
  };

  const renderLawyerCard = (lawyer) => {
    return renderPersonCard(lawyer, 'lawyer');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients & Parties</h1>
          <p className="text-muted-foreground">
            Manage all clients, lawyers, and other parties involved in cases
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

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search clients or lawyers..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="clients" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Clients</span>
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {filteredClients.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="lawyers" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>Lawyers</span>
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {filteredLawyers.length}
                </span>
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="clients">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
                    {error}
                  </div>
                ) : filteredClients.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredClients.map(renderClientCard)}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">No clients found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Try a different search term' : 'Add your first client to get started'}
                    </p>
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Client
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="lawyers">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
                    {error}
                  </div>
                ) : filteredLawyers.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredLawyers.map(renderLawyerCard)}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
                    <Briefcase className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">No lawyers found</h3>
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
