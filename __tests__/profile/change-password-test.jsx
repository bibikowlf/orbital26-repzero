import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import ChangePassword from '../../app/(tabs)/(settings)/change-password'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
  },
}))

jest.mock('../../styles/styles', () => ({
  appStyles: {},
}))

describe('ChangePassword Unit Test', () => {
  beforeEach(() => jest.clearAllMocks())

  it('password is correctly updated and signs out user after pressing change password button', async () => {
    await act(async () => render(<ChangePassword />))

    const inputs = screen.getAllByRole('textbox')
    const currentPasswordInput = inputs[0]
    const newPasswordInput = inputs[1]

    await act(async () => fireEvent.changeText(currentPasswordInput, 'oldPassword123'))
    await act(async () => fireEvent.changeText(newPasswordInput, 'newSecurePassword456'))

    const changePasswordButton = screen.getByText('Change Password')
    await act(async () => fireEvent.press(changePasswordButton))

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        current_password: 'oldPassword123',
        password: 'newSecurePassword456',
      })
    })

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })
})