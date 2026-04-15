// SCRUM-4: Task list UI to be implemented
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ComingSoon } from '@/components/ui/coming-soon';
import { useAuth } from '@/context/auth-context';

export default function TasksScreen() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/sign-in');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
      <ComingSoon
        title="My Tasks"
        icon="checkmark-circle-outline"
        description="Your task list is on its way. Create, manage and complete tasks all in one place."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  logoutBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: { color: '#fff', fontFamily: 'Fredoka_600SemiBold', fontSize: 14 },
});
