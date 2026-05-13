import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  setDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Schedule, User } from '../../lib/types';
import { format, isAfter, isSameDay, startOfDay } from 'date-fns';
import { Trash2, PlusCircle, CheckCircle, XCircle } from 'lucide-react-native';

export default function ScheduleScreen() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'my' | 'all'>('my');

  useEffect(() => {
    // Fetch users for admin view mapping
    const fetchUsers = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersMap: Record<string, User> = {};
      usersSnap.forEach(doc => {
        usersMap[doc.id] = { id: doc.id, ...doc.data() } as User;
      });
      setUsers(usersMap);
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!user) return;

    const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
    const q = filter === 'my'
      ? query(collection(db, 'schedule'), where('employeeId', '==', user.id), orderBy('date', 'asc'))
      : query(collection(db, 'schedule'), orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scheduleData: Schedule[] = [];
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as Schedule;
        // Filter for future dates (including today)
        if (data.date >= today) {
          scheduleData.push(data);
        }
      });
      setSchedules(scheduleData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, filter]);

  const updateShiftTime = async (id: string, field: 'startTime' | 'endTime', value: string) => {
    try {
      await updateDoc(doc(db, 'schedule', id), { [field]: value });
    } catch (error) {
      console.error(error);
      Alert.alert('Ошибка', 'Не удалось обновить время');
    }
  };

  const setDayOff = async (id: string) => {
    try {
      await updateDoc(doc(db, 'schedule', id), { status: 'off', startTime: '', endTime: '' });
    } catch (error) {
      console.error(error);
      Alert.alert('Ошибка', 'Не удалось изменить статус');
    }
  };

  const deleteShift = async (id: string) => {
    Alert.alert('Удаление', 'Вы уверены, что хотите удалить эту запись?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'schedule', id));
          } catch (error) {
            console.error(error);
            Alert.alert('Ошибка', 'Не удалось удалить запись');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: Schedule }) => {
    const isAdmin = user?.role === 'admin';
    const employeeName = users[item.employeeId]?.name || '...';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{format(new Date(item.date), 'dd.MM.yyyy')}</Text>
          {isAdmin && filter === 'all' && (
            <Text style={styles.employeeName}>{employeeName}</Text>
          )}
          <View style={[styles.statusBadge, item.status === 'off' ? styles.offBadge : styles.workBadge]}>
            <Text style={styles.statusText}>{item.status === 'work' ? 'Работа' : 'Выходной'}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          {item.status === 'work' ? (
            <View style={styles.timeRow}>
              {isAdmin ? (
                <>
                  <TextInput
                    style={styles.timeInput}
                    value={item.startTime}
                    onChangeText={(val) => updateShiftTime(item.id, 'startTime', val)}
                    placeholder="09:00"
                  />
                  <Text style={styles.separator}>—</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={item.endTime}
                    onChangeText={(val) => updateShiftTime(item.id, 'endTime', val)}
                    placeholder="21:00"
                  />
                </>
              ) : (
                <Text style={styles.timeText}>{item.startTime} — {item.endTime}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.offText}>Выходной день</Text>
          )}
        </View>

        {isAdmin && (
          <View style={styles.adminActions}>
            {item.status === 'work' && (
              <TouchableOpacity style={styles.actionButton} onPress={() => setDayOff(item.id)}>
                <XCircle size={20} color="#64748b" />
                <Text style={styles.actionText}>Сделать выходным</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionButton} onPress={() => deleteShift(item.id)}>
              <Trash2 size={20} color="#ef4444" />
              <Text style={[styles.actionText, { color: '#ef4444' }]}>Удалить</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user?.role === 'admin' && (
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'my' && styles.activeFilter]}
            onPress={() => setFilter('my')}
          >
            <Text style={[styles.filterButtonText, filter === 'my' && styles.activeFilterText]}>Мой график</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterButtonText, filter === 'all' && styles.activeFilterText]}>Все</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={schedules}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Нет запланированных смен</Text>
        }
      />
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f1f5f9',
  },
  activeFilter: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    color: '#64748b',
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  employeeName: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  workBadge: {
    backgroundColor: '#dcfce7',
  },
  offBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    paddingVertical: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    color: '#1e293b',
    fontWeight: '500',
  },
  timeInput: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 6,
    width: 70,
    textAlign: 'center',
    fontSize: 16,
  },
  separator: {
    marginHorizontal: 10,
    fontSize: 18,
    color: '#cbd5e1',
  },
  offText: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  adminActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#64748b',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#94a3b8',
    fontSize: 16,
  },
});
