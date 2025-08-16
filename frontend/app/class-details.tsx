// class-details.tsx
import React, { useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  Modal,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

const dummyStudents = [
  { roll: '101', name: 'Alice Johnson' },
  { roll: '102', name: 'Bob Smith' },
  { roll: '103', name: 'Charlie Brown' },
  { roll: '104', name: 'Diana Prince' },
  { roll: '105', name: 'Edward Norton' },
];

export default function ClassDetails() {
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const primaryColor = useThemeColor({}, 'buttonPrimary');
  const dangerColor = useThemeColor({}, 'danger');

  const handleDeleteClass = () => {
    setDeleteModalVisible(false);
    // Add your delete logic here
    Alert.alert('Success', 'Class deleted successfully', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  type Student = { roll: string; name: string };

  const renderStudent = ({
    item,
    index,
  }: {
    item: Student;
    index: number;
  }) => (
    <View style={[
      styles.studentRow, 
      { backgroundColor: index % 2 === 0 ? cardBackground : backgroundColor }
    ]}>
      <ThemedText style={styles.rollNumber}>{item.roll}</ThemedText>
      <ThemedText style={styles.studentName}>{item.name}</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBackground }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: backgroundColor }]} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={primaryColor} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Attendance</ThemedText>
          <ThemedText style={styles.className}>Class {classId}</ThemedText>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={() => router.push({ pathname: '/add-attendance', params: { classId } })}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <ThemedText style={styles.primaryButtonText}>Add Attendance</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton, { backgroundColor: cardBackground, borderColor: primaryColor }]}
          onPress={() => {}}
        >
          <Ionicons name="eye-outline" size={20} color={primaryColor} />
          <ThemedText style={[styles.secondaryButtonText, { color: primaryColor }]}>View Attendance</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton, { backgroundColor: cardBackground, borderColor: dangerColor }]}
          onPress={() => setDeleteModalVisible(true)}
        >
          <Ionicons name="trash-outline" size={20} color={dangerColor} />
          <ThemedText style={[styles.dangerButtonText, { color: dangerColor }]}>Delete Class</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Students Table */}
      <View style={[styles.tableContainer, { backgroundColor: cardBackground }]}>
        <ThemedText style={styles.tableTitle}>Students ({dummyStudents.length})</ThemedText>
        
        {/* Table Header */}
        <View style={[styles.tableHeader, { backgroundColor: backgroundColor }]}>
          <ThemedText style={styles.headerCell}>Roll No.</ThemedText>
          <ThemedText style={styles.headerCell}>Name</ThemedText>
        </View>

        {/* Students List */}
        <FlatList
          data={dummyStudents}
          keyExtractor={item => item.roll}
          renderItem={renderStudent}
          showsVerticalScrollIndicator={false}
          style={styles.studentsList}
        />
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: cardBackground }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={48} color={dangerColor} />
              <ThemedText style={styles.modalTitle}>Delete Class</ThemedText>
              <ThemedText style={styles.modalMessage}>
                Are you sure you want to delete Class {classId}? This action cannot be undone and will remove all attendance records.
              </ThemedText>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: backgroundColor }]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmDeleteButton, { backgroundColor: dangerColor }]}
                onPress={handleDeleteClass}
              >
                <ThemedText style={styles.confirmDeleteButtonText}>Delete</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  className: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.7,
  },
  buttonContainer: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    borderWidth: 1.5,
  },
  dangerButton: {
    borderWidth: 1.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 20,
    paddingBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'left',
  },
  studentsList: {
    flex: 1,
  },
  studentRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rollNumber: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  studentName: {
    flex: 1,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 25,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});