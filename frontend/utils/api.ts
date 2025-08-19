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
export async function createClass(className: string, studentList: any) {
  // TODO: Implement API call
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
export async function uploadCSV(file: any) {
  // TODO: Implement API call
}
export async function parseCSV(file: any) {
  // TODO: Implement CSV parsing
}
