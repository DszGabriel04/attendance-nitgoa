import React from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const dummyStudents = [
  { roll: '101', name: 'Alice' },
  { roll: '102', name: 'Bob' },
];

export default function ClassDetails() {
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Attendance</Text>
      <Text style={styles.className}>Class {classId}</Text>
      <Button title="Add Attendance" onPress={() => router.push({ pathname: '/add-attendance', params: { classId } })} />
      <Button title="View Attendance" onPress={() => {}} />
      <Button title="Delete Class" onPress={() => router.back()} />
      <View style={styles.tableHeader}>
        <Text style={styles.col}>Roll Number</Text>
        <Text style={styles.col}>Name</Text>
      </View>
      <FlatList
        data={dummyStudents}
        keyExtractor={item => item.roll}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.col}>{item.roll}</Text>
            <Text style={styles.col}>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  className: { fontSize: 18, marginBottom: 10 },
  tableHeader: { flexDirection: 'row', marginBottom: 10 },
  col: { flex: 1, fontWeight: 'bold' },
  row: { flexDirection: 'row', marginBottom: 5 },
});
