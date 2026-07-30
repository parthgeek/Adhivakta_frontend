"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, User, LogOut, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { useRealTimeCounts } from "@/context/realtime-counts-context";
import { useSidebar } from "@/context/sidebar-context";
import api from "@/services/api";
import {
  formatDisplayCaseNumber,
  getCaseIdentifier,
} from "@/lib/caseTypeUtils";
import { cn } from "@/lib/utils";
import GuideButton from "@/components/guide/GuideButton";

const APPROVAL_LOGOUT_EVENT = "app:approval-review:logout-attempt";

const safeText = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.name || value.title || value.email || value.caseNumber || "";
  }
  return String(value);
};

const normalizeText = (value) => safeText(value).trim().toLowerCase();

const getDisplayRole = (role) => {
  const normalizedRole = safeText(role).trim().toLowerCase();
  if (normalizedRole === "lawyer") return "Advocate";
  if (!normalizedRole) return "Member";
  return normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1);
};

const buildSearchData = (cases = []) => {
  const clientsMap = new Map();

  const caseResults = cases
    .filter(Boolean)
    .map((caseItem) => {
      const id = caseItem._id || caseItem.id;
      const caseNumber =
        formatDisplayCaseNumber({
          caseNumber: caseItem.caseNumber || caseItem.number || "",
          caseTypeName: caseItem.caseSubType || caseItem.eCourt?.caseTypeName || "",
          caseTypeCode: caseItem.eCourt?.caseTypeCode || caseItem.caseCode || "",
        }) ||
        safeText(caseItem.caseNumber || caseItem.number);
      const clientName =
        safeText(caseItem.clientName) ||
        safeText(caseItem.client) ||
        safeText(caseItem.clients?.[0]?.user) ||
        safeText(caseItem.clients?.[0]?.name);

      if (caseItem.client && typeof caseItem.client === "object" && caseItem.client._id) {
        clientsMap.set(caseItem.client._id, {
          id: caseItem.client._id,
          name: safeText(caseItem.client.name),
          email: safeText(caseItem.client.email),
          contact: safeText(caseItem.client.contact),
          relatedCaseId: id,
        });
      }

      (caseItem.clients || []).forEach((client) => {
        const personId =
          client?.user?._id ||
          client?.user?.id ||
          client?._id ||
          client?.email;

        if (!personId) return;

        const existingClient = clientsMap.get(personId);
        clientsMap.set(personId, {
          id: personId,
          name: safeText(client?.user?.name || client?.name),
          email: safeText(client?.user?.email || client?.email),
          contact: safeText(client?.user?.contact || client?.contact),
          relatedCaseId: existingClient?.relatedCaseId || id,
        });
      });

      return {
        id,
        title: safeText(caseItem.title) || "Untitled case",
        description: safeText(caseItem.description),
        caseNumber,
        identifier: safeText(getCaseIdentifier(caseItem)),
        clientName,
        courtName: safeText(caseItem.court || caseItem.courtName || caseItem.courtType),
        type: "case",
      };
    })
    .filter((caseItem) => caseItem.id);

  const clientResults = Array.from(clientsMap.values())
    .filter((client) => client.name || client.email)
    .map((client) => ({
      ...client,
      type: "client",
    }));

  return { cases: caseResults, clients: clientResults };
};

