// Admin API client. Mirrors the main frontend's conventions:
// JWT in localStorage, JSON errors as { errors: [{ msg }] } or { message }.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api"

// Shared with the customer app for single sign-on: an admin already logged
// into the main site is authenticated here too.
const TOKEN_KEY = "auth_token"

export const getToken = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token) => {
  if (typeof window === "undefined") return
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

const handleResponse = async (response) => {
  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`Server error: ${response.status} ${response.statusText}`)
  }

  if (!response.ok) {
    if (response.status === 401 && getToken() && typeof window !== "undefined" && window.__adminLogout) {
      window.__adminLogout()
    }
    const error = new Error(data.message || data.errors?.[0]?.msg || response.statusText)
    error.code = data.code
    error.status = response.status
    error.response = { data, status: response.status }
    throw error
  }
  return data
}

export const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      query.set(key, value)
    }
  })
  const str = query.toString()
  return str ? `?${str}` : ""
}

const request = async (path, { method = "GET", body, headers = {} } = {}) => {
  const token = getToken()
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
    return handleResponse(response)
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(`Cannot reach the API server at ${API_URL}. Check that the backend is running and CORS allows this frontend URL.`)
    }
    throw err
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path, body) => request(path, { method: "DELETE", body }),
}

// Streams a CSV export to the browser as a file download
export const downloadCsv = async (path, filename) => {
  const token = getToken()
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(`Cannot reach the API server at ${API_URL}.`)
    }
    throw err
  }
  if (!response.ok) {
    let message = `Export failed (${response.status})`
    try {
      const data = await response.json()
      message = data.message || data.errors?.[0]?.msg || message
    } catch { /* non-JSON error body */ }
    throw new Error(message)
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
