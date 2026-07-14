import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { View, Alert, TextInput, Text, TouchableOpacity, Button, ScrollView, 
  KeyboardAvoidingView } from 'react-native'
import { useAuthContext } from '../../../hooks/auth-context'
import { appStyles } from '../../../styles/styles'
import { router } from 'expo-router'
import SignOutButton from '../../../components/signout-button'
import Spacer from '../../../components/spacer'
import { Dropdown } from 'react-native-element-dropdown'
import { handleNumericInput } from '../../../functions/numeric-input'

const genderData = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
]
const frequencyData = [
  { label: '0', value: 0},
  { label: '1', value: 1},
  { label: '2', value: 2},
  { label: '3', value: 3},
  { label: '4', value: 4},
  { label: '5', value: 5},
  { label: '6', value: 6},
  { label: '7', value: 7},
]

const yearData = [{ label: '', value: 0 }];
for (let i = 1950; i <= 2025; i++) {
  yearData.push({ label: String(i), value: i });
}

export default function Profile() {
  const { claims } = useAuthContext()
  const userId = claims?.sub
  const email = claims?.email

  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [height, setHeight] = useState(0)
  const [weight, setWeight] = useState(0)
  const [year, setYear] = useState(0)
  const [gender, setGender] = useState('Other')
  const [frequency, setFrequency] = useState(0)
  const [time, setTime] = useState(0)
  const [exp, setExp] = useState('')
  const [focus, setFocus] = useState('')
  const [illness, setIllness] = useState('')
  const [info, setInfo] = useState('')
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
        setFocus(data.focus_area)
        setIllness(data.illness)
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

  async function updateProfile({ username, height, weight, year, gender, frequency, time, exp, focus, illness, info }) {
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
        focus_area: focus,
        illness: illness,
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

  return (
    <KeyboardAvoidingView behavior='padding'>
      <ScrollView style={{paddingHorizontal: 15}}>
        {/* EMAIL */}
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email ?? ''}
            editable={false}
            selectTextOnFocus={false}
            style={[styles.input, styles.inputDisabled]}
          />
        </View>

        {/* USERNAME */}
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            value={username ?? ''}
            onChangeText={(text) => setUsername(text)}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        {/* HEIGHT */}
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            value={height?.toString() ?? '0'}
            keyboardType='numeric'
            onChangeText={(text) => setHeight(handleNumericInput(text))}
            style={styles.input}
          />
        </View>

        {/* WEIGHT*/}
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            value={weight?.toString() ?? '0'}
            keyboardType='numeric'
            onChangeText={(text) => setWeight(handleNumericInput(text))}
            style={styles.input}
            testID='weight-input'
          />
        </View>

        {/* BIRTH YEAR */}
        <View style={styles.inputContainer}>
          <Text style={styles.fieldLabel}>Year of birth</Text>
          <Dropdown
            style={styles.dropdown}
            mode="modal"
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={yearData}
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Select year of birth"
            value={year}
            onChange={item => setYear(item.value)}
          />
        </View>

        {/* GENDER */}
        <View style={styles.inputContainer}>
          <Text style={styles.fieldLabel}>Gender</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={genderData}
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Select gender"
            value={gender}
            onChange={item => setGender(item.value)}
          />
        </View>

        {/* GYM FREQUENCY */}
        <View style={styles.inputContainer}>
          <Text style={styles.fieldLabel}>Number of gym sessions every week</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={frequencyData}
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Select number of sessions"
            value={frequency}
            onChange={item => setFrequency(item.value)}
          />
        </View>

        {/* SESSION TIME */}
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Average time per session (minutes)</Text>
          <TextInput
            value={time?.toString() ?? '0'}
            keyboardType='numeric'
            onChangeText={(text) => setTime(handleNumericInput(text))}
            style={styles.input}
          />
        </View>

        {/* GYMMING EXPERIENCE */}
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Gymming experience</Text>
          <TextInput
            value={exp ?? ''}
            onChangeText={(text) => setExp(text)}
            style={styles.input}
          />
        </View>

        {/* FOCUS AREA */}
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Focus area</Text>
          <TextInput
            value={focus ?? ''}
            onChangeText={(text) => setFocus(text)}
            style={styles.input}
          />
        </View>

        {/* ILLNESS */}
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Any illnesses to be considered</Text>
          <TextInput
            value={illness ?? ''}
            onChangeText={(text) => setIllness(text)}
            style={styles.input}
          />
        </View>

        {/* ADDITIONAL INFORMATION */}
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Additional information</Text>
          <TextInput
            value={info ?? ''}
            onChangeText={(text) => setInfo(text)}
            style={styles.input}
          />
        </View>

        <View style={[styles.verticallySpaced, styles.mt20]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#007AFF' }, loading && styles.buttonDisabled]}
            onPress={() => updateProfile({ username, height, weight, year, gender, frequency, time, exp, focus, illness, info })}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Loading ...' : 'Update'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verticallySpaced}>
          <Button 
            title="Change Password" 
            onPress={() => router.navigate('/change-password')} 
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