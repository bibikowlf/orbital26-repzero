import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { Alert } from 'react-native'
import WorkoutTutorial from '../../app/(tabs)/(tutorial)/workout-tutorial'
import { supabase } from '../../lib/supabase'

const mockInitialWorkouts = [
  { id: 1, name: 'Bench Press' },
  { id: 2, name: 'Squat' },
]

let mockActiveChains = {}

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn((table) => {
      if (!mockActiveChains[table]) {
        const builder = {
          select: jest.fn().mockImplementation(() => {
            return Promise.resolve({ data: mockInitialWorkouts, error: null })
          }),
          insert: jest.fn((payload) => {
            builder._payload = payload
            return builder
          }),
        }
        builder.select.mockImplementation(() => {
          if (builder._payload) {
            return Promise.resolve({ data: [{ id: 3, name: builder._payload.name }], error: null })
          }
          return Promise.resolve({ data: mockInitialWorkouts, error: null })
        })
        mockActiveChains[table] = builder
      }
      return mockActiveChains[table]
    }),
  },
}))

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn() },
}))
jest.mock('../../components/spacer', () => () => null)
jest.mock('../../styles/styles', () => ({ appStyles: {} }))

describe('WorkoutTutorial Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    mockActiveChains = {}
  })

  it('attempting to add existing workout triggers an alert and does not succeed', async () => {
    await act(async () => render(<WorkoutTutorial />))
    
    const newWorkoutInput = screen.getByPlaceholderText('Enter new workout')
    await act(async () => fireEvent.changeText(newWorkoutInput, 'bench press'))

    const addButton = screen.getByText('Add')
    await act(async () => fireEvent.press(addButton))

    expect(Alert.alert).toHaveBeenCalledWith('Workout already exists')
  })

  it('attempting to add empty workout triggers an alert and does not succeed', async () => {
    await act(async () => render(<WorkoutTutorial />))

    const newWorkoutInput = screen.getByPlaceholderText('Enter new workout')
    await act(async () => fireEvent.changeText(newWorkoutInput, '   '))

    const addButton = screen.getByText('Add')
    await act(async () => fireEvent.press(addButton))

    expect(Alert.alert).toHaveBeenCalledWith('Cannot add empty workout')
  })

  it('new tutorial is correctly added and displayed', async () => {
    await act(async () => render(<WorkoutTutorial />))

    const newWorkoutInput = screen.getByPlaceholderText('Enter new workout')
    await act(async () => fireEvent.changeText(newWorkoutInput, 'Deadlift'))

    const addButton = screen.getByText('Add')
    await act(async () => fireEvent.press(addButton))

    await waitFor(() => expect(screen.getByText('Deadlift')).toBeTruthy())
  })

  it('workouts are filtered according to search workouts', async () => {
    await act(async () => render(<WorkoutTutorial />))

    const searchInput = screen.getByPlaceholderText('Search workouts')
    await act(async () => fireEvent.changeText(searchInput, 'squat'))

    expect(screen.queryByText('Bench Press')).toBeNull()
    expect(screen.getByText('Squat')).toBeTruthy()
  })
})