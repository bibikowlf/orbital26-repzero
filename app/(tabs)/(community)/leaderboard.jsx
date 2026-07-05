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
  const [topTen, setTopTen] = useState([])
  const [topThree, setTopThree] = useState([])
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
        setTopThree([{...data[1], idx: 2}, {...data[0], idx: 1}, {...data[2], idx: 3}])
        setTopTen(data.slice(3))
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
      <Text style={[styles.title, { fontSize: 20, textAlign: 'center', color: 'black' }]}>
        You're in {rank}{rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'} place with {minutes} minutes!
      </Text>
      <Spacer height={10} />
      <View style={[styles.row, 
        { justifyContent: 'center', gap: 10, padding: 12, alignItems: 'flex-end' }]}>
        {topThree.map((user) => {
          const config = { 
            color: user.idx === 1 ? 'gold' : user.idx === 2 ? 'silver' : '#CD7F32',
            height: user.idx === 1 ? 200 : user.idx === 2 ? 160 : 140}
          return (
            <View key={user.id} style={{ alignItems: 'center', width: 100 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 6, color: 'black' }}>
                {user.id === userId ? 'You' : (user.username ?? 'Anonymous')}
              </Text>
              <View style={{ backgroundColor: config.color, width: 100, height: config.height, alignItems: 'center', borderTopLeftRadius: 8, borderTopRightRadius: 8, justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 50, fontWeight: 'bold', marginTop: 20, color: 'black' }}>
                  {user.idx}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: 'black' }}>
                  {user.minutes}
                </Text>
              </View>
            </View>
          )
        })}
      </View>
      <FlatList
        data={topTen}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <View style={[styles.row, 
            { backgroundColor: '#fff', padding: 12, 
              borderBottomWidth: 1, borderColor: '#ced4da',
              marginBottom: 0, justifyContent: 'space-between',
              height: 50 }]}>
            <Text style={{ fontSize: 16, color: 'black' }}>
              {index + 4}       {item.id === userId ? 'You' : (item.username ?? 'Anonymous')}
            </Text>
            <Text style={{ fontSize: 16, color: 'black' }}>
              {item.minutes} minutes
            </Text>
          </View>
        )}
      />
    </View>
  )
}