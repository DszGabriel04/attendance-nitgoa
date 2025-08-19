// API configuration
const API_BASE_URL = 'http://localhost:8000'; // Adjust this to your backend URL

// API response types
interface LoginResponse {
  message: string;
  faculty_id?: string;
}

interface FacultyLoginRequest {
  email: string;
  password: string;
}

interface ClassResponse {
  id: string;
  subject_name: string;
  attendance_taken: string; // "Yes" or "No"
}

// API stub functions for backend integration
export async function loginFaculty(username: string, password: string): Promise<{ success: boolean; facultyId?: string; error?: string }> {
  try {
    // Create URL with query parameters since backend expects query params
    const url = new URL(`${API_BASE_URL}/faculty/login`);
    url.searchParams.append('email', username);
    url.searchParams.append('password', password);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.detail || 'Login failed' 
      };
    }

    const data: LoginResponse = await response.json();
    return { 
      success: true, 
      facultyId: data.faculty_id 
    };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: 'Network error. Please check if the server is running.' 
    };
  }
}
export async function loginStudent(rollNumber: string) {
  // TODO: Implement API call
  return true;
}
export async function logout() {
  // TODO: Implement API call
}
export async function getClasses(): Promise<ClassResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/classes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ClassResponse[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
}
// Create class types
interface StudentCreate {
  id: string;      // roll number
  name: string;
}

interface CreateClassRequest {
  id: string;              // class ID
  subject_name: string;
  faculty_id: string;
  students: StudentCreate[];
}

export async function createClass(classId: string, subjectName: string, facultyId: string, students: StudentCreate[]): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const requestData: CreateClassRequest = {
      id: classId,
      subject_name: subjectName,
      faculty_id: facultyId,
      students: students
    };

    const response = await fetch(`${API_BASE_URL}/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.detail || 'Failed to create class' 
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      message: data.message 
    };
  } catch (error) {
    console.error('Create class error:', error);
    return { 
      success: false, 
      error: 'Network error. Please check if the server is running.' 
    };
  }
}
export async function deleteClass(classId: string) {
  // TODO: Implement API call
}
export async function getClassStudents(classId: string) {
  // TODO: Implement API call
  return [];
}
export async function getAttendance(classId: string, date?: string) {
  // TODO: Implement API call
  return [];
}
export async function markAttendance(classId: string, date: string, attendanceData: any) {
  // TODO: Implement API call
}
export async function getStudentAttendance(rollNumber: string) {
  // TODO: Implement API call
  return [];
}

// Attendance history types
interface AttendanceRecord {
  date: string;
  student_id: string;
  student_name: string;
  status: string; // "P" or "A"
}

interface AttendanceHistoryResponse {
  class_code: string;
  attendance_history: AttendanceRecord[];
}

// Function to get attendance history for a class
export async function getAttendanceHistory(classId: string): Promise<{ success: boolean; data?: AttendanceHistoryResponse; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance/history/${classId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AttendanceHistoryResponse = await response.json();
    return { 
      success: true, 
      data: data 
    };
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    return { 
      success: false, 
      error: 'Failed to fetch attendance history. Please check if the server is running.' 
    };
  }
}

// Function to get unique students from attendance history (for class details)
export async function getClassStudentsFromHistory(classId: string): Promise<{ success: boolean; students?: Array<{roll: string, name: string}>; error?: string }> {
  try {
    const historyResult = await getAttendanceHistory(classId);
    
    if (!historyResult.success || !historyResult.data) {
      return { 
        success: false, 
        error: historyResult.error || 'Failed to fetch attendance history' 
      };
    }

    // Extract unique students from attendance history
    const studentsMap = new Map<string, string>();
    
    historyResult.data.attendance_history.forEach(record => {
      if (!studentsMap.has(record.student_id)) {
        studentsMap.set(record.student_id, record.student_name);
      }
    });

    const students = Array.from(studentsMap.entries()).map(([roll, name]) => ({
      roll,
      name
    }));

    return { 
      success: true, 
      students: students 
    };
  } catch (error) {
    console.error('Error extracting students from attendance history:', error);
    return { 
      success: false, 
      error: 'Failed to process attendance data' 
    };
  }
}

// Attendance submission types
interface AttendanceItem {
  student_id: string;
  present: boolean;
}

interface AttendanceSubmissionRequest {
  attendees: AttendanceItem[];
}

interface AttendanceSubmissionResponse {
  message: string;
  class_id: string;
  date: string;
  created: number;
  skipped: string[];
}

// Function to submit attendance for a class
export async function submitAttendance(
  classId: string, 
  attendanceData: Record<string, string>
): Promise<{ success: boolean; data?: AttendanceSubmissionResponse; error?: string }> {
  try {
    // Convert frontend attendance format to backend format
    const attendees: AttendanceItem[] = Object.entries(attendanceData).map(([studentId, status]) => ({
      student_id: studentId,
      present: status === 'present'
    }));

    const requestData: AttendanceSubmissionRequest = {
      attendees
    };

    const response = await fetch(`${API_BASE_URL}/classes/${classId}/attendence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.detail || 'Failed to submit attendance' 
      };
    }

    const data: AttendanceSubmissionResponse = await response.json();
    return { 
      success: true, 
      data: data 
    };
  } catch (error) {
    console.error('Error submitting attendance:', error);
    return { 
      success: false, 
      error: 'Network error. Please check if the server is running.' 
    };
  }
}
export async function uploadCSV(file: any) {
  // TODO: Implement API call
}
export async function parseCSV(file: File): Promise<{ success: boolean; data?: StudentCreate[]; error?: string }> {
  try {
    const text = await file.text();
    const lines = text.trim().split('\n');
    
    if (lines.length < 2) {
      return { success: false, error: 'CSV file must contain at least a header and one data row' };
    }

    // Validate header
    const header = lines[0].trim();
    const expectedHeader = 'RollNumber,Name,Category';
    if (header !== expectedHeader) {
      return { 
        success: false, 
        error: `Invalid CSV header. Expected: "${expectedHeader}", Found: "${header}"` 
      };
    }

    const students: StudentCreate[] = [];
    const errors: string[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const parts = line.split(',');
      if (parts.length !== 3) {
        errors.push(`Line ${i + 1}: Expected 3 columns, found ${parts.length}`);
        continue;
      }

      const [rollNumber, name, category] = parts.map(part => part.trim());

      // Validate each field
      if (!rollNumber) {
        errors.push(`Line ${i + 1}: RollNumber cannot be empty`);
        continue;
      }
      if (!name) {
        errors.push(`Line ${i + 1}: Name cannot be empty`);
        continue;
      }
      if (!category) {
        errors.push(`Line ${i + 1}: Category cannot be empty`);
        continue;
      }

      // Check for duplicates
      if (students.some(student => student.id === rollNumber)) {
        errors.push(`Line ${i + 1}: Duplicate roll number "${rollNumber}"`);
        continue;
      }

      students.push({
        id: rollNumber,
        name: name
      });
    }

    if (errors.length > 0) {
      return { 
        success: false, 
        error: `CSV validation errors:\n${errors.join('\n')}` 
      };
    }

    if (students.length === 0) {
      return { 
        success: false, 
        error: 'No valid student records found in CSV file' 
      };
    }

    return { 
      success: true, 
      data: students 
    };
  } catch (error) {
    console.error('CSV parsing error:', error);
    return { 
      success: false, 
      error: 'Failed to parse CSV file. Please ensure it\'s a valid CSV format.' 
    };
  }
}
