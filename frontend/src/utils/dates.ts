export function normalizeDateTimeForApi(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${h}:${min}`
}

export function validateDateString(value: string): { valid: boolean; error?: string } {
  if (!value.trim()) {
    return { valid: false, error: 'Date is required' }
  }
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' }
  }
  return { valid: true }
}

export function formatEntryTimestamp(isoString?: string): string {
  if (!isoString) return '--'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return isoString
  return d.toLocaleString()
}
