import React, { useState } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [role, setRole] = useState<'faculty' | 'student' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    if (role === 'faculty') {
      // TODO: loginFaculty(username, password)
      router.push('/faculty-dashboard');
    } else if (role === 'student') {
      // TODO: loginStudent(rollNumber)
      router.push('/student-attendance');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance NIT Goa</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity onPress={() => setRole('faculty')} style={[styles.toggle, role === 'faculty' && styles.selected]}>
          <Text>Faculty</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRole('student')} style={[styles.toggle, role === 'student' && styles.selected]}>
          <Text>Student</Text>
        </TouchableOpacity>
      </View>
      {role === 'faculty' && (
        <View style={styles.form}>
          <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={styles.input} />
          <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
          <Button title="Enter" onPress={handleLogin} />
        </View>
      )}
      {role === 'student' && (
        <View style={styles.form}>
          <TextInput placeholder="Roll Number" value={rollNumber} onChangeText={setRollNumber} style={styles.input} />
          <Button title="Enter" onPress={handleLogin} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  toggleContainer: { flexDirection: 'row', marginBottom: 20 },
  toggle: { padding: 10, marginHorizontal: 10, borderWidth: 1, borderRadius: 8 },
  selected: { backgroundColor: '#e0e0e0' },
  form: { width: '100%', alignItems: 'center' },
  input: { width: '80%', padding: 10, marginVertical: 8, borderWidth: 1, borderRadius: 8 },
});
