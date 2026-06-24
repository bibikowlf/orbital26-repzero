import { addExerciseToDay, deleteExerciseFromDay, updateExerciseField } from '../app/(tabs)/generate-plan'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn() }
}))

jest.mock('../hooks/auth-context', () => ({
  useAuthContext: () => ({ claims: { sub: 'test-user-id' } }),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: jest.fn(),
}))

jest.mock('../components/spacer.jsx', () => 'Spacer')

const MOCK_PLAN = [
  {
    day: 'Monday: Push Day',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: '8-10', notes: '' },
      { name: 'Shoulder Press', sets: 3, reps: '10-12', notes: '' },
    ],
  },
  {
    day: 'Tuesday: Pull Day',
    exercises: [
      { name: 'Deadlift', sets: 4, reps: '6-8', notes: '' },
    ],
  },
]

describe('addExerciseToDay', () => {
  test('adds a blank exercise to the correct day', () => {
    const result = addExerciseToDay(MOCK_PLAN, 0)
    expect(result[0].exercises.length).toBe(3)
    expect(result[1].exercises.length).toBe(1) // other day unchanged
  })

  test('new exercise has empty fields', () => {
    const result = addExerciseToDay(MOCK_PLAN, 0)
    const newEx = result[0].exercises[2]
    expect(newEx.name).toBe('')
    expect(newEx.sets).toBe('')
    expect(newEx.reps).toBe('')
    expect(newEx.notes).toBe('')
  })

  test('does not mutate original plan', () => {
    const original = JSON.parse(JSON.stringify(MOCK_PLAN))
    addExerciseToDay(MOCK_PLAN, 0)
    expect(MOCK_PLAN[0].exercises.length).toBe(original[0].exercises.length)
  })
})

describe('deleteExerciseFromDay', () => {
  test('removes the correct exercise', () => {
    const result = deleteExerciseFromDay(MOCK_PLAN, 0, 0)
    expect(result[0].exercises.length).toBe(1)
    expect(result[0].exercises[0].name).toBe('Shoulder Press')
  })

  test('other days are unaffected', () => {
    const result = deleteExerciseFromDay(MOCK_PLAN, 0, 0)
    expect(result[1].exercises.length).toBe(1)
  })

  test('does not mutate original plan', () => {
    const original = JSON.parse(JSON.stringify(MOCK_PLAN))
    deleteExerciseFromDay(MOCK_PLAN, 0, 0)
    expect(MOCK_PLAN[0].exercises.length).toBe(original[0].exercises.length)
  })
})

describe('updateExerciseField', () => {
  test('updates the correct field', () => {
    const result = updateExerciseField(MOCK_PLAN, 0, 0, 'name', 'Incline Press')
    expect(result[0].exercises[0].name).toBe('Incline Press')
  })

  test('does not affect other exercises', () => {
    const result = updateExerciseField(MOCK_PLAN, 0, 0, 'name', 'Incline Press')
    expect(result[0].exercises[1].name).toBe('Shoulder Press')
  })

  test('does not affect other days', () => {
    const result = updateExerciseField(MOCK_PLAN, 0, 0, 'name', 'Incline Press')
    expect(result[1].exercises[0].name).toBe('Deadlift')
  })

  test('updates sets field correctly', () => {
    const result = updateExerciseField(MOCK_PLAN, 0, 0, 'sets', 5)
    expect(result[0].exercises[0].sets).toBe(5)
  })

  test('does not mutate original plan', () => {
    const original = JSON.parse(JSON.stringify(MOCK_PLAN))
    updateExerciseField(MOCK_PLAN, 0, 0, 'name', 'Incline Press')
    expect(MOCK_PLAN[0].exercises[0].name).toBe(original[0].exercises[0].name)
  })
})