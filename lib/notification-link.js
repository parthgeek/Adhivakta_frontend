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

  if (!DOCUMENT_NOTIFICATION_TYPES.has(notification?.type)) {
    return link;
  }

  const normalizedLink = normalizeCaseLink(link);

  if (!normalizedLink?.pathname.startsWith("/dashboard/cases/")) {
    return link;
  }

  const params = new URLSearchParams(normalizedLink.search);

  if (params.get("tab") !== "documents") {
    params.set("tab", "documents");
  }

  const nextQuery = params.toString();
  return nextQuery
    ? `${normalizedLink.pathname}?${nextQuery}${normalizedLink.hash}`
    : `${normalizedLink.pathname}${normalizedLink.hash}`;
}

function normalizeCaseLink(link) {
  if (!link) return null;

  if (link.startsWith("/")) {
    const [pathWithQuery, hash = ""] = link.split("#");
    const [pathname, queryString = ""] = pathWithQuery.split("?");
    return {
      pathname,
      search: queryString,
      hash: hash ? `#${hash}` : "",
    };
  }

  try {
    const url = new URL(link);
    return {
      pathname: url.pathname,
      search: url.search.startsWith("?") ? url.search.slice(1) : url.search,
      hash: url.hash || "",
    };
  } catch {
    return null;
  }
}
