// qr-attendance.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { generateQRCode, cancelQRCode, getQRCodeStatus } from '@/utils/api';

interface QRCodeData {
  token: string;
  data: string;
  validation_url: string;
}

export default function QRAttendance() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [submittedStudents, setSubmittedStudents] = useState<string[]>([]);
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const primaryColor = useThemeColor({}, 'buttonPrimary');
  const dangerColor = useThemeColor({}, 'danger');

  // Generate QR code on component mount
  useEffect(() => {
    if (classId) {
      generateQR();
    }
  }, [classId]);

  // Poll for status updates
  useEffect(() => {
    let interval: any;
    
    if (qrData?.token) {
      interval = setInterval(async () => {
        try {
          const statusResult = await getQRCodeStatus(qrData.token);
          if (statusResult.success && statusResult.data) {
            setSubmittedCount(statusResult.data.submitted_count);
            setSubmittedStudents(statusResult.data.submitted_students);
          }
        } catch (error) {
          console.error('Failed to get status:', error);
        }
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [qrData?.token]);

  const generateQR = async () => {
    if (!classId) {
      Alert.alert('Error', 'Class ID is required');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateQRCode(String(classId));
      
      if (result.success && result.data) {
        setQrData(result.data);
      } else {
        Alert.alert('Error', result.error || 'Failed to generate QR code');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate QR code');
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const handleCancel = async () => {
    console.log('Cancel button pressed');
    if (!qrData?.token) {
      console.log('No token available');
      router.back();
      return;
    }

    if (submittedCount === 0) {
      Alert.alert(
        'No Submissions',
        'No students have scanned the QR code yet. Are you sure you want to cancel?',
        [
          { text: 'Keep QR Active', style: 'cancel' },
          {
            text: 'Cancel QR Code',
            style: 'destructive',
            onPress: async () => {
              await performCancel();
            }
          }
        ]
      );
      return;
    }

    Alert.alert(
      'Finalize Attendance',
      `${submittedCount} student(s) have scanned the QR code. Cancelling will mark them as present. Continue?`,
      [
        { text: 'Keep QR Active', style: 'cancel' },
        {
          text: `Mark ${submittedCount} Present`,
          style: 'default',
          onPress: async () => {
            await performCancel();
          }
        }
      ]
    );
  };

  const performCancel = async () => {
    if (!qrData?.token) return;

    console.log('Cancelling QR code with token:', qrData.token);
    try {
      const result = await cancelQRCode(qrData.token);
      console.log('Cancel result:', result);
      
      if (result.success && result.data) {
        const { students_marked_present, submitted_students, errors } = result.data;
        
        let message = '';
        if (students_marked_present > 0) {
          message = `✅ Successfully marked ${students_marked_present} student(s) as present`;
          if (submitted_students && submitted_students.length > 0) {
            message += `\n\nStudents marked present:\n${submitted_students.join(', ')}`;
          }
        } else {
          message = 'QR code cancelled. No students were marked present.';
        }
        
        if (errors && errors.length > 0) {
          message += `\n\nErrors:\n${errors.join('\n')}`;
        }

        Alert.alert('Attendance Finalized', message, [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        console.log('Cancel failed:', result.error);
        Alert.alert('Warning', 'Failed to finalize attendance, but QR code has been cancelled.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.log('Cancel error:', error);
      Alert.alert('Error', 'Failed to cancel QR code. Please try again.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  const handleBack = () => {
    if (qrData?.token) {
      Alert.alert(
        'Cancel QR Code?',
        'Going back will cancel the current QR code. Are you sure?',
        [
          {
            text: 'Stay',
            style: 'cancel'
          },
          {
            text: 'Cancel QR & Go Back',
            style: 'destructive',
            onPress: async () => {
              await cancelQRCode(qrData.token);
              router.back();
            }
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const { width } = Dimensions.get('window');
  const qrSize = Math.min(width - 80, 300);

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
          <ThemedText style={styles.title}>QR Code Attendance</ThemedText>
          <ThemedText style={styles.classInfo}>Class: {String(classId)}</ThemedText>
        </View>
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Generating QR Code...</ThemedText>
        </View>
      ) : qrData ? (
        <View style={styles.content}>
          {/* Instructions */}
          <View style={[styles.instructionsCard, { backgroundColor: cardBackground }]}>
            <Ionicons name="information-circle-outline" size={20} color={primaryColor} />
            <ThemedText style={styles.instructionsText}>
              Students can scan this QR code to mark their attendance
            </ThemedText>
          </View>

          {/* Status Card */}
          <View style={[styles.statusCard, { backgroundColor: cardBackground }]}>
            <View style={styles.statusHeader}>
              <Ionicons name="people-outline" size={20} color={primaryColor} />
              <ThemedText style={styles.statusTitle}>Scanned Students</ThemedText>
            </View>
            <View style={styles.statusContent}>
              <ThemedText style={[styles.countText, { color: primaryColor }]}>
                {submittedCount}
              </ThemedText>
              <ThemedText style={styles.countLabel}>
                {submittedCount === 1 ? 'student has' : 'students have'} scanned
              </ThemedText>
            </View>
            {submittedStudents.length > 0 && (
              <View style={styles.studentsList}>
                <ThemedText style={styles.studentsLabel}>Recent scans:</ThemedText>
                {submittedStudents.slice(-3).map((studentId, index) => (
                  <ThemedText key={index} style={styles.studentId}>
                    • {studentId}
                  </ThemedText>
                ))}
                {submittedStudents.length > 3 && (
                  <ThemedText style={styles.moreStudents}>
                    +{submittedStudents.length - 3} more...
                  </ThemedText>
                )}
              </View>
            )}
          </View>

          {/* QR Code */}
          <View style={[styles.qrContainer, { backgroundColor: cardBackground }]}>
            <Image
              source={{ uri: qrData.data }}
              style={[styles.qrCode, { width: qrSize, height: qrSize }]}
              resizeMode="contain"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleCancel}
              style={[styles.actionButton, styles.cancelButton, { backgroundColor: dangerColor }]}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <ThemedText style={styles.actionButtonText}>
                {submittedCount > 0 ? `Finalize (${submittedCount})` : 'Cancel QR Code'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Token Info (for debugging - can be removed in production) */}
          <View style={[styles.tokenInfo, { backgroundColor: cardBackground }]}>
            <ThemedText style={styles.tokenLabel}>Token:</ThemedText>
            <ThemedText style={styles.tokenText}>{qrData.token}</ThemedText>
          </View>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={dangerColor} />
          <ThemedText style={styles.errorText}>Failed to generate QR code</ThemedText>
          <TouchableOpacity
            onPress={generateQR}
            style={[styles.retryButton, { backgroundColor: primaryColor }]}
          >
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
        </View>
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
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  classInfo: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
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
  content: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  qrCode: {
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  regenerateButton: {
    // backgroundColor set dynamically
  },
  cancelButton: {
    // backgroundColor set dynamically
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tokenInfo: {
    padding: 12,
    borderRadius: 8,
    marginTop: 'auto',
  },
  tokenLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusContent: {
    alignItems: 'center',
    marginBottom: 12,
  },
  countText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  countLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  studentsList: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },
  studentsLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 8,
  },
  studentId: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.8,
    marginBottom: 2,
  },
  moreStudents: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.6,
    marginTop: 4,
  },
});
