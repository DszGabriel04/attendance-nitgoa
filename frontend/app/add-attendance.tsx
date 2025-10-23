//add-attendance.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getClassStudentsFromHistory, getClasses, submitAttendance, updateAttendance, getTodayAttendance, downloadAttendanceExcel } from '@/utils/api';

export default function AttendanceUI() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  
  // Always use today's date
  const today = new Date();
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [attendanceTaken, setAttendanceTaken] = useState<string>('No');
  const [classSubject, setClassSubject] = useState<string>('');
  const [isRefreshingAttendance, setIsRefreshingAttendance] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const primaryColor = useThemeColor({}, 'buttonPrimary');
  const successColor = useThemeColor({}, 'success');
  const dangerColor = useThemeColor({}, 'danger');

  // Function to load today's attendance
  const loadTodayAttendance = async () => {
    if (!classId) return;
    
    try {
      setIsRefreshingAttendance(true);
      const attendanceResult = await getTodayAttendance(classId);
      if (attendanceResult.success && attendanceResult.attendance) {
        //console.log('Loaded today\'s attendance:', attendanceResult.attendance);
        // Merge today's attendance with existing state (preserving defaults)
        setAttendance(prev => ({
          ...prev,
          ...attendanceResult.attendance
        }));
      }
    } catch (error) {
      console.error('Error loading today\'s attendance:', error);
    } finally {
      setIsRefreshingAttendance(false);
    }
  };

  // Fetch class data and students on component mount
  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId) {
        Alert.alert('Error', 'Class ID not provided');
        router.back();
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch class info to check if attendance is taken
        const classesResult = await getClasses();
        const currentClass = classesResult.find(cls => cls.id === classId);
        
        if (!currentClass) {
          Alert.alert('Error', 'Class not found');
          router.back();
          return;
        }

        setClassSubject(currentClass.subject_name);
        setAttendanceTaken(currentClass.attendance_taken);

        // Fetch students for this class
        const studentsResult = await getClassStudentsFromHistory(classId);
        
        if (!studentsResult.success) {
          Alert.alert('Error', studentsResult.error || 'Failed to fetch students');
          return;
        }

        if (!studentsResult.students || studentsResult.students.length === 0) {
          Alert.alert('Warning', 'No students found for this class');
          return;
        }

        // Convert to expected format
        const studentsList = studentsResult.students.map(student => ({
          id: student.roll,
          name: student.name
        }));

        setStudents(studentsList);
        
        // Initialize all students as absent by default
        const defaultAttendance: Record<string, string> = {};
        studentsList.forEach(student => {
          defaultAttendance[student.id] = 'absent';
        });
        setAttendance(defaultAttendance);
        
        // Load today's attendance after students are loaded (this will override defaults if attendance exists)
        await loadTodayAttendance();
      } catch (error) {
        console.error('Error fetching class data:', error);
        Alert.alert('Error', 'Failed to load class data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassData();
  }, [classId, router]);

  // Refresh attendance when screen comes into focus (e.g., returning from QR page)
  useFocusEffect(
    useCallback(() => {
      if (classId && students.length > 0) {
        //console.log('Screen focused - refreshing attendance data');
        loadTodayAttendance();
      }
    }, [classId, students.length])
  );

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleBack = () => {
    try {
      router.back();
    } catch (error) {
      // Fallback if router.back() doesn't work
      router.push('/'); // or whatever your main screen route is
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(attendance).length === 0) {
      Alert.alert('Error', 'Please mark attendance for at least one student');
      return;
    }

    if (!classId) {
      Alert.alert('Error', 'Class ID is missing');
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      
      // Use POST (submitAttendance) if attendance not taken, PUT (updateAttendance) if already taken
      if (attendanceTaken === 'No') {
        result = await submitAttendance(classId, attendance);
      } else {
        result = await updateAttendance(classId, attendance);
      }

      if (result.success) {
        // Navigate immediately to dashboard
        try {
          router.push('/faculty-dashboard');
        } catch (error) {
          // Fallback navigation
          router.push('/');
        }
      } else {
        throw new Error(result.error || `Failed to ${attendanceTaken === 'No' ? 'submit' : 'update'} attendance`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `Failed to ${attendanceTaken === 'No' ? 'submit' : 'update'} attendance: ` + errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!classId) {
      Alert.alert('Error', 'Class ID not available');
      return;
    }

    setIsDownloading(true);
    try {
      const result = await downloadAttendanceExcel(classId);
      if (result.success) {
        Alert.alert('Success', 'Excel file downloaded successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to download Excel file');
      }
    } catch (error) {
      console.error('Error downloading Excel:', error);
      Alert.alert('Error', 'Failed to download Excel file');
    } finally {
      setIsDownloading(false);
    }
  };

  const presentCount = Object.values(attendance).filter(status => status === 'present').length;
  const absentCount = Object.values(attendance).filter(status => status === 'absent').length;

  // Safety check for classId
  if (!classId) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Invalid class ID</ThemedText>
        </View>
      </ThemedView>
    );
  }

  type Student = { id: string; name: string };

  const renderStudent = ({ item }: { item: Student }) => (
    <View style={[styles.studentCard, { backgroundColor: cardBackground }]}>
      <View style={styles.studentInfo}>
        <ThemedText style={styles.studentName}>{item?.name || 'Unknown'}</ThemedText>
        <ThemedText style={styles.studentRoll}>ID: {item?.id || 'Unknown'}</ThemedText>
      </View>
      <View style={styles.attendanceButtons}>
        <TouchableOpacity
          onPress={() => handleAttendanceChange(item.id, 'present')}
          style={[
            styles.attendanceButton,
            styles.presentButton,
            attendance[item.id] === 'present' && [styles.selectedPresent, { backgroundColor: successColor }]
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="checkmark"
            size={18}
            color={attendance[item.id] === 'present' ? '#fff' : successColor}
          />
          <ThemedText style={[
            styles.buttonText,
            attendance[item.id] === 'present' && styles.selectedButtonText
          ]}>
            Present
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleAttendanceChange(item.id, 'absent')}
          style={[
            styles.attendanceButton,
            styles.absentButton,
            attendance[item.id] === 'absent' && [styles.selectedAbsent, { backgroundColor: dangerColor }]
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close"
            size={18}
            color={attendance[item.id] === 'absent' ? '#fff' : dangerColor}
          />
          <ThemedText style={[
            styles.buttonText,
            attendance[item.id] === 'absent' && styles.selectedButtonText
          ]}>
            Absent
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBackground }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={primaryColor} />
          <ThemedText style={styles.backText}>Back</ThemedText>
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.title}>Attendance</ThemedText>
            {isRefreshingAttendance && (
              <ActivityIndicator size="small" color={primaryColor} style={styles.refreshIndicator} />
            )}
          </View>
          <ThemedText style={styles.classInfo}>Class: {String(classId)}</ThemedText>
          {classSubject && <ThemedText style={styles.subjectInfo}>{String(classSubject)}</ThemedText>}
        </View>
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Loading class data...</ThemedText>
        </View>
      ) : (
        <>
          {/* Date Display (no picker) */}
          <View style={styles.dateSection}>
            <View style={[styles.dateButton, { backgroundColor: cardBackground }]}>
              <Ionicons name="calendar-outline" size={20} color={useThemeColor({}, 'icon')} />
              <ThemedText style={styles.dateText}>{today.toDateString()}</ThemedText>
            </View>
            <View style={[styles.statusBadge, { 
              backgroundColor: attendanceTaken === 'Yes' ? successColor : dangerColor 
            }]}>
              <ThemedText style={styles.statusText}>
                {attendanceTaken === 'Yes' ? 'Updating Attendance' : 'Taking Attendance'}
              </ThemedText>
            </View>
          </View>

          {/* QR Code Button */}
          <View style={styles.qrSection}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/qr-attendance', params: { classId } })}
              style={[styles.qrButton, { backgroundColor: cardBackground }]}
              activeOpacity={0.7}
            >
              <Ionicons name="qr-code-outline" size={24} color={primaryColor} />
              <ThemedText style={styles.qrButtonText}>Generate QR Code for Attendance</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={useThemeColor({}, 'icon')} />
            </TouchableOpacity>
            
            {/* Excel Download Button */}
            <TouchableOpacity
              onPress={handleDownloadExcel}
              style={[styles.downloadButton, { backgroundColor: successColor }]}
              activeOpacity={0.7}
              disabled={isDownloading}
            >
              <Ionicons name="download-outline" size={24} color="#fff" />
              <ThemedText style={styles.downloadButtonText}>
                {isDownloading ? "Downloading..." : "Download Excel Report"}
              </ThemedText>
              {!isDownloading && <Ionicons name="chevron-forward" size={20} color="#fff" />}
              {isDownloading && <ActivityIndicator size="small" color="#fff" />}
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
              <View style={styles.statHeader}>
                <Ionicons name="checkmark-circle" size={20} color={successColor} />
                <ThemedText style={styles.statLabel}>Present</ThemedText>
              </View>
              <ThemedText style={styles.statNumber}>{presentCount || 0}</ThemedText>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
              <View style={styles.statHeader}>
                <Ionicons name="close-circle" size={20} color={dangerColor} />
                <ThemedText style={styles.statLabel}>Absent</ThemedText>
              </View>
              <ThemedText style={styles.statNumber}>{absentCount || 0}</ThemedText>
            </View>
          </View>

          {/* Student List */}
          <View style={styles.listHeader}>
            <Ionicons name="people-outline" size={20} color={useThemeColor({}, 'icon')} />
            <ThemedText style={styles.listHeaderText}>Students ({students?.length || 0})</ThemedText>
          </View>
          
          <FlatList
            data={students || []}
            keyExtractor={(item) => item.id}
            renderItem={renderStudent}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
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
                <ThemedText style={styles.submitButtonText}>
                  {attendanceTaken === 'Yes' ? 'Updating...' : 'Submitting...'}
                </ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.submitButtonText}>
                {attendanceTaken === 'Yes' ? 'Update Attendance' : 'Submit Attendance'}
              </ThemedText>
            )}
          </TouchableOpacity>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerInfo: {
    alignItems: 'flex-end',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshIndicator: {
    marginLeft: 4,
  },
  classInfo: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  subjectInfo: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateSection: {
    marginHorizontal: 16,
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
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  studentRoll: {
    fontSize: 14,
    opacity: 0.7,
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedButtonText: {
    color: '#fff',
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
  qrSection: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  qrButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
    marginTop: 12,
  },
  downloadButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});