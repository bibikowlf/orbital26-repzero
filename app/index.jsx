import { StyleSheet, Image, View, Text } from 'react-native'
import { Link } from 'expo-router'
import { appStyles } from '../styles/styles'
import Spacer from '../components/spacer'
import Logo from '../assets/RepZero_logo.png'
import SignOutButton from '../components/signout-button'

const Home = () => {
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

            <Spacer />

            <Link href="/profile" style={styles.link}>
                <Text>Profile</Text>
            </Link>
        </View>
    )
}

export default Home