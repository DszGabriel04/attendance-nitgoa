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
import { createClass, parseCSV } from '@/utils/api';

interface StudentData {
  id: string;
  name: string;
}

export default function CreateClass() {
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [parsedStudents, setParsedStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const cardBackground = useThemeColor({}, 'cardBackground');
  const primaryColor = useThemeColor({}, 'buttonPrimary');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'danger');

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        
        // Validate and parse CSV
        setIsLoading(true);
        try {
          // Create a File object from the URI for parsing
          const response = await fetch(file.uri);
          const blob = await response.blob();
          const csvFile = new File([blob], file.name, { type: file.mimeType || 'text/csv' });
          
          const parseResult = await parseCSV(csvFile);
          
          if (parseResult.success && parseResult.data) {
            setParsedStudents(parseResult.data);
            Alert.alert(
              'Success', 
              `CSV file validated successfully!\nFound ${parseResult.data.length} students.`
            );
          } else {
            setSelectedFile(null);
            setParsedStudents([]);
            Alert.alert('CSV Validation Error', parseResult.error || 'Unknown error');
          }
        } catch (parseError) {
          setSelectedFile(null);
          setParsedStudents([]);
          Alert.alert('Error', 'Failed to parse CSV file. Please check the file format.');
        } finally {
          setIsLoading(false);
        }
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

    if (!classCode.trim()) {
      Alert.alert('Error', 'Please enter a class code');
      return;
    }

    if (!selectedFile || parsedStudents.length === 0) {
      Alert.alert('Error', 'Please select and validate a CSV file');
      return;
    }

    setIsLoading(true);
    try {
      // For now, using a hardcoded faculty ID. In a real app, this would come from login/session
      const facultyId = "FAC-101"; // This should be passed from login or stored in context
      
      const result = await createClass(classCode, className, facultyId, parsedStudents);
      
      if (result.success) {
        // Show success message briefly and navigate back
        Alert.alert(
          'Success', 
          result.message || 'Class created successfully! Returning to dashboard...',
          [
            {
              text: 'OK',
              onPress: () => router.push('/faculty-dashboard')
            }
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create class');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create class. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.push('/faculty-dashboard')}
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

        <ThemedTextInput 
          placeholder="Class Code (e.g., CS101, MATH202)" 
          value={classCode} 
          onChangeText={setClassCode} 
          style={styles.input}
          autoCapitalize="characters"
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
          title={isLoading ? 'Processing...' : (selectedFile ? `Selected: ${selectedFile.name}` : 'Select CSV File')}
          onPress={handleFileUpload}
          variant="success"
          style={styles.uploadButton}
          disabled={isLoading}
        />

        {selectedFile && parsedStudents.length > 0 && (
          <View style={[styles.fileInfo, { backgroundColor: successColor + '20', borderLeftColor: successColor }]}>
            <ThemedText style={[styles.fileInfoText, { color: successColor }]}>
              ✓ File validated: {selectedFile.name}
            </ThemedText>
            <ThemedText style={[styles.fileInfoText, { color: successColor }]}>
              Students found: {parsedStudents.length}
            </ThemedText>
            <ThemedText style={[styles.fileInfoText, { color: successColor }]}>
              Size: {selectedFile.size !== undefined ? (selectedFile.size / 1024).toFixed(2) : 'N/A'} KB
            </ThemedText>
          </View>
        )}

        {parsedStudents.length > 0 && (
          <View style={[styles.previewContainer, { backgroundColor: cardBackground }]}>
            <ThemedText style={styles.previewTitle}>Student Preview (First 5 students):</ThemedText>
            {parsedStudents.slice(0, 5).map((student, index) => (
              <ThemedText key={student.id} style={styles.previewItem}>
                {index + 1}. {student.id} - {student.name}
              </ThemedText>
            ))}
            {parsedStudents.length > 5 && (
              <ThemedText style={styles.previewMore}>
                ...and {parsedStudents.length - 5} more students
              </ThemedText>
            )}
          </View>
        )}

        <ThemedButton
          title={isLoading ? "CREATING CLASS..." : "CREATE CLASS"}
          onPress={handleCreate}
          disabled={!className.trim() || !classCode.trim() || !selectedFile || parsedStudents.length === 0 || isLoading}
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
  previewContainer: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  previewItem: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  previewMore: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
    marginTop: 5,
  },
});