export default function Header({ onMenuClick }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { counts } = useRealTimeCounts();
  const { collapsed } = useSidebar();
  const searchRef = useRef(null);
  const [query, setQuery] = useState("");
  const [searchData, setSearchData] = useState({ cases: [], clients: [] });
  const [isLoadingSearch, setIsLoadingSearch] = useState(true);
  const [searchError, setSearchError] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [organizationAdvocates, setOrganizationAdvocates] = useState([]);
  const [selectedAdvocateId, setSelectedAdvocateId] = useState("all");

  const displayName = user?.name || "User";
  const firstName = displayName.split(" ").filter(Boolean)[0] || "User";
  const displayRole = getDisplayRole(user?.role);
  const initials = useMemo(() => {
    const value = displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
    return value || "U";
  }, [displayName]);

  const unreadNotifications = counts?.notifications || 0;

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      const logoutAttemptEvent = new CustomEvent(APPROVAL_LOGOUT_EVENT, {
        cancelable: true,
        detail: {
          continueLogout: logout,
        },
      });

      window.dispatchEvent(logoutAttemptEvent);

      if (logoutAttemptEvent.defaultPrevented) {
        return;
      }
    }

    logout();
  };

  useEffect(() => {
    let isCancelled = false;

    const loadSearchData = async () => {
      setIsLoadingSearch(true);
      setSearchError("");
      try {
        const cases = await api.cases.getAll();
        if (!isCancelled) {
          setSearchData(buildSearchData(cases));
        }
      } catch (error) {
        console.error("Failed to load header search data:", error);
        if (!isCancelled) {
          setSearchError("Unable to load search results.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSearch(false);
        }
      }
    };

    loadSearchData();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user?.role !== "organization_admin") return;

    let isCancelled = false;

    const loadOrganizationAdvocates = async () => {
      try {
        const organization = await api.organizations.getMine();
        if (isCancelled) return;
        const advocates = (organization?.members || []).filter(
          (member) => member.role === "lawyer" && member.status === "active"
        );
        setOrganizationAdvocates(advocates);

        const savedFilter = api.organizationAdvocateFilter.get();
        const hasSavedAdvocate = advocates.some(
          (advocate) => String(advocate.userId) === String(savedFilter)
        );
        setSelectedAdvocateId(savedFilter && hasSavedAdvocate ? savedFilter : "all");
        if (savedFilter && !hasSavedAdvocate) {
          api.organizationAdvocateFilter.set("all");
        }
      } catch (error) {
        console.error("Failed to load organization advocates:", error);
      }
    };

    loadOrganizationAdvocates();
    return () => {
      isCancelled = true;
    };
  }, [user?.role]);

  const handleAdvocateFilterChange = (value) => {
    setSelectedAdvocateId(value);
    api.organizationAdvocateFilter.set(value);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!searchRef.current?.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const searchResults = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) {
      return { cases: [], clients: [] };
    }

    const matchesQuery = (...values) =>
      values.some((value) => normalizeText(value).includes(normalizedQuery));

    const cases = searchData.cases
      .filter((caseItem) =>
        matchesQuery(
          caseItem.title,
          caseItem.description,
          caseItem.caseNumber,
          caseItem.identifier,
          caseItem.clientName,
          caseItem.courtName
        )
      )
      .slice(0, 5);

    const clients = searchData.clients
      .filter((client) =>
        matchesQuery(client.name, client.email, client.contact)
      )
      .slice(0, 5);

    return { cases, clients };
  }, [query, searchData]);

  const handleResultSelect = (result) => {
    setIsSearchOpen(false);
    setQuery("");

    if (result.type === "case") {
      router.push(`/dashboard/cases/${result.id}`);
      return;
    }

    const params = new URLSearchParams({
      q: result.name || result.email || "",
      tab: "clients",
    });
    router.push(`/dashboard/clients-parties?${params.toString()}`);
  };

  return (
    <header className="h-24 border-b bg-card shadow-sm flex items-center">
      <div
        className={cn(
          "hidden md:flex h-full items-center px-4 shrink-0",
          collapsed ? "w-28 justify-center" : "w-72"
        )}
      >
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center justify-center overflow-hidden focus:outline-none"
        >
          <img
            src="/images/adhi_logo_main.png"
            alt="Adhivakta Logo"
            className={cn(
              "object-contain transition-all duration-300",
              collapsed
                ? "h-[6.75rem] w-[6.75rem] scale-[1.35]"
                : "h-[6.5rem] w-[6.5rem] scale-[1.15]"
            )}
          />
        </button>
      </div>

      <div className="flex flex-1 items-center px-4 md:grid md:grid-cols-[1fr_minmax(340px,560px)_1fr] md:items-center md:gap-6 md:px-6">
        <div className="flex items-center gap-2 md:hidden">
          {onMenuClick && (
            <Button variant="ghost" size="icon" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <button
            onClick={() => router.push("/dashboard")}
            className="overflow-hidden focus:outline-none"
          >
            <img
              src="/images/adhi_logo_main.png"
              alt="Adhivakta Logo"
              className="h-14 w-14 scale-[1.1] object-contain"
            />
          </button>
        </div>

        <div className="hidden md:block md:col-start-1" />

        <div className="hidden md:block md:col-start-2 md:w-full">
          <div ref={searchRef} className="relative w-full" data-tour="global-search">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search cases and clients..."
              className="pl-12"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
            />
            {isSearchOpen && query.trim() ? (
              <div className="absolute top-full mt-2 w-full rounded-md border bg-popover shadow-md z-50">
                {isLoadingSearch ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : searchError ? (
                  <div className="px-4 py-3 text-sm text-destructive">
                    {searchError}
                  </div>
                ) : searchResults.cases.length === 0 &&
                  searchResults.clients.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    No results found for "{query.trim()}".
                  </div>
                ) : (
                  <div className="py-2">
                    {searchResults.cases.length > 0 ? (
                      <div>
                        <p className="px-4 pb-1 text-xs font-medium text-muted-foreground">
                          Cases
                        </p>
                        {searchResults.cases.map((caseItem) => (
                          <button
                            key={caseItem.id}
                            type="button"
                            className="flex w-full flex-col px-4 py-2 text-left hover:bg-accent"
                            onMouseDown={() =>
                              handleResultSelect({ ...caseItem, type: "case" })
                            }
                          >
                            <span className="text-sm font-medium">
                              {caseItem.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {[caseItem.caseNumber, caseItem.clientName]
                                .filter(Boolean)
                                .join(" • ")}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {searchResults.clients.length > 0 ? (
                      <div className={cn(searchResults.cases.length > 0 && "pt-2")}>
                        <p className="px-4 pb-1 text-xs font-medium text-muted-foreground">
                          Clients
                        </p>
                        {searchResults.clients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            className="flex w-full flex-col px-4 py-2 text-left hover:bg-accent"
                            onMouseDown={() => handleResultSelect(client)}
                          >
                            <span className="text-sm font-medium">
                              {client.name || client.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {[
                                "Client",
                                client.email,
                                client.contact,
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto md:ml-0 md:col-start-3 md:justify-self-end md:gap-4">
          {user?.role === "organization_admin" && (
            <div className="hidden min-w-[190px] md:block">
              <Select value={selectedAdvocateId} onValueChange={handleAdvocateFilterChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All advocates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Advocates</SelectItem>
                  {organizationAdvocates.map((advocate) => (
                    <SelectItem key={advocate.userId} value={String(advocate.userId)}>
                      {advocate.name || advocate.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => {
              const searchInput = document.querySelector(
                'input[placeholder*="Search"]'
              );
              if (searchInput instanceof HTMLInputElement) {
                searchInput.focus();
              }
            }}
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => router.push("/dashboard/notifications")}
            data-tour="notifications"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1.5 py-0 flex items-center justify-center text-[10px]"
              >
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </Badge>
            )}
          </Button>

          <GuideButton />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2" data-tour="user-menu">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <span className="text-xs font-semibold">{initials}</span>
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium leading-tight text-foreground">
                    Hi, {firstName}
                  </p>
                  <p className="text-xs leading-tight text-muted-foreground">
                    {displayRole}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/profile")}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
