import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { ThemedButton } from '@/components/ThemedButton';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function LoginScreen() {
  const [role, setRole] = useState<'faculty' | 'student' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardBackgroundColor = useThemeColor({}, 'cardBackground');
  const primaryColor = useThemeColor({}, 'buttonPrimary');

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
    <ThemedView style={styles.container}> 
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>NIT Goa</ThemedText>
          <ThemedText style={styles.subtitle}>Attendance Portal</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardBackgroundColor }]}>
          <ThemedText style={styles.cardTitle}>Select Your Role</ThemedText>
          
          <View style={styles.roleContainer}>
            <TouchableOpacity
              onPress={() => setRole('faculty')}
              style={[
                styles.roleButton, 
                role === 'faculty' && [styles.selectedRole, { backgroundColor: primaryColor }]
              ]}
            >
              <Text style={[
                styles.roleText, 
                role === 'faculty' && styles.selectedRoleText
              ]}>
                Faculty
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setRole('student')}
              style={[
                styles.roleButton, 
                role === 'student' && [styles.selectedRole, { backgroundColor: primaryColor }]
              ]}
            >
              <Text style={[
                styles.roleText, 
                role === 'student' && styles.selectedRoleText
              ]}>
                Student
              </Text>
            </TouchableOpacity>
          </View>

          {role && (
            <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
              {role === 'faculty' ? (
                <>
                  <View style={styles.inputContainer}>
                    <ThemedTextInput
                      placeholder="Username"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <ThemedTextInput
                      placeholder="Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>
                </>
              ) : (
                <View style={styles.inputContainer}>
                  <ThemedTextInput
                    placeholder="Roll Number"
                    value={rollNumber}
                    onChangeText={setRollNumber}
                    autoCapitalize="characters"
                  />
                </View>
              )}

              <ThemedButton
                title={isLoading ? 'Signing In...' : 'Sign In'}
                onPress={handleLogin}
                disabled={!isFormValid() || isLoading}
                style={styles.submitButton}
              />
            </Animated.View>
          )}
        </View>
      </View>
  </ThemedView>
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
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '300',
    opacity: 0.8,
  },
  card: {
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
    textAlign: 'center',
    marginBottom: 25,
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    shadowColor: '#000',
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
    color: '#B0BEC5',
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
  submitButton: {
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});