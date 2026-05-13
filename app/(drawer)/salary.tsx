import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../lib/authContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ScheduleEntry, Revenue, SalaryDetail } from '../../lib/types';
import { calculateSalary } from '../../lib/salaryUtils';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SalaryScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'current' | 'last'>('current');
  const [loading, setLoading] = useState(true);
  const [salaryData, setSalaryData] = useState<{
    total: number;
    okladTotal: number;
    bonusTotal: number;
    details: SalaryDetail[];
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      const now = new Date();
      let start: Date, end: Date;

      if (period === 'current') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
      }

      const startDateStr = start.toISOString().split('T')[0];
      const endDateStr = end.toISOString().split('T')[0];

      try {
        const scheduleQuery = query(
          collection(db, 'schedule'),
          where('employeeId', '==', user.id),
          where('date', '>=', startDateStr),
          where('date', '<=', endDateStr)
        );
        const scheduleSnap = await getDocs(scheduleQuery);
        const schedule = scheduleSnap.docs.map(doc => doc.data() as ScheduleEntry);

        const revenueQuery = query(
          collection(db, 'revenue'),
          where('date', '>=', startDateStr),
          where('date', '<=', endDateStr)
        );
        const revenueSnap = await getDocs(revenueQuery);
        const revenues = revenueSnap.docs.map(doc => doc.data() as Revenue);

        const result = calculateSalary(user, schedule, revenues);
        setSalaryData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, period]);

  const renderItem = ({ item }: { item: SalaryDetail }) => (
    <View style={styles.detailCard}>
      <View style={styles.detailRow}>
        <Text style={styles.detailDate}>{item.date}</Text>
        <Text style={styles.detailRevenue}>Выручка: {item.revenue.toLocaleString()} ₽</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailText}>Часы: {item.workHours.toFixed(1)} ({item.okladPart.toFixed(0)} ₽)</Text>
        <Text style={styles.detailText}>Бонус: {item.bonusPercentage}% ({item.bonusAmount.toFixed(0)} ₽)</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.periodContainer}>
        <TouchableOpacity
          style={[styles.periodBtn, period === 'current' && styles.periodBtnActive]}
          onPress={() => setPeriod('current')}
        >
          <Text style={[styles.periodBtnText, period === 'current' && styles.periodBtnTextActive]}>Текущий месяц</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodBtn, period === 'last' && styles.periodBtnActive]}
          onPress={() => setPeriod('last')}
        >
          <Text style={[styles.periodBtnText, period === 'last' && styles.periodBtnTextActive]}>Прошлый месяц</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
      ) : salaryData ? (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.totalLabel}>Итого к выплате</Text>
            <Text style={styles.totalValue}>{salaryData.total.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₽</Text>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summarySubLabel}>Оклад</Text>
                <Text style={styles.summarySubValue}>{salaryData.okladTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₽</Text>
              </View>
              <View>
                <Text style={styles.summarySubLabel}>Бонусы</Text>
                <Text style={styles.summarySubValue}>{salaryData.bonusTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₽</Text>
              </View>
            </View>
          </View>

          <FlatList
            data={salaryData.details}
            renderItem={renderItem}
            keyExtractor={(item) => item.date}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={<Text style={styles.listTitle}>Детализация по дням</Text>}
          />
        </>
      ) : (
        <Text style={styles.emptyText}>Нет данных за этот период</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  periodContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  periodBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  periodBtnText: {
    color: '#64748b',
    fontWeight: '600',
  },
  periodBtnTextActive: {
    color: '#ffffff',
  },
  summaryCard: {
    backgroundColor: '#3b82f6',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  totalLabel: {
    color: '#bfdbfe',
    fontSize: 16,
    marginBottom: 4,
  },
  totalValue: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
  },
  summarySubLabel: {
    color: '#bfdbfe',
    fontSize: 12,
    textAlign: 'center',
  },
  summarySubValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  detailRevenue: {
    fontSize: 14,
    color: '#64748b',
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#64748b',
  },
});
