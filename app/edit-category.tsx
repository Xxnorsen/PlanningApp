import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LoadingCat } from '@/components/ui/loading-cat';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { useAuth } from '@/context/auth-context';
import { categoriesApi } from '@/services/api/categories';
import { tasksApi } from '@/services/api/tasks';
import type { Category } from '@/types/category';
import type { Task } from '@/types/task';

const { width } = Dimensions.get('window');

// ── Delete Modal Component ─────────────────────────────────────────────────────

const CAT_SIZE = 140;
const CAT_OVERLAP = 70;

interface DeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

const DeleteModal = ({ visible, onClose, onConfirm, message }: DeleteModalProps) => (
  <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalWrapper}>
        <View style={styles.catFloatContainer} pointerEvents="none">
          <Image
            source={require('@/assets/animations/Blinking Kitty.gif')}
            style={styles.catVideo}
            contentFit="contain"
          />
        </View>
        <View style={styles.modalCard}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete?</Text>
            <Text style={styles.modalMessage}>
              {message}
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

// ── Color Picker Component ─────────────────────────────────────────────────────

const ColorPicker: React.FC<{
  selectedColor: string;
  onSelectColor: (color: string) => void;
}> = ({ selectedColor, onSelectColor }) => {
  const colors = [
    COLORS.LIME,
    '#45B7D1',
    '#9B59B6',
    '#95A5A6',
    '#E74C3C',
    '#F39C12',
  ];

  return (
    <View style={styles.colorPickerContainer}>
      {colors.map((color, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.colorOption,
            { backgroundColor: color },
            selectedColor === color && styles.colorOptionSelected,
          ]}
          onPress={() => onSelectColor(color)}
          activeOpacity={0.8}
        />
      ))}
    </View>
  );
};

// ── Icon Selector Component ─────────────────────────────────────────────────────

