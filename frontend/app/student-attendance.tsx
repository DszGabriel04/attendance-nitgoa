import React, { useState } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  StatusBar, 
  TextInput,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width: screenWidth } = Dimensions.get('window');

// Sample data based on your JSON structure
const sampleAttendanceData = {
  "class_code": "CS101",
  "attendance_history": [
    {
      "date": "2025-08-15",
      "student_id": "20230001",
      "student_name": "John Doe",
      "status": "P"
    },
    {
      "date": "2025-08-15",
      "student_id": "20230002", 
      "student_name": "Jane Smith",
      "status": "A"
    },
    {
      "date": "2025-08-15",
      "student_id": "20230003",
      "student_name": "Bob Johnson",
      "status": "P"
    },
    {
      "date": "2025-08-16",
      "student_id": "20230001",
      "student_name": "John Doe", 
      "status": "A"
    },
    {
      "date": "2025-08-16",
      "student_id": "20230002",
      "student_name": "Jane Smith",
      "status": "P"
    },
    {
      "date": "2025-08-16",
      "student_id": "20230003",
      "student_name": "Bob Johnson",
      "status": "P"
    },
    {
      "date": "2025-08-17",
      "student_id": "20230001",
      "student_name": "John Doe", 
      "status": "P"
    },
    {
      "date": "2025-08-17",
      "student_id": "20230002",
      "student_name": "Jane Smith",
      "status": "A"
    },
    {
      "date": "2025-08-17",
      "student_id": "20230003",
      "student_name": "Bob Johnson",
      "status": "P"
    }
  ]
};

// Additional sample classes for demonstration
const additionalClasses = {
  "MA201": {
    "class_code": "MATH201",
    "attendance_history": [
      {
        "date": "2025-08-14",
        "student_id": "20230001",
        "student_name": "John Doe",
        "status": "P"
      },
      {
        "date": "2025-08-14",
        "student_id": "20230004",
        "student_name": "Alice Brown",
        "status": "A"
      },
      {
        "date": "2025-08-18",
        "student_id": "20230001",
        "student_name": "John Doe",
        "status": "A"
      },
      {
        "date": "2025-08-18",
        "student_id": "20230004",
        "student_name": "Alice Brown",
        "status": "P"
      }
    ]
  }
};

// Function to transform JSON data into spreadsheet format
type AttendanceRecord = {
  date: string;
  student_id: string;
  student_name: string;
  status: string;
};

type AttendanceData = {
  class_code: string;
  attendance_history: AttendanceRecord[];
};

const transformAttendanceData = (attendanceData: AttendanceData) => {
  if (!attendanceData || !attendanceData.attendance_history) {
    return null;
  }

  const { class_code, attendance_history } = attendanceData;
  
  // Get unique dates and sort them
  const dates = [...new Set(attendance_history.map(record => record.date))].sort();
  
  // Get unique students
  const studentsMap = new Map();
  attendance_history.forEach(record => {
    if (!studentsMap.has(record.student_id)) {
      studentsMap.set(record.student_id, {
        student_id: record.student_id,
        student_name: record.student_name,
        attendance: {}
      });
    }
  });

  // Fill attendance data
  attendance_history.forEach(record => {
    const student = studentsMap.get(record.student_id);
    student.attendance[record.date] = record.status;
  });

  // Convert to array format for rendering
  const students = Array.from(studentsMap.values()).map(student => ({
    rollNo: student.student_id,
    name: student.student_name,
    attendance: dates.map(date => student.attendance[date] || '-') // '-' for missing data
  }));

  return {
    className: class_code,
    dates: dates,
    students: students
  };
};

