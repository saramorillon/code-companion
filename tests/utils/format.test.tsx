import { formatTokens, formatRelativeDate, formatLocaleDate } from '../../src/utils/format.js'

describe(formatTokens, () => {
  it('should return value without unit for less than 1 thousand tokens', () => {
    expect(formatTokens(80)).toBe('80')
  })

  it('should return value with K for less than 1 million tokens', () => {
    expect(formatTokens(80_000)).toBe('80K')
  })

  it('should return value with M for less than 1 billion tokens', () => {
    expect(formatTokens(80_000_000)).toBe('80M')
  })

  it('should return value with K for 1 billion tokens or more', () => {
    expect(formatTokens(1_000_000_000)).toBe('1B')
  })

  it('should return value with K for more than 1 billion tokens or more', () => {
    expect(formatTokens(80_000_000_000)).toBe('80B')
  })
})

describe(formatRelativeDate, () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: 0 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return today for an interval lower than a day', () => {
    expect(formatRelativeDate('1970-01-01')).toBe('today')
  })

  it('should return yesterday for an interval lower than two days', () => {
    expect(formatRelativeDate('1969-12-31')).toBe('yesterday')
  })

  it('should return X days ago for an interval lower than a week', () => {
    expect(formatRelativeDate('1969-12-27')).toBe('5 days ago')
  })

  it('should return X weeks ago for an interval of one week', () => {
    expect(formatRelativeDate('1969-12-25')).toBe('1 week ago')
  })

  it('should return X weeks ago for an interval lower than a month', () => {
    expect(formatRelativeDate('1969-12-20')).toBe('2 weeks ago')
  })

  it('should return X month ago for an interval of one month', () => {
    expect(formatRelativeDate('1969-12-01')).toBe('1 month ago')
  })

  it('should return X months ago for an interval lower than a year', () => {
    expect(formatRelativeDate('1969-03-20')).toBe('10 months ago')
  })

  it('should return X year ago for an interval of one year', () => {
    expect(formatRelativeDate('1969-01-01')).toBe('1 year ago')
  })

  it('should return X years ago for an interval bigger than a year', () => {
    expect(formatRelativeDate('1967-03-01')).toBe('3 years ago')
  })
})

describe(formatLocaleDate, () => {
  it('should return year, padded month 1-based and padded day of the month', () => {
    expect(formatLocaleDate(new Date('2026-01-01'))).toBe('2026-01-01')
  })
})
