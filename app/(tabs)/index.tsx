import { useEffect, useState } from "react";
import { NativeModules, Text, View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { extractDebitAmounts, extractMerchantName } from "@/lib/smsParser";

const { SMSModule } = NativeModules;

interface ExtractedExpense {
  amount: number;
  merchant: string;
  originalMessage: string;
  timestamp: string;
}

export default function HomeScreen() {
  const [smsContent, setSmsContent] = useState("No message yet");
  const [extractedExpenses, setExtractedExpenses] = useState<ExtractedExpense[]>([]);
  const [lastProcessedMessage, setLastProcessedMessage] = useState("");

  useEffect(() => {
    const getSMS = async () => {
      try {
        const latestSMS = await SMSModule.getLatestSMS();
        if (latestSMS && latestSMS !== lastProcessedMessage) {
          setSmsContent(latestSMS);
          
          // Extract debit amounts from the SMS
          const debitAmounts = extractDebitAmounts([latestSMS]);
          
          if (debitAmounts.length > 0) {
            const newExpenses = debitAmounts.map(({ amount, originalMessage }) => ({
              amount,
              merchant: extractMerchantName(originalMessage),
              originalMessage,
              timestamp: new Date().toLocaleString()
            }));
            
            setExtractedExpenses(prev => [...newExpenses, ...prev].slice(0, 10)); // Keep last 10
            setLastProcessedMessage(latestSMS);
          }
        }
      } catch (error) {
        console.error("Failed to get SMS:", error);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(getSMS, 2000);
    return () => clearInterval(interval);
  }, [lastProcessedMessage]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const clearExpenses = () => {
    setExtractedExpenses([]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SMS Expense Tracker</Text>
        <Text style={styles.subtitle}>Automatically extracts expenses from SMS</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Latest SMS</Text>
        <View style={styles.smsContainer}>
          <Text style={styles.smsText}>{smsContent}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.expenseHeader}>
          <Text style={styles.sectionTitle}>Extracted Expenses ({extractedExpenses.length})</Text>
          {extractedExpenses.length > 0 && (
            <TouchableOpacity onPress={clearExpenses} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {extractedExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No expenses detected yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Send yourself a test SMS with debit information to see the extraction in action
            </Text>
          </View>
        ) : (
          <View style={styles.expensesList}>
            {extractedExpenses.map((expense, index) => (
              <View key={index} style={styles.expenseItem}>
                <View style={styles.expenseHeader}>
                  <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                  <Text style={styles.expenseTimestamp}>{expense.timestamp}</Text>
                </View>
                <Text style={styles.expenseMerchant}>{expense.merchant}</Text>
                <Text style={styles.expenseMessage} numberOfLines={2}>
                  {expense.originalMessage}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Examples</Text>
        <Text style={styles.testText}>
          Try sending yourself SMS messages like:
        </Text>
        <Text style={styles.exampleText}>
          "₹500.00 has been debited from your account at AMAZON on 15-Jan-24"
        </Text>
        <Text style={styles.exampleText}>
          "Rs 1,250 debited from A/c XX1234 for payment to SWIGGY"
        </Text>
        <Text style={styles.exampleText}>
          "Amount Rs.750.50 debited via UPI to ZOMATO"
        </Text>
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
  smsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  smsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  expensesList: {
    gap: 12,
  },
  expenseItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  expenseTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  expenseMerchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 4,
    marginBottom: 8,
  },
  expenseMessage: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  testText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});