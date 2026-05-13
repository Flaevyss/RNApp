import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../lib/authContext';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, setDoc, orderBy } from 'firebase/firestore';
import { ScheduleEntry, User } from '../../lib/types';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScheduleScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [filter, setFilter] = useState<'my' | 'all'>('my');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    let q = query(collection(db, 'schedule'), where('date', '>=', today), orderBy('date', 'asc'));

    if (filter === 'my') {
      q = query(collection(db, 'schedule'), where('employeeId', '==', user.id), where('date', '>=', today), orderBy('date', 'asc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleEntry));
      setEntries(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, filter]);

  useEffect(() => {
    if (user?.role === 'admin' && filter === 'all') {
      const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const uMap: Record<string, string> = {};
        snapshot.docs.forEach(doc => {
          uMap[doc.id] = doc.data().name;
        });
        setUsers(uMap);
      });
      return unsubscribe;
    }
  }, [user, filter]);

  const updateEntry = async (id: string, field: string, value: string) => {
    try {
      await updateDoc(doc(db, 'schedule', id), { [field]: value });
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    }
  };

  const toggleStatus = async (entry: ScheduleEntry) => {
    try {
      const newStatus = entry.status === 'work' ? 'off' : 'work';
      await updateDoc(doc(db, 'schedule', entry.id), { status: newStatus });
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'schedule', id));
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    }
  };

  const renderItem = ({ item }: { item: ScheduleEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryInfo}>
        <Text style={styles.entryDate}>{item.date}</Text>
        {filter === 'all' && <Text style={styles.entryEmployee}>{users[item.employeeId] || item.employeeId}</Text>}
        {user?.role === 'admin' ? (
          <View style={styles.adminControls}>
            <TextInput
              style={styles.timeInput}
              value={item.startTime}
              onChangeText={(text) => updateEntry(item.id, 'startTime', text)}
              placeholder="HH:mm"
            />
            <Text> - </Text>
            <TextInput
              style={styles.timeInput}
              value={item.endTime}
              onChangeText={(text) => updateEntry(item.id, 'endTime', text)}
              placeholder="HH:mm"
            />
          </View>
        ) : (
          <Text style={styles.entryTime}>
            {item.status === 'work' ? `${item.startTime} - ${item.endTime}` : 'Выходной'}
          </Text>
        )}
      </View>

      {user?.role === 'admin' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.statusBtn, item.status === 'off' && styles.offBtn]}
            onPress={() => toggleStatus(item)}
          >
            <Text style={styles.btnText}>{item.status === 'work' ? 'Работа' : 'Выходной'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteEntry(item.id)}>
            <Text style={styles.btnText}>❌</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'my' && styles.filterBtnActive]}
          onPress={() => setFilter('my')}
        >
          <Text style={[styles.filterBtnText, filter === 'my' && styles.filterBtnTextActive]}>Мой график</Text>
        </TouchableOpacity>
        {user?.role === 'admin' && (
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterBtnText, filter === 'all' && styles.filterBtnTextActive]}>Все</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>Смен не найдено</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterBtnText: {
    color: '#64748b',
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
  },
  entryCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  entryInfo: {
    flex: 1,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  entryEmployee: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  entryTime: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 4,
    fontWeight: '500',
  },
  adminControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 4,
    width: 60,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  offBtn: {
    backgroundColor: '#94a3b8',
  },
  deleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#64748b',
  },
});
