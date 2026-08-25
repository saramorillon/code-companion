export function daysAgoLabel(date: Date): string {
  const today = new Date()
  const msPerDay = 24 * 60 * 60 * 1000
  const daysAgo = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - date.getTime()) / msPerDay,
  )
  if (daysAgo <= 0) return 'today'
  if (daysAgo === 1) return 'yesterday'
  return `${daysAgo} days ago`
}

export function parseLocalDate(date: string): Date {
  const [year, month, dayOfMonth] = date.split('-').map(Number) as [number, number, number]
  return new Date(year, month - 1, dayOfMonth)
}
