import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import {
  Bell,
  Database,
  Trash2,
  Download,
  Shield,
  Info,
  ChevronRight,
} from 'lucide-react-native';

import { database } from '@/lib/database';
import { cancelAllNotifications } from '@/lib/notifications';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoCategorizationEnabled, setAutoCategorizationEnabled] = useState(false);

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your expenses and cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get all expenses and delete them
              const expenses = await database.getExpenses();
              for (const expense of expenses) {
                await database.deleteExpense(expense.id!);
              }
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const expenses = await database.getExpenses();
      const categories = await database.getCategories();
      
      const exportData = {
        expenses,
        categories,
        exportDate: new Date().toISOString(),
      };
      
      // In a real app, you would save this to a file or share it
      console.log('Export data:', JSON.stringify(exportData, null, 2));
      Alert.alert(
        'Export Data',
        'Export functionality would save your data to a file. Check console for data structure.'
      );
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (!value) {
      await cancelAllNotifications();
    }
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode,
    danger?: boolean
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, danger && styles.dangerIcon]}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, danger && styles.dangerText]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightComponent || (onPress && <ChevronRight size={20} color="#C7C7CC" />)}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your expense tracker preferences</Text>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {renderSettingItem(
          <Bell size={20} color="#007AFF" />,
          'Push Notifications',
          'Get notified when new expenses are detected',
          undefined,
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
            thumbColor="#FFFFFF"
          />
        )}
      </View>

      {/* Automation Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Automation</Text>
        {renderSettingItem(
          <Shield size={20} color="#34C759" />,
          'Auto Categorization',
          'Automatically categorize expenses based on merchant patterns',
          undefined,
          <Switch
            value={autoCategorizationEnabled}
            onValueChange={setAutoCategorizationEnabled}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFFFFF"
          />
        )}
      </View>

      {/* Data Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        {renderSettingItem(
          <Download size={20} color="#007AFF" />,
          'Export Data',
          'Download your expenses as JSON file',
          handleExportData
        )}
        {renderSettingItem(
          <Database size={20} color="#8E8E93" />,
          'Database Info',
          'View local database statistics',
          () => Alert.alert('Database Info', 'All data is stored locally on your device using SQLite')
        )}
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        {renderSettingItem(
          <Trash2 size={20} color="#FF3B30" />,
          'Clear All Data',
          'Permanently delete all expenses and categories',
          handleClearAllData,
          undefined,
          true
        )}
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        {renderSettingItem(
          <Info size={20} color="#8E8E93" />,
          'App Version',
          '1.0.0',
          () => Alert.alert('About', 'SMS-based Expense Tracker\nVersion 1.0.0\n\nAutomatically tracks expenses from SMS messages.')
        )}
      </View>

      {/* Privacy Notice */}
      <View style={styles.privacyNotice}>
        <Shield size={16} color="#34C759" />
        <Text style={styles.privacyText}>
          All your data is stored locally on your device. No information is sent to external servers.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerIcon: {
    backgroundColor: '#FFEBEE',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  dangerText: {
    color: '#FF3B30',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    lineHeight: 18,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  privacyText: {
    fontSize: 14,
    color: '#1B5E20',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});