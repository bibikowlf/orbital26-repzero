import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { View, Alert, TextInput, Text, TouchableOpacity, Button, ScrollView, KeyboardAvoidingView } from 'react-native'
import { useAuthContext } from '../../hooks/auth-context'
import { appStyles } from '../../styles/styles'
import { router } from 'expo-router'
import SignOutButton from '../../components/signout-button'
import Spacer from '../../components/spacer'

export default function Profile() {
  const { claims } = useAuthContext()
  const userId = claims?.sub
  const email = claims?.email

  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [height, setHeight] = useState(0)
  const [weight, setWeight] = useState(0)
  const [year, setYear] = useState(0)
  const [gender, setGender] = useState('OTHER')
  const [frequency, setFrequency] = useState(0)
  const [time, setTime] = useState(0)
  const [exp, setExp] = useState('')
  const [info, setInfo] = useState('')
  const genders = ['OTHER', 'MALE', 'FEMALE']
  const styles = appStyles

  useEffect(() => {
    if (userId) getProfile()
  }, [userId])

  async function getProfile() {
    try {
      setLoading(true)

      let { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setUsername(data.username)
        setHeight(data.height_cm)
        setWeight(data.weight_kg)
        setYear(data.birth_year)
        setGender(data.gender)
        setFrequency(data.gym_frequency)
        setTime(data.time_per_session)
        setExp(data.gym_exp)
        setInfo(data.add_info)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile({ username, height, weight, year, gender, frequency, time, exp, info }) {
    try {
      setLoading(true)

      const updates = {
        id: userId,
        username: username,
        height_cm: height,
        weight_kg: weight,
        birth_year: year,
        gender: gender,
        gym_frequency: frequency,
        time_per_session: time,
        gym_exp: exp,
        add_info: info,
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

  const handleNumberInput = (text) => {
    const cleanedValue = text.replace(/[^0-9]/g, '')
    const parsedValue = parseInt(cleanedValue, 10)

    return isNaN(parsedValue) ? 0 : parsedValue
  }

  return (
    <KeyboardAvoidingView behavior='padding'>
      <ScrollView style={{paddingHorizontal: 15}}>
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
            value={username ?? ''}
            onChangeText={(text) => setUsername(text)}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            value={height?.toString() ?? '0'}
            keyboardType='numeric'
            onChangeText={(text) => setHeight(handleNumberInput(text))}
            style={styles.input}
          />
        </View>
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            value={weight?.toString() ?? '0'}
            keyboardType='numeric'
            onChangeText={(text) => setWeight(handleNumberInput(text))}
            style={styles.input}
          />
        </View>
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Year of birth</Text>
          <TextInput
            value={year?.toString() ?? '0'}
            keyboardType='numeric'
            onChangeText={(text) => setYear(handleNumberInput(text))}
            style={styles.input}
          />
        </View>
        <View style = {styles.verticallySpaced}>
          <Text style={styles.label}>Select gender</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40 }}>
          {genders.map((option, index) => {
            const isSelected = gender === option;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.button, isSelected && styles.buttonDisabled]}
                onPress={() => setGender(option)}
              >
                <Text style={styles.buttonText}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
          </View>
        </View>
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Number of gym sessions every week</Text>
          <TextInput
            value={frequency?.toString() ?? '0'}
            keyboardType='numeric'
            onChangeText={(text) => setFrequency(handleNumberInput(text))}
            style={styles.input}
          />
        </View>
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Time for every session (minutes)</Text>
          <TextInput
            value={time?.toString() ?? '0'}
            keyboardType='numeric'
            onChangeText={(text) => setTime(handleNumberInput(text))}
            style={styles.input}
          />
        </View>
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Gymming experience</Text>
          <TextInput
            value={exp ?? ''}
            onChangeText={(text) => setExp(text)}
            style={styles.input}
          />
        </View>
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Additional information we should consider (illness, fitness goals...)</Text>
          <TextInput
            value={info ?? ''}
            onChangeText={(text) => setInfo(text)}
            style={styles.input}
          />
        </View>

        <View style={[styles.verticallySpaced, styles.mt20]}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={() => updateProfile({ username, height, weight, year, gender, frequency, time, exp, info })}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Loading ...' : 'Update'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.verticallySpaced}>
          <Button 
            title="Change Password" 
            styles={styles.button} 
            onPress={() => router.navigate("/change-password")} 
          />
        </View>

        <View style={styles.verticallySpaced}>
          <SignOutButton />
        </View>
        <Spacer />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}