const ALLOWED_EXTENSIONS = ['.log', '.txt', '.gz']

export function validateFilePath(path: string): { valid: boolean; error?: string } {
  const trimmed = path.trim()
  if (!trimmed) {
    return { valid: false, error: 'File path is required' }
  }
  const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => trimmed.endsWith(ext))
  if (!hasAllowedExt) {
    return { valid: false, error: `File extension not allowed (allowed: ${ALLOWED_EXTENSIONS.join(', ')})` }
  }
  return { valid: true }
}

export function parseBatchInput(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function getSearchLabel(logType?: string): string {
  switch (logType) {
    case 'error':
      return 'Search (regex, max 100 chars)'
    case 'request':
    case 'cdn':
      return 'Search URL (substring match)'
    default:
      return 'Search'
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}
