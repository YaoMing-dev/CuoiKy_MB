import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
  addNotificationReceivedListener,
} from '../services/notificationService';
import useAuthStore from '../stores/useAuthStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function useNotifications(onNotificationPress) {
  const { user } = useAuthStore();
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Register for push notifications
    const register = async () => {
      if (!user) return;

      const token = await registerForPushNotifications();
      setExpoPushToken(token);

      // Save token to user document
      if (token && user.uid) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            expoPushToken: token,
            updatedAt: new Date(),
          });
        } catch (error) {
          console.error('Error saving push token:', error);
        }
      }
    };

    register();

    // Listen for foreground notifications
    notificationListener.current = addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listen for notification taps
    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (onNotificationPress) {
        onNotificationPress(data);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  return {
    expoPushToken,
    notification,
  };
}
