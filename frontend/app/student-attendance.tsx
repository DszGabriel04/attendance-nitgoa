import React from 'react';
import { View, FlatList, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { useThemeColor } from '@/hooks/useThemeColor';

const dummyAttendance = [
  { date: '2025-08-01', class: 'Math', status: 'Present' },
  { date: '2025-08-02', class: 'Physics', status: 'Absent' },
  { date: '2025-08-03', class: 'Chemistry', status: 'Present' },
  { date: '2025-08-04', class: 'Computer Science', status: 'Present' },
  { date: '2025-08-05', class: 'English', status: 'Absent' },
];

export default function StudentAttendance() {
  const router = useRouter();
  const cardBackground = useThemeColor({}, 'cardBackground');
  const successColor = useThemeColor({}, 'success');
  const dangerColor = useThemeColor({}, 'danger');
  const backgroundColor = useThemeColor({}, 'background');

  const renderAttendanceRow = ({ item }: { item: typeof dummyAttendance[0] }) => (
    <View style={[styles.attendanceRow, { backgroundColor: cardBackground }]}>
      <ThemedText style={styles.dateText}>{item.date}</ThemedText>
      <ThemedText style={styles.classText}>{item.class}</ThemedText>
      <View style={[
        styles.statusBadge, 
        { backgroundColor: item.status === 'Present' ? successColor : dangerColor }
      ]}>
        <ThemedText style={styles.statusText}>{item.status}</ThemedText>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Attendance Record</ThemedText>
        <ThemedText style={styles.headerSubtitle}>NIT Goa</ThemedText>
      </View>

      <View style={[styles.tableHeader, { backgroundColor: cardBackground }]}>
        <ThemedText style={[styles.tableHeaderText, styles.dateColumn]}>Date</ThemedText>
        <ThemedText style={[styles.tableHeaderText, styles.classColumn]}>Class</ThemedText>
        <ThemedText style={[styles.tableHeaderText, styles.statusColumn]}>Status</ThemedText>
      </View>

      <FlatList
        data={dummyAttendance}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderAttendanceRow}
        style={styles.attendanceList}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.buttonContainer}>
        <ThemedButton 
          title="Exit" 
          onPress={() => router.replace('/')}
          variant="secondary"
          style={styles.exitButton}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  tableHeaderText: {
    fontWeight: '600',
    fontSize: 16,
  },
  dateColumn: {
    flex: 2,
  },
  classColumn: {
    flex: 3,
  },
  statusColumn: {
    flex: 2,
    textAlign: 'center',
  },
  attendanceList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  dateText: {
    flex: 2,
    fontSize: 14,
  },
  classText: {
    flex: 3,
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    flex: 2,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonContainer: {
    padding: 20,
  },
  exitButton: {
    marginTop: 10,
  },
});
