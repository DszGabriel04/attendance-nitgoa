// create-class.tsx
import React, { useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert,
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { ThemedButton } from '@/components/ThemedButton';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function CreateClass() {
  const [className, setClassName] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const router = useRouter();
  
  const cardBackground = useThemeColor({}, 'cardBackground');
  const primaryColor = useThemeColor({}, 'buttonPrimary');
  const successColor = useThemeColor({}, 'success');

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
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={primaryColor} />
          </TouchableOpacity>
          <ThemedText style={styles.header}>Create Class</ThemedText>
        </View>
        
        <ThemedTextInput 
          placeholder="Class Name" 
          value={className} 
          onChangeText={setClassName} 
          style={styles.input} 
        />

        <View style={[styles.instructionContainer, { backgroundColor: cardBackground }]}>
          <ThemedText style={styles.instructionTitle}>Upload Student List (CSV)</ThemedText>
          <ThemedText style={styles.instructionText}>
            Please upload a CSV file with student information in the following format:
          </ThemedText>
          <ThemedText style={[styles.formatText, { backgroundColor: primaryColor + '20', color: primaryColor }]}>
            RollNumber,Name,Category
          </ThemedText>
          
          <View style={styles.exampleContainer}>
            <ThemedText style={styles.exampleTitle}>Example:</ThemedText>
            <Image 
              source={require('../assets/images/example_csv.png')} 
              style={[styles.exampleImage, { borderColor: useThemeColor({}, 'inputBorder') }]}
              resizeMode="contain"
            />
          </View>
        </View>

        <ThemedButton
          title={selectedFile ? `Selected: ${selectedFile.name}` : 'Select CSV File'}
          onPress={handleFileUpload}
          variant="success"
          style={styles.uploadButton}
        />

        {selectedFile && (
          <View style={[styles.fileInfo, { backgroundColor: successColor + '20', borderLeftColor: successColor }]}>
            <ThemedText style={[styles.fileInfoText, { color: successColor }]}>
              ✓ File selected: {selectedFile.name}
            </ThemedText>
            <ThemedText style={[styles.fileInfoText, { color: successColor }]}>
              Size: {selectedFile.size !== undefined ? (selectedFile.size / 1024).toFixed(2) : 'N/A'} KB
            </ThemedText>
          </View>
        )}

        <ThemedButton
          title="CREATE CLASS"
          onPress={handleCreate}
          disabled={!className.trim() || !selectedFile}
          style={styles.createButton}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
    flex: 1
  },
  input: { 
    marginBottom: 20,
  },
  instructionContainer: {
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
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
    opacity: 0.8,
  },
  formatText: {
    fontSize: 14,
    fontWeight: '500',
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
  },
  exampleImage: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    borderRadius: 8
  },
  uploadButton: {
    marginBottom: 15
  },
  fileInfo: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  fileInfoText: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  createButton: {
    marginBottom: 30
  },
});