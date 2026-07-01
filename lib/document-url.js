const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const API_BASE = API_URL.replace(/\/+$/, "");
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

const isAbsoluteUrl = (value = "") => /^https?:\/\//i.test(value);

const normalizePath = (value = "") => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("/api/v1/")) {
    return trimmed.replace(/^\/api\/v1\//, "/api/");
  }

  if (trimmed.startsWith("api/v1/")) {
    return `/${trimmed.replace(/^api\/v1\//, "api/")}`;
  }

  if (trimmed.startsWith("api/")) {
    return `/${trimmed}`;
  }

  if (trimmed.startsWith("uploads/")) {
    return `/${trimmed}`;
  }

  return trimmed;
};

const toAbsoluteUrl = (rawValue) => {
  if (typeof rawValue !== "string") return null;

  const normalized = normalizePath(rawValue);
  if (!normalized) return null;

  if (isAbsoluteUrl(normalized)) return normalized;

  if (normalized.startsWith("/api/")) {
    return API_ORIGIN ? `${API_ORIGIN}${normalized}` : normalized;
  }

  if (normalized.startsWith("/uploads/")) {
    return API_ORIGIN ? `${API_ORIGIN}${normalized}` : normalized;
  }

  if (normalized.startsWith("/")) {
    return API_ORIGIN ? `${API_ORIGIN}${normalized}` : normalized;
  }

  if (API_BASE) {
    return `${API_BASE}/${normalized.replace(/^\/+/, "")}`;
  }

  return normalized;
};

const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token") || localStorage.getItem("token");
};

const appendToken = (url) => {
  if (!url) return null;

  const token = getAuthToken();
  if (!token) return url;

  try {
    const base =
      API_ORIGIN ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const parsed = new URL(url, base);

    // Only append token for backend API endpoints that require auth.
    if (!parsed.pathname.startsWith("/api/")) {
      return parsed.toString();
    }

    if (!parsed.searchParams.get("token")) {
      parsed.searchParams.set("token", token);
    }

    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}token=${encodeURIComponent(token)}`;
  }
};

const appendQuery = (url, key, value) => {
  if (!url) return url;
  try {
    const base =
      API_ORIGIN ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const parsed = new URL(url, base);
    parsed.searchParams.set(key, value);
    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}${key}=${encodeURIComponent(value)}`;
  }
};

/**
 * Build an authenticated URL for a document.
 * @param {object} document
 * @param {{ inline?: boolean }} [opts] inline: open in-browser instead of download
 */
export const getDocumentOpenUrl = (document, opts = {}) => {
  const documentId =
    document?.id || document?._id || document?.raw?._id || document?.raw?.id;

  const fallbackPath = documentId ? `/api/documents/${documentId}/download` : null;

  const rawUrl = [
    document?.fileUrl,
    document?.downloadUrl,
    document?.signedUrl,
    document?.url,
    document?.raw?.downloadUrl,
    document?.raw?.fileUrl,
    document?.raw?.signedUrl,
    document?.raw?.url,
    fallbackPath,
  ].find((candidate) => typeof candidate === "string" && candidate.trim().length > 0);

  let absoluteUrl = toAbsoluteUrl(rawUrl);
  // Guard against a doubled base (e.g. NEXT_PUBLIC_API_URL already ends in /api
  // AND the path is /api/... ) which produces /api/api/ and 404s on deploy.
  if (absoluteUrl) absoluteUrl = absoluteUrl.replace(/\/api\/api\//g, "/api/");

  let url = appendToken(absoluteUrl);
  if (opts.inline) url = appendQuery(url, "disposition", "inline");
  return url;
};
