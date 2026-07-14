const API_URL = process.env.NEXT_PUBLIC_API_URL 

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json()

  if (!response.ok) {
    const isAuthAttempt = /\/auth\/(login|google-login|register|forgot-password|reset-password)(\/|$)/.test(
      response.url || ""
    )
    const hasStoredToken = Boolean(getToken())

    if (
      response.status === 401 &&
      hasStoredToken &&
      !isAuthAttempt &&
      typeof window !== "undefined" &&
      window.__authLogout
    ) {
      window.__authLogout()
    }

    const errorMessage = data.message || data.errors?.[0]?.msg || response.statusText
    const error = new Error(errorMessage)
    error.code = data.code
    error.response = { data, status: response.status }
    throw error
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

  // ===== AI Prep Room (case-scoped RAG) =====
  aiPrep: {
    getConfig: async () => {
      const response = await fetch(`${API_URL}/ai-prep/config`, {
        method: "GET",
        headers: createHeaders(),
      })
      const data = await handleResponse(response)
      return data.data
    },

    getStatus: async (caseId) => {
      const response = await fetch(`${API_URL}/ai-prep/cases/${caseId}/status`, {
        method: "GET",
        headers: createHeaders(),
      })
      const data = await handleResponse(response)
      return data.data
    },

    ingest: async (caseId) => {
      const response = await fetch(`${API_URL}/ai-prep/cases/${caseId}/ingest`, {
        method: "POST",
        headers: createHeaders(),
      })
      const data = await handleResponse(response)
      return data.data
    },

    ask: async (caseId, query, history = []) => {
      const response = await fetch(`${API_URL}/ai-prep/cases/${caseId}/ask`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ query, history }),
      })
      const data = await handleResponse(response)
      return data.data
    },

    brief: async (caseId) => {
      const response = await fetch(`${API_URL}/ai-prep/cases/${caseId}/brief`, {
        method: "POST",
        headers: createHeaders(),
      })
      const data = await handleResponse(response)
      return data.data
    },

    weaknesses: async (caseId) => {
      const response = await fetch(`${API_URL}/ai-prep/cases/${caseId}/weaknesses`, {
        method: "POST",
        headers: createHeaders(),
      })
      const data = await handleResponse(response)
      return data.data
    },

    practice: async (caseId, history = []) => {
      const response = await fetch(`${API_URL}/ai-prep/cases/${caseId}/practice`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ history }),
      })
      const data = await handleResponse(response)
      return data.data
    },
  },

  // ===== NyaAI (workspace-wide assistant) =====
  nyaai: {
    getConfig: async () => {
      const response = await fetch(`${API_URL}/nyaai/config`, {
        method: "GET",
        headers: createHeaders(),
      })
      const data = await handleResponse(response)
      return data.data
    },

    /**
     * Streaming chat turn over SSE.
     * handlers: { onMeta, onTool, onDelta, onReset, onDone, onError }
     * Returns the final `done` payload (or throws).
     */
    chatStream: async ({ message, conversationId, caseId }, handlers = {}) => {
      const response = await fetch(`${API_URL}/nyaai/chat`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ message, conversationId, caseId }),
      })

      if (!response.ok || !response.body) {
        let msg = "NyaAI request failed"
        try {
          const err = await response.json()
          msg = err.message || msg
        } catch {}
        throw new Error(msg)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let done = null

      const dispatch = (event, payload) => {
        if (event === "meta") handlers.onMeta?.(payload)
        else if (event === "tool") handlers.onTool?.(payload)
        else if (event === "delta") handlers.onDelta?.(payload)
        else if (event === "reset") handlers.onReset?.()
        else if (event === "done") {
          done = payload
          handlers.onDone?.(payload)
        } else if (event === "error") {
          handlers.onError?.(payload)
          throw new Error(payload.message || "NyaAI failed to answer.")
        }
      }

      while (true) {
        const { value, done: finished } = await reader.read()
        if (finished) break
        buffer += decoder.decode(value, { stream: true })

        // SSE frames are separated by a blank line.
        let idx
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 2)
          let event = "message"
          let data = ""
          for (const line of frame.split("\n")) {
            if (line.startsWith("event: ")) event = line.slice(7).trim()
            else if (line.startsWith("data: ")) data += line.slice(6)
          }
          if (data) dispatch(event, JSON.parse(data))
        }
      }

      if (!done) throw new Error("NyaAI stream ended unexpectedly.")
      return done
    },

    /** Non-streaming chat turn (fallback). */
    chat: async ({ message, conversationId, caseId }) => {
      const response = await fetch(`${API_URL}/nyaai/chat`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ message, conversationId, caseId, stream: false }),
      })
      const data = await handleResponse(response)
      return data.data
    },

    listConversations: async () => {
      const response = await fetch(`${API_URL}/nyaai/conversations`, {
        method: "GET",
        headers: createHeaders(),
      })
      const data = await handleResponse(response)
      return data.data
    },

    getConversation: async (id) => {
      const response = await fetch(`${API_URL}/nyaai/conversations/${id}`, {
        method: "GET",
        headers: createHeaders(),
      })
      const data = await handleResponse(response)
      return data.data
    },

    deleteConversation: async (id) => {
      const response = await fetch(`${API_URL}/nyaai/conversations/${id}`, {
        method: "DELETE",
        headers: createHeaders(),
      })
      return handleResponse(response)
    },

    getDigest: async () => {
      const response = await fetch(`${API_URL}/nyaai/digest`, {
        method: "GET",
        headers: createHeaders(),
      })
      const data = await handleResponse(response)
      return data.data
    },

    getReminders: async () => {
      const response = await fetch(`${API_URL}/nyaai/reminders`, {
        method: "GET",
        headers: createHeaders(),
      })
      const data = await handleResponse(response)
      return data.data
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
    type: caseData.caseSubType || caseData.caseType || caseData.type || "Other",
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
