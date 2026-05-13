import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView, Modal } from 'react-native';
import { db, auth } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { User } from '../../lib/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/authContext';

export default function EmployeesScreen() {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [branch, setBranch] = useState('');
  const [oklad, setOklad] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as User))
        .filter(u => u.id !== currentUser.id);
      setEmployees(data);
    });
    return unsubscribe;
  }, [currentUser]);

  const handleAddEmployee = async () => {
    if (!name || !email || !branch || !oklad) {
      Alert.alert('Ошибка', 'Все поля обязательны');
      return;
    }

    setLoading(true);
    try {
      // NOTE: Using the Firebase Client SDK to create users will automatically
      // sign in the new user and sign out the current admin.
      // In production, this should be handled via Firebase Admin SDK in a Cloud Function.

      Alert.alert(
        'Внимание',
        'После создания сотрудника вы будете разлогинены из системы (ограничение клиентского SDK). Желаете продолжить?',
        [
          { text: 'Отмена', onPress: () => setLoading(false), style: 'cancel' },
          {
            text: 'Продолжить',
            onPress: async () => {
              try {
                const res = await createUserWithEmailAndPassword(auth, email, '123456');
      const newUser: User = {
        id: res.user.uid,
        name,
        email,
        branch,
        oklad: Number(oklad),
        role: 'user',
      };
                await setDoc(doc(db, 'users', res.user.uid), newUser);

                Alert.alert('Успех', 'Сотрудник добавлен. Пароль: 123456. Вы будете перенаправлены на экран входа.');
                setModalVisible(false);
                resetForm();
              } catch (error: any) {
                Alert.alert('Ошибка', error.message);
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
      setLoading(false);
    }
  };

  const deleteEmployee = async (id: string) => {
    Alert.alert(
      'Удаление',
      'Вы уверены, что хотите удалить сотрудника?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', id));
            } catch (error: any) {
              Alert.alert('Ошибка', error.message);
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setBranch('');
    setOklad('');
  };

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userDetail}>{item.email} | {item.branch}</Text>
        <Text style={styles.userDetail}>Оклад: {item.oklad} ₽</Text>
      </View>
      <TouchableOpacity onPress={() => deleteEmployee(item.id)}>
        <Text style={styles.deleteText}>Удалить</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.addBtnText}>+ Добавить сотрудника</Text>
      </TouchableOpacity>

      <FlatList
        data={employees}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />

      <Modal visible={isModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Новый сотрудник</Text>

            <TextInput style={styles.input} placeholder="Имя Фамилия" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Филиал" value={branch} onChangeText={setBranch} />
            <TextInput style={styles.input} placeholder="Оклад за 12 часов" value={oklad} onChangeText={setOklad} keyboardType="numeric" />

            <TouchableOpacity style={[styles.submitBtn, loading && styles.btnDisabled]} onPress={handleAddEmployee} disabled={loading}>
              <Text style={styles.submitBtnText}>{loading ? 'Создание...' : 'Создать'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Отмена</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  addBtn: {
    backgroundColor: '#3b82f6',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  userDetail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  deleteText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalContent: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1e293b',
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  submitBtn: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748b',
    fontSize: 16,
  },
});
