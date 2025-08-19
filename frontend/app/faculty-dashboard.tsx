// faculty-dashboard.tsx
import React, { useState, useEffect } from 'react';
import { ColorPicker } from '../utils/ColorPicker';
import { View, TouchableOpacity, FlatList, StyleSheet, StatusBar, SafeAreaView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getClasses } from '../utils/api';

interface ClassItem {
  id: string;
  subject_name: string;
  attendance_taken: string;
  color: string;
}

export default function FacultyDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const primaryColor = useThemeColor({}, 'buttonPrimary');
  const successColor = useThemeColor({}, 'success');
  const dangerColor = useThemeColor({}, 'danger');

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorPicker = new ColorPicker();

  // Focus effect to refresh when returning from other screens
  useFocusEffect(
    useCallback(() => {
      fetchClasses();
    }, [])
  );

  // Handle refresh parameter
  useEffect(() => {
    if (params.refresh === 'true') {
      setRefreshing(true);
      fetchClasses().finally(() => setRefreshing(false));
      // Clear the refresh parameter by replacing the current route
      router.replace('/faculty-dashboard');
    }
  }, [params.refresh]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const apiClasses = await getClasses();
      
      // Add colors to the classes
      const classesWithColors = apiClasses.map((cls, index) => ({
        ...cls,
        color: colorPicker.getColor(index)
      }));
      
      setClasses(classesWithColors);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      Alert.alert(
        'Error', 
        'Failed to load classes. Please check your connection and try again.',
        [
          { 
            text: 'Retry', 
            onPress: fetchClasses 
          },
          { 
            text: 'Cancel', 
            style: 'cancel' 
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderClassItem = ({ item }: { item: ClassItem }) => (
    <TouchableOpacity 
      style={[styles.classCard, { backgroundColor: item.color }]} 
      onPress={() => router.push({ pathname: '/class-details', params: { classId: item.id } })}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <ThemedText style={styles.className}>{item.subject_name}</ThemedText>
            <ThemedText style={styles.classSubtitle}>Class ID: {item.id}</ThemedText>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.attendanceStatus}>
            <ThemedText style={styles.attendanceLabel}>Attendance Marked: </ThemedText>
            <View style={[
              styles.attendanceBadge, 
              { backgroundColor: item.attendance_taken === 'Yes' ? successColor : dangerColor }
            ]}>
              <ThemedText style={styles.attendanceBadgeText}>{item.attendance_taken}</ThemedText>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.cardDecoration}>
        <View style={styles.decorativeElement1} />
        <View style={styles.decorativeElement2} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.headerTitle}>Class Attendance</ThemedText>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => router.replace('/')}
          >
            <Ionicons name="log-out-outline" size={20} color="#ECEDEE" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Classes List */}
      {loading && classes.length === 0 ? (
        <View style={styles.centerContainer}>
          <ThemedText style={styles.loadingText}>Loading classes...</ThemedText>
        </View>
      ) : classes.length === 0 ? (
        <View style={styles.centerContainer}>
          <ThemedText style={styles.emptyText}>No classes found</ThemedText>
          <ThemedText style={styles.emptySubtext}>Tap the + button to create your first class</ThemedText>
        </View>
      ) : (
        <FlatList
          data={classes}
          keyExtractor={item => item.id}
          renderItem={renderClassItem}
          contentContainerStyle={styles.classesContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading || refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchClasses().finally(() => setRefreshing(false));
          }}
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: primaryColor }]}
        onPress={() => router.push('/create-class')}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '400',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5f6368',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileText: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    padding: 4,
  },
  thisWeekContainer: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3c3c3c',
  },
  thisWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  thisWeekTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  viewTodoText: {
    fontSize: 14,
    color: '#8ab4f8',
  },
  noWorkText: {
    fontSize: 14,
    color: '#9aa0a6',
  },
  classesContainer: {
    padding: 16,
    paddingTop: 8,
  },
  classCard: {
    borderRadius: 8,
    marginBottom: 16,
    minHeight: 120,
    position: 'relative',
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  className: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginBottom: 4,
  },
  classSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuButton: {
    padding: 4,
  },
  cardFooter: {
    marginTop: 16,
  },
  teacherName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  attendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  attendanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attendanceBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  cardDecoration: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    opacity: 0.3,
  },
  decorativeElement1: {
    position: 'absolute',
    right: -10,
    top: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  decorativeElement2: {
    position: 'absolute',
    right: 10,
    bottom: -15,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});