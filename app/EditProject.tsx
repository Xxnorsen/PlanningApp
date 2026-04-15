import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Types
interface ProjectData {
  taskGroup: string;
  projectName: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'Completed' | 'In Progress' | 'To-do';
}

export default function EditProject() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Initialize form data (in real app, this would come from params or API)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [datePickerConfig, setDatePickerConfig] = useState<{
    visible: boolean;
    field: 'startDate' | 'endDate' | null;
    date: Date;
  }>({ visible: false, field: null, date: new Date() });
  
  const statusOptions: ProjectData['status'][] = ['To-do', 'In Progress', 'Completed'];
  
  const [formData, setFormData] = useState<ProjectData>({
    taskGroup: 'Work',
    projectName: 'Grocery Shopping App',
    description: 'This application is designed for super shops. By using this application they can enlist all their products in one place and can deliver. Customers will get a one-stop solution for their daily shopping.',
    startDate: '01 May, 2022',
    endDate: '30 June, 2022',
    status: 'Completed',
  });

  const handleEdit = () => {
    // Handle edit functionality
    console.log('Edit project:', formData);
    // Navigate back or show success message
  };

  const handleDelete = () => {
    // Handle delete functionality
    console.log('Delete project');
    // Navigate back or show confirmation
  };

  const goBack = () => {
    router.back();
  };

  const getStatusBgColor = (status: string) => {
    switch(status) {
      case 'Completed': return '#E8E5FF';
      case 'In Progress': return '#FFF4E5';
      case 'To-do': return '#FFE5E5';
      default: return '#E8E5FF';
    }
  };

  const handleStatusSelect = (status: ProjectData['status']) => {
    setFormData(prev => ({ ...prev, status }));
    setStatusDropdownOpen(false);
  };

  const parseDateString = (dateStr: string): Date => {
    const months: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'June': 5,
      'July': 6, 'Aug': 7, 'Sept': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const parts = dateStr.split(' ');
    const day = parseInt(parts[0]);
    const month = months[parts[1].replace(',', '')] || 0;
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  };

  const formatDate = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  const openDatePicker = (field: 'startDate' | 'endDate') => {
    const currentDate = parseDateString(formData[field]);
    setDatePickerConfig({
      visible: true,
      field,
      date: currentDate,
    });
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setDatePickerConfig(prev => ({ ...prev, visible: false }));
    }
    
    if (selectedDate && datePickerConfig.field) {
      setFormData(prev => ({
        ...prev,
        [datePickerConfig.field!]: formatDate(selectedDate),
      }));
      if (Platform.OS === 'ios') {
        setDatePickerConfig(prev => ({ ...prev, date: selectedDate }));
      }
    }
  };

  const closeDatePicker = () => {
    setDatePickerConfig(prev => ({ ...prev, visible: false }));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8FF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Project</Text>
        <TouchableOpacity style={styles.bellButton}>
          <Text style={styles.bellIcon}>🔔</Text>
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      {/* Form Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.formContainer}
      >
        {/* Task Group */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <View style={styles.labelContainer}>
              <View style={styles.iconContainerPink}>
                <Text style={styles.icon}>💼</Text>
              </View>
              <Text style={styles.labelSmall}>Task Group</Text>
            </View>
            <Text style={styles.dropdownArrow}>▼</Text>
          </View>
          <Text style={[styles.value, styles.valueIndented]}>{formData.taskGroup}</Text>
        </View>

        {/* Project Name */}
        <View style={styles.inputCard}>
          <Text style={styles.labelSmall}>Project Name</Text>
          <TextInput
            style={styles.textInput}
            value={formData.projectName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, projectName: text }))}
            placeholder="Enter project name"
            placeholderTextColor="#999"
          />
        </View>

        {/* Description */}
        <View style={[styles.inputCard, styles.descriptionCard]}>
          <Text style={styles.labelSmall}>Description</Text>
          <TextInput
            style={styles.textInputMultiline}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Enter description"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Start Date */}
        <TouchableOpacity style={styles.inputCard} onPress={() => openDatePicker('startDate')}>
          <View style={styles.inputHeader}>
            <View style={styles.labelContainer}>
              <View style={styles.iconContainerPurple}>
                <Text style={styles.iconWhite}>📅</Text>
              </View>
              <Text style={styles.labelSmall}>Start Date</Text>
            </View>
            <Text style={styles.dropdownArrow}>▼</Text>
          </View>
          <Text style={[styles.value, styles.valueIndented]}>{formData.startDate}</Text>
        </TouchableOpacity>

        {/* End Date */}
        <TouchableOpacity style={styles.inputCard} onPress={() => openDatePicker('endDate')}>
          <View style={styles.inputHeader}>
            <View style={styles.labelContainer}>
              <View style={styles.iconContainerPurple}>
                <Text style={styles.iconWhite}>📅</Text>
              </View>
              <Text style={styles.labelSmall}>End Date</Text>
            </View>
            <Text style={styles.dropdownArrow}>▼</Text>
          </View>
          <Text style={[styles.value, styles.valueIndented]}>{formData.endDate}</Text>
        </TouchableOpacity>

        {/* Status */}
        <View style={[styles.inputCard, { backgroundColor: getStatusBgColor(formData.status) }]}>
          <TouchableOpacity onPress={() => setStatusDropdownOpen(!statusDropdownOpen)}>
            <View style={styles.inputHeader}>
              <View style={styles.labelContainer}>
                <View style={styles.iconContainerPurpleSmall}>
                  <Text style={styles.iconWhiteSmall}>✏️</Text>
                </View>
                <Text style={styles.labelSmall}>Status</Text>
              </View>
              <Text style={[styles.dropdownArrow, statusDropdownOpen && styles.dropdownArrowOpen]}>▼</Text>
            </View>
            <Text style={[styles.value, styles.valueIndented]}>{formData.status}</Text>
          </TouchableOpacity>
          
          {statusDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.dropdownItem,
                    formData.status === status && styles.dropdownItemSelected
                  ]}
                  onPress={() => handleStatusSelect(status)}
                >
                  <View style={[styles.statusDot, { backgroundColor: getStatusBgColor(status) }]} />
                  <Text style={[
                    styles.dropdownItemText,
                    formData.status === status && styles.dropdownItemTextSelected
                  ]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* iOS Date Picker Modal */}
        {datePickerConfig.visible && Platform.OS === 'ios' && (
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={closeDatePicker}>
                  <Text style={styles.datePickerButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={datePickerConfig.date}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
              />
            </View>
          </View>
        )}

        {/* Android Date Picker */}
        {datePickerConfig.visible && Platform.OS === 'android' && (
          <DateTimePicker
            value={datePickerConfig.date}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEdit}
          activeOpacity={0.85}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.85}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Styles
const PURPLE = '#6C63FF';
const RED = '#E53935';

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
  backArrow: { 
    fontSize: 20, 
    color: '#333', 
    fontWeight: 'bold' 
  },
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
  bellIcon: { 
    fontSize: 16,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PURPLE,
    borderWidth: 1.5,
    borderColor: '#fff',
  },

  // Form Container
  formContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120, // Extra padding for buttons
    gap: 16,
  },

  // Input Cards
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
  descriptionValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    paddingVertical: 4,
  },
  // Icon containers
  iconContainerPink: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFE5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconContainerPurple: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconContainerPurpleSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconWhite: {
    fontSize: 14,
  },
  iconWhiteSmall: {
    fontSize: 12,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
  },
  valueIndented: {
    marginLeft: 42,
  },
  descriptionCard: {
    backgroundColor: '#FFFBF0',
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginTop: 4,
  },
  textInputMultiline: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginTop: 4,
    minHeight: 80,
  },

  // Dropdown styles
  dropdownArrowOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownMenu: {
    marginTop: 12,
    marginLeft: 42,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemSelected: {
    backgroundColor: '#F7F8FF',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
    color: PURPLE,
  },

  // Date Picker styles
  datePickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 320,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  datePickerButton: {
    color: PURPLE,
    fontSize: 16,
    fontWeight: '600',
  },

  // Buttons
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 34, // Extra padding for safe area
    backgroundColor: '#F7F8FF',
  },
  editButton: {
    flex: 1,
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: PURPLE,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: RED,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: RED,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
