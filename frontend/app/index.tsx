import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, StatusBar, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import "expo-router/entry";
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { ThemedButton } from '@/components/ThemedButton';
import { useThemeColor } from '@/hooks/useThemeColor';
import { loginFaculty } from '@/utils/api';

export default function LoginScreen() {
  const [role, setRole] = useState<'faculty' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
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
    setLoginError(null);
    
    try {
      if (role === 'faculty') {
        const result = await loginFaculty(username, password);
        
        if (result.success) {
          // Store faculty ID if needed (you might want to use AsyncStorage or context)
          router.push('/faculty-dashboard');
        } else {
          setLoginError(result.error || 'Login failed');
        }
      }
    } catch (error) {
      // Make sure we only set string errors, not objects
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setLoginError(errorMessage);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    if (role === 'faculty') {
      return username.trim() && password.trim();
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
              onPress={() => router.push('/student-attendance')}
              style={[
                styles.roleButton, 
                styles.checkAttendanceButton
              ]}
            >
              <Text style={[
                styles.roleText, 
                styles.checkAttendanceText
              ]}>
                Attendance
              </Text>
            </TouchableOpacity>
          </View>

          {role === 'faculty' && (
            <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
              {loginError && (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>{loginError}</ThemedText>
                </View>
              )}
              
              <View style={styles.inputContainer}>
                <ThemedTextInput
                  placeholder="Email"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    setLoginError(null); // Clear error when user types
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <ThemedTextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setLoginError(null); // Clear error when user types
                  }}
                  secureTextEntry
                />
              </View>

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
  checkAttendanceButton: {
    backgroundColor: '#42424233',
    borderWidth: 1,
    borderColor: '#42424266',
  },
  checkAttendanceText: {
    color: '#b0bec5',
    fontWeight: '600',
    textAlign: 'center',
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
  errorContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});