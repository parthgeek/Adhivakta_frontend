const DOCUMENT_NOTIFICATION_TYPES = new Set([
  "document",
  "document_upload",
  "document_review_request",
  "document_reviewed",
]);

export function getNotificationTarget(notification) {
  const link = notification?.link;

  if (!link) {
    return "/dashboard/notifications";
  }

  const normalizedLink = normalizeAppLink(link);

  if (!normalizedLink) {
    return link;
  }

  if (!DOCUMENT_NOTIFICATION_TYPES.has(notification?.type)) {
    return buildRelativeUrl(normalizedLink);
  }

  if (!normalizedLink?.pathname.startsWith("/dashboard/cases/")) {
    return buildRelativeUrl(normalizedLink);
  }

  const params = new URLSearchParams(normalizedLink.search);

  if (params.get("tab") !== "documents") {
    params.set("tab", "documents");
  }

  const nextHash = normalizedLink.hash || "";
  const nextQuery = params.toString();
  return nextQuery
    ? `${normalizedLink.pathname}?${nextQuery}${nextHash}`
    : `${normalizedLink.pathname}${nextHash}`;
}

function buildRelativeUrl({ pathname, search = "", hash = "" }) {
  const nextQuery = search ? `?${search}` : "";
  return `${pathname}${nextQuery}${hash}`;
}

function normalizeAppLink(link) {
  if (!link) return null;

  if (link.startsWith("/")) {
    return splitRelativeUrl(link);
  }

  try {
    const url = new URL(link);
    const pathname = url.pathname || "";

    if (!isSafeAppPath(pathname)) {
      return extractDashboardPath(link);
    }

    return {
      pathname,
      search: url.search.startsWith("?") ? url.search.slice(1) : url.search,
      hash: url.hash || "",
    };
  } catch {
    return extractDashboardPath(link);
  }
}

function splitRelativeUrl(link) {
  const [pathWithQuery, hash = ""] = link.split("#");
  const [pathname, queryString = ""] = pathWithQuery.split("?");
  return {
    pathname,
    search: queryString,
    hash: hash ? `#${hash}` : "",
  };
}

function extractDashboardPath(link) {
  if (typeof link !== "string") return null;

  const match = link.match(/(\/dashboard\/[^\s,?#]+)(\?[^#\s,]*)?(#[^\s,]*)?/i);

  if (!match) {
    return null;
  }

  return {
    pathname: match[1],
    search: match[2] ? match[2].slice(1) : "",
    hash: match[3] || "",
  };
}

function isSafeAppPath(pathname) {
  return (
    typeof pathname === "string" &&
    pathname.startsWith("/") &&
    !pathname.startsWith("//") &&
    !pathname.includes("http://") &&
    !pathname.includes("https://")
  );
}
