"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Building2,
  Loader2,
  Bell,
  Clock,
  LogOut,
  Mail,
  Pencil,
  Crown,
  MonitorSmartphone,
  LayoutDashboard,
  UserRoundMinus,
  Users,
} from "lucide-react"
import api from "@/services/api"
import SubscriptionSettings from "@/components/subscription/subscription-settings"
import DashboardCustomizer from "@/components/dashboard/dashboard-customizer"
import { useLanguage } from "@/context/language-context"

const DEFAULT_NOTIFICATION_SETTINGS = {
  emailNotifications: true,
  caseUpdates: true,
  hearingReminders: true,
  documentUploads: true,
  marketingEmails: false,
}

const DEFAULT_SECURITY_SETTINGS = {
  loginAlerts: true,
  sessionTimeout: "30",
  sessionLoginLimit: "1",
}

const VALID_TABS = ["profile", "password", "notifications", "security", "dashboard", "subscription", "organization"]

const SESSION_TIMEOUT_OPTIONS = ["15", "30", "60", "120", "240"]
const SESSION_LOGIN_LIMIT_OPTIONS = ["1", "2", "3"]

const mergeBooleanSettings = (settings, defaults) =>
  Object.keys(defaults).reduce((acc, key) => {
    acc[key] = typeof settings?.[key] === "boolean" ? settings[key] : defaults[key]
    return acc
  }, {})

const normalizeSecuritySettings = (settings) => {
  const sessionTimeout = String(settings?.sessionTimeout ?? DEFAULT_SECURITY_SETTINGS.sessionTimeout)
  const sessionLoginLimit = String(settings?.sessionLoginLimit ?? DEFAULT_SECURITY_SETTINGS.sessionLoginLimit)
  return {
    loginAlerts: typeof settings?.loginAlerts === "boolean" ? settings.loginAlerts : DEFAULT_SECURITY_SETTINGS.loginAlerts,
    sessionTimeout: SESSION_TIMEOUT_OPTIONS.includes(sessionTimeout)
      ? sessionTimeout
      : DEFAULT_SECURITY_SETTINGS.sessionTimeout,
    sessionLoginLimit: SESSION_LOGIN_LIMIT_OPTIONS.includes(sessionLoginLimit)
      ? sessionLoginLimit
      : DEFAULT_SECURITY_SETTINGS.sessionLoginLimit,
  }
}

