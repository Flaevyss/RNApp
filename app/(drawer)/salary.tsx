import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Schedule, Revenue } from '../../lib/types';
import { calculateSalary, SalaryDetail } from '../../lib/salary';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export default function SalaryScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'current' | 'prev'>('current');
  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState<Schedule[]>([]);
  const [revenueData, setRevenueData] = useState<Revenue[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      const now = new Date();
      const start = period === 'current' ? startOfMonth(now) : startOfMonth(subMonths(now, 1));
      const end = period === 'current' ? endOfMonth(now) : endOfMonth(subMonths(now, 1));

      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');

      try {
        // Fetch schedule for the user in the selected period
        const qSchedule = query(
          collection(db, 'schedule'),
          where('employeeId', '==', user.id),
          where('date', '>=', startDateStr),
          where('date', '<=', endDateStr)
        );
        const snapSchedule = await getDocs(qSchedule);
        const schedules: Schedule[] = [];
        snapSchedule.forEach(doc => schedules.push({ id: doc.id, ...doc.data() } as Schedule));

        // Fetch all revenue for the selected period
        const qRevenue = query(
          collection(db, 'revenue'),
          where('date', '>=', startDateStr),
          where('date', '<=', endDateStr)
        );
        const snapRevenue = await getDocs(qRevenue);
        const revenues: Revenue[] = [];
        snapRevenue.forEach(doc => revenues.push({ id: doc.id, ...doc.data() } as Revenue));

        setScheduleData(schedules);
        setRevenueData(revenues);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, period]);

  const salary = useMemo(() => {
    if (!user) return null;
    return calculateSalary(user.oklad, scheduleData, revenueData);
  }, [user, scheduleData, revenueData]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.periodSwitcher}>
        <TouchableOpacity
          style={[styles.periodButton, period === 'current' && styles.activePeriod]}
          onPress={() => setPeriod('current')}
        >
          <Text style={[styles.periodText, period === 'current' && styles.activePeriodText]}>Текущий месяц</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'prev' && styles.activePeriod]}
          onPress={() => setPeriod('prev')}
        >
          <Text style={[styles.periodText, period === 'prev' && styles.activePeriodText]}>Прошлый месяц</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Итоговая ЗП</Text>
          <Text style={styles.totalAmount}>{salary?.total.toLocaleString()} ₽</Text>

          <View style={styles.breakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Окладная часть</Text>
              <Text style={styles.breakdownValue}>{salary?.okladTotal.toLocaleString()} ₽</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Бонус от продаж</Text>
              <Text style={styles.breakdownValue}>{salary?.bonusTotal.toLocaleString()} ₽</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Детализация по дням</Text>
        {salary?.details.map((item, index) => (
          <View key={index} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayDate}>{format(new Date(item.date), 'dd.MM.yyyy')}</Text>
              <Text style={styles.dayTotal}>{item.total.toLocaleString()} ₽</Text>
            </View>
            <View style={styles.dayDetails}>
              <Text style={styles.dayDetailText}>Выручка: {item.revenue.toLocaleString()} ₽ ({item.percent}%)</Text>
              <Text style={styles.dayDetailText}>Бонус: {item.bonusPart.toLocaleString()} ₽</Text>
              <Text style={styles.dayDetailText}>Отработано: {item.hours} ч. ({item.okladPart.toLocaleString()} ₽)</Text>
            </View>
          </View>
        ))}

        {salary?.details.length === 0 && (
          <Text style={styles.emptyText}>Нет данных за выбранный период</Text>
        )}
      </ScrollView>
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
  periodSwitcher: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f1f5f9',
  },
  activePeriod: {
    backgroundColor: '#3b82f6',
  },
  periodText: {
    fontWeight: '600',
    color: '#64748b',
  },
  activePeriodText: {
    color: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  totalCard: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  totalLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 8,
  },
  totalAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  breakdown: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 16,
    width: '100%',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  breakdownValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  dayTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  dayDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  dayDetailText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#94a3b8',
    fontSize: 16,
  },
});
