const API_URL = process.env.NEXT_PUBLIC_API_URL;
const handleResponse = async (response) => {
  let data;
  try {
    data = await response.json();
  } catch (error) {
    // If response is not JSON, create a proper error
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }

  if (!response.ok) {
    // Handle 401 Unauthorized - trigger logout
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      window.__authLogout
    ) {
      window.__authLogout();
    }

    const errorMessage = data.message || data.errors?.[0]?.msg || response.statusText;
    const error = new Error(errorMessage);
    error.code = data.code; // Preserve error code (e.g., ALREADY_LOGGED_IN)
    error.response = { data, status: response.status };
    throw error;
  }

  return data;
};

// Helper function to get auth token
const getToken = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    console.log("Retrieved token:", token); // Debugging log
    return token;
  }
  return null;
};

// Helper function to create headers with auth token
const createHeaders = (contentType = "application/json") => {
  const headers = {
    "Content-Type": contentType,
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("Request headers:", headers); // Debugging log
  }

  return headers;
};

const api = {
  auth: {
    register: async (userData) => {
      console.log("API Register - Sending:", userData);
      const response = await fetch(`${API_URL}/auth/register`, {  // Changed from /auth/signup
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(userData),
      });

      const data = await handleResponse(response);
      console.log("API Register - Response:", data);
      return data;
    },

    login: async (credentials) => {
      console.log("API Login - Sending:", { email: credentials.email });
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(credentials),
      });

      const data = await handleResponse(response);
      console.log("API Login - Response:", data);
      return data;
    },

    googleLogin: async (data) => {
      const response = await fetch(`${API_URL}/auth/google-login`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(data),
      });

      return handleResponse(response);
    },

    logout: async () => {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: createHeaders(),
      });

      return handleResponse(response);
    },

    logoutOtherSessions: async () => {
      const response = await fetch(`${API_URL}/auth/logout-other-sessions`, {
        method: "POST",
        headers: createHeaders(),
      });

      return handleResponse(response);
    },

    verifyToken: async () => {
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: "GET",
        headers: createHeaders(),
      });

      return handleResponse(response);
    },

    forgotPassword: async (data) => {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(data),
      });

      return handleResponse(response);
    },

    resetPassword: async (token, data) => {
      const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(data),
      });

      return handleResponse(response);
    },

    changePassword: async (data) => {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(data),
      });

      return handleResponse(response);
    },

    getMe: async () => {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        headers: createHeaders(),
      });

      return handleResponse(response);
    },

    resendVerification: async () => {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: createHeaders(),
      });

      return handleResponse(response);
    },

    verifyEmail: async (token) => {
      const response = await fetch(`${API_URL}/auth/verify-email/${token}`, {
        method: "GET",
        headers: createHeaders(),
      });

      return handleResponse(response);
    },


    // NEW: Get current user
    getMe: async () => {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        headers: createHeaders(),
      });

      return handleResponse(response);
    },

    // NEW: Resend verification email
    resendVerification: async () => {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: createHeaders(),
      });

      return handleResponse(response);
    },
  },

  users: {
    getProfile: async () => {
      const response = await fetch(`${API_URL}/profile/profile`, {
        method: "GET",
        headers: createHeaders(),
      });

      return handleResponse(response);
    },

    updateProfile: async (profileData) => {
      const response = await fetch(`${API_URL}/profile/profile`, {
        method: "PUT",
        headers: createHeaders(),
        body: JSON.stringify(profileData),
      });

      return handleResponse(response);
    },

    changePassword: async (passwordData) => {
      const response = await fetch(`${API_URL}/profile/change-password`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(passwordData),
      });

      return handleResponse(response);
    },

    updateAppearance: async (appearanceSettings) => {
      const response = await fetch(`${API_URL}/profile/appearance`, {
        method: "PUT",
        headers: createHeaders(),
        body: JSON.stringify(appearanceSettings),
      });

      return handleResponse(response);
    },

    updateNotifications: async (notificationSettings) => {
      const response = await fetch(`${API_URL}/profile/notifications`, {
        method: "PUT",
        headers: createHeaders(),
        body: JSON.stringify(notificationSettings),
      });

      return handleResponse(response);
    },

    updateSecurity: async (securitySettings) => {
      const response = await fetch(`${API_URL}/profile/security`, {
        method: "PUT",
        headers: createHeaders(),
        body: JSON.stringify(securitySettings),
      });

      return handleResponse(response);
    },
  },

  cases: {
    getAll: async (filters = {}) => {
      // Convert filters object to query string
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value);
        }
      });

      // Set a very high limit to get all cases without pagination
      queryParams.append("limit", "1000");

      const response = await fetch(
        `${API_URL}/cases?${queryParams.toString()}`,
        {
          method: "GET",
          headers: createHeaders(),
        }
      );

      const data = await handleResponse(response);
      console.log("API service - Raw response data:", data);
      console.log("API service - data.data:", data.data);
      console.log(
        "API service - data.data length:",
        data.data ? data.data.length : "No data.data"
      );
      return data.data || [];
    },

    getById: async (id) => {
      const response = await fetch(`${API_URL}/cases/${id}`, {
        method: "GET",
        headers: createHeaders(),
      });

      return handleResponse(response);
    },
    addClientByEmail: async (caseId, email) => {
      const response = await fetch(
        `${API_URL}/cases/${caseId}/clients-by-email`,
        {
          method: "POST",
          headers: createHeaders(),
          body: JSON.stringify({ email }),
        }
      );
      return handleResponse(response);
    },

    addLawyerByEmail: async (caseId, email) => {
      const response = await fetch(
        `${API_URL}/cases/${caseId}/lawyers-by-email`,
        {
          method: "POST",
          headers: createHeaders(),
          body: JSON.stringify({ email }),
        }
      );
      return handleResponse(response);
    },
    create: async (caseData) => {
      const response = await fetch(`${API_URL}/cases`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(caseData),
      });

      const data = await handleResponse(response);
      return data.data;
    },

    update: async (id, caseData) => {
      const response = await fetch(`${API_URL}/cases/${id}`, {
        method: "PUT",
        headers: createHeaders(),
        body: JSON.stringify(caseData),
      });

      const data = await handleResponse(response);
      return data.data;
    },

    delete: async (id) => {
      const response = await fetch(`${API_URL}/cases/${id}`, {
        method: "DELETE",
        headers: createHeaders(),
      });

      return handleResponse(response);
    },

    getStats: async () => {
      const response = await fetch(`${API_URL}/cases/stats`, {
        method: "GET",
        headers: createHeaders(),
      });

      return handleResponse(response);
    },

    getRecent: async () => {
      const response = await fetch(`${API_URL}/cases/recent`, {
        method: "GET",
        headers: createHeaders(),
      });

      const data = await handleResponse(response);
      return data.data || [];
    },

    getTimeline: async (id) => {
      const response = await fetch(`${API_URL}/cases/${id}/timeline`, {
        method: "GET",
        headers: createHeaders(),
      });

      const data = await handleResponse(response);
      return data.data || [];
    },

    sendReminder: async (id) => {
      const response = await fetch(`${API_URL}/cases/${id}/send-reminder`, {
        method: "POST",
        headers: createHeaders(),
      });
      return handleResponse(response);
    },
  },

  documents: {
    getAll: async (filters = {}) => {
      // Convert filters object to query string
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(
        `${API_URL}/documents?${queryParams.toString()}`,
        {
          method: "GET",
          headers: createHeaders(),
        }
      );

      const data = await handleResponse(response);
      return data.data || [];
    },

    getById: async (id) => {
      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: "GET",
        headers: createHeaders(),
      });

      const data = await handleResponse(response);
      return data.data;
    },

    getByCaseId: async (caseId) => {
      const response = await fetch(`${API_URL}/documents?caseId=${caseId}`, {
        method: "GET",
        headers: createHeaders(),
      });

      const data = await handleResponse(response);
      return data.data || [];
    },

    upload: async (formData, onProgress) => {
      // Create XMLHttpRequest to track upload progress
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Setup progress tracking
        if (onProgress) {
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              onProgress(event);
            }
          });
        }

        // Handle response
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (error) {
              reject(new Error("Invalid JSON response"));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || errorData.errors?.[0]?.msg || `Upload failed with status ${xhr.status}`));
            } catch (error) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        // Handle errors
        xhr.onerror = () => {
          reject(new Error("Network error occurred during upload"));
        };

        // Setup and send request
        xhr.open("POST", `${API_URL}/documents/upload`);

        // Add authorization header
        const token = getToken();
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.send(formData);
      });
    },

    // Upload documents directly to a case using multer
    uploadToCaseId: async (caseId, formData, onProgress) => {
      // Create XMLHttpRequest to track upload progress
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Setup progress tracking
        if (onProgress) {
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              onProgress(event);
            }
          });
        }

        // Handle response
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (error) {
              reject(new Error("Invalid JSON response"));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || errorData.errors?.[0]?.msg || `Upload failed with status ${xhr.status}`));
            } catch (error) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        // Handle errors
        xhr.onerror = () => {
          reject(new Error("Network error occurred during upload"));
        };

        // Setup and send request
        xhr.open("POST", `${API_URL}/cases/${caseId}/documents`);

        // Add authorization header
        const token = getToken();
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.send(formData);
      });
    },

    update: async (id, documentData) => {
      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: "PUT",
        headers: createHeaders(),
        body: JSON.stringify(documentData),
      });

      const data = await handleResponse(response);
      return data.data;
    },

    review: async (id, reviewData) => {
      const response = await fetch(`${API_URL}/documents/${id}/review`, {
        method: "PUT",
        headers: createHeaders(),
        body: JSON.stringify(reviewData),
      });

      return handleResponse(response);
    },

    delete: async (id) => {
      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: "DELETE",
        headers: createHeaders(),
      });

      return handleResponse(response);
    },

    share: async (id, users) => {
      const response = await fetch(`${API_URL}/documents/${id}/share`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ users }),
      });

      return handleResponse(response);
    },

    toggleFavorite: async (id) => {
      const response = await fetch(`${API_URL}/documents/${id}/favorite`, {
        method: "POST",
        headers: createHeaders(),
      });

      return handleResponse(response);
    },
  },

  events: {
    getAll: async (filters = {}) => {
      // Convert filters object to query string
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(
        `${API_URL}/events?${queryParams.toString()}`,
        {
          method: "GET",
          headers: createHeaders(),
        }
      );

      const data = await handleResponse(response);
      return data.data || [];
    },

    getById: async (id) => {
      const response = await fetch(`${API_URL}/events/${id}`, {
        method: "GET",
        headers: createHeaders(),
      });

      const data = await handleResponse(response);
      return data.data;
    },

    getByCaseId: async (caseId) => {
      const response = await fetch(`${API_URL}/events?caseId=${caseId}`, {
        method: "GET",
        headers: createHeaders(),
      });

      const data = await handleResponse(response);
      return data.data || [];
    },

    create: async (eventData) => {
      const response = await fetch(`${API_URL}/events`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(eventData),
      });

      const data = await handleResponse(response);
      return data.data;
    },

    update: async (id, eventData) => {
      const response = await fetch(`${API_URL}/events/${id}`, {
        method: "PUT",
        headers: createHeaders(),
        body: JSON.stringify(eventData),
      });

      const data = await handleResponse(response);
      return data.data;
    },

    delete: async (id) => {
      const response = await fetch(`${API_URL}/events/${id}`, {
        method: "DELETE",
        headers: createHeaders(),
      });

      return handleResponse(response);
    },

    sendNotification: async (id) => {
      const response = await fetch(`${API_URL}/events/${id}/notify`, {
        method: "POST",
        headers: createHeaders(),
      });

      return handleResponse(response);
    },
  },

  dashboard: {
    getSummary: async () => {
      const response = await fetch(`${API_URL}/dashboard/summary`, {
        method: "GET",
        headers: createHeaders(),
      });

      const data = await handleResponse(response);
      return (
        data.data || {
          totalCases: 0,
          activeCases: 0,
          closedCases: 0,
          urgentCases: 0,
          upcomingHearings: 0,
          documents: 0,
          successRate: "0%",
          activeClients: 0,
        }
      );
    },

    getRecentCases: async () => {
      const response = await fetch(`${API_URL}/dashboard/recent-cases`, {
        method: "GET",
        headers: createHeaders(),
      });

      const data = await handleResponse(response);
      return data || [];
    },

    getUpcomingEvents: async () => {
      const response = await fetch(`${API_URL}/dashboard/upcoming-events`, {
        method: "GET",
        headers: createHeaders(),
      });

      const data = await handleResponse(response);
      return data || [];
    },
  },

  notifications: {
    getAll: async () => {
      const response = await fetch(`${API_URL}/notifications`, {
        method: "GET",
        headers: createHeaders(),
      });
      const data = await handleResponse(response);
      return data.data || [];
    },
    getUnreadCount: async () => {
      try {
        const response = await fetch(`${API_URL}/notifications/count`, {
          method: "GET",
          headers: createHeaders(),
        });
        const data = await handleResponse(response);
        if (typeof data?.data?.count === "number") {
          return data.data.count;
        }
      } catch (error) {
        if (error?.response?.status !== 404) {
          throw error;
        }
      }

      const notifications = await api.notifications.getAll();
      return notifications.filter((notification) => !notification.read).length;
    },
    markAsRead: async (id) => {
      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: createHeaders(),
      });
      const data = await handleResponse(response);
      return data.data;
    },
    delete: async (id) => {
      const response = await fetch(`${API_URL}/notifications/${id}`, {
        method: "DELETE",
        headers: createHeaders(),
      });
      return handleResponse(response);
    },
  },
  chat: {
    getGroups: async () => {
      const response = await fetch(`${API_URL}/chat/groups`, {
        method: "GET",
        headers: createHeaders(),
      });
      const data = await handleResponse(response);
      return data.data || [];
    },

    getMessages: async (groupId, limit = 100) => {
      const response = await fetch(
        `${API_URL}/chat/groups/${groupId}/messages?limit=${limit}`,
        {
          method: "GET",
          headers: createHeaders(),
        }
      );
      const data = await handleResponse(response);
      return data.data || [];
    },

    sendMessage: async (groupId, messageData) => {
      const response = await fetch(
        `${API_URL}/chat/groups/${groupId}/messages`,
        {
          method: "POST",
          headers: createHeaders(),
          body: JSON.stringify(messageData),
        }
      );
      const data = await handleResponse(response);
      return data.data;
    },

    markAsDelivered: async (groupId) => {
      const response = await fetch(
        `${API_URL}/chat/groups/${groupId}/delivered`,
        {
          method: "POST",
          headers: createHeaders(),
        }
      );
      const data = await handleResponse(response);
      return data.data;
    },

    markAsSeen: async (groupId) => {
      const response = await fetch(
        `${API_URL}/chat/groups/${groupId}/seen`,
        {
          method: "POST",
          headers: createHeaders(),
        }
      );
      const data = await handleResponse(response);
      return data.data;
    },

    markAsRead: async (groupId) => {
      return api.chat.markAsSeen(groupId);
    },

    archiveGroup: async (groupId) => {
      const response = await fetch(`${API_URL}/chat/groups/${groupId}/archive`, {
        method: "PATCH",
        headers: createHeaders(),
      });
      const data = await handleResponse(response);
      return data.data;
    },

    unarchiveGroup: async (groupId) => {
      const response = await fetch(
        `${API_URL}/chat/groups/${groupId}/unarchive`,
        {
          method: "PATCH",
          headers: createHeaders(),
        }
      );
      const data = await handleResponse(response);
      return data.data;
    },

    pinGroup: async (groupId) => {
      const response = await fetch(`${API_URL}/chat/groups/${groupId}/pin`, {
        method: "PATCH",
        headers: createHeaders(),
      });
      const data = await handleResponse(response);
      return data.data;
    },

    unpinGroup: async (groupId) => {
      const response = await fetch(`${API_URL}/chat/groups/${groupId}/unpin`, {
        method: "PATCH",
        headers: createHeaders(),
      });
      const data = await handleResponse(response);
      return data.data;
    },

    getUnreadCounts: async () => {
      const response = await fetch(`${API_URL}/chat/unread-counts`, {
        method: "GET",
        headers: createHeaders(),
      });
      const data = await handleResponse(response);
      return data.data || { groups: {}, total: 0 };
    },

    deleteMessage: async (messageId, scope = "me") => {
      const response = await fetch(`${API_URL}/chat/messages/${messageId}/delete`, {
        method: "PATCH",
        headers: createHeaders(),
        body: JSON.stringify({ scope }),
      });
      const data = await handleResponse(response);
      return data.data;
    },
  },

  // Subscription APIs
  subscriptions: {
    getPlans: async (role) => {
      const url = role
        ? `${API_URL}/subscriptions/plans?role=${role}`
        : `${API_URL}/subscriptions/plans`;
      const response = await fetch(url, {
        method: "GET",
        headers: createHeaders(),
      });
      return handleResponse(response);
    },

    getPlanBySlug: async (slug) => {
      const response = await fetch(`${API_URL}/subscriptions/plans/${slug}`, {
        method: "GET",
        headers: createHeaders(),
      });
      return handleResponse(response);
    },

    getCurrent: async () => {
      const response = await fetch(`${API_URL}/subscriptions/current`, {
        method: "GET",
        headers: createHeaders(),
      });
      return handleResponse(response);
    },

    createOrder: async (planId) => {
      const response = await fetch(`${API_URL}/subscriptions/create-order`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ planId }),
      });
      return handleResponse(response);
    },

    verifyPayment: async (paymentData) => {
      const response = await fetch(`${API_URL}/subscriptions/verify-payment`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(paymentData),
      });
      return handleResponse(response);
    },

    cancel: async (reason) => {
      const response = await fetch(`${API_URL}/subscriptions/cancel`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ reason }),
      });
      return handleResponse(response);
    },

    getPaymentHistory: async () => {
      const response = await fetch(`${API_URL}/subscriptions/payments`, {
        method: "GET",
        headers: createHeaders(),
      });
      return handleResponse(response);
    },

    canCreateAccount: async () => {
      const response = await fetch(`${API_URL}/subscriptions/can-create-account`, {
        method: "GET",
        headers: createHeaders(),
      });
      return handleResponse(response);
    },
  },
};

// Add this function to ensure consistent case data structure
export const normalizeCaseData = (caseData) => {
  // If the case data is already in the expected format, return it
  if (caseData.title && (caseData.caseNumber || caseData.number)) {
    return caseData;
  }

  // Otherwise, transform it to the expected format
  return {
    id: caseData._id || caseData.id,
    title: caseData.title || "Untitled Case",
    number: caseData.caseNumber || caseData.number || "No Number",
    type: caseData.caseType || caseData.type || "Other",
    status: caseData.status || "active",
    court: caseData.court || caseData.courtType || "Not specified",
    courtHall: caseData.courtHall || "N/A",
    district: caseData.district || "Not specified",
    nextHearing: caseData.nextHearingDate || caseData.hearingDate || null,
    client: caseData.client?.name || caseData.client || "No Client",
  };
};

export default api;
