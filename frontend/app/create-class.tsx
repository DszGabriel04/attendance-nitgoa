// create-class.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert,
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

export default function CreateClass() {
  const [className, setClassName] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const router = useRouter();

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        Alert.alert('Success', 'CSV file selected successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select file. Please try again.');
    }
  };

  const handleCreate = async () => {
    if (!className.trim()) {
      Alert.alert('Error', 'Please enter a class name');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Error', 'Please select a CSV file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('className', className);
      formData.append('csvFile', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'text/csv',
        name: selectedFile.name,
      } as any);

      // Replace with your actual API endpoint
      const response = await fetch('YOUR_API_ENDPOINT/create-class', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'Class created successfully!');
        router.back();
      } else {
        throw new Error('Failed to create class');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create class. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.header}>Attendance</Text>
      </View>
      
      <TextInput 
        placeholder="Class Name" 
        value={className} 
        onChangeText={setClassName} 
        style={styles.input} 
      />

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionTitle}>Upload Student List (CSV)</Text>
        <Text style={styles.instructionText}>
          Please upload a CSV file with student information in the following format:
        </Text>
        <Text style={styles.formatText}>RollNumber,Name,Category</Text>
        
        <View style={styles.exampleContainer}>
          <Text style={styles.exampleTitle}>Example:</Text>
          <Image 
            source={require('../assets/images/example_csv.png')} 
            style={styles.exampleImage}
            resizeMode="contain"
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.uploadButton} 
        onPress={handleFileUpload}
      >
        <Text style={styles.uploadButtonText}>
          {selectedFile ? `Selected: ${selectedFile.name}` : 'Select CSV File'}
        </Text>
      </TouchableOpacity>

      {selectedFile && (
        <View style={styles.fileInfo}>
          <Text style={styles.fileInfoText}>✓ File selected: {selectedFile.name}</Text>
          <Text style={styles.fileInfoText}>
            Size: {selectedFile.size !== undefined ? (selectedFile.size / 1024).toFixed(2) : 'N/A'} KB
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.createButton, (!className.trim() || !selectedFile) && styles.disabledButton]} 
        onPress={handleCreate}
        disabled={!className.trim() || !selectedFile}
      >
        <Text style={styles.createButtonText}>CREATE CLASS</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#f5f5f5' 
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold',
    color: '#333',
    flex: 1
  },
  input: { 
    padding: 15, 
    borderWidth: 2,
    borderColor: '#007AFF', 
    borderRadius: 8, 
    marginBottom: 20,
    backgroundColor: 'white',
    fontSize: 16
  },
  instructionContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333'
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20
  },
  formatText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 4,
    marginBottom: 15
  },
  exampleContainer: {
    marginTop: 10
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333'
  },
  exampleImage: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8
  },
  uploadButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500'
  },
  fileInfo: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759'
  },
  fileInfoText: {
    color: '#2d5a2d',
    fontSize: 14,
    marginBottom: 4
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});