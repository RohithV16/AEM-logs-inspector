export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleString()
  } catch (e) {
    return dateStr
  }
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function highlightText(text: string, query: string): string {
  if (!query) return escapeHtml(text)
  const escapedText = escapeHtml(text)
  const escapedQuery = escapeHtml(query)
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  return escapedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
}
