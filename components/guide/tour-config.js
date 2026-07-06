export const TOUR_STORAGE_KEY = "adhivakta-tour-progress-v1";

export const GUIDE_CATEGORIES = [
  {
    id: "getting-started",
    title: "Getting Started",
    guides: [
      {
        id: "application-overview",
        icon: "LayoutDashboard",
        title: "Application Overview",
        description: "Learn the main navigation, header tools, and dashboard workspace.",
        estimatedTime: "1 min",
        difficulty: "Beginner",
        route: "/dashboard",
        steps: [
          {
            selector: "[data-tour='dashboard']",
            title: "Dashboard",
            content: "This is your daily command center for cases, hearings, documents, cause lists, AI tools, and activity.",
          },
          {
            selector: "[data-tour='sidebar-nav']",
            title: "Main navigation",
            content: "Use the sidebar to move between the core workspaces in Adhivakta.",
          },
          {
            selector: "[data-tour='global-search']",
            title: "Global search",
            content: "Search cases and clients from the top bar without leaving your current workflow.",
          },
          {
            selector: "[data-tour='guide-center']",
            title: "Guide center",
            content: "Open this help center anytime to replay walkthroughs or discover another workflow.",
          },
        ],
      },
      {
        id: "complete-profile",
        icon: "UserRound",
        title: "Complete Your Profile",
        description: "Review your advocate profile and update personal details.",
        estimatedTime: "1 min",
        difficulty: "Beginner",
        route: "/dashboard/profile",
        steps: [
          {
            selector: "[data-tour='user-menu']",
            title: "Profile menu",
            content: "Open your account menu from the header to reach profile and settings.",
            route: "/dashboard",
          },
          {
            selector: "[data-tour='profile-page']",
            title: "Profile page",
            content: "Keep your contact, role, and identity details accurate for case collaboration.",
            route: "/dashboard/profile",
          },
        ],
      },
      {
        id: "dashboard-overview",
        icon: "BarChart3",
        title: "Dashboard Overview",
        description: "Understand stats, hearing cards, and recent operational activity.",
        estimatedTime: "1 min",
        difficulty: "Beginner",
        route: "/dashboard",
        steps: [
          {
            selector: "[data-tour='dashboard-stats']",
            title: "Key metrics",
            content: "Track open cases, upcoming hearings, documents, and urgent work from these summary cards.",
          },
          {
            selector: "[data-tour='dashboard-hearings']",
            title: "Upcoming hearings",
            content: "Review upcoming hearing dates and jump into case preparation when needed.",
          },
          {
            selector: "[data-tour='dashboard-activity']",
            title: "Operational activity",
            content: "Use this section to catch recent updates and cause-list related activity.",
          },
        ],
      },
    ],
  },
  {
    id: "cases",
    title: "Cases",
    guides: [
      {
        id: "create-case",
        icon: "FilePlus2",
        title: "Create Your First Case",
        description: "Start a new legal matter and complete the core case form.",
        estimatedTime: "2 min",
        difficulty: "Beginner",
        route: "/dashboard/cases",
        steps: [
          {
            selector: "[data-tour='cases-nav']",
            title: "Cases",
            content: "Open the case register from the sidebar whenever you need to manage matters.",
          },
          {
            selector: "[data-tour='create-case-btn']",
            title: "New Case",
            content: "Click this button to create a new case and register a fresh legal matter.",
          },
          {
            selector: "[data-tour='case-form']",
            title: "Case form",
            content: "Fill required details first, then move through parties, court details, dates, and documents.",
            route: "/dashboard/cases/new",
          },
        ],
      },
      {
        id: "search-cases",
        icon: "Search",
        title: "Search Cases",
        description: "Use case search to find matters quickly.",
        estimatedTime: "1 min",
        difficulty: "Beginner",
        route: "/dashboard/cases",
        steps: [
          {
            selector: "[data-tour='case-search']",
            title: "Case search",
            content: "Type a client name, case number, case title, or court to filter results immediately.",
          },
          {
            selector: "[data-tour='case-list']",
            title: "Filtered results",
            content: "The case register updates to show only matching matters.",
          },
        ],
      },
      {
        id: "filter-cases",
        icon: "SlidersHorizontal",
        title: "Filter Cases",
        description: "Filter by status, hearing state, and priority.",
        estimatedTime: "1 min",
        difficulty: "Beginner",
        route: "/dashboard/cases",
        steps: [
          {
            selector: "[data-tour='case-tabs']",
            title: "Status tabs",
            content: "Switch between active, closed, and all matters from these quick tabs.",
          },
          {
            selector: "[data-tour='case-filter']",
            title: "Advanced filters",
            content: "Combine hearing and priority filters for a more focused case register.",
          },
        ],
      },
    ],
  },
  {
    id: "hearings",
    title: "Hearings",
    guides: [
      {
        id: "add-hearing",
        icon: "CalendarPlus",
        title: "Add Hearing",
        description: "Schedule a hearing from a case or the hearing workspace.",
        estimatedTime: "1 min",
        difficulty: "Beginner",
        route: "/dashboard/hearings",
        steps: [
          {
            selector: "[data-tour='hearings-nav']",
            title: "Hearings",
            content: "Use this workspace to track hearing activity.",
          },
          {
            selector: "[data-tour='hearing-calendar']",
            title: "Schedule hearing",
            content: "Use this action to add a hearing date, connect it to a case, and keep your calendar current.",
          },
        ],
      },
    ],
  },
  {
    id: "documents",
    title: "Documents",
    guides: [
      {
        id: "upload-documents",
        icon: "UploadCloud",
        title: "Upload Documents",
        description: "Add case files and supporting documents.",
        estimatedTime: "1 min",
        difficulty: "Beginner",
        route: "/dashboard/documents",
        steps: [
          {
            selector: "[data-tour='documents-nav']",
            title: "Documents",
            content: "Open this workspace to manage files across all cases.",
          },
          {
            selector: "[data-tour='upload-document-btn']",
            title: "Upload document",
            content: "Click here to upload a document and attach it to the correct matter.",
          },
        ],
      },
      {
        id: "organize-files",
        icon: "FolderKanban",
        title: "Organize Files",
        description: "Group, filter, and review files by case or status.",
        estimatedTime: "1 min",
        difficulty: "Beginner",
        route: "/dashboard/documents",
        steps: [
          {
            selector: "[data-tour='document-view-toggle']",
            title: "View mode",
            content: "Switch between grouped and list views depending on how you want to inspect files.",
          },
          {
            selector: "[data-tour='document-filters']",
            title: "Document filters",
            content: "Search documents and filter by category or review status.",
          },
        ],
      },
      {
        id: "download-documents",
        icon: "Download",
        title: "Download Documents",
        description: "Find and download files when you need them.",
        estimatedTime: "1 min",
        difficulty: "Beginner",
        route: "/dashboard/documents",
        steps: [
          {
            selector: "[data-tour='document-list']",
            title: "Document list",
            content: "Open a file action menu or row controls to preview, review, or download the document.",
          },
        ],
      },
    ],
  },
  {
    id: "cause-list",
    title: "Cause List",
    guides: [
      {
        id: "view-cause-list",
        icon: "Scale",
        title: "View Cause List",
        description: "Open cause list search and fetch court listings.",
        estimatedTime: "1 min",
        difficulty: "Beginner",
        route: "/dashboard/cause-list/search",
        steps: [
          {
            selector: "[data-tour='cause-list-nav']",
            title: "Cause list search",
            content: "Open this workspace to fetch district court and High Court cause lists.",
          },
          {
            selector: "[data-tour='cause-list-search']",
            title: "Search form",
            content: "Choose the court source, court hierarchy, date, captcha, and listing type to fetch a cause list.",
          },
          {
            selector: "[data-tour='cause-list-results']",
            title: "Cause list results",
            content: "Fetched entries appear here with search support so you can inspect listed matters.",
          },
        ],
      },
      {
        id: "personalized-cause-list",
        icon: "BookmarkPlus",
        title: "Personalized Cause List",
        description: "Understand how Adhivakta builds your cause list from tracked cases.",
        estimatedTime: "2 min",
        difficulty: "Intermediate",
        route: "/dashboard/cause-list/search",
        steps: [
          {
            selector: "[data-tour='personalized-cause-list']",
            title: "Personalized cause list",
            content: "This section builds a focused cause list by checking your tracked case numbers against live eCourts listings.",
          },
          {
            selector: "[data-tour='personalized-cause-list-start']",
            title: "Start the workflow",
            content: "Start Personalized Flow finds the courts connected to your saved cases for the selected date.",
          },
          {
            selector: "[data-tour='personalized-cause-list-current-court']",
            title: "Court-by-court matching",
            content: "Adhivakta walks through each court that has your tracked cases. For each court, confirm the court entry and solve the live captcha.",
            lookupAttempts: 80,
            fallbackSelector: "[data-tour='personalized-cause-list']",
            action: {
              type: "click",
              selector: "[data-tour='personalized-cause-list-start']",
            },
          },
          {
            selector: "[data-tour='personalized-cause-list-captcha']",
            title: "Captcha verification",
            content: "Enter the captcha shown by eCourts so Adhivakta can fetch the official civil or criminal listing for this court.",
            fallbackSelector: "[data-tour='personalized-cause-list']",
          },
          {
            selector: "[data-tour='personalized-cause-list-submit']",
            title: "Civil or criminal list",
            content: "Choose Civil or Criminal to fetch that list. The system compares returned entries with your tracked cases and moves to the next court.",
            fallbackSelector: "[data-tour='personalized-cause-list']",
          },
          {
            selector: "[data-tour='personalized-cause-list-results']",
            title: "Matched results",
            content: "Matched entries are collected here. Saved personalized lists remain visible until a new live flow is completed.",
          },
        ],
      },
    ],
  },
  {
    id: "calendar",
    title: "Calendar",
    guides: [
      {
        id: "create-reminder",
        icon: "AlarmClockPlus",
        title: "Create Reminder",
        description: "Add reminders for filings, hearings, and tasks.",
        estimatedTime: "1 min",
        difficulty: "Beginner",
        route: "/dashboard/calendar",
        steps: [
          {
            selector: "[data-tour='calendar-nav']",
            title: "Calendar",
            content: "Use the calendar to manage reminders, hearing dates, and events.",
          },
          {
            selector: "[data-tour='calendar-events']",
            title: "Events",
            content: "Create reminders or events to keep deadlines visible.",
          },
        ],
      },
    ],
  },
  {
    id: "ai-features",
    title: "AI Features",
    guides: [
      {
        id: "ai-prep-room-flow",
        icon: "Sparkles",
        title: "AI Prep Room Feature Flow",
        description: "Select a case, index documents, and use each AI Prep Room feature tab.",
        estimatedTime: "2 min",
        difficulty: "Beginner",
        route: "/dashboard/ai-prep-room",
        steps: [
          {
            selector: "[data-tour='ai-prep-nav']",
            title: "AI Prep Room",
            content: "Open AI Prep Room from the sidebar. Every AI feature is scoped to one selected case.",
          },
          {
            selector: "[data-tour='ai-case-picker']",
            title: "Select a case",
            content: "Choose the case you want the AI to work on. By selecting a case, you allow Adhivakta AI to analyse that case's details and documents for this prep room session.",
          },
          {
            selector: "[data-tour='ai-selected-case']",
            title: "Selected case context",
            content: "After selecting a case, this bar shows the active case, indexing state, document count, and the change-case control.",
          },
          {
            selector: "[data-tour='ai-feature-tabs']",
            title: "AI feature tabs",
            content: "These tabs are the AI feature set: Overview, Hearing Brief, Ask AI, Weaknesses, Practice, and Activity.",
          },
          {
            selector: "[data-tour='ai-tab-brief']",
            title: "Hearing Brief",
            content: "Generate a structured hearing brief from the selected case context.",
            route: "/dashboard/ai-prep-room/brief",
          },
          {
            selector: "[data-tour='ai-tab-ask']",
            title: "Ask AI",
            content: "Ask case-specific questions and review answers grounded in the selected case.",
            route: "/dashboard/ai-prep-room/ask",
          },
          {
            selector: "[data-tour='ai-tab-weaknesses']",
            title: "Weaknesses",
            content: "Surface factual gaps, contradictions, and preparation risks for the selected case.",
            route: "/dashboard/ai-prep-room/weaknesses",
          },
          {
            selector: "[data-tour='ai-tab-practice']",
            title: "Practice",
            content: "Use practice mode to rehearse opposing counsel questions and sharpen responses.",
            route: "/dashboard/ai-prep-room/practice",
          },
          {
            selector: "[data-tour='ai-tab-activity']",
            title: "Activity",
            content: "Review recent AI actions such as brief generation, weakness analysis, and prep work.",
            route: "/dashboard/ai-prep-room/activity",
          },
        ],
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    guides: [
      {
        id: "notifications",
        icon: "BellRing",
        title: "Notifications",
        description: "Manage alert preferences and notification behavior.",
        estimatedTime: "1 min",
        difficulty: "Beginner",
        route: "/dashboard/settings",
        steps: [
          {
            selector: "[data-tour='settings-nav']",
            title: "Settings",
            content: "Open settings to manage account preferences, notifications, and security.",
          },
          {
            selector: "[data-tour='notification-settings-tab']",
            title: "Notification settings",
            content: "Choose which alerts should reach you and how reminders behave.",
          },
        ],
      },
      {
        id: "profile-settings",
        icon: "UserRoundCog",
        title: "Profile Settings",
        description: "Update profile, role, and account details.",
        estimatedTime: "1 min",
        difficulty: "Beginner",
        route: "/dashboard/settings",
        steps: [
          {
            selector: "[data-tour='profile-settings']",
            title: "Profile settings",
            content: "Review your profile and account details from settings.",
          },
        ],
      },
      {
        id: "security",
        icon: "ShieldCheck",
        title: "Security",
        description: "Review security controls and session preferences.",
        estimatedTime: "1 min",
        difficulty: "Intermediate",
        route: "/dashboard/settings",
        steps: [
          {
            selector: "[data-tour='security-settings-tab']",
            title: "Security settings",
            content: "Manage security options such as session timeout and account protection.",
          },
        ],
      },
    ],
  },
];

export const GUIDE_TOURS = GUIDE_CATEGORIES.flatMap((category) =>
  category.guides.map((guide) => ({
    ...guide,
    categoryId: category.id,
    categoryTitle: category.title,
  }))
);

export function getTourById(tourId) {
  return GUIDE_TOURS.find((tour) => tour.id === tourId) || null;
}
