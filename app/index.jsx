import { StyleSheet, Image } from 'react-native'
import { Link } from 'expo-router'
import ThemedView from "../components/ThemedView"
import ThemedText from "../components/ThemedText"
import Spacer from '../components/Spacer'
import Logo from '../assets/RepZero_logo.png'

const Home = () => {
    return (
        <ThemedView style={styles.container}>
            <Image source={Logo} style={styles.img} />

            <Spacer />
            
            <ThemedText>Welcome to</ThemedText>

            <Spacer height={10} />

            <ThemedText style={styles.title} title={true}>
                RepZero
            </ThemedText>

            <Spacer />

            <Link href="/profile" style={styles.link}>
                <ThemedText>Profile</ThemedText>
            </Link>
        </ThemedView>
    )
}

export default Home

const styles = StyleSheet.create({
    title: {
        fontWeight: 'bold',
        fontSize: 18
    },
    img: {
        marginVertical: 20
    },
    link: {
        marginVertical: 10,
        borderBottomWidth: 1
    }
})