import { Drawer } from 'expo-router/drawer';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useAuth } from '../../lib/authContext';
import { auth } from '../../lib/firebase';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';

function CustomDrawerContent(props: any) {
  const { user } = useAuth();
  const router = useRouter();

  const pickImage = async () => {
    if (!user) return;
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `avatars/${user.id}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', user.id), {
        avatarUrl: downloadURL,
      });
      // In a real app, you might want to update the context or refresh
    }
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerHeader}>
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={user?.avatarUrl ? { uri: user.avatarUrl } : require('../../assets/icon.png')}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.name || 'Пользователь'}</Text>
        <Text style={styles.userBranch}>{user?.branch || 'Филиал не указан'}</Text>
      </View>
      <DrawerItemList {...props} />
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => auth.signOut()}
      >
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  const { user } = useAuth();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#f8fafc' },
        headerTintColor: '#3b82f6',
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Главная',
          title: 'Главная',
        }}
      />
      <Drawer.Screen
        name="schedule"
        options={{
          drawerLabel: 'График',
          title: 'График работы',
        }}
      />
      <Drawer.Screen
        name="salary"
        options={{
          drawerLabel: 'Зарплата',
          title: 'Зарплата',
        }}
      />
      <Drawer.Screen
        name="revenue"
        options={{
          drawerLabel: 'Выручка',
          title: 'Выручка',
        }}
      />
      <Drawer.Screen
        name="employees"
        options={{
          drawerLabel: 'Сотрудники',
          title: 'Сотрудники',
          drawerItemStyle: { display: user?.role === 'admin' ? 'flex' : 'none' },
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    backgroundColor: '#e2e8f0',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  userBranch: {
    fontSize: 14,
    color: '#64748b',
  },
  logoutButton: {
    marginTop: 20,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
