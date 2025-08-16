import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [role, setRole] = useState<'faculty' | 'student' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (role) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [role]);

  const handleLogin = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (role === 'faculty') {
        // TODO: loginFaculty(username, password)
        router.push('/faculty-dashboard');
      } else if (role === 'student') {
        // TODO: loginStudent(rollNumber)
        router.push('/student-attendance');
      }
      setIsLoading(false);
    }, 1000);
  };

  const isFormValid = () => {
    if (role === 'faculty') {
      return username.trim() && password.trim();
    } else if (role === 'student') {
      return rollNumber.trim();
    }
    return false;
  };

  return (
    <View style={[styles.container, { backgroundColor: '#667eea' }]}> 
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>NIT Goa</Text>
          <Text style={styles.subtitle}>Attendance Portal</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Your Role</Text>
          
          <View style={styles.roleContainer}>
            <TouchableOpacity
              onPress={() => setRole('faculty')}
              style={[styles.roleButton, role === 'faculty' && styles.selectedRole]}
            >
              <Text style={[styles.roleText, role === 'faculty' && styles.selectedRoleText]}>
                Faculty
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setRole('student')}
              style={[styles.roleButton, role === 'student' && styles.selectedRole]}
            >
              <Text style={[styles.roleText, role === 'student' && styles.selectedRoleText]}>
                Student
              </Text>
            </TouchableOpacity>
          </View>

          {role && (
            <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
              {role === 'faculty' ? (
                <>
                  <View style={styles.inputContainer}>
                    <TextInput
                      placeholder="Username"
                      placeholderTextColor="#9ca3af"
                      value={username}
                      onChangeText={setUsername}
                      style={styles.input}
                      autoCapitalize="none"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor="#9ca3af"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      style={styles.input}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.inputContainer}>
                  <TextInput
                    placeholder="Roll Number"
                    placeholderTextColor="#9ca3af"
                    value={rollNumber}
                    onChangeText={setRollNumber}
                    style={styles.input}
                    autoCapitalize="characters"
                  />
                </View>
              )}

              <TouchableOpacity
                onPress={handleLogin}
                disabled={!isFormValid() || isLoading}
                style={[
                  styles.submitButton,
                  (!isFormValid() || isLoading) && styles.disabledButton
                ]}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#e5e7eb',
    fontWeight: '300',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 25,
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 30,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedRole: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  selectedRoleText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  formContainer: {
    marginTop: 10,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});