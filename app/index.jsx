import { StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import ThemedView from "../components/ThemedView"
import ThemedText from "../components/ThemedText"
import Spacer from '../components/Spacer'

const Home = () => {
    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.title} title={true}>
                The Number 1
            </ThemedText>

            <Spacer height={10} />
            <ThemedText>Reading List App</ThemedText>
            <Spacer />

            <Link href="/about" style={styles.link}>
                <ThemedText>About Page</ThemedText>
            </Link>
            <Link href="/contact" style={styles.link}>
                <ThemedText>Contact Page</ThemedText>
            </Link>
        </ThemedView>
    )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
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