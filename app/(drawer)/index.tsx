import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import {
  Calendar,
  Wallet,
  FileText,
  User as UserIcon,
  TrendingUp
} from 'lucide-react-native';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const menuItems = [
    {
      title: 'Документы',
      icon: <FileText size={32} color="#3b82f6" />,
      route: null, // неактивно
      disabled: true,
    },
    {
      title: 'График работы',
      icon: <Calendar size={32} color="#3b82f6" />,
      route: '/(drawer)/schedule',
      disabled: false,
    },
    {
      title: 'Личный кабинет',
      icon: <UserIcon size={32} color="#3b82f6" />,
      route: null, // неактивно
      disabled: true,
    },
    {
      title: 'Зарплата',
      icon: <Wallet size={32} color="#3b82f6" />,
      route: '/(drawer)/salary',
      disabled: false,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Привет, {user?.name}!</Text>
        <Text style={styles.subtitle}>Рады тебя видеть</Text>
      </View>

      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, item.disabled && styles.disabledCard]}
            onPress={() => item.route && router.push(item.route as any)}
            disabled={item.disabled}
          >
            <View style={styles.iconContainer}>{item.icon}</View>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {user?.role === 'admin' && (
        <TouchableOpacity
          style={styles.adminCard}
          onPress={() => router.push('/(drawer)/revenue')}
        >
          <TrendingUp size={24} color="#fff" />
          <Text style={styles.adminCardText}>Внести выручку за сегодня</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#fff',
    width: '46%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: '2%',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  disabledCard: {
    opacity: 0.6,
  },
  iconContainer: {
    marginBottom: 12,
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  adminCard: {
    backgroundColor: '#3b82f6',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminCardText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});
