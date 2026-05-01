import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticTab } from '@/components/ui/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FloatingAddButton } from '@/components/ui/floating-add-button';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: '#C8FF3E',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
          tabBarStyle: {
          paddingBottom: 10,
          backgroundColor: '#4A4AE8',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          borderRadius: 20,
          position: 'absolute',
          marginHorizontal: 16,
          bottom: insets.bottom + 10,
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="checklist" color={color} />,
        }}
      />

      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="calendar" color={color} />,
        }}
      />

      <Tabs.Screen
        name="add-task"
        options={{
          title: '',
          tabBarButton: () => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const router = useRouter();
            return <FloatingAddButton onPress={() => router.push('/add-task')} />;
          },
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="group"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
      </Tabs>
    </View>
  );
}
