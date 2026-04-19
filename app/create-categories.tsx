import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { COLORS } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { useAuth } from '@/context/auth-context';
import { categoriesApi } from '@/services/api/categories';

const { width } = Dimensions.get('window');

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

// ── Main Create Project Screen Component ─────────────────────────────────────────

export default function CreateProjectScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(COLORS.LIME);
  const [selectedIcon, setSelectedIcon] = useState('laptop-outline');

  const userName = (user?.name ?? 'NORSEN').toUpperCase();
  const firstLetter = (user?.name?.[0] ?? 'N').toUpperCase();

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      // Show error or alert
      return;
    }

    try {
      await categoriesApi.create({
        name: projectName,
        color: selectedColor,
        icon: selectedIcon,
      });
      
      // Navigate back to group page
      router.back();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

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
          <Text style={styles.title}>Create New Category</Text>

          {/* Project Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons 
                name="add-outline" 
                size={20} 
                color={COLORS.MUTED_ON_CARD} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Category Name"
                placeholderTextColor={COLORS.MUTED_ON_CARD}
                value={projectName}
                onChangeText={setProjectName}
              />
            </View>
          </View>

          {/* Project Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project Description</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your project here..."
                placeholderTextColor={COLORS.MUTED_ON_CARD}
                value={projectDescription}
                onChangeText={setProjectDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Color Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color Picker</Text>
            <ColorPicker
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
            />
          </View>

          {/* Icon Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Icon Icon</Text>
            <IconSelector
              selectedIcon={selectedIcon}
              onSelectIcon={setSelectedIcon}
            />
          </View>

          {/* Add First Task Button */}
          <TouchableOpacity
            style={styles.addTaskBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/add-task')}
          >
            <Ionicons name="add-outline" size={20} color={COLORS.WHITE_TEXT} />
            <Text style={styles.addTaskText}>Add First Task</Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.createBtn]}
              onPress={handleCreateProject}
              activeOpacity={0.8}
            >
              <Text style={styles.createBtnText}>Create Category</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelBtn]}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
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
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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

  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.LIME,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 24,
  },
  addTaskText: {
    fontFamily: FontFamily.BOLD,
    fontSize: 16,
    color: COLORS.DARK_TEXT,
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
  createBtn: {
    backgroundColor: COLORS.LIME,
  },
  createBtnText: {
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
});
