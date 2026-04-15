import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  StatusBar,
  Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// ── Types ────────────────────────────────────────────────────────────────────

type Status = 'Done' | 'In Progress' | 'To-do';
type Filter = 'All' | 'To do' | 'In Progress' | 'Completed';

interface Task {
  id: string;
  project: string;
  title: string;
  time: string;
  status: Status;
  emoji: string;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    project: 'Grocery shopping app design',
    title: 'Market Research',
    time: '10:00 AM',
    status: 'Done',
    emoji: '🛒',
  },
  {
    id: '2',
    project: 'Grocery shopping app design',
    title: 'Competitive Analysis',
    time: '12:00 PM',
    status: 'In Progress',
    emoji: '🛒',
  },
  {
    id: '3',
    project: 'Uber Eats redesign challange',
    title: 'Create Low-fidelity Wireframe',
    time: '07:00 PM',
    status: 'To-do',
    emoji: '🍔',
  },
];

const DAYS = [
  { date: 23, day: 'Fri', month: 'May' },
  { date: 24, day: 'Sat', month: 'May' },
  { date: 25, day: 'Sun', month: 'May' },
  { date: 26, day: 'Mon', month: 'May' },
  { date: 27, day: 'Tue', month: 'May' },
];

const FILTERS: Filter[] = ['All', 'To do', 'In Progress', 'Completed'];

// ── Status Badge ─────────────────────────────────────────────────────────────

const statusStyle: Record<Status, { bg: string; text: string }> = {
  Done: { bg: '#E8F5E9', text: '#43A047' },
  'In Progress': { bg: '#FFF3E0', text: '#FB8C00' },
  'To-do': { bg: '#E3F2FD', text: '#1E88E5' },
};

const StatusBadge = ({ status }: { status: Status }) => {
  const s = statusStyle[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{status}</Text>
    </View>
  );
};

// ── Custom Delete Modal ───────────────────────────────────────────────────────

interface DeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
}

