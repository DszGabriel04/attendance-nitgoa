import React from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const dummyAttendance = [
  { date: '2025-08-01', class: 'Math', status: 'Present' },
  { date: '2025-08-02', class: 'Physics', status: 'Absent' },
];

export default function StudentAttendance() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Attendance NIT Goa</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.col}>Date</Text>
        <Text style={styles.col}>Class</Text>
        <Text style={styles.col}>Status</Text>
      </View>
      <FlatList
        data={dummyAttendance}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.col}>{item.date}</Text>
            <Text style={styles.col}>{item.class}</Text>
            <Text style={styles.col}>{item.status}</Text>
          </View>
        )}
      />
      <Button title="Exit" onPress={() => router.replace('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  tableHeader: { flexDirection: 'row', marginBottom: 10 },
  col: { flex: 1, fontWeight: 'bold' },
  row: { flexDirection: 'row', marginBottom: 5 },
});