export default function SettingsPage() {
  const { user, refreshUser, logoutOtherSessions } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isSigningOutSessions, setIsSigningOutSessions] = useState(false)
  const [isOrganizationLoading, setIsOrganizationLoading] = useState(false)
  const [isLeavingOrganization, setIsLeavingOrganization] = useState(false)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [organization, setOrganization] = useState(null)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
    barCouncilNumber: "",
    specialization: "",
    yearsOfExperience: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS)
  const [securitySettings, setSecuritySettings] = useState(DEFAULT_SECURITY_SETTINGS)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const hasOrganization = Boolean(user?.organization?.id || user?.organization?.name)
  const activeOrganizationAdvocates = (organization?.members || []).filter(
    (member) => member.role === "lawyer" && member.status === "active"
  )
  const currentMembership = organization?.currentMembership
  const membershipLabel =
    currentMembership?.role === "admin"
      ? "Organization Admin"
      : currentMembership?.role === "lawyer"
        ? "Advocate"
        : "Member"
  const memberSince = currentMembership?.assignedAt
    ? new Date(currentMembership.assignedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not available"

  // Auto-clear feedback banners
  useEffect(() => {
    if (!successMessage && !errorMessage) return
    const id = setTimeout(() => {
      setSuccessMessage("")
      setErrorMessage("")
    }, 4000)
    return () => clearTimeout(id)
  }, [successMessage, errorMessage])

  // Skeleton Component for Settings
  const SettingsSkeleton = () => (
    <div className="space-y-6" data-tour="settings-page">
      <div className="flex items-center justify-between">
        <div className="h-9 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="w-full">
        <div className="grid w-full grid-cols-2 gap-2 mb-6 md:grid-cols-7">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-24 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Refetch profile data (for save and tab switch)
  const fetchUserProfile = async () => {
    setIsFetching(true)
    try {
      const profile = await api.users.getProfile()
      setProfileData({
        name: profile.data.name || user?.name || "",
        email: profile.data.email || user?.email || "",
        phone: profile.data.phone || "",
        address: profile.data.address || "",
        bio: profile.data.bio || "",
        barCouncilNumber: profile.data.barCouncilNumber || "",
        specialization: profile.data.specialization || "",
        yearsOfExperience: profile.data.yearsOfExperience || "",
      })

      setNotificationSettings(mergeBooleanSettings(profile.data.notificationSettings, DEFAULT_NOTIFICATION_SETTINGS))

      const nextSecurity = normalizeSecuritySettings(profile.data.securitySettings)
      setSecuritySettings(nextSecurity)
      // Keep the inactivity auto-logout (dashboard layout) in sync with the saved value.
      localStorage.setItem("sessionTimeout", nextSecurity.sessionTimeout)
    } catch (error) {
      console.error("Error fetching profile:", error)
      // Fallback to user data from auth context
      if (user) {
        setProfileData((prev) => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
        }))
      }
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (!hasOrganization) {
      setOrganization(null)
      return
    }

    let cancelled = false
    const fetchOrganization = async () => {
      setIsOrganizationLoading(true)
      try {
        const data = await api.organizations.getMine()
        if (!cancelled) {
          setOrganization(data)
        }
      } catch (error) {
        console.error("Error fetching organization:", error)
        if (!cancelled) {
          setOrganization(null)
        }
      } finally {
        if (!cancelled) {
          setIsOrganizationLoading(false)
        }
      }
    }

    fetchOrganization()
    return () => {
      cancelled = true
    }
  }, [hasOrganization, user?.organization?.id])

  // Handle tab change
  const [activeTab, setActiveTab] = useState("profile")

  // Allow deep links such as /dashboard/settings?tab=dashboard
  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab")
    if (VALID_TABS.includes(requestedTab)) {
      setActiveTab(requestedTab)
    }
  }, [])

  const handleTabChange = (value) => {
    setActiveTab(value)
    setSuccessMessage("")
    setErrorMessage("")
    if (value === "profile") {
      fetchUserProfile()
      setIsEditing(false)
    }
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    if (name === "phone") {
      // Only allow up to 10 digits
      if (!/^\d*$/.test(value)) return
      if (value.length > 10) return
      setProfileData((prev) => ({ ...prev, [name]: value }))
      setPhoneError("")
    } else {
      setProfileData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
    setPasswordError("")
  }

  const handleNotificationChange = (name, value) => {
    setNotificationSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSecurityChange = (name, value) => {
    setSecuritySettings((prev) => ({ ...prev, [name]: value }))
  }

  const updateProfile = async (e) => {
    e.preventDefault()
    setSuccessMessage("")
    setErrorMessage("")
    setPhoneError("")

    if (profileData.phone && !/^\d{10}$/.test(profileData.phone)) {
      setPhoneError("Phone number must be exactly 10 digits.")
      return
    }

    setIsLoading(true)
    try {
      await api.users.updateProfile(profileData)
      setSuccessMessage("Profile updated successfully")
      setIsEditing(false)
      await fetchUserProfile()
      if (refreshUser) await refreshUser()
    } catch (error) {
      setErrorMessage(error.message || "Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const updatePassword = async (e) => {
    e.preventDefault()
    setSuccessMessage("")
    setErrorMessage("")
    setPasswordError("")

    if (passwordData.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.")
      return
    }
    if (passwordData.newPassword === passwordData.currentPassword) {
      setPasswordError("New password must be different from the current password.")
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match.")
      return
    }

    setIsLoading(true)
    try {
      await api.users.changePassword(passwordData)
      setSuccessMessage("Password updated successfully")
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error updating password:", error)
      setErrorMessage(error.message || "Failed to update password. Please check your current password and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const updateNotifications = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
      const nextNotificationSettings = mergeBooleanSettings(notificationSettings, DEFAULT_NOTIFICATION_SETTINGS)
      const response = await api.users.updateNotifications(nextNotificationSettings)
      setNotificationSettings(mergeBooleanSettings(response.data, DEFAULT_NOTIFICATION_SETTINGS))
      setSuccessMessage("Notification settings updated successfully")
    } catch (error) {
      console.error("Error updating notification settings:", error)
      setErrorMessage("Failed to update notification settings. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const updateSecurity = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
      const payload = {
        loginAlerts: securitySettings.loginAlerts,
        sessionTimeout: Number(securitySettings.sessionTimeout),
        sessionLoginLimit: Number(securitySettings.sessionLoginLimit),
      }
      const response = await api.users.updateSecurity(payload)
      const nextSecurity = normalizeSecuritySettings(response.data)
      setSecuritySettings(nextSecurity)
      // Apply the new timeout to the active inactivity watcher immediately.
      localStorage.setItem("sessionTimeout", nextSecurity.sessionTimeout)
      setSuccessMessage("Security settings updated successfully")
    } catch (error) {
      console.error("Error updating security settings:", error)
      setErrorMessage("Failed to update security settings. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOutOtherSessions = async () => {
    setIsSigningOutSessions(true)
    setSuccessMessage("")
    setErrorMessage("")
    try {
      await logoutOtherSessions()
    } catch (error) {
      // logoutOtherSessions surfaces its own toast; nothing extra needed here.
    } finally {
      setIsSigningOutSessions(false)
    }
  }

  const handleLeaveOrganization = async () => {
    if (!organization) return

    setIsLeavingOrganization(true)
    setSuccessMessage("")
    setErrorMessage("")
    try {
      await api.organizations.leave()
      setOrganization(null)
      setIsLeaveDialogOpen(false)
      setSuccessMessage(`You have left ${organization.name}.`)
      if (refreshUser) await refreshUser()
    } catch (error) {
      console.error("Error leaving organization:", error)
      setErrorMessage(error.message || "Failed to leave organization. Please try again.")
    } finally {
      setIsLeavingOrganization(false)
    }
  }

  if (isFetching) {
    return <SettingsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.settings}</h1>
      </div>

      {successMessage && <div className="bg-green-50 text-green-800 p-4 rounded-md mb-4">{successMessage}</div>}

      {errorMessage && <div className="bg-red-50 text-red-800 p-4 rounded-md mb-4">{errorMessage}</div>}

      <Tabs defaultValue="profile" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-7">
          <TabsTrigger value="profile" data-tour="profile-settings">{t.profile}</TabsTrigger>
          <TabsTrigger value="password">{t.password}</TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="notifications" data-tour="notification-settings-tab">{t.notifications}</TabsTrigger>
          <TabsTrigger value="security" data-tour="security-settings-tab">{t.security}</TabsTrigger>
          <TabsTrigger
            value="dashboard"
            data-tour="dashboard-settings-tab"
            className="flex items-center gap-1"
          >
            <LayoutDashboard className="h-3 w-3" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-1">
            <Crown className="h-3 w-3" />
            Subscription
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and professional details</CardDescription>
              </div>
              {!isEditing && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label="Edit Profile">
                  <Pencil className="h-5 w-5" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <form id="profile-form" onSubmit={updateProfile} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={profileData.name} onChange={handleProfileChange} required readOnly={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      readOnly
                      disabled
                      className="bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground">Email is your sign-in identity and cannot be changed here.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      inputMode="numeric"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      readOnly={!isEditing}
                      placeholder="10-digit mobile number"
                    />
                    {phoneError && <div className="text-red-600 text-xs mt-1">{phoneError}</div>}
                  </div>
                  {user?.role === "lawyer" && (
                    <div className="space-y-2">
                      <Label htmlFor="barCouncilNumber">Bar Council Number</Label>
                      <Input
                        id="barCouncilNumber"
                        name="barCouncilNumber"
                        value={profileData.barCouncilNumber}
                        onChange={handleProfileChange}
                        readOnly={!isEditing}
                      />
                    </div>
                  )}
                </div>

                {user?.role === "lawyer" && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        name="specialization"
                        value={profileData.specialization}
                        onChange={handleProfileChange}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                      <Input
                        id="yearsOfExperience"
                        name="yearsOfExperience"
                        type="number"
                        min="0"
                        value={profileData.yearsOfExperience}
                        onChange={handleProfileChange}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={profileData.address}
                    onChange={handleProfileChange}
                    rows={3}
                    readOnly={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    rows={4}
                    maxLength={500}
                    placeholder="Tell us about your professional background and expertise"
                    readOnly={!isEditing}
                  />
                  {isEditing && (
                    <p className="text-xs text-muted-foreground text-right">{profileData.bio.length}/500</p>
                  )}
                </div>
                {isEditing && (
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        setPhoneError("")
                        fetchUserProfile()
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" form="profile-form" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t.saving}
                        </>
                      ) : (
                        t.saveChanges
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Organization</CardTitle>
                  <CardDescription>View your organization membership and access details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isOrganizationLoading ? (
                <div className="flex min-h-[180px] items-center justify-center rounded-md border border-dashed">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : organization ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-md border p-4">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Organization Name</p>
                      <p className="mt-1 text-base font-semibold text-foreground">{organization.name}</p>
                    </div>
                    <div className="rounded-md border p-4">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Your Role</p>
                      <div className="mt-2">
                        <Badge variant="secondary">{membershipLabel}</Badge>
                      </div>
                    </div>
                    <div className="rounded-md border p-4">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Member Since</p>
                      <p className="mt-1 text-base font-semibold text-foreground">{memberSince}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Users className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Organization Advocates</p>
                        <p className="text-sm text-muted-foreground">
                          {activeOrganizationAdvocates.length} active advocate{activeOrganizationAdvocates.length !== 1 ? "s" : ""} are registered under this organization.
                        </p>
                      </div>
                    </div>
                    {organization.isAdmin && (
                      <Button type="button" variant="outline" onClick={() => router.push("/dashboard/organization")}>
                        Manage Organization
                      </Button>
                    )}
                  </div>

                  {!organization.isAdmin && user?.role === "lawyer" && (
                    <div className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <UserRoundMinus className="mt-0.5 h-5 w-5 text-red-700" />
                        <div>
                          <p className="font-medium text-red-950">Leave Organization</p>
                          <p className="text-sm text-red-800">
                            Your account will be removed from this organization, and the organization admin will no longer see your cases in their organization dashboard.
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setIsLeaveDialogOpen(true)}
                        disabled={isLeavingOrganization}
                      >
                        Leave Organization
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-md border border-dashed p-8 text-center">
                  <p className="font-medium text-foreground">No organization linked</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This account is not currently registered under an organization.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="password-form" onSubmit={updatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                {passwordError && <div className="text-red-600 text-xs">{passwordError}</div>}
              </form>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" form="password-form" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.updating}
                  </>
                ) : (
                  t.updatePassword
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" data-tour="notification-settings">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="notifications-form" onSubmit={updateNotifications} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
                  />
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-sm font-medium">Notification Types</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="caseUpdates" className="flex items-center space-x-2">
                        <span>Case Updates</span>
                      </Label>
                      <Switch
                        id="caseUpdates"
                        checked={notificationSettings.caseUpdates}
                        onCheckedChange={(checked) => handleNotificationChange("caseUpdates", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hearingReminders" className="flex items-center space-x-2">
                        <span>Hearing Reminders</span>
                      </Label>
                      <Switch
                        id="hearingReminders"
                        checked={notificationSettings.hearingReminders}
                        onCheckedChange={(checked) => handleNotificationChange("hearingReminders", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="documentUploads" className="flex items-center space-x-2">
                        <span>Document Uploads</span>
                      </Label>
                      <Switch
                        id="documentUploads"
                        checked={notificationSettings.documentUploads}
                        onCheckedChange={(checked) => handleNotificationChange("documentUploads", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="marketingEmails" className="flex items-center space-x-2">
                        <span>Marketing Emails</span>
                      </Label>
                      <Switch
                        id="marketingEmails"
                        checked={notificationSettings.marketingEmails}
                        onCheckedChange={(checked) => handleNotificationChange("marketingEmails", checked)}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" form="notifications-form" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.saving}
                  </>
                ) : (
                  t.savePreferences
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" data-tour="security-settings">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="security-form" onSubmit={updateSecurity} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Login Alerts</p>
                      <p className="text-sm text-muted-foreground">Receive alerts for new login attempts</p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.loginAlerts}
                    onCheckedChange={(checked) => handleSecurityChange("loginAlerts", checked)}
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-start space-x-2">
                    <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically sign out after this period of inactivity.
                      </p>
                      <Select
                        value={securitySettings.sessionTimeout}
                        onValueChange={(value) => handleSecurityChange("sessionTimeout", value)}
                      >
                        <SelectTrigger id="sessionTimeout" className="max-w-xs">
                          <SelectValue placeholder="Select timeout duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="240">4 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-start space-x-2">
                    <MonitorSmartphone className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="sessionLoginLimit">Session Login Limit</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow this account to stay signed in on up to this many active sessions.
                      </p>
                      <Select
                        value={securitySettings.sessionLoginLimit}
                        onValueChange={(value) => handleSecurityChange("sessionLoginLimit", value)}
                      >
                        <SelectTrigger id="sessionLoginLimit" className="max-w-xs">
                          <SelectValue placeholder="Select active sessions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 session</SelectItem>
                          <SelectItem value="2">2 sessions</SelectItem>
                          <SelectItem value="3">3 sessions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </form>

              <div className="mt-6 border-t pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start space-x-2">
                    <LogOut className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Active Sessions</p>
                      <p className="text-sm text-muted-foreground">
                        Sign out everywhere else while staying logged in here.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSignOutOtherSessions}
                    disabled={isSigningOutSessions}
                  >
                    {isSigningOutSessions ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing out...
                      </>
                    ) : (
                      "Sign out other sessions"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" form="security-form" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.saving}
                  </>
                ) : (
                  t.saveSettings
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" data-tour="dashboard-settings">
          <DashboardCustomizer />
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionSettings />
        </TabsContent>
      </Tabs>

      <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave {organization?.name || "organization"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your advocate account from the organization. You will keep your account, but organization admins will no longer have organization-level access to your advocate data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeavingOrganization}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                handleLeaveOrganization()
              }}
              disabled={isLeavingOrganization}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLeavingOrganization ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Leaving...
                </>
              ) : (
                "Leave Organization"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
