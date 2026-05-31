import { Image, View, Text } from 'react-native'
import { Link } from 'expo-router'
import { appStyles } from '../../styles/styles'
import Spacer from '../../components/spacer'
import Logo from '../../assets/logo_small.png'

export default function Home() {
    const styles = appStyles

    return (
        <View style={styles.container}>
            <Image source={Logo} style={styles.image} />

            <Spacer />
            
            <Text>Welcome to</Text>

            <Spacer height={10} />

            <Text style={styles.title}>
                RepZero
            </Text>
        </View>
    )
}