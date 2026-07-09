import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import Profile from '../../app/(tabs)/(settings)/profile'
import { supabase } from '../../lib/supabase'

const mockUserId = 'mock-user-777'
const mockInitialProfile = {
  id: mockUserId,
  username: 'initial_gym_bro',
  height_cm: 175,
  weight_kg: 70,
  birth_year: 1995,
  gender: 'Male',
  gym_frequency: 3,
  time_per_session: 60,
  gym_exp: '1 year',
  focus_area: 'Arms',
  illness: 'None',
  add_info: 'None'
}

let mockActiveChains = {}

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn((table) => {
      if (!mockActiveChains[table]) {
        const builder = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockImplementation(() => {
            if (table === 'profiles') {
              return Promise.resolve({ data: mockInitialProfile, error: null, status: 200 })
            }
            return Promise.resolve({ data: null, error: null, status: 404 })
          }),
          upsert: jest.fn().mockImplementation(() => {
            return Promise.resolve({ error: null })
          })
        }
        mockActiveChains[table] = builder
      }
      return mockActiveChains[table]
    })
  }
}))

jest.mock('../../hooks/auth-context', () => ({
  useAuthContext: () => ({
    claims: { sub: mockUserId, email: 'mock@gmail.com' }
  })
}))

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn() }
}))

jest.mock('../../components/signout-button', () => {
  const { Text } = require('react-native')
  return () => <Text>Sign Out Button</Text>
})

jest.mock('../../components/spacer', () => () => null)

jest.mock('../../functions/numeric-input', () => ({
  handleNumericInput: (text) => parseInt(text, 10) || 0
}))

jest.mock('react-native-element-dropdown', () => {
  const { TextInput } = require('react-native')
  return {
    Dropdown: ({ placeholder, value, onChange }) => (
      <TextInput
        placeholder={placeholder}
        value={String(value)}
        onChangeText={(text) => {
          const numericValue = parseInt(text, 10)
          onChange({ value: isNaN(numericValue) ? text : numericValue })
        }}
      />
    )
  }
})

describe('Profile Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockActiveChains = {}
  })

  it('new data is correctly added into database after pressing update button', async () => {
    await act(async () => render(<Profile />))
    await waitFor(() => expect(screen.getByDisplayValue('initial_gym_bro')).toBeTruthy())

    expect(screen.getByDisplayValue('mock@gmail.com')).toBeTruthy()

    const usernameInput = screen.getByDisplayValue('initial_gym_bro')
    await act(async () => fireEvent.changeText(usernameInput, 'edited_gym_bro'))

    const heightInput = screen.getByDisplayValue('175')
    await act(async () => fireEvent.changeText(heightInput, '180'))

    const weightInput = screen.getByDisplayValue('70')
    await act(async () => fireEvent.changeText(weightInput, '82'))

    const birthYearDropdown = screen.getByPlaceholderText('Select year of birth')
    await act(async () => fireEvent(birthYearDropdown, 'onChange', { label: '2000', value: 2000 }))

    const genderDropdown = screen.getByPlaceholderText('Select gender')
    await act(async () => fireEvent(genderDropdown, 'onChange', { label: 'Other', value: 'Other' }))

    const frequencyDropdown = screen.getByPlaceholderText('Select number of sessions')
    await act(async () => fireEvent(frequencyDropdown, 'onChange', { label: '5', value: 5 }))

    const updateButton = screen.getByText('Update')
    await act(async () => fireEvent.press(updateButton))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles')
      expect(mockActiveChains['profiles'].upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUserId,
          username: 'edited_gym_bro',
          height_cm: 180,
          weight_kg: 82,
          birth_year: 2000,
          gender: 'Other',
          gym_frequency: 5,
          updated_at: expect.any(Date)
        })
      )
    })
  }, 10000)
})