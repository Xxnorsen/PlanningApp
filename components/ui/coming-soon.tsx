import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ComingSoonProps {
  title: string;
  icon: string;
  description?: string;
}

export function ComingSoon({ title, icon, description }: ComingSoonProps) {
  const router = useRouter();
  const pulse = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -12, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(float, { toValue: 0,   duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Decorative circles */}
      <View style={[styles.circle, styles.c1]} />
      <View style={[styles.circle, styles.c2]} />
      <View style={[styles.circle, styles.c3]} />

      <View style={styles.content}>
        {/* Floating icon bubble */}
        <Animated.View style={[styles.iconBubble, { transform: [{ translateY: float }, { scale: pulse }] }]}>
          <Ionicons name={icon as any} size={52} color="#4A4AE8" />
        </Animated.View>

        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>COMING SOON</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>
          {description ?? "Our team is working hard on this feature. It'll be ready soon!"}
        </Text>

        {/* Back to home */}
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')} activeOpacity={0.85}>
          <Ionicons name="home-outline" size={18} color="#1A1A1A" />
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#4A4AE8' },

  circle: { position: 'absolute', borderRadius: 999 },
  c1: { width: 180, height: 180, backgroundColor: '#6B6BFF', top: -40, left: -50, opacity: 0.6 },
  c2: { width: 120, height: 120, backgroundColor: '#9B9BFF', bottom: 120, right: -30, opacity: 0.5 },
  c3: { width: 20,  height: 20,  backgroundColor: '#C8FF3E', top: 160, right: 60 },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  iconBubble: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: '#C8FF3E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  badgeText: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 12,
    color: '#C8FF3E',
    letterSpacing: 2,
  },

  title: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 36,
    color: '#C8FF3E',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Fredoka_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C8FF3E',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 28,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  buttonText: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 16,
    color: '#1A1A1A',
  },
});
