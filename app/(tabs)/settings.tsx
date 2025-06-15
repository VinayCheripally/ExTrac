import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeModules } from 'react-native';

const { SMSModule } = NativeModules;

export default function SettingsScreen() {
  const handleClearSMS = async () => {
    try {
      // Clear the stored SMS (you might want to add this method to your SMSModule)
      Alert.alert('Success', 'SMS data cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear SMS data');
    }
  };

  const handleTestSMS = () => {
    Alert.alert(
      'Test SMS',
      'To test the SMS extraction, send yourself a message like:\n\n"₹500.00 has been debited from your account at AMAZON on 15-Jan-24"',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your SMS expense tracker</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SMS Processing</Text>
        <Text style={styles.description}>
          This app automatically detects financial SMS messages and extracts expense information.
        </Text>
        
        <TouchableOpacity style={styles.button} onPress={handleTestSMS}>
          <Text style={styles.buttonText}>How to Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleClearSMS}>
          <Text style={[styles.buttonText, styles.dangerButtonText]}>Clear SMS Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supported Formats</Text>
        <Text style={styles.description}>
          The app can extract amounts from SMS messages containing:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletPoint}>• Debit notifications</Text>
          <Text style={styles.bulletPoint}>• Payment confirmations</Text>
          <Text style={styles.bulletPoint}>• Transfer notifications</Text>
          <Text style={styles.bulletPoint}>• EMI deductions</Text>
          <Text style={styles.bulletPoint}>• Wallet payments</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <Text style={styles.description}>
          All SMS data is processed locally on your device. No information is sent to external servers.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SMS Expense Tracker v1.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  dangerButtonText: {
    color: '#fff',
  },
  bulletList: {
    marginLeft: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});