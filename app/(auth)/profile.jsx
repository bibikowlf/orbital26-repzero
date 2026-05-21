import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { View, Alert, TextInput, Text, TouchableOpacity } from 'react-native'
import { useAuthContext } from '../../hooks/auth-context'
import { appStyles } from '../../styles/styles'
import SignOutButton from '../../components/signout-button'

export default function Profile() {
  const { claims } = useAuthContext()
  const userId = claims?.sub
  const email = claims?.email

  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const styles = appStyles

  useEffect(() => {
    if (userId) getProfile()
  }, [userId])

  async function getProfile() {
    try {
      setLoading(true)

      let { data, error, status } = await supabase
        .from('profiles')
        .select(`username`)
        .eq('id', userId)
        .single()
      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setUsername(data.username)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile({
    username,
  }) {
    try {
      setLoading(true)

      const updates = {
        id: userId,
        username: username,
        updated_at: new Date(),
      }

      let { error } = await supabase.from('profiles').upsert(updates)

      if (error) {
        throw error
      }
    } catch (error) {
      Alert.alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.verticallySpaced}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email ?? ''}
          editable={false}
          selectTextOnFocus={false}
          style={[styles.input, styles.inputDisabled]}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username || ''}
          onChangeText={(text) => setUsername(text)}
          style={styles.input}
        />
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => updateProfile({ username })}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Loading ...' : 'Update'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.verticallySpaced}>
        <SignOutButton />
      </View>
    </View>
  )
}