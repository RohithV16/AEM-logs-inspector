import { LogEvent } from '../stores/logStore'

/**
 * Groups similar log entries together based on message patterns.
 * Useful for summarizing large volumes of similar errors.
 */
export function groupSimilarEvents(events: LogEvent[]): any[] {
  const groups: Record<string, { count: number, example: LogEvent }> = {}

  events.forEach(event => {
    // Basic normalization: remove numbers and UUIDs
    const pattern = event.message
      .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '<UUID>')
      .replace(/\d+/g, '<NUM>')
      .substring(0, 200)

    const key = `${event.level}:${pattern}`
    if (!groups[key]) {
      groups[key] = { count: 0, example: event }
    }
    groups[key].count++
  })

  return Object.values(groups).sort((a, b) => b.count - a.count)
}