export default function StudentAttendance() {
  const router = useRouter();
  const [classCode, setClassCode] = useState('');
  const [selectedClass, setSelectedClass] = useState<ReturnType<typeof transformAttendanceData> | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const cardBackground = useThemeColor({}, 'cardBackground');
  const successColor = useThemeColor({}, 'success');
  const dangerColor = useThemeColor({}, 'danger');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'inputBorder');
  const inputBackground = useThemeColor({}, 'inputBackground');

  const classData: { [key: string]: any } = {
    [sampleAttendanceData.class_code]: transformAttendanceData(sampleAttendanceData),
    ...Object.fromEntries(
      Object.entries(additionalClasses).map(([code, data]) => [
        code,
        transformAttendanceData(data)
      ])
    )
  };
  
  const availableClasses = Object.keys(classData);
  const filteredClasses = availableClasses.filter(code => 
    code.toLowerCase().includes(classCode.toLowerCase())
  );

  const handleClassSelect = (code: string) => {
    setClassCode(code);
    setSelectedClass(classData[code]);
    setShowSuggestions(false);
  };

  const handleSearch = () => {
    if (classData[classCode]) {
      setSelectedClass(classData[classCode]);
    } else {
      setSelectedClass(null);
    }
    setShowSuggestions(false);
  };

  const renderAttendanceCell = (status: string, index: number) => (
    <View 
      key={index}
      style={[
        styles.attendanceCell,
        { 
          backgroundColor: status === 'P' ? successColor : 
                          status === 'A' ? dangerColor : '#888' 
        }
      ]}
    >
      <ThemedText style={styles.attendanceCellText}>{status}</ThemedText>
    </View>
  );

  const renderStudentRow = (student: { rollNo: string; name: string; attendance: string[] }, index: number) => (
    <View key={student.rollNo} style={styles.studentRow}>
      {/* Sticky left column with roll number and name */}
      <View style={[styles.stickyColumn, { backgroundColor: cardBackground }]}>
        <ThemedText style={styles.rollNoText}>{student.rollNo}</ThemedText>
        <ThemedText style={styles.studentNameText} numberOfLines={1}>
          {student.name}
        </ThemedText>
      </View>
      
      {/* Scrollable attendance columns */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.attendanceScrollView}
      >
        <View style={styles.attendanceRow}>
          {student.attendance.map((status, i) => renderAttendanceCell(status, i))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      
      <View style={[styles.fixedHeader, { backgroundColor: backgroundColor }]}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Attendance Tracker</ThemedText>
          <ThemedText style={styles.headerSubtitle}>NIT Goa</ThemedText>
        </View>

        {/* Class Code Input Section */}
        <View style={styles.inputSection}>
        <ThemedText style={styles.inputLabel}>Enter Class Code:</ThemedText>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: inputBackground, borderColor }]}
            value={classCode}
            onChangeText={(text) => {
              setClassCode(text);
              setShowSuggestions(text.length > 0);
            }}
            placeholder="e.g., CSE101, MATH201, PHY101"
            placeholderTextColor="#888"
            onFocus={() => setShowSuggestions(classCode.length > 0)}
          />
          <ThemedButton
            title="Search"
            onPress={handleSearch}
            style={styles.searchButton}
          />
        </View>
        
        {/* Suggestions Dropdown */}
        {showSuggestions && filteredClasses.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: cardBackground, borderColor }]}>
            {filteredClasses.map((code) => (
              <TouchableOpacity
                key={code}
                style={styles.suggestionItem}
                onPress={() => handleClassSelect(code)}
              >
                <ThemedText style={styles.suggestionCode}>{code}</ThemedText>
                <ThemedText style={styles.suggestionName}>
                  {classData[code]?.className || 'Class'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

        )
      </View>

      {/* Scrollable Content Area */}
      <View style={styles.contentContainer}>
        {/* Attendance Spreadsheet */}
        {selectedClass && (
          <View style={styles.spreadsheetContainer}>
            <View style={styles.classInfo}>
              <ThemedText style={styles.classTitle}>
                {classCode} - {selectedClass.className}
              </ThemedText>
            </View>

            {/* Header Row */}
            <View style={styles.headerRow}>
              <View style={[styles.stickyColumn, styles.headerStickyColumn, { backgroundColor: cardBackground }]}>
                <ThemedText style={styles.headerText}>Roll No / Name</ThemedText>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.headerScrollView}
              >
                <View style={styles.dateHeaderRow}>
                  {selectedClass.dates.map((date, index) => (
                    <View key={index} style={[styles.dateHeader, { backgroundColor: cardBackground }]}>
                      <ThemedText style={styles.dateHeaderText}>{date}</ThemedText>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Student Rows */}
            <ScrollView style={styles.studentsContainer} showsVerticalScrollIndicator={false}>
              {selectedClass.students.map((student, index) => renderStudentRow(student, index))}
            </ScrollView>

            {/* Legend */}
            <View style={[styles.legend, { backgroundColor: cardBackground }]}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: successColor }]} />
                <ThemedText style={styles.legendText}>Present (P)</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: dangerColor }]} />
                <ThemedText style={styles.legendText}>Absent (A)</ThemedText>
              </View>
            </View>
          </View>
        )}

        {!selectedClass && classCode && !classData[classCode] && (
          <View style={styles.noDataContainer}>
            <ThemedText style={styles.noDataText}>
              No attendance data found for class code: {classCode}
            </ThemedText>
            <ThemedText style={styles.availableClassesText}>
              Available classes: {availableClasses.join(', ')}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Fixed Bottom Button */}
      <View style={[styles.buttonContainer, { backgroundColor: backgroundColor }]}>
        <ThemedButton 
          title="Back to Home" 
          onPress={() => router.replace('/')}
          variant="secondary"
          style={styles.exitButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { 
    flex: 1,
  },
  fixedHeader: {
    paddingTop: 40,
    zIndex: 1000,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    zIndex: 1000,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  searchButton: {
    paddingHorizontal: 20,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 85,
    left: 20,
    right: 20,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionCode: {
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionName: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 20,
  },
  spreadsheetContainer: {
    flex: 1,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  classInfo: {
    marginBottom: 15,
    alignItems: 'center',
  },
  classTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 2,
    overflow: 'hidden',
  },
  headerStickyColumn: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    paddingVertical: 15,
  },
  headerScrollView: {
    flex: 1,
    overflow: 'hidden',
  },
  dateHeaderRow: {
    flexDirection: 'row',
  },
  dateHeader: {
    width: 60,
    paddingVertical: 15,
    paddingHorizontal: 5,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
    marginHorizontal: 2,
    minWidth: 60,
  },
  dateHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  studentsContainer: {
    flex: 1,
    maxHeight: 300,
  },
  studentRow: {
    flexDirection: 'row',
    marginBottom: 2,
    minHeight: 60,
    overflow: 'hidden',
  },
  stickyColumn: {
    width: screenWidth * 0.35,
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderRightWidth: 2,
    borderRightColor: '#ddd',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 10,
    position: 'relative',
  },
  rollNoText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  studentNameText: {
    fontSize: 11,
    opacity: 0.8,
  },
  attendanceScrollView: {
    flex: 1,
    overflow: 'hidden',
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  attendanceCell: {
    width: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    borderRadius: 6,
    minWidth: 60,
  },
  attendanceCellText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  availableClassesText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  exitButton: {
    marginTop: 0,
  },
});