const IconSelector: React.FC<{
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
}> = ({ selectedIcon, onSelectIcon }) => {
  const icons = [
    'laptop-outline',
    'fitness-outline', 
    'cart-outline',
    'book-outline',
    'heart-outline',
    'calendar-outline',
    'construct-outline',
    'document-text-outline',
    'bulb-outline',
    'settings-outline',
    'shield-checkmark-outline',
    'star-outline',
    'add-circle-outline',
  ];

  return (
    <View style={styles.iconSelectorContainer}>
      {icons.map((icon, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.iconOption,
            selectedIcon === icon && styles.iconOptionSelected,
          ]}
          onPress={() => onSelectIcon(icon)}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={icon as keyof typeof Ionicons.glyphMap} 
            size={20} 
            color={selectedIcon === icon ? COLORS.LIME : COLORS.MUTED_ON_CARD} 
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ── Task Item Component ─────────────────────────────────────────────────────

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onEdit, onDelete, onToggleComplete }) => {
  return (
    <View style={styles.taskItem}>
      <TouchableOpacity
        style={styles.taskCheckbox}
        onPress={() => onToggleComplete(task.id)}
        activeOpacity={0.8}
      >
        <Ionicons 
          name={task.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'} 
          size={20} 
          color={task.status === 'completed' ? COLORS.LIME : COLORS.MUTED_ON_CARD} 
        />
      </TouchableOpacity>
      
      <View style={styles.taskContent}>
        <Text style={[
          styles.taskText,
          task.status === 'completed' && styles.taskTextCompleted
        ]}>
          {task.title}
        </Text>
        <Text style={styles.taskDate}>
          {new Date(task.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.taskActions}>
        <TouchableOpacity
          style={styles.taskActionBtn}
          onPress={() => onEdit(task)}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={16} color={COLORS.MUTED_ON_CARD} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.taskActionBtn}
          onPress={() => onDelete(task.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Main Edit Category Screen Component ─────────────────────────────────────────

export default function EditCategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(COLORS.LIME);
  const [selectedIcon, setSelectedIcon] = useState('laptop-outline');
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [pendingDeleteAction, setPendingDeleteAction] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    loadCategoryData();
  }, [id]);

  const loadCategoryData = async () => {
    if (!id) return;
    
    try {
      const [allCategories, allTasks] = await Promise.all([
        categoriesApi.getAll(),
        tasksApi.getAll(),
      ]);
      const categoryData = allCategories.find(cat => cat.id === id);
      const tasksData = allTasks.filter(task => task.categoryId === id);
      
      if (!categoryData) {
        Alert.alert('Error', 'Category not found');
        router.back();
        return;
      }
      
      setCategory(categoryData);
      setTasks(tasksData);
      setCategoryName(categoryData.name);
      setSelectedColor(categoryData.color);
      setSelectedIcon(categoryData.icon || 'laptop-outline');
    } catch (error) {
      console.error('Failed to load category:', error);
      Alert.alert('Error', 'Failed to load category data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!category || !categoryName.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }

    try {
      await categoriesApi.update(category.id, {
        name: categoryName,
        color: selectedColor,
        icon: selectedIcon,
      });
      
      Alert.alert('Success', 'Category updated successfully');
      router.back();
    } catch (error) {
      console.error('Failed to update category:', error);
      
      // Show more detailed error information
      let errorMessage = 'Failed to update category';
      if (error && typeof error === 'object') {
        const errObj = error as any;
        if (errObj.message) {
          errorMessage = `Failed to update category: ${errObj.message}`;
        }
        if (errObj.code) {
          errorMessage += ` (Code: ${errObj.code})`;
        }
        if (errObj.status) {
          errorMessage += ` (Status: ${errObj.status})`;
        }
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDeleteGroup = () => {
    // Check if category has tasks
    if (tasks.length > 0) {
      Alert.alert(
        'Cannot Delete Group',
        `This group has ${tasks.length} task${tasks.length === 1 ? '' : 's'}. Please delete all tasks first before deleting the group.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setDeleteMessage('Are you sure you want to delete this group? This action cannot be undone.');
    setPendingDeleteAction(() => {
      return async () => {
        if (!category) return;
        
        try {
          console.log('Attempting to delete category:', category.id);
          await categoriesApi.delete(category.id);
          setDeleteModalVisible(false);
          router.back();
        } catch (error) {
          console.error('Failed to delete category:', error);
          
          // Try to extract more detailed error information
          let errorDetails = 'Unknown error';
          if (error) {
            console.error('Error type:', typeof error);
            console.error('Error constructor:', error.constructor.name);
            console.error('Error keys:', Object.keys(error));
            
            if (error instanceof Error) {
              errorDetails = error.message;
              console.error('Error message:', error.message);
              console.error('Error stack:', error.stack);
            }
            
            if (typeof error === 'object') {
              const errObj = error as any;
              console.error('Error code:', errObj.code);
              console.error('Error status:', errObj.status);
              console.error('Error original:', errObj.original);
              
              if (errObj.message) {
                errorDetails = errObj.message;
              }
              if (errObj.code) {
                errorDetails += ` (Code: ${errObj.code})`;
              }
              if (errObj.status) {
                errorDetails += ` (Status: ${errObj.status})`;
              }
              if (errObj.original) {
                console.error('Original error:', JSON.stringify(errObj.original, null, 2));
              }
            }
          }
          
          Alert.alert('Error', `Failed to delete group: ${errorDetails}`);
          setDeleteModalVisible(false);
        }
      };
    });
    setDeleteModalVisible(true);
  };

  const handleEditTask = (task: Task) => {
    router.push('/add-task' as any);
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setDeleteMessage(`Are you sure you want to delete "${task?.title}"?`);
    setPendingDeleteAction(() => async () => {
      try {
        await tasksApi.delete(taskId);
        setTasks(tasks.filter(t => t.id !== taskId));
        setDeleteModalVisible(false);
      } catch (error) {
        console.error('Failed to delete task:', error);
        Alert.alert('Error', 'Failed to delete task');
        setDeleteModalVisible(false);
      }
    });
    setDeleteModalVisible(true);
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const updatedTask = await tasksApi.update(taskId, {
        status: task.status === 'completed' ? 'pending' : 'completed'
      });
      
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const confirmDelete = async () => {
    if (pendingDeleteAction) {
      await pendingDeleteAction();
    }
    setDeleteModalVisible(false);
    setPendingDeleteAction(null);
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setPendingDeleteAction(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <LoadingCat size={120} />
        </View>
      </SafeAreaView>
    );
  }

  const userName = (user?.name ?? 'NORSEN').toUpperCase();
  const firstLetter = (user?.name?.[0] ?? 'N').toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BACKGROUND} />
      
      {/* Purple background */}
      <View style={styles.background}>
        {/* Header with user info */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{firstLetter}</Text>
            </View>
            <View>
              <Text style={styles.helloText}>Hello!</Text>
              <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/categories')}
            >
              <Ionicons name="grid-outline" size={18} color={COLORS.DARK_TEXT} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/planner')}
            >
              <Ionicons name="arrow-forward" size={18} color={COLORS.DARK_TEXT} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Translucent white overlay with form */}
        <ScrollView 
          style={styles.formContainer}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Edit Group: {category?.name}</Text>

          {/* Category Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Group Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons 
                name="create-outline" 
                size={20} 
                color={COLORS.MUTED_ON_CARD} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Group Name"
                placeholderTextColor={COLORS.MUTED_ON_CARD}
                value={categoryName}
                onChangeText={setCategoryName}
              />
            </View>
          </View>

          {/* Color Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color</Text>
            <ColorPicker
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
            />
          </View>

          {/* Icon Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Icon</Text>
            <IconSelector
              selectedIcon={selectedIcon}
              onSelectIcon={setSelectedIcon}
            />
          </View>

          {/* Task Items List */}
          <View style={styles.taskSection}>
            <Text style={styles.taskSectionTitle}>Task Items List</Text>
            
            {tasks.length === 0 ? (
              <View style={styles.emptyTasks}>
                <Ionicons 
                  name="list-outline" 
                  size={48} 
                  color={COLORS.INPUT_BORDER} 
                />
                <Text style={styles.emptyTasksText}>
                  No tasks yet. Add your first task to get started!
                </Text>
              </View>
            ) : (
              <View style={styles.tasksList}>
                {tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.addTaskBtn]}
              onPress={() => router.push('/(tabs)/add-task')}
              activeOpacity={0.8}
            >
              <Ionicons name="add-outline" size={20} color={COLORS.WHITE_TEXT} />
              <Text style={styles.addTaskBtnText}>Add New Task</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteBtn]}
              onPress={handleDeleteGroup}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.WHITE_TEXT} />
              <Text style={styles.deleteBtnText}>Delete Group</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.saveBtn]}
              onPress={handleSaveChanges}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelBtn]}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      
      <DeleteModal
        visible={deleteModalVisible}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        message={deleteMessage}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: COLORS.BACKGROUND 
  },
  background: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 16,
    color: COLORS.WHITE_TEXT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.30)',
  },
  avatarText: {
    fontFamily: FontFamily.BOLD,
    color: COLORS.WHITE_TEXT,
    fontSize: 18,
  },
  helloText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 12,
    color: COLORS.MUTED_ON_DARK,
  },
  userName: {
    fontFamily: FontFamily.BOLD,
    fontSize: 18,
    color: COLORS.WHITE_TEXT,
    letterSpacing: 1,
    maxWidth: 180,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.LIME,
    alignItems: 'center', justifyContent: 'center',
  },

  formContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -16,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  title: {
    fontFamily: FontFamily.BOLD,
    fontSize: 24,
    color: COLORS.DARK_TEXT,
    marginBottom: 32,
    textAlign: 'center',
  },

  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontFamily: FontFamily.BOLD,
    fontSize: 16,
    color: COLORS.DARK_TEXT,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.DARK_TEXT,
    fontFamily: FontFamily.REGULAR,
  },

  colorPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: COLORS.DARK_TEXT,
    transform: [{ scale: 1.1 }],
  },

  iconSelectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.INPUT_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: COLORS.LIME,
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
  },

  taskSection: {
    marginBottom: 32,
  },
  taskSectionTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 18,
    color: COLORS.DARK_TEXT,
    marginBottom: 16,
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 16,
    color: COLORS.DARK_TEXT,
    marginBottom: 4,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.MUTED_ON_CARD,
  },
  taskDate: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 12,
    color: COLORS.MUTED_ON_CARD,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  taskActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTasks: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyTasksText: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 16,
    color: COLORS.MUTED_ON_CARD,
    textAlign: 'center',
    lineHeight: 24,
  },

  buttonContainer: {
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addTaskBtn: {
    backgroundColor: COLORS.LIME,
    flexDirection: 'row',
    gap: 8,
  },
  addTaskBtnText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 16,
    color: COLORS.DARK_TEXT,
  },
  deleteBtn: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    gap: 8,
  },
  deleteBtnText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 16,
    color: COLORS.WHITE_TEXT,
  },
  saveBtn: {
    backgroundColor: COLORS.LIME,
  },
  saveBtnText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 16,
    color: COLORS.DARK_TEXT,
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.LIME,
  },
  cancelBtnText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 16,
    color: COLORS.LIME,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,26,46,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalWrapper: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  catFloatContainer: {
    width: CAT_SIZE,
    height: CAT_SIZE,
    backgroundColor: 'transparent',
    marginBottom: -CAT_OVERLAP,
    left: 100,
    zIndex: 10,
  },
  catVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 24,
    width: '100%',
    shadowColor: COLORS.BACKGROUND,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    overflow: 'visible',
    zIndex: 12,
  },
  modalContent: {
    alignItems: 'center',
    paddingTop: CAT_OVERLAP + 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  modalTitle: {
    fontFamily: FontFamily.BOLD,
    fontSize: 20,
    color: COLORS.DARK_TEXT,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontFamily: FontFamily.REGULAR,
    fontSize: 14,
    color: COLORS.MUTED_ON_CARD,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: COLORS.INPUT_BG,
    borderWidth: 1.5,
    borderColor: COLORS.INPUT_BORDER,
  },
  modalDeleteBtn: { backgroundColor: '#FF4757' },
  modalCancelBtnText: {
    fontFamily: FontFamily.BOLD,
    color: COLORS.MUTED_ON_CARD,
    fontSize: 15,
  },
  modalDeleteBtnText: {
    fontFamily: FontFamily.BOLD,
    color: COLORS.WHITE_TEXT,
    fontSize: 15,
  },
});