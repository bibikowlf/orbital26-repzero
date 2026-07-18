import React, { useState } from 'react'
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { supabase } from '../../../lib/supabase'
import { appStyles } from '../../../styles/styles'

export default function ChangePassword () {
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const styles = appStyles

  async function changePassword() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        current_password: password,
        password: newPassword,
      })
      if (error) {
        throw error
      }
      const { signouterror } = await supabase.auth.signOut()
      if (signouterror) {
        console.error('Error signing out:', signouterror)
      }
    } catch (error) {
      Alert.alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Text style={styles.label}>Password</Text>
        <TextInput
            onChangeText={(text) => setPassword(text)}
            value={password}
            secureTextEntry={true}
            autoCapitalize="none"
            style={styles.input}
            accessibilityRole="textbox"
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Text style={styles.label}>New Password</Text>
        <TextInput
            onChangeText={(text) => setNewPassword(text)}
            value={newPassword}
            secureTextEntry={true}
            autoCapitalize="none"
            style={styles.input}
            accessibilityRole="textbox"
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#007AFF', flex: 0 }, loading && styles.buttonDisabled]}
            onPress={() => changePassword()}
            disabled={loading}
        >
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}