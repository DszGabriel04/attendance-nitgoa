import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const dummyStudents = {
  "class_code": "CS101",
  "attendance_history": [
    {
      "date": "2025-08-15",
      "student_id": "101",
      "student_name": "Alice",
      "status": "P"
    },
    {
      "date": "2025-08-15",
      "student_id": "102",
      "student_name": "Bob",
      "status": "A"
    },
    {
      "date": "2025-08-16",
      "student_id": "101",
      "student_name": "Alice",
      "status": "P"
    },
    {
      "date": "2025-08-16",
      "student_id": "102",
      "student_name": "Bob",
      "status": "P"
    }
  ]
};

export default function AttendanceUI() {
  const router = useRouter();
  // Always use today's date
  const today = new Date();
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const classId = dummyStudents.class_code;

  // Get unique students from attendance_history
  const students = Array.from(
    new Map(
      dummyStudents.attendance_history.map(s => [s.student_id, { id: s.student_id, name: s.student_name }])
    ).values()
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

    setIsSubmitting(true);
    try {
      // Replace with your actual API endpoint
      const response = await fetch('https://your-api.com/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId,
          date: today.toISOString().split('T')[0],
          attendance
        }),
      });
      if (response.ok) {
        Alert.alert('Success', 'Attendance submitted successfully!', [
          { 
            text: 'OK', 
            onPress: () => {
              try {
                router.back();
              } catch (error) {
                // Fallback navigation
                router.push('/'); // or whatever your main screen route is
              }
            }
          }
        ]);
      } else {
        throw new Error('Failed to submit attendance');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', 'Failed to submit attendance: ' + errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Date picker removed, always use today's date

  const presentCount = Object.values(attendance).filter(status => status === 'present').length;
  const absentCount = Object.values(attendance).filter(status => status === 'absent').length;

  type Student = { id: string; name: string };

  const renderStudent = ({ item }: { item: Student }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentRoll}>ID: {item.id}</Text>
      </View>
      <View style={styles.attendanceButtons}>
        <TouchableOpacity
          onPress={() => handleAttendanceChange(item.id, 'present')}
          style={[
            styles.attendanceButton,
            styles.presentButton,
            attendance[item.id] === 'present' && styles.selectedPresent
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="checkmark"
            size={18}
            color={attendance[item.id] === 'present' ? '#fff' : '#10b981'}
          />
          <Text style={[
            styles.buttonText,
            attendance[item.id] === 'present' && styles.selectedButtonText
          ]}>
            Present
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleAttendanceChange(item.id, 'absent')}
          style={[
            styles.attendanceButton,
            styles.absentButton,
            attendance[item.id] === 'absent' && styles.selectedAbsent
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close"
            size={18}
            color={attendance[item.id] === 'absent' ? '#fff' : '#ef4444'}
          />
          <Text style={[
            styles.buttonText,
            attendance[item.id] === 'absent' && styles.selectedButtonText
          ]}>
            Absent
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f9ff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Attendance</Text>
          <Text style={styles.classInfo}>Class: {classId}</Text>
        </View>
      </View>

      {/* Date Display (no picker) */}
      <View style={styles.dateSection}>
        <View style={styles.dateButton}>
          <Ionicons name="calendar-outline" size={20} color="#6b7280" />
          <Text style={styles.dateText}>{today.toDateString()}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <Text style={styles.statNumber}>{presentCount}</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="close-circle" size={20} color="#ef4444" />
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <Text style={styles.statNumber}>{absentCount}</Text>
        </View>
      </View>

      {/* Student List */}
      <View style={styles.listHeader}>
        <Ionicons name="people-outline" size={20} color="#6b7280" />
        <Text style={styles.listHeaderText}>Students</Text>
      </View>
      
      <FlatList
        data={students}
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
          (isSubmitting || Object.keys(attendance).length === 0) && styles.disabledButton
        ]}
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.submitButtonText}>Submitting...</Text>
          </View>
        ) : (
          <Text style={styles.submitButtonText}>Submit Attendance</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  header: {
    backgroundColor: '#fff',
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
    color: '#374151',
  },
  headerInfo: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  classInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  dateSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  dateButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
    color: '#374151',
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
    backgroundColor: '#fff',
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
    color: '#374151',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
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
    color: '#374151',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  studentCard: {
    backgroundColor: '#fff',
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
    color: '#1f2937',
    marginBottom: 4,
  },
  studentRoll: {
    fontSize: 14,
    color: '#6b7280',
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
  },
  presentButton: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  selectedPresent: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  absentButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  selectedAbsent: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedButtonText: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
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
});