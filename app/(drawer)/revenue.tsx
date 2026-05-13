import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';

export default function RevenueScreen() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [idealPlan, setIdealPlan] = useState('');
  const [grossRevenue, setGrossRevenue] = useState('');
  const [expenses, setExpenses] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!date || !idealPlan || !grossRevenue || !employeeCount) {
      Alert.alert('Ошибка', 'Заполните обязательные поля: Дата, План, Выручка, Кол-во сотрудников');
      return;
    }

    setLoading(true);
    try {
      const revenueId = date; // One record per day
      await setDoc(doc(db, 'revenue', revenueId), {
        date,
        idealPlan: Number(idealPlan),
        grossRevenue: Number(grossRevenue),
        expenses: Number(expenses || 0),
        employeeCount: Number(employeeCount),
        timestamp: serverTimestamp(),
      }, { merge: true });

      Alert.alert('Успех', 'Данные успешно сохранены');
      // Reset form (except date)
      setIdealPlan('');
      setGrossRevenue('');
      setExpenses('');
      setEmployeeCount('');
    } catch (error) {
      console.error(error);
      Alert.alert('Ошибка', 'Не удалось сохранить данные');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ввод выручки за день</Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Дата (YYYY-MM-DD)*</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="2023-10-27"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>План (Идеал)*</Text>
          <TextInput
            style={styles.input}
            value={idealPlan}
            onChangeText={setIdealPlan}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Фактическая выручка*</Text>
          <TextInput
            style={styles.input}
            value={grossRevenue}
            onChangeText={setGrossRevenue}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Расходы</Text>
          <TextInput
            style={styles.input}
            value={expenses}
            onChangeText={setExpenses}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Количество сотрудников на смене*</Text>
          <TextInput
            style={styles.input}
            value={employeeCount}
            onChangeText={setEmployeeCount}
            keyboardType="numeric"
            placeholder="1"
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Сохранить</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 24,
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    color: '#1e293b',
  },
  button: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
