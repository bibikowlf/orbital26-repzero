import { Image, View, Text } from 'react-native'
import { appStyles } from '../styles/styles'
import Spacer from '../components/spacer'
import Logo from '../assets/RepZero_logo.png'

export default function LoadingScreen() {
    const styles = appStyles

    return (
        <View style={styles.container}>
            <Image source={Logo} style={styles.image} />
            <Spacer />
            <Text>Loading...</Text>
        </View>
    )
}