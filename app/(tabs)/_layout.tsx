import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform, NativeModules, NativeEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { extractDebitAmounts, extractMerchantName } from '@/lib/smsParser';
import { database } from '@/lib/database';
import { sendExpenseNotification } from '@/lib/notifications';

const { SMSModule } = NativeModules;

export default function TabLayout() {
  const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState<number>(0);

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          {
            title: "SMS Permission",
            message: "App needs access to receive SMS messages for expense tracking",
            buttonPositive: "OK",
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("SMS permission granted");
        } else {
          console.log("SMS permission denied");
        }
      }
    };

    requestPermissions();
  }, []);

  useEffect(() => {
    // Set up SMS event listener
    const eventEmitter = new NativeEventEmitter(SMSModule);
    const subscription = eventEmitter.addListener('onSMSReceived', (smsContent: string) => {
      console.log('SMS received in React Native:', smsContent);
      processSMSForExpenses(smsContent);
    });

    // Poll for new SMS messages
    const pollForSMS = async () => {
      try {
        const latestSMS = await SMSModule.getLatestSMS();
        if (latestSMS && latestSMS.trim()) {
          await processSMSForExpenses(latestSMS);
          // Clear the SMS after processing
          await SMSModule.clearLatestSMS();
        }
      } catch (error) {
        console.error('Error polling for SMS:', error);
      }
    };

    const interval = setInterval(pollForSMS, 3000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [lastProcessedTimestamp]);

  const processSMSForExpenses = async (smsContent: string) => {
    try {
      const debitAmounts = extractDebitAmounts([smsContent]);
      
      if (debitAmounts.length > 0) {
        for (const { amount, originalMessage } of debitAmounts) {
          const merchant = extractMerchantName(originalMessage);
          const currentDate = new Date().toISOString().split('T')[0];
          
          // Add uncategorized expense to database
          await database.addExpense({
            amount,
            category: 'Uncategorized',
            description: merchant !== 'Unknown Merchant' ? merchant : '',
            date: currentDate,
            sms_content: originalMessage,
            is_categorized: false
          });

          // Send notification
          await sendExpenseNotification(amount, merchant);
          
          console.log(`Added uncategorized expense: ₹${amount} from ${merchant}`);
        }
        
        setLastProcessedTimestamp(Date.now());
      }
    } catch (error) {
      console.error('Error processing SMS for expenses:', error);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="pie-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}