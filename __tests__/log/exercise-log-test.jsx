import { getCurrentWeekDays, getWeekRangeLabel } from '../../app/(tabs)/(log)/exercise-log'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn() }
}))

jest.mock('../../hooks/auth-context', () => ({
  useAuthContext: () => ({ claims: { sub: 'test-user-id' } }),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: jest.fn(),
}))

describe('getCurrentWeekDays', () => {
  test('returns exactly 7 days', () => {
    const days = getCurrentWeekDays(0)
    expect(days.length).toBe(7)
  })

  test('first day label is Mon', () => {
    const days = getCurrentWeekDays(0)
    expect(days[0].label).toBe('Mon')
  })

  test('last day label is Sun', () => {
    const days = getCurrentWeekDays(0)
    expect(days[6].label).toBe('Sun')
  })

  test('dateString is in YYYY-MM-DD format', () => {
    const days = getCurrentWeekDays(0)
    days.forEach(day => {
      expect(day.dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  test('offset=1 shifts week forward by 7 days', () => {
    const current = getCurrentWeekDays(0)
    const next = getCurrentWeekDays(1)
    const currentMonday = new Date(current[0].dateString)
    const nextMonday = new Date(next[0].dateString)
    const diff = (nextMonday - currentMonday) / (1000 * 60 * 60 * 24)
    expect(diff).toBe(7)
  })

  test('offset=-1 shifts week back by 7 days', () => {
    const current = getCurrentWeekDays(0)
    const prev = getCurrentWeekDays(-1)
    const currentMonday = new Date(current[0].dateString)
    const prevMonday = new Date(prev[0].dateString)
    const diff = (currentMonday - prevMonday) / (1000 * 60 * 60 * 24)
    expect(diff).toBe(7)
  })

  test('all 7 days have sequential dates', () => {
    const days = getCurrentWeekDays(0)
    for (let i = 1; i < 7; i++) {
      const prev = new Date(days[i - 1].dateString)
      const curr = new Date(days[i].dateString)
      const diff = (curr - prev) / (1000 * 60 * 60 * 24)
      expect(diff).toBe(1)
    }
  })
})

describe('getWeekRangeLabel', () => {
  test('returns empty string for empty array', () => {
    const result = getWeekRangeLabel([])
    expect(result).toBe('')
  })

  test('returns a non-empty string for valid week', () => {
    const days = getCurrentWeekDays(0)
    const result = getWeekRangeLabel(days)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  test('includes year in the label', () => {
    const days = getCurrentWeekDays(0)
    const result = getWeekRangeLabel(days)
    const year = new Date().getFullYear().toString()
    expect(result).toContain(year)
  })

  test('includes dash separator between dates', () => {
    const days = getCurrentWeekDays(0)
    const result = getWeekRangeLabel(days)
    expect(result).toContain('–')
  })

  test('shows both month names when week spans two months', () => {
    const days = [
      { dateString: '2025-06-30' },
      { dateString: '2025-07-01' },
      { dateString: '2025-07-02' },
      { dateString: '2025-07-03' },
      { dateString: '2025-07-04' },
      { dateString: '2025-07-05' },
      { dateString: '2025-07-06' },
    ]
    const result = getWeekRangeLabel(days)
    expect(result).toContain('June')
    expect(result).toContain('July')
  })

  test('shows single month name when week is within one month', () => {
    const days = [
      { dateString: '2025-06-02' },
      { dateString: '2025-06-03' },
      { dateString: '2025-06-04' },
      { dateString: '2025-06-05' },
      { dateString: '2025-06-06' },
      { dateString: '2025-06-07' },
      { dateString: '2025-06-08' },
    ]
    const result = getWeekRangeLabel(days)
    expect(result).toContain('June')
    expect(result.indexOf('June')).toBe(result.lastIndexOf('June'))
  })
})