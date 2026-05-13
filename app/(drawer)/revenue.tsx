import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RevenueScreen() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [idealPlan, setIdealPlan] = useState('');
  const [grossRevenue, setGrossRevenue] = useState('');
  const [expenses, setExpenses] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!idealPlan || !grossRevenue || !employeeCount) {
      Alert.alert('Ошибка', 'План, Выручка и Кол-во сотрудников обязательны');
      return;
    }

    setLoading(true);
    try {
      const revenueId = date; // Using date as ID for simplicity (one record per day)
      await setDoc(doc(db, 'revenue', revenueId), {
        date,
        idealPlan: Number(idealPlan),
        grossRevenue: Number(grossRevenue),
        expenses: Number(expenses || 0),
        employeeCount: Number(employeeCount),
        timestamp: serverTimestamp(),
      }, { merge: true });

      Alert.alert('Успех', 'Данные сохранены');
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.form}>
            <Text style={styles.label}>Дата</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.label}>План продаж (Идеал) *</Text>
            <TextInput
              style={styles.input}
              value={idealPlan}
              onChangeText={setIdealPlan}
              keyboardType="numeric"
              placeholder="0"
            />

            <Text style={styles.label}>Фактическая выручка *</Text>
            <TextInput
              style={styles.input}
              value={grossRevenue}
              onChangeText={setGrossRevenue}
              keyboardType="numeric"
              placeholder="0"
            />

            <Text style={styles.label}>Расходы</Text>
            <TextInput
              style={styles.input}
              value={expenses}
              onChangeText={setExpenses}
              keyboardType="numeric"
              placeholder="0"
            />

            <Text style={styles.label}>Кол-во сотрудников на смене *</Text>
            <TextInput
              style={styles.input}
              value={employeeCount}
              onChangeText={setEmployeeCount}
              keyboardType="numeric"
              placeholder="0"
            />

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.btnDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveBtnText}>{loading ? 'Сохранение...' : 'Сохранить'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
  },
  form: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    marginBottom: 20,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  btnDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
