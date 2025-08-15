import React, { useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const dummyStudents = [
  { roll: '101', name: 'Alice' },
  { roll: '102', name: 'Bob' },
];

export default function AddAttendance() {
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState<{ [roll: string]: 'P' | 'A' }>({});

  const toggleAttendance = (roll: string) => {
    setAttendance(prev => ({
      ...prev,
      [roll]: prev[roll] === 'P' ? 'A' : 'P',
    }));
  };

  const handleSubmit = () => {
    // TODO: markAttendance(classId, date, attendance)
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Attendance</Text>
      <Text>Class: {classId}</Text>
      <TextInput value={date} onChangeText={setDate} style={styles.input} />
      <FlatList
        data={dummyStudents}
        keyExtractor={item => item.roll}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.col}>{item.roll}</Text>
            <Text style={styles.col}>{item.name}</Text>
            <TouchableOpacity onPress={() => toggleAttendance(item.roll)} style={styles.toggleBtn}>
              <Text>{attendance[item.roll] || 'A'}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  input: { padding: 10, borderWidth: 1, borderRadius: 8, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  col: { flex: 1 },
  toggleBtn: { padding: 10, borderWidth: 1, borderRadius: 8 },
});
