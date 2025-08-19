// class-details.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getClassStudentsFromHistory, submitAttendance, deleteClass } from '@/utils/api';

type Student = { roll: string; name: string };

export default function ClassDetails() {
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const primaryColor = useThemeColor({}, 'buttonPrimary');
  const dangerColor = useThemeColor({}, 'danger');
  const successColor = useThemeColor({}, 'success');

  const today = new Date();

  // Fetch students when component mounts
  useEffect(() => {
    const fetchStudents = async () => {
      if (!classId || typeof classId !== 'string') {
        setStudentsError('Invalid class ID');
        setIsLoadingStudents(false);
        return;
      }

      try {
        setIsLoadingStudents(true);
        setStudentsError(null);
        
        const result = await getClassStudentsFromHistory(classId);
        
        if (result.success && result.students) {
          setStudents(result.students);
        } else {
          setStudentsError(result.error || 'Failed to load students');
          setStudents([]); // Set empty array as fallback
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudentsError('Network error occurred');
        setStudents([]);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [classId]);

  const handleDeleteClass = async () => {
    setDeleteModalVisible(false);
    
    if (!classId || typeof classId !== 'string') {
      Alert.alert('Error', 'Invalid class ID');
      return;
    }

    // Navigate back to dashboard immediately
    router.push('/faculty-dashboard?refresh=true');

    try {
      const result = await deleteClass(classId);
      
      if (!result.success) {
        // If deletion failed, show error but user is already back at dashboard
        Alert.alert('Error', result.error || 'Failed to delete class');
      }
      // No success alert needed since user is already back at dashboard
      // and the refresh will show the updated list
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', 'Failed to delete class: ' + errorMsg);
    }
  };

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmitAttendance = async () => {
    if (Object.keys(attendance).length === 0) {
      Alert.alert('Error', 'Please mark attendance for at least one student');
      return;
    }

    if (!classId || typeof classId !== 'string') {
      Alert.alert('Error', 'Invalid class ID');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitAttendance(classId, attendance);
      
      if (result.success && result.data) {
        const { created, skipped } = result.data;
        let message = `Attendance submitted successfully!\n${created} record(s) created.`;
        
        if (skipped.length > 0) {
          message += `\n\nSkipped:\n${skipped.join('\n')}`;
        }
        
        Alert.alert('Success', message, [
          { 
            text: 'OK', 
            onPress: () => {
              setShowAttendance(false);
              setAttendance({});
            }
          }
        ]);
      } else {
        throw new Error(result.error || 'Failed to submit attendance');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', 'Failed to submit attendance: ' + errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const presentCount = Object.values(attendance).filter(status => status === 'present').length;
  const absentCount = Object.values(attendance).filter(status => status === 'absent').length;

  const renderStudent = ({
    item,
    index,
  }: {
    item: Student;
    index: number;
  }) => (
    <View style={[
      styles.studentRow, 
      { backgroundColor: index % 2 === 0 ? cardBackground : backgroundColor }
    ]}>
      <ThemedText style={styles.rollNumber}>{item.roll}</ThemedText>
      <ThemedText style={styles.studentName}>{item.name}</ThemedText>
    </View>
  );

  const renderAttendanceStudent = ({ item }: { item: Student }) => (
    <View style={[styles.studentCard, { backgroundColor: cardBackground }]}>
      <View style={styles.studentInfo}>
        <ThemedText style={styles.studentNameCard} numberOfLines={1}>{item.name}</ThemedText>
        <ThemedText style={styles.studentRoll}>Roll: {item.roll}</ThemedText>
      </View>
      <View style={styles.attendanceButtons}>
        <TouchableOpacity
          onPress={() => handleAttendanceChange(item.roll, 'present')}
          style={[
            styles.attendanceButton,
            styles.presentButton,
            attendance[item.roll] === 'present' && [styles.selectedPresent, { backgroundColor: successColor }]
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="checkmark"
            size={20}
            color={attendance[item.roll] === 'present' ? '#fff' : successColor}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleAttendanceChange(item.roll, 'absent')}
          style={[
            styles.attendanceButton,
            styles.absentButton,
            attendance[item.roll] === 'absent' && [styles.selectedAbsent, { backgroundColor: dangerColor }]
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close"
            size={20}
            color={attendance[item.roll] === 'absent' ? '#fff' : dangerColor}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (showAttendance) {
    return (
      <ThemedView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
        
        {/* Attendance Header */}
        <View style={[styles.attendanceHeader, { backgroundColor: cardBackground }]}>
          <View style={styles.attendanceHeaderTop}>
            <TouchableOpacity 
              onPress={() => {
                setShowAttendance(false);
                setAttendance({});
              }} 
              style={styles.attendanceBackButton}
            >
              <Ionicons name="arrow-back" size={24} color={primaryColor} />
              <ThemedText style={styles.backText}>Back</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.attendanceHeaderContent}>
            <ThemedText style={styles.attendanceHeaderTitle}>Attendance</ThemedText>
            <ThemedText style={styles.attendanceClassName}>Class {classId}</ThemedText>
          </View>
        </View>

        {/* Date Display */}
        <View style={styles.dateSection}>
          <View style={[styles.dateButton, { backgroundColor: cardBackground }]}>
            <Ionicons name="calendar-outline" size={20} color={useThemeColor({}, 'icon')} />
            <ThemedText style={styles.dateText}>{today.toDateString()}</ThemedText>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <View style={styles.statHeader}>
              <Ionicons name="checkmark-circle" size={20} color={successColor} />
              <ThemedText style={styles.statLabel}>Present</ThemedText>
            </View>
            <ThemedText style={styles.statNumber}>{presentCount}</ThemedText>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <View style={styles.statHeader}>
              <Ionicons name="close-circle" size={20} color={dangerColor} />
              <ThemedText style={styles.statLabel}>Absent</ThemedText>
            </View>
            <ThemedText style={styles.statNumber}>{absentCount}</ThemedText>
          </View>
        </View>

        {/* Student List for Attendance */}
        <View style={styles.listHeader}>
          <Ionicons name="people-outline" size={20} color={useThemeColor({}, 'icon')} />
          <ThemedText style={styles.listHeaderText}>Students</ThemedText>
        </View>
        
        <FlatList
          data={students}
          keyExtractor={(item) => item.roll}
          renderItem={renderAttendanceStudent}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmitAttendance}
          disabled={isSubmitting || Object.keys(attendance).length === 0}
          style={[
            styles.submitButton,
            { backgroundColor: primaryColor },
            (isSubmitting || Object.keys(attendance).length === 0) && styles.disabledButton
          ]}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <ThemedText style={styles.submitButtonText}>Submitting...</ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.submitButtonText}>Submit Attendance</ThemedText>
          )}
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBackground }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: backgroundColor }]} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={primaryColor} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Class Details</ThemedText>
          <ThemedText style={styles.className}>Class {classId}</ThemedText>
        </View>
        
        {/* Delete button moved to header - safer location */}
        <TouchableOpacity 
          style={styles.headerDeleteButton}
          onPress={() => setDeleteModalVisible(true)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={useThemeColor({}, 'icon')} />
        </TouchableOpacity>
      </View>

      {/* Take Attendance Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={() => setShowAttendance(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <ThemedText style={styles.primaryButtonText}>Take Attendance</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Students Table */}
      <View style={[styles.tableContainer, { backgroundColor: cardBackground }]}>
        <ThemedText style={styles.tableTitle}>
          Students ({isLoadingStudents ? '...' : students.length})
        </ThemedText>
        
        {isLoadingStudents ? (
          <View style={styles.studentsLoadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <ThemedText style={styles.loadingText}>Loading students...</ThemedText>
          </View>
        ) : studentsError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={24} color={dangerColor} />
            <ThemedText style={styles.errorText}>{studentsError}</ThemedText>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: primaryColor }]}
              onPress={() => {
                // Trigger re-fetch by changing a dependency
                const fetchStudents = async () => {
                  if (!classId || typeof classId !== 'string') return;
                  
                  try {
                    setIsLoadingStudents(true);
                    setStudentsError(null);
                    
                    const result = await getClassStudentsFromHistory(classId);
                    
                    if (result.success && result.students) {
                      setStudents(result.students);
                    } else {
                      setStudentsError(result.error || 'Failed to load students');
                      setStudents([]);
                    }
                  } catch (error) {
                    console.error('Error fetching students:', error);
                    setStudentsError('Network error occurred');
                    setStudents([]);
                  } finally {
                    setIsLoadingStudents(false);
                  }
                };
                fetchStudents();
              }}
            >
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Table Header */}
            <View style={[styles.tableHeader, { backgroundColor: backgroundColor }]}>
              <ThemedText style={styles.headerCell}>Roll No.</ThemedText>
              <ThemedText style={styles.headerCell}>Name</ThemedText>
            </View>

            {/* Students List */}
            <FlatList
              data={students}
              keyExtractor={item => item.roll}
              renderItem={renderStudent}
              showsVerticalScrollIndicator={false}
              style={styles.studentsList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color={useThemeColor({}, 'icon')} style={{ opacity: 0.3 }} />
                  <ThemedText style={styles.emptyText}>No students found</ThemedText>
                  <ThemedText style={styles.emptySubText}>
                    This class may not have any attendance records yet
                  </ThemedText>
                </View>
              }
            />
          </>
        )}
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: cardBackground }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={48} color={dangerColor} />
              <ThemedText style={styles.modalTitle}>Delete Class</ThemedText>
              <ThemedText style={styles.modalMessage}>
                Are you sure you want to delete Class {classId}? This action cannot be undone and will remove all attendance records.
              </ThemedText>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: backgroundColor }]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmDeleteButton, { backgroundColor: dangerColor }]}
                onPress={handleDeleteClass}
              >
                <ThemedText style={styles.confirmDeleteButtonText}>Delete</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    flexDirection: 'row',
    gap: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerContent: {
    flex: 1,
  },
  headerInfo: {
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  className: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.7,
  },
  headerDeleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  
  // Updated Attendance Header Styles
  attendanceHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attendanceHeaderTop: {
    marginBottom: 16,
  },
  attendanceBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  attendanceHeaderContent: {
    alignItems: 'center',
  },
  attendanceHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  attendanceClassName: {
    fontSize: 18,
    fontWeight: '500',
    opacity: 0.7,
  },
  
  buttonContainer: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 20,
    paddingBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'left',
  },
  studentsList: {
    flex: 1,
  },
  studentRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rollNumber: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  studentName: {
    flex: 1,
    fontSize: 16,
  },
  
  // Attendance specific styles
  dateSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  studentCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  studentInfo: {
    flex: 1,
    marginRight: 16,
    minWidth: 200, // Ensures enough space for first 2 words + roll number
  },
  studentNameCard: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    // Prevent text wrapping
  },
  studentRoll: {
    fontSize: 14,
    opacity: 0.7,
    minWidth: 120, // Space for roll numbers up to 10 characters
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 12,
    flexShrink: 0, // Prevents buttons from shrinking
  },
  attendanceButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presentButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  selectedPresent: {
    borderColor: 'transparent',
  },
  absentButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  selectedAbsent: {
    borderColor: 'transparent',
  },
  submitButton: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 25,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Loading and error states
  studentsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 20,
  },
});