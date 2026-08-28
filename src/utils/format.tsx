export function formatTokens(value: number): string {
  const abs = Math.abs(value)
  if (abs < 1_000) {
    return `${value}`
  }
  if (abs < 1_000_000) {
    return (value / 1_000).toFixed() + 'K'
  }
  if (abs < 1_000_000_000) {
    return (value / 1_000_000).toFixed() + 'M'
  }
  return (value / 1_000_000_000).toFixed() + 'B'
}

export function formatRelativeDate(date: string): string {
  const interval = Math.floor((new Date().getTime() - new Date(date).getTime()) / 86400000)
  if (interval < 1) {
    return 'today'
  }
  if (interval < 2) {
    return 'yesterday'
  }
  if (interval < 7) {
    return `${interval} days ago`
  }
  if (interval < 30) {
    const weeks = Math.round(interval / 7)
    return weeks === 1 ? `${weeks} week ago` : `${weeks} weeks ago`
  }
  if (interval < 365) {
    const months = Math.round(interval / 30)
    return months === 1 ? `${months} month ago` : `${months} months ago`
  }
  const years = Math.round(interval / 365)
  return years === 1 ? `${years} year ago` : `${years} years ago`
}

export function formatLocaleDate(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}
