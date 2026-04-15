// SCRUM-4: Task list UI to be implemented
import { Pressable, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ComingSoon } from '@/components/ui/coming-soon';
import { useAuth } from '@/context/auth-context';
import TaskDashboard from '../../src/screens/TaskDashboard';

export default function TasksScreen() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('[Logout error]', e);
    }
    router.dismissAll();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
      {/* <ComingSoon
        title="My Tasks"
        icon="checkmark-circle-outline"
        description="Your task list is on its way. Create, manage and complete tasks all in one place."
      /> */}
      <TaskDashboard />
    </SafeAreaView>
  );

}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#4A4AE8' },
  logoutBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 20,
    marginBottom: 4,
  },
  logoutText: { color: '#fff', fontFamily: 'Fredoka_400Regular', fontSize: 14 },
});