const DeleteModal = ({ visible, onClose, onConfirm, taskTitle }: DeleteModalProps) => (
  <Modal
    transparent={true}
    visible={visible}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      {/* Wrapper that positions cat above the card */}
      <View style={styles.modalWrapper}>

        {/* Cat video floats above the card, centered */}
        <View style={styles.catFloatContainer} pointerEvents="none">
          <Image
  source={require('@/assets/animations/Blinking Kitty.gif')}
  style={styles.catVideo}
  contentFit="contain"
/>
        </View>

        {/* Modal Card — sits below the cat */}
        <View style={styles.modalCard}>
          {/* Extra top padding so text doesn't crowd the cat's feet */}
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Task?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{taskTitle}"?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalDeleteBtn]}
                onPress={onConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.modalDeleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  </Modal>
);

// ── Task Card ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const TaskCard = ({ task, onEdit, onDelete }: TaskCardProps) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.projectName}>{task.project}</Text>
      <View style={styles.emojiCircle}>
        <Text style={styles.emoji}>{task.emoji}</Text>
      </View>
    </View>
    <Text style={styles.taskTitle}>{task.title}</Text>
    <View style={styles.cardMeta}>
      <View style={styles.timeRow}>
        <Text style={styles.clockIcon}>🕐</Text>
        <Text style={styles.timeText}>{task.time}</Text>
      </View>
      <StatusBadge status={task.status} />
    </View>
    <View style={styles.cardActions}>
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => onEdit(task.id)}
        activeOpacity={0.85}
      >
        <Text style={styles.editBtnText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(task.id)}
        activeOpacity={0.85}
      >
        <Text style={styles.deleteBtnText}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function PlannerScreen() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(25);
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    router.push(`/EditProject?id=${id}`);
  };

  const handleDelete = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setTaskToDelete(id);
      setDeleteModalVisible(true);
    }
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      setTasks(prev => prev.filter(t => t.id !== taskToDelete));
      setTaskToDelete(null);
      setDeleteModalVisible(false);
    }
  };

  const cancelDelete = () => {
    setTaskToDelete(null);
    setDeleteModalVisible(false);
  };

  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'To do') return task.status === 'To-do';
    if (activeFilter === 'In Progress') return task.status === 'In Progress';
    if (activeFilter === 'Completed') return task.status === 'Done';
    return true;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8FF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today's Tasks</Text>
        <TouchableOpacity style={styles.bellButton}>
          <Text style={styles.bellIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Strip */}
      <View style={styles.calendarStrip}>
        {DAYS.map(d => {
          const isSelected = d.date === selectedDay;
          return (
            <TouchableOpacity
              key={d.date}
              onPress={() => setSelectedDay(d.date)}
              style={[styles.dayItem, isSelected && styles.dayItemSelected]}
              activeOpacity={0.8}
            >
              <Text style={[styles.dayMonth, isSelected && styles.dayTextSelected]}>
                {d.month}
              </Text>
              <Text style={[styles.dayNumber, isSelected && styles.dayTextSelected]}>
                {d.date}
              </Text>
              <Text style={[styles.dayName, isSelected && styles.dayTextSelected]}>
                {d.day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setActiveFilter(f)}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.filterText, activeFilter === f && styles.filterTextActive]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Task List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.taskList}
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks found</Text>
          </View>
        ) : (
          filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        visible={deleteModalVisible}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        taskTitle={tasks.find(t => t.id === taskToDelete)?.title || ''}
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const PURPLE = '#6C63FF';
const RED = '#E53935';
const CAT_SIZE = 140; // height of the cat video that peeks above the card
const CAT_OVERLAP = 70; // how many px of the cat overlap INTO the card top

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F8FF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  backArrow: { fontSize: 18, color: '#333' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: 0.3,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bellIcon: { fontSize: 18 },

  // Calendar
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dayItem: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
    minWidth: 52,
  },
  dayItemSelected: {
    backgroundColor: PURPLE,
    shadowColor: PURPLE,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dayMonth: { fontSize: 11, color: '#999', fontWeight: '500' },
  dayNumber: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginVertical: 2 },
  dayName: { fontSize: 11, color: '#999', fontWeight: '500' },
  dayTextSelected: { color: '#fff' },

  // Filters
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    marginBottom:12
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E8E8F0',
    marginRight: 8,
    height: 40,
  },
  filterChipActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  filterText: { fontSize: 13, fontWeight: '600', color: '#888' },
  filterTextActive: { color: '#fff' },

  // Task List
  taskList: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
    marginTop:14
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 5,
    marginTop:14
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  projectName: { fontSize: 12, color: '#9E9EB5', fontWeight: '500' },
  emojiCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F3F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: { fontSize: 16 },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 10,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clockIcon: { fontSize: 13 },
  timeText: { fontSize: 13, color: '#9E9EB5', fontWeight: '500', marginLeft: 4 },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Buttons
  cardActions: { flexDirection: 'row', gap: 10 },
  editBtn: {
    flex: 1,
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: PURPLE,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  deleteBtn: {
    flex: 1,
    backgroundColor: RED,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: RED,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  deleteBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 15, color: '#aaa', fontWeight: '500' },

  // ── Modal ──────────────────────────────────────────────────────────────────

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  /**
   * Outer wrapper — no background, just used to stack the cat on top of the card.
   * We use a negative marginBottom on the cat so it visually sits on the card edge.
   */
  modalWrapper: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    
  },

  /**
   * The cat floats here. It renders ABOVE the card in z-order because it comes
   * first in JSX and we pull it down via a negative bottom margin so its feet
   * land exactly on the card's top edge.
   *
   * backgroundColor: 'transparent' + no overflow:hidden = the alpha channel
   * of the .webm shows through on both iOS and Android.
   */
  catFloatContainer: {
    width: CAT_SIZE,
    height: CAT_SIZE,
    backgroundColor: 'transparent',
    marginBottom: -CAT_OVERLAP,
   left:100,
   
    zIndex: 10,
  },

  catVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },

  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    overflow: 'visible',
    zIndex:12
  },

  modalContent: {
    alignItems: 'center',
    // Extra top padding gives breathing room below the cat's feet
    paddingTop: CAT_OVERLAP + 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#E8E8F0',
  },
  modalDeleteBtn: {
    backgroundColor: RED,
    shadowColor: RED,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  modalCancelBtnText: {
    color: '#666',
    fontWeight: '700',
    fontSize: 15,
  },
  modalDeleteBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});