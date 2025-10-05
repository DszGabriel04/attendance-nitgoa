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
  ScrollView,
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
  const [recentSubmissions, setRecentSubmissions] = useState(0);
  const [recentStudents, setRecentStudents] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  
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

  // Poll for status updates with smart polling and bulk operation optimization
  useEffect(() => {
    let interval: any;
    let isActive = true;
    let pollCount = 0;
    
    const pollStatus = async (useDetailedStatus = false) => {
      if (!isActive || !qrData?.token) return;
      
      try {
        const statusResult = await getQRCodeStatus(qrData.token, useDetailedStatus);
        if (statusResult.success && statusResult.data) {
          setSubmittedCount(statusResult.data.submitted_count);
          setSubmittedStudents(statusResult.data.submitted_students);
          setLastUpdateTime(new Date());
          
          // Update additional bulk operation data if available
          if (statusResult.data.recent_submissions !== undefined) {
            setRecentSubmissions(statusResult.data.recent_submissions);
            setRecentStudents(statusResult.data.recent_students || []);
          }
        }
      } catch (error) {
        console.error('Failed to get status:', error);
        // If there's an error, don't spam the server
        return;
      }
    };
    
    if (qrData?.token) {
      // Initial poll with detailed data
      pollStatus(true);
      
      // Set up adaptive interval polling
      interval = setInterval(() => {
        pollCount++;
        // Use detailed status every 3rd poll (to reduce API load)
        // but still get real-time updates for submission count
        const useDetails = pollCount % 3 === 0;
        pollStatus(useDetails);
      }, 6000); // Poll every 6 seconds for better responsiveness
    }

    return () => {
      isActive = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [qrData?.token]);

  const handleRefreshStatus = async () => {
    if (!qrData?.token) return;
    
    setIsRefreshing(true);
    try {
      const statusResult = await getQRCodeStatus(qrData.token, true); // Always use detailed status on manual refresh
      if (statusResult.success && statusResult.data) {
        setSubmittedCount(statusResult.data.submitted_count);
        setSubmittedStudents(statusResult.data.submitted_students);
        setLastUpdateTime(new Date());
        
        // Update bulk operation data
        if (statusResult.data.recent_submissions !== undefined) {
          setRecentSubmissions(statusResult.data.recent_submissions);
          setRecentStudents(statusResult.data.recent_students || []);
        }
      }
    } catch (error) {
      console.error('Failed to refresh status:', error);
      Alert.alert('Error', 'Failed to refresh status');
    } finally {
      setIsRefreshing(false);
    }
  };

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
    console.log('Bulk finalize button pressed');
    if (!qrData?.token) {
      console.log('No token available, going back...');
      router.back();
      return;
    }

    console.log(`Bulk operation: ${submittedCount} total submissions`);
    if (recentSubmissions > 0) {
      console.log(`Recent activity: ${recentSubmissions} submissions in last 30 seconds`);
    }
    
    // Skip alerts and directly perform bulk cancel/finalize
    if (submittedCount === 0) {
      console.log('No submissions - cancelling QR code...');
    } else {
      console.log(`Bulk finalizing attendance for ${submittedCount} student(s): ${submittedStudents.join(', ')}`);
    }
    
    await performCancel();
  };

  const performCancel = async () => {
    if (!qrData?.token) return;

    console.log('Performing bulk attendance update with token:', qrData.token);
    console.log('Students to be processed in bulk:', submittedStudents);
    try {
      const result = await cancelQRCode(qrData.token);
      console.log('Bulk update result:', result);
      
      if (result.success && result.data) {
        const { students_marked_present, submitted_students, errors } = result.data;
        
        console.log(`Bulk operation completed: ${students_marked_present} student(s) marked present in single transaction`);
        if (submitted_students && submitted_students.length > 0) {
          console.log('Bulk processed students:', submitted_students.join(', '));
        }
        if (errors && errors.length > 0) {
          console.log('Bulk operation errors:', errors.join(', '));
        }
      } else {
        console.log('Bulk update failed:', result.error);
      }
    } catch (error) {
      console.log('Bulk update error:', error);
    }
    
    // Always navigate back after bulk operation, regardless of success/failure
    console.log('Navigating back to add-attendance page...');
    router.back();
  };

  const handleBack = async () => {
    console.log('Back button pressed');
    if (qrData?.token) {
      console.log('QR code active - cancelling and going back...');
      await cancelQRCode(qrData.token);
    }
    console.log('Navigating back...');
    router.back();
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
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
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
              <View style={styles.statusHeaderLeft}>
                <Ionicons name="people-outline" size={20} color={primaryColor} />
                <ThemedText style={styles.statusTitle}>Scanned Students</ThemedText>
              </View>
              <TouchableOpacity onPress={handleRefreshStatus} disabled={isRefreshing}>
                <Ionicons 
                  name={isRefreshing ? "sync" : "refresh-outline"} 
                  size={20} 
                  color={isRefreshing ? '#999' : primaryColor}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.statusContent}>
              <View style={styles.mainStats}>
                <ThemedText style={[styles.countText, { color: primaryColor }]}>
                  {submittedCount}
                </ThemedText>
                <ThemedText style={styles.countLabel}>
                  {submittedCount === 1 ? 'student has' : 'students have'} scanned
                </ThemedText>
              </View>
              
            </View>
            
            {/* Bulk operation ready indicator */}
            {submittedCount > 0 && (
              <View style={[styles.bulkIndicator, { backgroundColor: '#e8f5e8' }]}>
                <Ionicons name="checkmark-circle" size={16} color="#2e7d32" />
                <ThemedText style={[styles.bulkText, { color: '#2e7d32' }]}>
                  Ready for bulk attendance update
                </ThemedText>
              </View>
            )}
            
            {submittedStudents.length > 0 && (
              <View style={styles.studentsList}>
                <ThemedText style={styles.studentsLabel}>All submissions:</ThemedText>
                {submittedStudents.slice(-5).map((studentId, index) => (
                  <ThemedText key={index} style={styles.studentId}>
                    • {studentId}
                  </ThemedText>
                ))}
                {submittedStudents.length > 5 && (
                  <ThemedText style={styles.moreStudents}>
                    +{submittedStudents.length - 5} more...
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
                {submittedCount > 0 ? `Bulk Update (${submittedCount} students)` : 'Cancel QR Code'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContainer: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    gap: 20,
    paddingBottom: 40, // Extra padding at bottom for scroll
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  mainStats: {
    alignItems: 'center',
    marginBottom: 12,
  },
  recentActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  recentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bulkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  bulkText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
