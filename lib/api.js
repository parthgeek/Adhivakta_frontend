const API_URL = process.env.NEXT_PUBLIC_API_URL 

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json()

  if (!response.ok) {
    const error = data.message || response.statusText
    throw new Error(error)
  }

  return data
}

// Helper function to get auth token
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token")
  }
  return null
}

// Helper function to create headers with auth token
const createHeaders = (contentType = "application/json") => {
  const headers = {
    "Content-Type": contentType,
  }

  const token = getToken()
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return headers
}

const api = {
  auth: {
    register: async (userData) => {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(userData),
      })

      return handleResponse(response)
    },

    login: async (credentials) => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(credentials),
      })

      return handleResponse(response)
    },

    googleLogin: async (data) => {
      const response = await fetch(`${API_URL}/auth/google-login`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(data),
      })

      return handleResponse(response)
    },

    logout: async () => {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: createHeaders(),
      })

      return handleResponse(response)
    },

    verifyToken: async () => {
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: "GET",
        headers: createHeaders(),
      })

      return handleResponse(response)
    },
  },

  users: {
    getProfile: async () => {
      const response = await fetch(`${API_URL}/profile/profile`, {
        method: "GET",
        headers: createHeaders(),
      })

      return handleResponse(response)
    },

    updateProfile: async (profileData) => {
      const response = await fetch(`${API_URL}/profile/profile`, {
        method: "PUT",
        headers: createHeaders(),
        body: JSON.stringify(profileData),
      })

      return handleResponse(response)
    },

    changePassword: async (passwordData) => {
      const response = await fetch(`${API_URL}/profile/change-password`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(passwordData),
      })

      return handleResponse(response)
    },

    updateAppearance: async (appearanceSettings) => {
      const response = await fetch(`${API_URL}/profile/appearance`, {
        method: "PUT",
        headers: createHeaders(),
        body: JSON.stringify(appearanceSettings),
      })

      return handleResponse(response)
    },

    updateNotifications: async (notificationSettings) => {
      const response = await fetch(`${API_URL}/profile/notifications`, {
        method: "PUT",
        headers: createHeaders(),
        body: JSON.stringify(notificationSettings),
      })

      return handleResponse(response)
    },

    updateSecurity: async (securitySettings) => {
      const response = await fetch(`${API_URL}/profile/security`, {
        method: "PUT",
        headers: createHeaders(),
        body: JSON.stringify(securitySettings),
      })

      return handleResponse(response)
    },
  },

  cases: {
    getAll: async (filters = {}) => {
      // Convert filters object to query string
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value)
        }
      })

      const response = await fetch(`${API_URL}/cases?${queryParams.toString()}`, {
        method: "GET",
        headers: createHeaders(),
      })

      const data = await handleResponse(response)
      return data.data || []
    },

    getById: async (id) => {
      const response = await fetch(`${API_URL}/cases/${id}`, {
        method: "GET",
        headers: createHeaders(),
      })

      const data = await handleResponse(response)
      return data.data
    },

    create: async (caseData) => {
      const response = await fetch(`${API_URL}/cases`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(caseData),
      })

      const data = await handleResponse(response)
      return data.data
    },

    update: async (id, caseData) => {
      const response = await fetch(`${API_URL}/cases/${id}`, {
        method: "PUT",
        headers: createHeaders(),
        body: JSON.stringify(caseData),
      })

      const data = await handleResponse(response)
      return data.data
    },

    delete: async (id) => {
      const response = await fetch(`${API_URL}/cases/${id}`, {
        method: "DELETE",
        headers: createHeaders(),
      })

      return handleResponse(response)
    },

    getStats: async () => {
      const response = await fetch(`${API_URL}/cases/stats`, {
        method: "GET",
        headers: createHeaders(),
      })

      return handleResponse(response)
    },

    getRecent: async () => {
      const response = await fetch(`${API_URL}/cases/recent`, {
        method: "GET",
        headers: createHeaders(),
      })

      const data = await handleResponse(response)
      return data.data || []
    },

    getTimeline: async (id) => {
      const response = await fetch(`${API_URL}/cases/${id}/timeline`, {
        method: "GET",
        headers: createHeaders(),
      })

      const data = await handleResponse(response)
      return data.data || []
    },
  },

  documents: {
    getAll: async (filters = {}) => {
      // Convert filters object to query string
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value)
        }
      })

      const response = await fetch(`${API_URL}/documents?${queryParams.toString()}`, {
        method: "GET",
        headers: createHeaders(),
      })

      const data = await handleResponse(response)
      return data.data || []
    },

    getById: async (id) => {
      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: "GET",
        headers: createHeaders(),
      })

      const data = await handleResponse(response)
      return data.data
    },

    upload: async (formData, onProgress) => {
      // Create XMLHttpRequest to track upload progress
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Setup progress tracking
        if (onProgress) {
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              onProgress(event)
            }
          })
        }

        // Handle response
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve(data)
            } catch (error) {
              reject(new Error("Invalid JSON response"))
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }

        // Handle errors
        xhr.onerror = () => {
          reject(new Error("Network error occurred during upload"))
        }

        // Setup and send request
        xhr.open("POST", `${API_URL}/documents/upload`)

        // Add authorization header
        const token = getToken()
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`)
        }

        xhr.send(formData)
      })
    },

    update: async (id, documentData) => {
      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: "PUT",
        headers: createHeaders(),
        body: JSON.stringify(documentData),
      })

      const data = await handleResponse(response)
      return data.data
    },

    delete: async (id) => {
      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: "DELETE",
        headers: createHeaders(),
      })

      return handleResponse(response)
    },

    share: async (id, users) => {
      const response = await fetch(`${API_URL}/documents/${id}/share`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ users }),
      })

      return handleResponse(response)
    },

    toggleFavorite: async (id) => {
      const response = await fetch(`${API_URL}/documents/${id}/favorite`, {
        method: "POST",
        headers: createHeaders(),
      })

      return handleResponse(response)
    },
  },

  events: {
    getAll: async (filters = {}) => {
      // Convert filters object to query string
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value)
        }
      })

      const response = await fetch(`${API_URL}/events?${queryParams.toString()}`, {
        method: "GET",
        headers: createHeaders(),
      })

      const data = await handleResponse(response)
      return data.data || []
    },

    getById: async (id) => {
      const response = await fetch(`${API_URL}/events/${id}`, {
        method: "GET",
        headers: createHeaders(),
      })

      const data = await handleResponse(response)
      return data.data
    },

    create: async (eventData) => {
      const response = await fetch(`${API_URL}/events`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify(eventData),
      })

      const data = await handleResponse(response)
      return data.data
    },

    update: async (id, eventData) => {
      const response = await fetch(`${API_URL}/events/${id}`, {
        method: "PUT",
        headers: createHeaders(),
        body: JSON.stringify(eventData),
      })

      const data = await handleResponse(response)
      return data.data
    },

    delete: async (id) => {
      const response = await fetch(`${API_URL}/events/${id}`, {
        method: "DELETE",
        headers: createHeaders(),
      })

      return handleResponse(response)
    },
  },

  dashboard: {
    getSummary: async () => {
      const response = await fetch(`${API_URL}/dashboard/summary`, {
        method: "GET",
        headers: createHeaders(),
      })

      const data = await handleResponse(response)
      return (
        data.data || {
          activeCases: 0,
          urgentCases: 0,
          upcomingHearings: 0,
          documents: 0,
          successRate: "0%",
        }
      )
    },

    getRecentCases: async () => {
      const response = await fetch(`${API_URL}/dashboard/recent-cases`, {
        method: "GET",
        headers: createHeaders(),
      })

      const data = await handleResponse(response)
      return data || []
    },

    getUpcomingevents: async () => {
      const response = await fetch(`${API_URL}/dashboard/upcoming-events`, {
        method: "GET",
        headers: createHeaders(),
      })

      const data = await handleResponse(response)
      return data || []
    },
  },
}

// Add this function to ensure consistent case data structure
export const normalizeCaseData = (caseData) => {
  // If the case data is already in the expected format, return it
  if (caseData.title && (caseData.caseNumber || caseData.number)) {
    return caseData
  }

  // Otherwise, transform it to the expected format
  return {
    _id: caseData._id || caseData.id,
    title: caseData.title || "Untitled Case",
    caseNumber: caseData.caseNumber || caseData.number || "No Number",
    type: caseData.caseType || caseData.type || "Other",
    status: caseData.status || "active",
    court: caseData.court || caseData.courtType || "Not specified",
    courtHall: caseData.courtHall || "N/A",
    district: caseData.district || "Not specified",
    nextHearing: caseData.nextHearingDate || caseData.hearingDate || null,
    client: caseData.client?.name || caseData.client || "No Client",
  }
}

export const fetchCases = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value)
    })

    const response = await fetch(`${API_URL}/cases?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch cases")
    }

    const result = await response.json()
    // Normalize case data to ensure consistency
    return result.data.map(normalizeCaseData) || []
  } catch (error) {
    console.error("Error fetching cases:", error)
    throw error
  }
}

export default api
export { api }