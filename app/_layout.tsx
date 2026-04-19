import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { Fredoka_400Regular } from '@expo-google-fonts/fredoka/400Regular';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { TaskProvider } from '@/context/task-context';
import { CategoryProvider } from '@/context/category-context';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: 'index',
};

// Watches auth state and redirects to welcome when user logs out
function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inProtectedArea = segments[0] === '(tabs)';
    if (!isAuthenticated && inProtectedArea) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, segments]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fredoka_700Bold, Fredoka_400Regular });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <TaskProvider>
        <CategoryProvider>
          <AuthGate />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="categories" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="create-categories" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="edit-task" options={{ headerShown: false }} />
            <Stack.Screen name="edit-category" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="light" />
        </CategoryProvider>
      </TaskProvider>
    </AuthProvider>
  );
}
