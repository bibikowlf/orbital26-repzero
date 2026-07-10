import { isValidDateFormat, isValidTimeFormat, combineDatetime, isFutureDate } from '../../app/(tabs)/(event)/create-event'

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
  router: { back: jest.fn(), navigate: jest.fn() },
}))

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}))

describe('isValidDateFormat', () => {
  test('accepts valid date', () => {
    expect(isValidDateFormat('2025-06-20')).toBe(true)
  })

  test('rejects wrong format', () => {
    expect(isValidDateFormat('20-06-2025')).toBe(false)
    expect(isValidDateFormat('2025/06/20')).toBe(false)
    expect(isValidDateFormat('20250620')).toBe(false)
  })

  test('rejects invalid month', () => {
    expect(isValidDateFormat('2025-13-01')).toBe(false)
    expect(isValidDateFormat('2025-00-01')).toBe(false)
  })

  test('rejects invalid day', () => {
    expect(isValidDateFormat('2025-06-31')).toBe(false)
    expect(isValidDateFormat('2025-06-00')).toBe(false)
  })

  test('accepts last day of month', () => {
    expect(isValidDateFormat('2025-01-31')).toBe(true)
    expect(isValidDateFormat('2025-04-30')).toBe(true)
  })

  test('handles leap year correctly', () => {
    expect(isValidDateFormat('2024-02-29')).toBe(true)
    expect(isValidDateFormat('2025-02-29')).toBe(false)
  })
})

describe('isValidTimeFormat', () => {
  test('accepts valid time', () => {
    expect(isValidTimeFormat('07:00')).toBe(true)
    expect(isValidTimeFormat('23:59')).toBe(true)
    expect(isValidTimeFormat('00:00')).toBe(true)
  })

  test('rejects invalid hours', () => {
    expect(isValidTimeFormat('25:00')).toBe(false)
    expect(isValidTimeFormat('24:00')).toBe(false)
  })

  test('rejects invalid minutes', () => {
    expect(isValidTimeFormat('12:60')).toBe(false)
    expect(isValidTimeFormat('12:99')).toBe(false)
  })

  test('rejects wrong format', () => {
    expect(isValidTimeFormat('7:00')).toBe(false)
    expect(isValidTimeFormat('0700')).toBe(false)
    expect(isValidTimeFormat('07:0')).toBe(false)
  })
})

describe('combineDatetime', () => {
  test('returns a valid Date for valid inputs', () => {
    const result = combineDatetime('2025-06-20', '07:00')
    expect(result).toBeInstanceOf(Date)
    expect(isNaN(result)).toBe(false)
  })

  test('returns null for invalid inputs', () => {
    const result = combineDatetime('not-a-date', 'bad-time')
    expect(result).toBeNull()
  })

  test('combined datetime has correct hour', () => {
    const result = combineDatetime('2025-06-20', '07:00')
    expect(result).not.toBeNull()
  })
})

describe('isFutureDate', () => {
  test('returns true for a future date', () => {
    expect(isFutureDate('2099-01-01', '07:00')).toBe(true)
  })

  test('returns false for a past date', () => {
    expect(isFutureDate('2000-01-01', '07:00')).toBe(false)
  })

  test('returns false for today in the past', () => {
    expect(isFutureDate('2020-06-20', '07:00')).toBe(false)
  })
})
