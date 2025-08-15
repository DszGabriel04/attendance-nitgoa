import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function CreateClass() {
  const [className, setClassName] = useState('');
  // TODO: Add file upload and photo capture
  const router = useRouter();

  const handleCreate = () => {
    // TODO: createClass(className, studentList)
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Attendance</Text>
      <TextInput placeholder="Class Name" value={className} onChangeText={setClassName} style={styles.input} />
      {/* TODO: File upload for CSV, photo capture */}
      <Button title="Create Class" onPress={handleCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { padding: 10, borderWidth: 1, borderRadius: 8, marginBottom: 20 },
});
