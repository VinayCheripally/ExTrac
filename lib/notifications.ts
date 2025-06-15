import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('expense-alerts', {
      name: 'Expense Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

export async function sendExpenseNotification(amount: number, merchant: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💳 New Expense Detected',
      body: `₹${amount.toFixed(2)} debited${merchant !== 'Unknown Merchant' ? ` at ${merchant}` : ''}. Tap to categorize.`,
      data: { 
        type: 'expense_detected',
        amount,
        merchant,
        timestamp: new Date().toISOString()
      },
      sound: true,
    },
    trigger: null, // Show immediately
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}