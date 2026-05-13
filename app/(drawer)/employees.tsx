import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  setDoc,
  query,
  where
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { User } from '../../lib/types';
import { Trash2, UserPlus, X } from 'lucide-react-native';

export default function EmployeesScreen() {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [branch, setBranch] = useState('');
  const [oklad, setOklad] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: User[] = [];
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as User;
        if (data.id !== currentUser?.id) {
          usersData.push(data);
        }
      });
      setEmployees(usersData);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const handleAddEmployee = async () => {
    if (!name || !email || !branch || !oklad) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    setSubmitting(true);
    try {
      // NOTE: Creating user in Firebase Auth usually requires a separate Admin SDK
      // or using the current Auth instance which will log out the admin.
      // In a real Expo app, you'd use a Cloud Function.
      // For this task, we'll try to use createUserWithEmailAndPassword
      // but be aware it might sign out the admin if not careful.
      // A better way for client-side only is to just write to Firestore
      // and have a trigger or assume the user exists.
      // But the requirement says "вызов createUserWithEmailAndPassword".

      const userCredential = await createUserWithEmailAndPassword(auth, email, '123456');
      const newUser = userCredential.user;

      await setDoc(doc(db, 'users', newUser.uid), {
        name,
        email,
        branch,
        oklad: Number(oklad),
        role: 'user',
      });

      Alert.alert('Успех', 'Сотрудник добавлен. Пароль: 123456');
      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Ошибка', error.message || 'Не удалось добавить сотрудника');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setBranch('');
    setOklad('');
  };

  const deleteEmployee = (id: string) => {
    Alert.alert('Удаление', 'Вы уверены, что хотите удалить этого сотрудника?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'users', id));
            // Note: This doesn't delete the user from Firebase Auth on the client side.
          } catch (error) {
            console.error(error);
            Alert.alert('Ошибка', 'Не удалось удалить сотрудника');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.empName}>{item.name}</Text>
        <Text style={styles.empDetail}>{item.email}</Text>
        <Text style={styles.empDetail}>{item.branch} • {item.oklad} ₽</Text>
      </View>
      <TouchableOpacity onPress={() => deleteEmployee(item.id)}>
        <Trash2 size={24} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={employees}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Список сотрудников пуст</Text>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <UserPlus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Новый сотрудник</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Имя Фамилия</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Иван Иванов"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="user@example.com"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Филиал</Text>
                <TextInput
                  style={styles.input}
                  value={branch}
                  onChangeText={setBranch}
                  placeholder="Центральный"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Оклад за 12ч</Text>
                <TextInput
                  style={styles.input}
                  value={oklad}
                  onChangeText={setOklad}
                  keyboardType="numeric"
                  placeholder="2000"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddEmployee}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Создать</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardInfo: {
    flex: 1,
  },
  empName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  empDetail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#3b82f6',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#94a3b8',
    fontSize: 16,
  },
});
