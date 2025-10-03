// qr-student.tsx - Student QR Code Attendance Submission Page
import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { ThemedButton } from '@/components/ThemedButton';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getQRClassInfo, submitQRAttendance } from '@/utils/api';

interface ClassInfo {
  id: string;
  subject_name: string;
  faculty_name: string;
  date: string;
}

export default function QRStudent() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  
  const [rollNumber, setRollNumber] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const primaryColor = useThemeColor({}, 'buttonPrimary');
  const successColor = useThemeColor({}, 'success');
  const textColor = useThemeColor({}, 'text');

  // Fetch class information when token is available
  useEffect(() => {
    if (token) {
      fetchClassInfo();
    } else {
      // Allow manual token entry if no token provided
      setIsLoading(false);
      setShowTokenInput(true);
    }
  }, [token]);

  const fetchClassInfo = async (tokenToUse?: string) => {
    const currentToken = tokenToUse || token;
    if (!currentToken) return;
    
    setIsLoading(true);
    try {
      const result = await getQRClassInfo(currentToken);
      
      if (result.success && result.data) {
        setClassInfo(result.data);
        setShowTokenInput(false);
      } else {
        throw new Error(result.error || 'Failed to load class information');
      }
    } catch (error) {
      console.error('Failed to fetch class info:', error);
      Alert.alert('Error', 'Failed to load class information. The QR code may have expired.', [
        { text: 'OK', onPress: () => setShowTokenInput(true) }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualTokenSubmit = () => {
    if (!manualToken.trim()) {
      Alert.alert('Error', 'Please enter a valid token');
      return;
    }
    fetchClassInfo(manualToken.trim());
  };

  const handleSubmit = async () => {
    if (!rollNumber.trim()) {
      Alert.alert('Error', 'Please enter your roll number');
      return;
    }

    const currentToken = token || manualToken;
    if (!currentToken) {
      Alert.alert('Error', 'Invalid token');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await submitQRAttendance(currentToken, rollNumber.trim());

      if (result.success) {
        setIsSubmitted(true);
        Alert.alert(
          'Success!', 
          'Your attendance has been recorded successfully.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit attendance');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
      console.error('Submit attendance error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Loading class information...</ThemedText>
        </View>
      </ThemedView>
    );
  }

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
          <ThemedText style={styles.title}>📚 Mark Attendance</ThemedText>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Manual Token Entry */}
        {showTokenInput && (
          <View style={[styles.tokenInputCard, { backgroundColor: cardBackground }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="key-outline" size={24} color={primaryColor} />
              <ThemedText style={styles.cardTitle}>Enter Token</ThemedText>
            </View>
            
            <ThemedText style={styles.tokenInputLabel}>
              Enter the token from the QR code validation page:
            </ThemedText>
            
            <ThemedTextInput
              style={[styles.textInput, { borderColor: primaryColor }]}
              value={manualToken}
              onChangeText={setManualToken}
              placeholder="e.g., 8dae7babe59cd5377b370d7d677880e2"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <ThemedButton
              title="Load Class Info"
              onPress={handleManualTokenSubmit}
              disabled={!manualToken.trim()}
              style={[
                styles.tokenSubmitButton,
                { backgroundColor: !manualToken.trim() ? '#ccc' : primaryColor }
              ]}
            />
          </View>
        )}

        {/* Class Information Card */}
        {classInfo && (
          <View style={[styles.classInfoCard, { backgroundColor: cardBackground }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="school-outline" size={24} color={primaryColor} />
              <ThemedText style={styles.cardTitle}>Class Details</ThemedText>
            </View>
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Subject:</ThemedText>
              <ThemedText style={styles.infoValue}>{classInfo.subject_name}</ThemedText>
            </View>
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Class Code:</ThemedText>
              <ThemedText style={styles.infoValue}>{classInfo.id}</ThemedText>
            </View>
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Faculty:</ThemedText>
              <ThemedText style={styles.infoValue}>{classInfo.faculty_name}</ThemedText>
            </View>
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Date:</ThemedText>
              <ThemedText style={styles.infoValue}>{classInfo.date}</ThemedText>
            </View>
          </View>
        )}

        {/* Attendance Form */}
        {!isSubmitted ? (
          <View style={[styles.formCard, { backgroundColor: cardBackground }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={24} color={primaryColor} />
              <ThemedText style={styles.cardTitle}>Student Information</ThemedText>
            </View>
            
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Roll Number *</ThemedText>
              <ThemedTextInput
                style={[styles.textInput, { borderColor: primaryColor }]}
                value={rollNumber}
                onChangeText={setRollNumber}
                placeholder="e.g., 22CSE1032"
                placeholderTextColor="#999"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isSubmitting}
              />
              <ThemedText style={styles.inputHint}>
                Enter your complete roll number as provided by the institution
              </ThemedText>
            </View>

            <ThemedButton
              title={isSubmitting ? "Submitting..." : "Mark My Attendance"}
              onPress={handleSubmit}
              disabled={isSubmitting || !rollNumber.trim()}
              style={[
                styles.submitButton,
                { backgroundColor: (!rollNumber.trim() || isSubmitting) ? '#ccc' : primaryColor }
              ]}
            />
          </View>
        ) : (
          /* Success State */
          <View style={[styles.successCard, { backgroundColor: cardBackground }]}>
            <View style={styles.successHeader}>
              <Ionicons name="checkmark-circle" size={48} color={successColor} />
              <ThemedText style={[styles.successTitle, { color: successColor }]}>
                Attendance Recorded!
              </ThemedText>
            </View>
            
            <ThemedText style={styles.successMessage}>
              Your attendance has been successfully recorded for {classInfo?.subject_name}.
            </ThemedText>
            
            <View style={styles.successDetails}>
              <ThemedText style={styles.successDetailText}>
                Roll Number: {rollNumber}
              </ThemedText>
              <ThemedText style={styles.successDetailText}>
                Time: {new Date().toLocaleTimeString()}
              </ThemedText>
            </View>

            <ThemedButton
              title="Done"
              onPress={handleBack}
              style={[styles.doneButton, { backgroundColor: successColor }]}
            />
          </View>
        )}

        {/* Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: cardBackground }]}>
          <Ionicons name="information-circle-outline" size={20} color={primaryColor} />
          <View style={styles.instructionsContent}>
            <ThemedText style={styles.instructionsTitle}>Instructions:</ThemedText>
            <ThemedText style={styles.instructionsText}>
              • Make sure you enter your correct roll number{'\n'}
              • Your attendance will be marked once you submit{'\n'}
              • Contact your faculty if you face any issues
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
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
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  classInfoCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionsCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  successDetails: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    width: '100%',
  },
  successDetailText: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  doneButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsContent: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.7,
  },
  tokenInputCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tokenInputLabel: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.8,
  },
  tokenSubmitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
});
