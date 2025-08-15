import React from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const dummyClasses = [
  { id: '1', name: 'Class 1' },
  { id: '2', name: 'Class 2' },
];

export default function FacultyDashboard() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Attendance</Text>
      <Button title="Logout" onPress={() => router.replace('/')} />
      <FlatList
        data={dummyClasses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.classItem} onPress={() => router.push({ pathname: '/class-details', params: { classId: item.id } })}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      <Button title="New Class +" onPress={() => router.push('/create-class')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  classItem: { padding: 15, borderWidth: 1, borderRadius: 8, marginBottom: 10 },
});
