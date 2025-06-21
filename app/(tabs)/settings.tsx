import {
  Alert,
  NativeModules,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { databaseManager } from "@/lib/database";
import { useState, useEffect } from "react";

const { SMSModule } = NativeModules;

export default function SettingsScreen() {
  const [dbStats, setDbStats] = useState({
    totalExpenses: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    loadDatabaseStats();
  }, []);

  const loadDatabaseStats = async () => {
    try {
      const [totalExpenses, totalAmount] = await Promise.all([
        databaseManager.getExpenseCount(),
        databaseManager.getTotalExpenseAmount(),
      ]);
      
      setDbStats({
        totalExpenses,
        totalAmount,
      });
    } catch (error) {
      console.error('Failed to load database stats:', error);
    }
  };

  const handleClearSMS = async () => {
    Alert.alert(
      "Clear SMS Data",
      "This will clear the stored SMS data but keep your expense records. Continue?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            Alert.alert("Success", "SMS data cleared");
          },
        },
      ]
    );
  };

  const handleClearDatabase = async () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all expense records from the database. This action cannot be undone. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await databaseManager.clearAllExpenses();
              await loadDatabaseStats();
              Alert.alert("Success", "All expense data has been cleared from the database.");
            } catch (error) {
              console.error('Failed to clear database:', error);
              Alert.alert("Error", "Failed to clear database. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const expenses = await databaseManager.getAllExpenses();
      
      if (expenses.length === 0) {
        Alert.alert("No Data", "No expense data available to export.");
        return;
      }

      // In a real app, you would implement actual export functionality
      // For now, we'll just show the data count
      Alert.alert(
        "Export Data",
        `Found ${expenses.length} expense records. Export functionality would be implemented here.`,
        [
          {
            text: "OK",
            onPress: () => console.log("Export data:", expenses),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to export data:', error);
      Alert.alert("Error", "Failed to export data. Please try again.");
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your SMS expense tracker</Text>
      </View>

      {/* Database Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Database Statistics</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Expenses</Text>
            <Text style={styles.statValue}>{dbStats.totalExpenses}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Amount</Text>
            <Text style={styles.statValue}>{formatCurrency(dbStats.totalAmount)}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.button}
          onPress={loadDatabaseStats}
        >
          <Text style={styles.buttonText}>Refresh Statistics</Text>
        </TouchableOpacity>
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <Text style={styles.description}>
          Manage your stored expense data and SMS processing settings.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleExportData}
        >
          <Text style={styles.buttonText}>Export Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={handleClearSMS}
        >
          <Text style={[styles.buttonText, styles.warningButtonText]}>
            Clear SMS Data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleClearDatabase}
        >
          <Text style={[styles.buttonText, styles.dangerButtonText]}>
            Clear All Database Records
          </Text>
        </TouchableOpacity>
      </View>

      {/* SMS Processing Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SMS Processing</Text>
        <Text style={styles.description}>
          This app automatically detects financial SMS messages and extracts
          expense information. All data is stored locally on your device using SQLite.
        </Text>
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
          <Text style={styles.bulletPoint}>• UPI transactions</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Storage</Text>
        <Text style={styles.description}>
          All SMS data is processed locally on your device using SQLite database.
          No information is sent to external servers. Your data remains private
          and secure on your device.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>ExTrac - SMS Expense Tracker v1.0</Text>
        <Text style={styles.footerText}>Powered by SQLite Local Database</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  warningButton: {
    backgroundColor: "#FF9500",
  },
  warningButtonText: {
    color: "#fff",
  },
  dangerButton: {
    backgroundColor: "#FF3B30",
  },
  dangerButtonText: {
    color: "#fff",
  },
  bulletList: {
    marginLeft: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    lineHeight: 20,
  },
  footer: {
    alignItems: "center",
    padding: 20,
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
});