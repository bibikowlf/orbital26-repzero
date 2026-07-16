import React from 'react'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import { Alert } from 'react-native'
import Profile from '../../app/(tabs)/(settings)/profile'
import GeneratePlan from '../../app/(tabs)/(plan)/generate-plan'
import ExerciseLog from '../../app/(tabs)/(log)/exercise-log'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const mockDynamicDayName = dayNames[new Date().getDay()] 
const mockUserSubId = 'user-123'
const mockTodayDate = new Date().toISOString().split('T')[0]

let mockDatabaseStore = {
  profiles: {},
  workout_logs: {}
}

jest.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn().mockImplementation((functionName, options) => {
        if (functionName === 'generate-workout') {
          const generatedPlan = [
            {
              day: mockDynamicDayName,
              exercises: [{ name: 'Squats', sets: 4, reps: '10' }]
            }
          ]
          
          mockDatabaseStore.profiles[mockUserSubId] = { 
            ...mockDatabaseStore.profiles[mockUserSubId],
            workout_plan: generatedPlan 
          }

          const mockEdgeResponse = {
            candidates: [
              {
                content: {
                  parts: [
                    { text: JSON.stringify(generatedPlan) }
                  ]
                }
              }
            ]
          }

          return Promise.resolve({ data: mockEdgeResponse, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })
    },
    from: jest.fn((table) => {
      const builder = {
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockImplementation((payload) => {
          mockDatabaseStore.profiles[mockUserSubId] = {
            ...mockDatabaseStore.profiles[mockUserSubId],
            ...payload
          }
          return builder
        }),
        eq: jest.fn().mockImplementation((column, value) => builder),
        single: jest.fn().mockImplementation(() => {
          let dataResult = null
          if (table === 'profiles') {
            dataResult = mockDatabaseStore.profiles[mockUserSubId] || { workout_plan: null }
          } else if (table === 'workout_logs') {
            dataResult = mockDatabaseStore.workout_logs[mockTodayDate] || null
          }
          return Promise.resolve({ data: dataResult, error: null })
        }),
        upsert: jest.fn().mockImplementation((payload) => {
          if (table === 'workout_logs') {
            mockDatabaseStore.workout_logs[mockTodayDate] = payload
          } else if (table === 'profiles') {
            mockDatabaseStore.profiles[mockUserSubId] = {
              ...mockDatabaseStore.profiles[mockUserSubId],
              ...payload
            }
          }
          return Promise.resolve({ error: null })
        }),
        then: jest.fn().mockImplementation((resolve) => {
          return Promise.resolve(resolve({ data: null, error: null }))
        })
      }
      return builder
    })
  }
}))

jest.mock('expo-router', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    useFocusEffect: (callback) => {
      React.useEffect(() => callback(), [])
    },
    Stack: Object.assign(({ children }) => React.createElement(View, null, children), { Screen: () => null }),
  }
})

jest.mock('../../hooks/auth-context', () => ({
  useAuthContext: () => ({ claims: { sub: mockUserSubId } }),
}))

jest.mock('../../functions/numeric-input', () => ({
  handleNumericInput: (val) => val
}))

describe('Plan & Log Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    mockDatabaseStore = { profiles: {}, workout_logs: {} }
  })

  afterEach(() => cleanup())

  it('user fills out profile, generates exercise plan, then imports plan to exercise log', async () => {
    mockDatabaseStore.profiles[mockUserSubId] = { workout_plan: null }

    await act(async () => render(<Profile />))
    
    await act(async () => fireEvent.changeText(screen.getByTestId('weight-input'), '70'))
    await act(async () => fireEvent.press(screen.getByText('Update')))

    await waitFor(() => expect(mockDatabaseStore.profiles[mockUserSubId].weight_kg).toBe('70'))
    
    await act(async () => cleanup())

    await act(async () => render(<GeneratePlan />))
    
    const generateBtn = await screen.findByText('AI Generate')
    await act(async () => fireEvent.press(generateBtn))

    await waitFor(() => expect(mockDatabaseStore.profiles[mockUserSubId].workout_plan).toHaveLength(1))
    
    await act(async () => cleanup())

    mockDatabaseStore.profiles[mockUserSubId].workout_plan = [
      {
        day: mockDynamicDayName,
        exercises: [{ name: 'Squats', sets: 4, reps: '10' }]
      }
    ]

    await act(async () => render(<ExerciseLog />))

    Alert.alert.mockClear() 

    const importBtn = screen.getByText(/Import from Workout Plan/i)
    await act(async () => fireEvent.press(importBtn))

    const confirmImportActionBtn = await screen.findByText('Import These Exercises')
    await act(async () => fireEvent.press(confirmImportActionBtn))

    let confirmAction
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled()
      confirmAction = Alert.alert.mock.calls[0][2].find(btn => btn.text === 'Import')
      expect(confirmAction).toBeDefined()
    })

    await act(async () => confirmAction.onPress())

    expect(screen.getByDisplayValue('Squats')).toBeTruthy()
  })
})