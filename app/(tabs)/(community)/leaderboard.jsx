import { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { useAuthContext } from '../../../hooks/auth-context'
import Spacer from '../../../components/spacer'

export default function WorkoutTutorial() {
  const { claims } = useAuthContext()
  const userId = claims?.sub
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [rank, setRank] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const styles = appStyles

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('total_minutes_this_week')
        .select('*')
      if (error) {
        throw error
      }
      if (data) {
        data.sort((a, b) => b.minutes - a.minutes)
        const userIndex = data.findIndex(item => item.id === userId)
        const userData = data[userIndex]
        setMinutes(userData.minutes)
        setRank(userIndex + 1)
        data.length = Math.min(10, data.length)
        setUsers(data)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  return (
    <View style={[styles.container, { alignItems: 'stretch', width: '100%', marginTop: 10 }]}>
      <Text style={[styles.title, { fontSize: 20, textAlign: 'center' }]}>
        You're in {rank} place with {minutes} minutes!
      </Text>
      <Spacer />
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <View style={[styles.row, 
            { backgroundColor: '#fff', padding: 12, 
              borderBottomWidth: 1, borderColor: '#ced4da',
              marginBottom: 0, justifyContent: 'space-between',
              height: 50 }]}>
            <Text style={[{ fontSize: 16 }, 
              index === 0 && { color: 'gold', fontWeight: 'bold', fontSize: 18 },
              index === 1 && { color: 'silver', fontWeight: 'bold', fontSize: 18 },
              index === 2 && { color: '#CD7F32', fontWeight: 'bold', fontSize: 18 }]}>
              {index + 1}       {item.username ?? 'Anonymous User'}
            </Text>
            <Text style={[{ fontSize: 16 }, 
              index === 0 && { color: 'gold', fontWeight: 'bold', fontSize: 18 },
              index === 1 && { color: 'silver', fontWeight: 'bold', fontSize: 18 },
              index === 2 && { color: '#CD7F32', fontWeight: 'bold', fontSize: 18 }]}>
              {item.minutes} minutes
            </Text>
          </View>
        )}
      />
    </View>
  )
}