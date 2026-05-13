import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import { useAuth } from '../../context/AuthContext';
import { auth, db, storage } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { LogOut, User as UserIcon } from 'lucide-react-native';

function CustomDrawerContent(props: any) {
  const { user } = useAuth();

  const pickImage = async () => {
    if (!user) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Требуется разрешение на доступ к фото');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      try {
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `avatars/${user.id}`);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        await updateDoc(doc(db, 'users', user.id), {
          avatarUrl: downloadURL
        });

        Alert.alert('Успех', 'Фото профиля обновлено');
      } catch (error) {
        console.error(error);
        Alert.alert('Ошибка', 'Не удалось загрузить фото');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
      Alert.alert('Ошибка', 'Не удалось выйти из системы');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}>
                <UserIcon size={40} color="#64748b" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.name || 'Пользователь'}</Text>
          <Text style={styles.branchName}>{user?.branch || 'Филиал не указан'}</Text>
        </View>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  const { user } = useAuth();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#1e293b',
        drawerActiveTintColor: '#3b82f6',
        drawerInactiveTintColor: '#64748b',
        drawerLabelStyle: { fontSize: 16 },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Главная',
          drawerLabel: 'Главная',
        }}
      />
      <Drawer.Screen
        name="schedule"
        options={{
          title: 'График работы',
          drawerLabel: 'График',
        }}
      />
      <Drawer.Screen
        name="salary"
        options={{
          title: 'Зарплата',
          drawerLabel: 'Зарплата',
        }}
      />
      <Drawer.Screen
        name="revenue"
        options={{
          title: 'Выручка',
          drawerLabel: 'Выручка',
        }}
      />
      <Drawer.Screen
        name="employees"
        options={{
          title: 'Сотрудники',
          drawerLabel: 'Сотрудники',
          drawerItemStyle: { display: user?.role === 'admin' ? 'flex' : 'none' },
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 10,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  placeholderAvatar: {
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  branchName: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
});
