import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import useAuthStore from '../stores/useAuthStore';
import useNotifications from '../hooks/useNotifications';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import { COLORS } from '../config/constants';

export default function RootNavigator({ navigation }) {
  const { isAuthenticated, isLoading, setUser, setUserProfile, setLoading } = useAuthStore();

  // Setup notifications
  useNotifications((data) => {
    // Handle notification tap - navigate based on data
    // This is a placeholder - actual navigation would need NavigationContainer ref
    console.log('Notification tapped:', data);
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile({ id: userDoc.id, ...userDoc.data() });
          }
        } catch (error) {
          console.log('Error fetching user profile:', error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
