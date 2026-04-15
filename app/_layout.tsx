import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { Fredoka_400Regular } from '@expo-google-fonts/fredoka/400Regular';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider } from '@/context/auth-context';
import { TaskProvider } from '@/context/task-context';
import { CategoryProvider } from '@/context/category-context';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: 'index',
};

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
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="task/new" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="task/[id]" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="categories/index" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="EditProject" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="light" />
        </CategoryProvider>
      </TaskProvider>
    </AuthProvider>
  );
}
