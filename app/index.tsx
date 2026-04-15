import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { LoadingCat } from '@/components/ui/loading-cat';


export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Floating animation
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -18,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // Already logged in → skip intro
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <LoadingCat size={200} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative background circles */}
      <View style={[styles.circle, styles.circleLargeLeft]} />
      <View style={[styles.circle, styles.circleMediumRight]} />
      <View style={[styles.circle, styles.circleSmallTop]} />
      <View style={[styles.circle, styles.circlePinkBottom]} />

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>PLAN YOUR{'\n'}DAY WITH{'\n'}CHARMI!</Text>
      </View>

      {/* Mascot area */}
      <View style={styles.mascotArea}>
        {/* Hello bubble */}
        <View style={styles.helloBubble}>
          <Text style={styles.helloBubbleText}>Hello!</Text>
        </View>

        {/* Floating planner sticker */}
        <Animated.Image
          source={require('@/assets/stickers/planner.png')}
          style={[styles.mascotImage, { transform: [{ translateY: floatAnim }] }]}
          resizeMode="contain"
        />

        {/* Let's start bubble */}
        <View style={styles.startBubble}>
          <Text style={styles.startBubbleText}>Let's start!</Text>
        </View>
      </View>

      {/* Get Started button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Get started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A4AE8',
  },

  container: {
    flex: 1,
    backgroundColor: '#4A4AE8',
    paddingHorizontal: 24,
  },

  // Decorative circles
  circle: {
    position: 'absolute',
    borderRadius: 999,
  },
  circleLargeLeft: {
    width: 120,
    height: 120,
    backgroundColor: '#6B6BFF',
    top: 180,
    left: -30,
  },
  circleMediumRight: {
    width: 80,
    height: 80,
    backgroundColor: '#9B9BFF',
    top: 260,
    right: 20,
  },
  circleSmallTop: {
    width: 18,
    height: 18,
    backgroundColor: '#C8FF3E',
    top: 60,
    right: 24,
  },
  circlePinkBottom: {
    width: 60,
    height: 60,
    backgroundColor: '#FF9BCC',
    bottom: 160,
    right: 30,
  },

  // Title
  titleContainer: {
    marginTop: 32,
    zIndex: 1,
  },
  title: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 42,
    lineHeight: 50,
    color: '#C8FF3E',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Mascot
  mascotArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  mascotImage: {
    width: 280,
    height: 280,
  },

  // Speech bubbles
  helloBubble: {
    backgroundColor: '#C8FF3E',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 12,
    alignSelf: 'flex-end',
    marginRight: 16,
  },
  helloBubbleText: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 16,
    color: '#1a1a1a',
  },
  startBubble: {
    backgroundColor: '#B2F0E8',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 12,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  startBubbleText: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 18,
    color: '#1a1a1a',
  },

  // Footer button
  footer: {
    paddingBottom: 24,
    zIndex: 1,
  },
  button: {
    backgroundColor: '#C8FF3E',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 18,
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
});
