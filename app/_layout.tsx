import { Fredoka_400Regular } from '@expo-google-fonts/fredoka/400Regular';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { CategoryProvider } from '@/context/category-context';
import { TaskProvider } from '@/context/task-context';
import { ThemeProvider } from '@/context/theme-context';

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
  }, [isAuthenticated, isLoading, segments, router]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fredoka_700Bold, Fredoka_400Regular });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <CategoryProvider>
            <AuthGate />
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="categories" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="edit-task" options={{ headerShown: false }} />
              <Stack.Screen name="completed" options={{ headerShown: false }} />
              <Stack.Screen name="in-progress" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="light" />
          </CategoryProvider>
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
