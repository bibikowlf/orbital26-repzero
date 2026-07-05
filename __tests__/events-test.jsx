import { formatEventDate, filterEvents } from '../app/(tabs)/(event)/events'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}))

jest.mock('../hooks/auth-context', () => ({
  useAuthContext: () => ({
    claims: { sub: 'test-user-id' }
  }),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: jest.fn(),
}))

const MOCK_EVENTS = [
  {
    id: '1',
    title: 'Morning Run',
    category: 'Cardio',
    event_date: '2025-06-20T07:00:00+08:00',
    user_rsvp: [{ status: 'going' }],
  },
  {
    id: '2',
    title: 'Push Day',
    category: 'Strength',
    event_date: '2025-06-22T10:00:00+08:00',
    user_rsvp: [],
  },
  {
    id: '3',
    title: 'Yoga Session',
    category: 'Flexibility',
    event_date: '2025-06-18T08:00:00+08:00',
    user_rsvp: [],
  },
]

describe('formatEventDate', () => {
  test('returns day and time strings', () => {
    const { day, time } = formatEventDate('2025-06-20T07:00:00+08:00')
    expect(typeof day).toBe('string')
    expect(typeof time).toBe('string')
    expect(day.length).toBeGreaterThan(0)
    expect(time.length).toBeGreaterThan(0)
  })

  test('time format contains colon', () => {
    const { time } = formatEventDate('2025-06-20T07:00:00+08:00')
    expect(time).toContain(':')
  })
})

describe('filterEvents', () => {
  test('All Events tab returns all events', () => {
    const result = filterEvents(MOCK_EVENTS, 'All Events', 'All', 'date_asc')
    expect(result.length).toBe(3)
  })

  test('Going tab returns only rsvpd events', () => {
    const result = filterEvents(MOCK_EVENTS, 'Going', 'All', 'date_asc')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  test('category filter returns only matching events', () => {
    const result = filterEvents(MOCK_EVENTS, 'All Events', 'Strength', 'date_asc')
    expect(result.length).toBe(1)
    expect(result[0].title).toBe('Push Day')
  })

  test('Going + category filter combines both', () => {
    const result = filterEvents(MOCK_EVENTS, 'Going', 'Cardio', 'date_asc')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  test('Going + wrong category returns empty', () => {
    const result = filterEvents(MOCK_EVENTS, 'Going', 'Strength', 'date_asc')
    expect(result.length).toBe(0)
  })

  test('date_asc sorts earliest first', () => {
    const result = filterEvents(MOCK_EVENTS, 'All Events', 'All', 'date_asc')
    expect(result[0].id).toBe('3')
    expect(result[2].id).toBe('2')
  })

  test('date_desc sorts latest first', () => {
    const result = filterEvents(MOCK_EVENTS, 'All Events', 'All', 'date_desc')
    expect(result[0].id).toBe('2')
    expect(result[2].id).toBe('3')
  })
})