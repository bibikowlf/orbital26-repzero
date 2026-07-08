import { useState } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { supabase } from '../../../lib/supabase'
import { useAuthContext } from '../../../hooks/auth-context'
import { appStyles } from '../../../styles/styles'
import BackButton from '../../../components/back-button'
import Spacer from '../../../components/spacer'

export function filterOutSelf(results, userId) {
  return results.filter((r) => r.id !== userId)
}

export default function SearchUsers() {
  const { claims } = useAuthContext()
  const userId = claims?.sub

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(text) {
    setQuery(text)

    if (!text.trim()) {
      setResults([])
      setSearched(false)
      return
    }

    try {
      setLoading(true)
      let { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${text.trim()}%`)
        .limit(20)

      if (error)
        throw error

      setResults(filterOutSelf(data || [], userId))
      setSearched(true)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[appStyles.container, { paddingHorizontal: 15, paddingTop: 20 }]}>
      <BackButton />
      <Spacer />
      <Text style={[appStyles.label, { fontSize: 22, fontWeight: 'bold' }]}>Find Friends</Text>
      <Spacer />

      <TextInput
        style={appStyles.inlineInput}
        placeholder="Search by username"
        value={query}
        onChangeText={handleSearch}
        autoCapitalize="none"
      />
      <Spacer />

      {loading && <ActivityIndicator size="small" color="#000" />}

      {!loading && searched && results.length === 0 && (
        <Text style={appStyles.fallbackText}>No users found.</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={appStyles.exerciseRow}>
            <Text style={appStyles.exerciseName}>{item.username}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}