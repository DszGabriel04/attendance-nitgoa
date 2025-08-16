// faculty-dashboard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const dummyClasses = [
  {
    "id": "CS101",
    "subject_name": "Computer Science Fundamentals",
    "attendance_taken": "Yes",
    "color": "#4285F4"
  },
  {
    "id": "MA201",
    "subject_name": "Advanced Mathematics",
    "attendance_taken": "No",
    "color": "#34A853"
  },
  {
    "id": "EE301",
    "subject_name": "Electrical Engineering Basics",
    "attendance_taken": "Yes",
    "color": "#EA4335"
  }
];

export default function FacultyDashboard() {
  const router = useRouter();

  const renderClassItem = ({ item }: { item: typeof dummyClasses[0] }) => (
    <TouchableOpacity 
      style={[styles.classCard, { backgroundColor: item.color }]} 
      onPress={() => router.push({ pathname: '/class-details', params: { classId: item.id } })}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.className}>{item.subject_name}</Text>
            <Text style={styles.classSubtitle}>Class ID: {item.id}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.attendanceStatus}>
            <Text style={styles.attendanceLabel}>Attendance: </Text>
            <View style={[
              styles.attendanceBadge, 
              { backgroundColor: item.attendance_taken === 'Yes' ? '#34A853' : '#EA4335' }
            ]}>
              <Text style={styles.attendanceBadgeText}>{item.attendance_taken}</Text>
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f1f1f" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Class Attendance</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => router.replace('/')}
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Classes List */}
      <FlatList
        data={dummyClasses}
        keyExtractor={item => item.id}
        renderItem={renderClassItem}
        contentContainerStyle={styles.classesContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push('/create-class')}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f1f1f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1f1f1f',
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
    color: 'white',
    fontFamily: 'Google Sans', // You might need to add this font
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
    color: 'white',
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
    backgroundColor: '#2d2d2d',
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
    color: 'white',
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
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});