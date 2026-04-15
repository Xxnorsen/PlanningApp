import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { 
  ChevronLeft, 
  Bell, 
  Briefcase, 
  Calendar, 
  Edit3, 
  ChevronDown,
  CheckCircle2,
  Clock,
  ListTodo
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
// import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EditProjectScreen = () => {
  const router = useRouter();
  
  const [project, setProject] = useState({
    group: 'Work',
    name: 'Grocery Shopping App',
    description: 'This application is designed for super shops. By using this application they can enlist all their products in one place and can deliver. Customers will get a one-stop solution for their daily shopping.',
    startDate: new Date(2022, 4, 1), // May 1, 2022
    endDate: new Date(2022, 5, 30),   // June 30, 2022
    status: 'Completed'
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);
  const rotationAnim = useRef(new Animated.Value(0)).current;

  const statusOptions = [
    { label: 'To Do', icon: <ListTodo size={18} color="#64748b" /> },
    { label: 'In Progress', icon: <Clock size={18} color="#f59e0b" /> },
    { label: 'Completed', icon: <CheckCircle2 size={18} color="#10b981" /> },
  ];

  // Helper to format date for the UI
  // Add ': Date' to the parameter
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
  // Hide picker for Android immediately
  if (Platform.OS === 'android') setShowPicker(null);

  if (selectedDate) {
    if (showPicker === 'start') {
      setProject({ ...project, startDate: selectedDate });
    } else {
      setProject({ ...project, endDate: selectedDate });
    }
  }
};

  const toggleDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(rotationAnim, {
      toValue: isDropdownOpen ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectStatus = (val: string) => { 
  setProject({ ...project, status: val });
  toggleDropdown();
};

  const arrowRotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handleUpdate = () => {
    console.log("Saving changes:", {
      ...project,
      startDate: formatDate(project.startDate),
      endDate: formatDate(project.endDate)
    });
  };

  const goBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={goBack}>
            <ChevronLeft color="#1A1C1E" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Project</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Bell color="#1A1C1E" size={24} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Task Group */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#FDECF1' }]}>
                <Briefcase color="#E91E63" size={20} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>Task Group</Text>
                <TextInput 
                  style={styles.input}
                  value={project.group}
                  onChangeText={(text) => setProject({...project, group: text})}
                />
              </View>
              <ChevronDown color="#8E8E93" size={20} />
            </View>
          </View>

          {/* Project Name */}
          <View style={styles.card}>
            <Text style={styles.label}>Project Name</Text>
            <TextInput 
              style={styles.input}
              value={project.name}
              onChangeText={(text) => setProject({...project, name: text})}
              placeholder="Enter project name"
            />
          </View>

          {/* Description */}
          <View style={[styles.card, styles.descriptionCard]}>
            <Text style={styles.label}>Description</Text>
            <TextInput 
              style={[styles.input, styles.multilineInput]}
              value={project.description}
              onChangeText={(text) => setProject({...project, description: text})}
              multiline
              scrollEnabled={false}
            />
          </View>

          {/* Start Date Picker Trigger */}
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.7}
            onPress={() => setShowPicker('start')}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#EEF0FF' }]}>
                <Calendar color="#5D5FEF" size={20} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>Start Date</Text>
                <Text style={styles.valueText}>{formatDate(project.startDate)}</Text>
              </View>
              <ChevronDown color="#8E8E93" size={20} />
            </View>
          </TouchableOpacity>

          {/* End Date Picker Trigger */}
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.7}
            onPress={() => setShowPicker('end')}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#EEF0FF' }]}>
                <Calendar color="#5D5FEF" size={20} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>End Date</Text>
                <Text style={styles.valueText}>{formatDate(project.endDate)}</Text>
              </View>
              <ChevronDown color="#8E8E93" size={20} />
            </View>
          </TouchableOpacity>

          {/* Native Date Picker Component */}
          {showPicker && (
            <DateTimePicker
              value={showPicker === 'start' ? project.startDate : project.endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onDateChange}
              style={Platform.OS === 'ios' ? styles.iosPicker : null}
            />
          )}

          {/* Status Dropdown */}
          <View style={styles.dropdownContainer}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={toggleDropdown}
              style={[
                styles.card, 
                styles.statusCard, 
                isDropdownOpen && styles.statusCardActive
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#C7C9FF' }]}>
                  <Edit3 color="#5D5FEF" size={20} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.label}>Status</Text>
                  <Text style={styles.valueText}>{project.status}</Text>
                </View>
                <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
                  <ChevronDown color="#1A1C1E" size={20} />
                </Animated.View>
              </View>
            </TouchableOpacity>

            {isDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {statusOptions.map((item, index) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.optionItem,
                      index !== statusOptions.length - 1 && styles.optionBorder
                    ]}
                    onPress={() => selectStatus(item.label)}
                  >
                    {item.icon}
                    <Text style={[
                      styles.optionText, 
                      project.status === item.label && styles.selectedOptionText
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, styles.editButton]} 
          onPress={handleUpdate}
        >
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.deleteButton]}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E' },
  iconButton: { padding: 8 },
  notificationDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, backgroundColor: '#E91E63', borderRadius: 4, borderWidth: 1, borderColor: 'white' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { padding: 10, borderRadius: 12, marginRight: 12 },
  textContainer: { flex: 1 },
  label: { fontSize: 12, color: '#8E8E93', marginBottom: 2 },
  input: { fontSize: 16, fontWeight: '600', color: '#1A1C1E', paddingVertical: 0 },
  valueText: { fontSize: 16, fontWeight: '600', color: '#1A1C1E' },
  multilineInput: { lineHeight: 22, fontWeight: '400', color: '#4A4A4A' },
  descriptionCard: { backgroundColor: '#FFFCF5' },
  iosPicker: { backgroundColor: 'white', borderRadius: 16, marginBottom: 16 },
  
  dropdownContainer: { zIndex: 1000 },
  statusCard: { backgroundColor: '#E8E9FF' },
  statusCardActive: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0 },
  dropdownMenu: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 16,
  },
  optionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  optionBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F3FF' },
  optionText: { fontSize: 15, color: '#4A4A4A' },
  selectedOptionText: { color: '#5D5FEF', fontWeight: 'bold' },

  footer: { position: 'absolute', bottom: 0, flexDirection: 'row', padding: 20, backgroundColor: '#F8F9FF', width: '100%', gap: 12 },
  button: { flex: 1, height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  editButton: { backgroundColor: '#5D5FEF' },
  deleteButton: { backgroundColor: '#E53935' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default EditProjectScreen;