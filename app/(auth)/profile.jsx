import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { View, Alert, TextInput, Text, TouchableOpacity, Button, ScrollView, KeyboardAvoidingView, 
          StyleSheet, ActivityIndicator } from 'react-native'
import { useAuthContext } from '../../hooks/auth-context'
import { appStyles } from '../../styles/styles'
import { router } from 'expo-router'
import SignOutButton from '../../components/signout-button'
import Spacer from '../../components/spacer'
import { Dropdown } from 'react-native-element-dropdown';

const genderData = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
]

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
            onChangeText={(text) => setHeight(handleNumberInput(text))}
            style={styles.input}
          />
        </View>

        {/* WEIGHT*/}
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            value={weight?.toString() ?? '0'}
            keyboardType='numeric'
            onChangeText={(text) => setWeight(handleNumberInput(text))}
            style={styles.input}
          />
        </View>

        {/* BIRTH YEAR */}
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Year of birth</Text>
          <TextInput
            value={year?.toString() ?? '0'}
            keyboardType='numeric'
            onChangeText={(text) => setYear(handleNumberInput(text))}
            style={styles.input}
          />
        </View>

        {/* GENDER */}
        <View style={localStyles.inputContainer}>
        <Text style={localStyles.fieldLabel}>Gender</Text>
        <Dropdown
          style={localStyles.dropdown}
          placeholderStyle={localStyles.placeholderStyle}
          selectedTextStyle={localStyles.selectedTextStyle}
          data={genderData}
          maxHeight={200}
          labelField="label"
          valueField="value"
          placeholder="Select Gender"
          value={gender}
          onChange={item => setGender(item.value)}
        />
      </View>
       
        {/*
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
        */}


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
          <Button 
            title="View AI Workout Plan" 
            onPress={() => router.navigate("/generate-plan")} 
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

const localStyles = StyleSheet.create({
  actionButton: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dayHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    paddingBottom: 4,
  },
  exerciseRow: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#ced4da',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
  },
  exerciseMeta: {
    fontSize: 13,
    color: '#495057',
    marginTop: 2,
  },
  exerciseNotes: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 4,
  },
  miniLabel: {
    fontSize: 11,
    color: '#6c757d',
    fontWeight: '600',
    marginBottom: 2,
  },
  inlineInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  fallbackText: {
    color: '#868e96',
    textAlign: 'center',
    marginTop: 40,
  }
})