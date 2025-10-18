"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Bell, Shield, Mail, Pencil } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import api from "@/services/api"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
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
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    caseUpdates: true,
    hearingReminders: true,
    documentUploads: true,
    marketingEmails: false,
  })
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: "30",
  })
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "system",
    fontSize: "medium",
    language: "english",
  })
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [currentFontSize, setCurrentFontSize] = useState("medium")
  const [currentLanguage, setCurrentLanguage] = useState("english")

  // Refetch profile data (for save and tab switch)
  const fetchUserProfile = async () => {
    setIsLoading(true)
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

      // Set notification settings if available
      if (profile.data.notificationSettings) {
        setNotificationSettings(profile.data.notificationSettings)
      }

      // Set security settings if available
      if (profile.data.securitySettings) {
        setSecuritySettings(profile.data.securitySettings)
      }

      // Set appearance settings if available
      if (profile.data.appearanceSettings) {
        setAppearanceSettings(profile.data.appearanceSettings)

        // Apply font size from settings
        if (profile.data.appearanceSettings.fontSize) {
          setCurrentFontSize(profile.data.appearanceSettings.fontSize)
          applyFontSize(profile.data.appearanceSettings.fontSize)
        }

        // Apply language from settings
        if (profile.data.appearanceSettings.language) {
          setCurrentLanguage(profile.data.appearanceSettings.language)
        }

        // Apply theme from settings
        if (profile.data.appearanceSettings.theme) {
          setTheme(profile.data.appearanceSettings.theme)
        }
      }
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
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()

    // Initialize font size from localStorage or default
    const savedFontSize = localStorage.getItem("fontSize") || "medium"
    setCurrentFontSize(savedFontSize)
    applyFontSize(savedFontSize)

    // Initialize language from localStorage or default
    const savedLanguage = localStorage.getItem("language") || "english"
    setCurrentLanguage(savedLanguage)
  }, [user, setTheme])

  // Handle tab change
  const [activeTab, setActiveTab] = useState("profile")
  const handleTabChange = (value) => {
    setActiveTab(value)
    if (value === "profile") {
      fetchUserProfile()
      setIsEditing(false)
    }
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    if (name === "phone") {
      // Only allow digits
      if (!/^\d*$/.test(value)) return
      // Validate length
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
  }

  const handleNotificationChange = (name, value) => {
    setNotificationSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSecurityChange = (name, value) => {
    setSecuritySettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleAppearanceChange = (name, value) => {
    setAppearanceSettings((prev) => ({ ...prev, [name]: value }))

    // Apply changes immediately
    if (name === "theme") {
      setTheme(value)
    } else if (name === "fontSize") {
      setCurrentFontSize(value)
      applyFontSize(value)
      localStorage.setItem("fontSize", value)
    } else if (name === "language") {
      setCurrentLanguage(value)
      localStorage.setItem("language", value)
    }
  }

  // Enhanced: Persist theme change immediately
  const handleThemeChange = async (value) => {
    setAppearanceSettings((prev) => ({ ...prev, theme: value }))
    setTheme(value)
    try {
      await api.users.updateAppearance({ ...appearanceSettings, theme: value })
      setSuccessMessage("Theme preference saved!")
    } catch (error) {
      setErrorMessage("Failed to save theme preference.")
    }
  }

  // Function to apply font size to the document
  const applyFontSize = (size) => {
    const html = document.documentElement

    // Remove any existing font size classes
    html.classList.remove("text-sm", "text-base", "text-lg")

    // Apply the appropriate class based on the selected size
    switch (size) {
      case "small":
        html.classList.add("text-sm")
        break
      case "medium":
        html.classList.add("text-base")
        break
      case "large":
        html.classList.add("text-lg")
        break
      default:
        html.classList.add("text-base")
    }
  }

  const updateProfile = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMessage("")
    setErrorMessage("")
    setPhoneError("")
    // Frontend phone validation
    if (profileData.phone && !/^\d{10}$/.test(profileData.phone)) {
      setPhoneError("Phone number must be exactly 10 digits.")
      setIsLoading(false)
      return
    }
    try {
      await api.users.updateProfile(profileData)
      setSuccessMessage("Profile updated successfully")
      setIsEditing(false)
      fetchUserProfile()
      if (refreshUser) await refreshUser(); // Update AuthContext and localStorage
    } catch (error) {
      // Show backend error if available
      setErrorMessage(error.message || "Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const updatePassword = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMessage("")
    setErrorMessage("")

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage("New passwords do not match")
      setIsLoading(false)
      return
    }

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
      setErrorMessage("Failed to update password. Please check your current password and try again.")
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
      await api.users.updateNotifications(notificationSettings)
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
      await api.users.updateSecurity(securitySettings)
      setSuccessMessage("Security settings updated successfully")
    } catch (error) {
      console.error("Error updating security settings:", error)
      setErrorMessage("Failed to update security settings. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const updateAppearance = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
      await api.users.updateAppearance(appearanceSettings)
      setSuccessMessage("Appearance settings updated successfully")
    } catch (error) {
      console.error("Error updating appearance settings:", error)
      setErrorMessage("Failed to update appearance settings. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Translations for multilingual support
  const translations = {
    english: {
      settings: "Settings",
      profile: "Profile",
      password: "Password",
      notifications: "Notifications",
      security: "Security",
      appearance: "Appearance",
      successMessage: successMessage,
      errorMessage: errorMessage,
      saveChanges: "Save Changes",
      saving: "Saving...",
      updatePassword: "Update Password",
      updating: "Updating...",
      savePreferences: "Save Preferences",
      saveSettings: "Save Settings",
    },
    hindi: {
      settings: "सेटिंग्स",
      profile: "प्रोफाइल",
      password: "पासवर्ड",
      notifications: "सूचनाएं",
      security: "सुरक्षा",
      appearance: "दिखावट",
      successMessage: successMessage,
      errorMessage: errorMessage,
      saveChanges: "परिवर्तन सहेजें",
      saving: "सहेज रहा है...",
      updatePassword: "पासवर्ड अपडेट करें",
      updating: "अपडेट हो रहा है...",
      savePreferences: "प्राथमिकताएँ सहेजें",
      saveSettings: "सेटिंग्स सहेजें",
    },
    kannada: {
      settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
      profile: "ಪ್ರೊಫೈಲ್",
      password: "ಪಾಸ್‌ವರ್ಡ್",
      notifications: "ಅಧಿಸೂಚನೆಗಳು",
      security: "ಭದ್ರತೆ",
      appearance: "ರೂಪ",
      successMessage: successMessage,
      errorMessage: errorMessage,
      saveChanges: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
      saving: "ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
      updatePassword: "ಪಾಸ್‌ವರ್ಡ್ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ",
      updating: "ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತಿದೆ...",
      savePreferences: "ಆದ್ಯತೆಗಳನ್ನು ಉಳಿಸಿ",
      saveSettings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಿ",
    },
  }

  // Get current translations based on selected language
  const t = translations[currentLanguage] || translations.english

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.settings}</h1>
      </div>

      {successMessage && <div className="bg-green-50 text-green-800 p-4 rounded-md mb-4">{t.successMessage}</div>}

      {errorMessage && <div className="bg-red-50 text-red-800 p-4 rounded-md mb-4">{errorMessage}</div>}

      <Tabs defaultValue="profile" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">{t.profile}</TabsTrigger>
          <TabsTrigger value="password">{t.password}</TabsTrigger>
          <TabsTrigger value="notifications">{t.notifications}</TabsTrigger>
          <TabsTrigger value="security">{t.security}</TabsTrigger>
          <TabsTrigger value="appearance">{t.appearance}</TabsTrigger>
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
                      onChange={handleProfileChange}
                      required
                      readOnly={!isEditing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" value={profileData.phone} onChange={handleProfileChange} readOnly={!isEditing} />
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
                    placeholder="Tell us about your professional background and expertise"
                    readOnly={!isEditing}
                  />
                </div>
                {isEditing && (
                  <div className="flex justify-end">
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
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
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

        <TabsContent value="notifications">
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

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="security-form" onSubmit={updateSecurity} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => handleSecurityChange("twoFactorAuth", checked)}
                  />
                </div>

                <div className="flex items-center justify-between border-t pt-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Select
                      value={securitySettings.sessionTimeout}
                      onValueChange={(value) => handleSecurityChange("sessionTimeout", value)}
                    >
                      <SelectTrigger id="sessionTimeout">
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
              </form>
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

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize how the application looks and feels</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="appearance-form" onSubmit={updateAppearance} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Theme</h3>
                  <RadioGroup
                    value={appearanceSettings.theme}
                    onValueChange={handleThemeChange}
                    className="grid grid-cols-3 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="light" id="theme-light" className="peer sr-only" />
                      <Label
                        htmlFor="theme-light"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mb-3 h-6 w-6"
                        >
                          <circle cx="12" cy="12" r="4" />
                          <path d="M12 2v2" />
                          <path d="M12 20v2" />
                          <path d="m4.93 4.93 1.41 1.41" />
                          <path d="m17.66 17.66 1.41 1.41" />
                          <path d="M2 12h2" />
                          <path d="M20 12h2" />
                          <path d="m6.34 17.66-1.41 1.41" />
                          <path d="m19.07 4.93-1.41 1.41" />
                        </svg>
                        Light
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="dark" id="theme-dark" className="peer sr-only" />
                      <Label
                        htmlFor="theme-dark"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mb-3 h-6 w-6"
                        >
                          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                        </svg>
                        Dark
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="system" id="theme-system" className="peer sr-only" />
                      <Label
                        htmlFor="theme-system"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mb-3 h-6 w-6"
                        >
                          <rect width="20" height="14" x="2" y="3" rx="2" />
                          <line x1="8" x2="16" y1="21" y2="21" />
                          <line x1="12" x2="12" />
                          <line x1="8" x2="16" y1="21" y2="21" />
                          <line x1="12" x2="12" y1="17" y2="21" />
                        </svg>
                        System
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-sm font-medium">Font Size</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <RadioGroup
                        value={appearanceSettings.fontSize}
                        onValueChange={(value) => handleAppearanceChange("fontSize", value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="small" id="font-small" />
                          <Label htmlFor="font-small">Small</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="font-medium" />
                          <Label htmlFor="font-medium">Medium</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="large" id="font-large" />
                          <Label htmlFor="font-large">Large</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-sm font-medium">Language</h3>
                  <Select
                    value={appearanceSettings.language}
                    onValueChange={(value) => handleAppearanceChange("language", value)}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">Hindi</SelectItem>
                      <SelectItem value="kannada">Kannada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" form="appearance-form" disabled={isLoading}>
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
      </Tabs>
    </div>
  )
}
