"use client"

import { createContext, useContext, useState, useEffect } from "react"

// Define all translations for the application
const translations = {
    english: {
        // Common
        settings: "Settings",
        profile: "Profile",
        password: "Password",
        notifications: "Notifications",
        security: "Security",
        appearance: "Appearance",
        saveChanges: "Save Changes",
        saving: "Saving...",
        updatePassword: "Update Password",
        updating: "Updating...",
        savePreferences: "Save Preferences",
        saveSettings: "Save Settings",
        cancel: "Cancel",
        submit: "Submit",
        loading: "Loading...",
        error: "Error",
        success: "Success",

        // Dashboard
        dashboard: "Dashboard",
        cases: "Cases",
        messages: "Messages",
        documents: "Documents",
        calendar: "Calendar",
        clients: "Clients",
        clientsParties: "Clients & Parties",
        lawyers: "Advocates",
        myCases: "My Cases",
        myLawyers: "My Advocates",
        reports: "Reports",
        help: "Help",

        // Auth
        login: "Login",
        logout: "Logout",
        register: "Register",
        email: "Email",
        forgotPassword: "Forgot Password?",
        rememberMe: "Remember me",
        noAccount: "Don't have an account?",
        alreadyHaveAccount: "Already have an account?",

        // Navigation
        home: "Home",
        about: "About",
        services: "Services",
        contact: "Contact",

        // Profile
        fullName: "Full Name",
        phoneNumber: "Phone Number",
        address: "Address",
        bio: "Bio",

        // Messages
        typeMessage: "Type a message...",
        send: "Send",
        noMessages: "No messages yet",
    },
    hindi: {
        // Common
        settings: "सेटिंग्स",
        profile: "प्रोफाइल",
        password: "पासवर्ड",
        notifications: "सूचनाएं",
        security: "सुरक्षा",
        appearance: "दिखावट",
        saveChanges: "परिवर्तन सहेजें",
        saving: "सहेज रहा है...",
        updatePassword: "पासवर्ड अपडेट करें",
        updating: "अपडेट हो रहा है...",
        savePreferences: "प्राथमिकताएँ सहेजें",
        saveSettings: "सेटिंग्स सहेजें",
        cancel: "रद्द करें",
        submit: "जमा करें",
        loading: "लोड हो रहा है...",
        error: "त्रुटि",
        success: "सफलता",

        // Dashboard
        dashboard: "डैशबोर्ड",
        cases: "मामले",
        messages: "संदेश",
        documents: "दस्तावेज़",
        calendar: "कैलेंडर",
        clients: "मुवक्किल",
        clientsParties: "मुवक्किल और पक्ष",
        lawyers: "वकील",
        myCases: "मेरे मामले",
        myLawyers: "मेरे वकील",
        reports: "रिपोर्ट",
        help: "सहायता",

        // Auth
        login: "लॉगिन",
        logout: "लॉगआउट",
        register: "पंजीकरण",
        email: "ईमेल",
        forgotPassword: "पासवर्ड भूल गए?",
        rememberMe: "मुझे याद रखें",
        noAccount: "खाता नहीं है?",
        alreadyHaveAccount: "पहले से खाता है?",

        // Navigation
        home: "होम",
        about: "हमारे बारे में",
        services: "सेवाएं",
        contact: "संपर्क",

        // Profile
        fullName: "पूरा नाम",
        phoneNumber: "फोन नंबर",
        address: "पता",
        bio: "जीवनी",

        // Messages
        typeMessage: "संदेश लिखें...",
        send: "भेजें",
        noMessages: "अभी कोई संदेश नहीं",
    },
    kannada: {
        // Common
        settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
        profile: "ಪ್ರೊಫೈಲ್",
        password: "ಪಾಸ್‌ವರ್ಡ್",
        notifications: "ಅಧಿಸೂಚನೆಗಳು",
        security: "ಭದ್ರತೆ",
        appearance: "ರೂಪ",
        saveChanges: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
        saving: "ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
        updatePassword: "ಪಾಸ್‌ವರ್ಡ್ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ",
        updating: "ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತಿದೆ...",
        savePreferences: "ಆದ್ಯತೆಗಳನ್ನು ಉಳಿಸಿ",
        saveSettings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಿ",
        cancel: "ರದ್ದುಮಾಡಿ",
        submit: "ಸಲ್ಲಿಸಿ",
        loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
        error: "ದೋಷ",
        success: "ಯಶಸ್ಸು",

        // Dashboard
        dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        cases: "ಪ್ರಕರಣಗಳು",
        messages: "ಸಂದೇಶಗಳು",
        documents: "ದಾಖಲೆಗಳು",
        calendar: "ಕ್ಯಾಲೆಂಡರ್",
        clients: "ಕಕ್ಷಿದಾರರು",
        clientsParties: "ಕಕ್ಷಿದಾರರು ಮತ್ತು ಪಕ್ಷಗಳು",
        lawyers: "ವಕೀಲರು",
        myCases: "ನನ್ನ ಪ್ರಕರಣಗಳು",
        myLawyers: "ನನ್ನ ವಕೀಲರು",
        reports: "ವರದಿಗಳು",
        help: "ಸಹಾಯ",

        // Auth
        login: "ಲಾಗಿನ್",
        logout: "ಲಾಗ್‌ಔಟ್",
        register: "ನೋಂದಣಿ",
        email: "ಇಮೇಲ್",
        forgotPassword: "ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?",
        rememberMe: "ನನ್ನನ್ನು ನೆನಪಿಟ್ಟುಕೊಳ್ಳಿ",
        noAccount: "ಖಾತೆ ಇಲ್ಲವೇ?",
        alreadyHaveAccount: "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?",

        // Navigation
        home: "ಮುಖಪುಟ",
        about: "ನಮ್ಮ ಬಗ್ಗೆ",
        services: "ಸೇವೆಗಳು",
        contact: "ಸಂಪರ್ಕ",

        // Profile
        fullName: "ಪೂರ್ಣ ಹೆಸರು",
        phoneNumber: "ಫೋನ್ ಸಂಖ್ಯೆ",
        address: "ವಿಳಾಸ",
        bio: "ಜೀವನಚರಿತ್ರೆ",

        // Messages
        typeMessage: "ಸಂದೇಶ ಟೈಪ್ ಮಾಡಿ...",
        send: "ಕಳುಹಿಸಿ",
        noMessages: "ಇನ್ನೂ ಸಂದೇಶಗಳಿಲ್ಲ",
    },
}

const LanguageContext = createContext(undefined)

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState("english")
    const [isLoaded, setIsLoaded] = useState(false)

    // Load language from localStorage on mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem("language") || "english"
        setLanguage(savedLanguage)
        setIsLoaded(true)
    }, [])

    // Function to change language
    const changeLanguage = (newLanguage) => {
        setLanguage(newLanguage)
        localStorage.setItem("language", newLanguage)
    }

    // Get translations for current language
    const t = translations[language] || translations.english

    // Expose the full translations object for components that need all languages
    const allTranslations = translations

    return (
        <LanguageContext.Provider
            value={{
                language,
                changeLanguage,
                t,
                allTranslations,
                isLoaded
            }}
        >
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider")
    }
    return context
}

// Export translations for use in components that can't use hooks
export { translations }
