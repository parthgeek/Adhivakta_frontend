// Display helpers. All dates render in the viewer's local timezone with the
// zone made explicit, since court data is entered in IST.

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
})

const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" })

export const formatDateTime = (value) => {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date)
}

export const formatDate = (value) => {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date)
}

export const formatRelative = (value) => {
  if (!value) return "—"
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.round(diffMs / 60000)
  if (Math.abs(minutes) < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return `${days}d ago`
  return formatDate(date)
}

export const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B"
  if (!bytes && bytes !== 0) return "—"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

// Amounts are stored in the smallest currency unit (paise)
export const formatMoney = (amount, currency = "INR") => {
  if (amount === null || amount === undefined) return "—"
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount / 100)
}

export const formatNumber = (value) => {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("en-IN").format(value)
}

export const titleCase = (value = "") =>
  String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
