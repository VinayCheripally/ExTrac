import { extractDebitAmounts, extractMerchantName } from "@/lib/smsParser";
import { useEffect, useState } from "react";
import {
  NativeModules,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { SMSModule } = NativeModules;

interface ExtractedExpense {
  amount: number;
  merchant: string;
  originalMessage: string;
  timestamp: string;
  date: Date;
}

interface MonthlyExpense {
  month: string;
  year: number;
  total: number;
  count: number;
  expenses: ExtractedExpense[];
}

export default function HomeScreen() {
  const [smsContent, setSmsContent] = useState("No message yet");
  const [extractedExpenses, setExtractedExpenses] = useState<
    ExtractedExpense[]
  >([]);
  const [lastProcessedMessage, setLastProcessedMessage] = useState("");
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [selectedView, setSelectedView] = useState<"recent" | "monthly">(
    "recent"
  );

  useEffect(() => {
    const getSMS = async () => {
      try {
        const latestSMS = await SMSModule.getLatestSMS();
        if (latestSMS && latestSMS !== lastProcessedMessage) {
          setSmsContent(latestSMS);

          // Extract debit amounts from the SMS
          const debitAmounts = extractDebitAmounts([latestSMS]);

          if (debitAmounts.length > 0) {
            const newExpenses = debitAmounts.map(
              ({ amount, originalMessage }) => {
                const now = new Date();
                return {
                  amount,
                  merchant: extractMerchantName(originalMessage),
                  originalMessage,
                  timestamp: now.toLocaleString(),
                  date: now,
                };
              }
            );

            setExtractedExpenses((prev) =>
              [...newExpenses, ...prev].slice(0, 50)
            ); // Keep last 50
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

  // Calculate monthly expenses whenever extractedExpenses changes
  useEffect(() => {
    const calculateMonthlyExpenses = () => {
      const monthlyMap = new Map<string, MonthlyExpense>();

      extractedExpenses.forEach((expense) => {
        const date = expense.date;
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthName = date.toLocaleDateString("en-US", { month: "long" });
        const year = date.getFullYear();

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            month: monthName,
            year,
            total: 0,
            count: 0,
            expenses: [],
          });
        }

        const monthData = monthlyMap.get(monthKey)!;
        monthData.total += expense.amount;
        monthData.count += 1;
        monthData.expenses.push(expense);
      });

      // Convert to array and sort by year and month (most recent first)
      const monthlyArray = Array.from(monthlyMap.values()).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return (
          new Date(`${b.month} 1, ${b.year}`).getMonth() -
          new Date(`${a.month} 1, ${a.year}`).getMonth()
        );
      });

      setMonthlyExpenses(monthlyArray);
    };

    calculateMonthlyExpenses();
  }, [extractedExpenses]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const clearExpenses = () => {
    setExtractedExpenses([]);
    setMonthlyExpenses([]);
  };

  const getCurrentMonthTotal = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return extractedExpenses
      .filter((expense) => {
        const expenseDate = expense.date;
        return (
          expenseDate.getMonth() === currentMonth &&
          expenseDate.getFullYear() === currentYear
        );
      })
      .reduce((total, expense) => total + expense.amount, 0);
  };

  const renderRecentExpenses = () => (
    <View style={styles.section}>
      <View style={styles.expenseHeader}>
        <Text style={styles.sectionTitle}>
          Recent Expenses ({extractedExpenses.length})
        </Text>
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
            Send yourself a test SMS with debit information to see the
            extraction in action
          </Text>
        </View>
      ) : (
        <View style={styles.expensesList}>
          {extractedExpenses.slice(0, 10).map((expense, index) => (
            <View key={index} style={styles.expenseItem}>
              <View style={styles.expenseHeader}>
                <Text style={styles.expenseAmount}>
                  {formatCurrency(expense.amount)}
                </Text>
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
  );

  const renderMonthlyExpenses = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Monthly Expenses</Text>

      {monthlyExpenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No monthly data available</Text>
          <Text style={styles.emptyStateSubtext}>
            Start tracking expenses to see monthly summaries
          </Text>
        </View>
      ) : (
        <View style={styles.monthlyList}>
          {monthlyExpenses.map((monthData, index) => (
            <View key={index} style={styles.monthlyItem}>
              <View style={styles.monthlyHeader}>
                <Text style={styles.monthlyTitle}>
                  {monthData.month} {monthData.year}
                </Text>
                <Text style={styles.monthlyTotal}>
                  {formatCurrency(monthData.total)}
                </Text>
              </View>
              <Text style={styles.monthlyCount}>
                {monthData.count} transactions
              </Text>

              {/* Show top 3 expenses for this month */}
              <View style={styles.monthlyExpensesList}>
                {monthData.expenses
                  .sort((a, b) => b.amount - a.amount)
                  .slice(0, 3)
                  .map((expense, expIndex) => (
                    <View key={expIndex} style={styles.monthlyExpenseItem}>
                      <Text style={styles.monthlyExpenseMerchant}>
                        {expense.merchant}
                      </Text>
                      <Text style={styles.monthlyExpenseAmount}>
                        {formatCurrency(expense.amount)}
                      </Text>
                    </View>
                  ))}
                {monthData.expenses.length > 3 && (
                  <Text style={styles.moreExpensesText}>
                    +{monthData.expenses.length - 3} more transactions
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ExTrac</Text>
        <Text style={styles.subtitle}>Expense Tracker</Text>
      </View>

      {/* Current Month Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>This Month</Text>
        <Text style={styles.summaryAmount}>
          {formatCurrency(getCurrentMonthTotal())}
        </Text>
        <Text style={styles.summarySubtext}>
          {
            extractedExpenses.filter((e) => {
              const now = new Date();
              return (
                e.date.getMonth() === now.getMonth() &&
                e.date.getFullYear() === now.getFullYear()
              );
            }).length
          }{" "}
          transactions
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Latest SMS</Text>
        <View style={styles.smsContainer}>
          <Text style={styles.smsText}>{smsContent}</Text>
        </View>
      </View>

      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedView === "recent" && styles.toggleButtonActive,
          ]}
          onPress={() => setSelectedView("recent")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              selectedView === "recent" && styles.toggleButtonTextActive,
            ]}
          >
            Recent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedView === "monthly" && styles.toggleButtonActive,
          ]}
          onPress={() => setSelectedView("monthly")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              selectedView === "monthly" && styles.toggleButtonTextActive,
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>
      </View>

      {selectedView === "recent"
        ? renderRecentExpenses()
        : renderMonthlyExpenses()}
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
  summarySection: {
    backgroundColor: "#007AFF",
    margin: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
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
  smsContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  smsText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#007AFF",
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  toggleButtonTextActive: {
    color: "#fff",
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  clearButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  expensesList: {
    gap: 12,
  },
  expenseItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#34C759",
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  expenseTimestamp: {
    fontSize: 12,
    color: "#666",
  },
  expenseMerchant: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginTop: 4,
    marginBottom: 8,
  },
  expenseMessage: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  monthlyList: {
    gap: 16,
  },
  monthlyItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
  },
  monthlyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  monthlyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  monthlyTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF9500",
  },
  monthlyCount: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  monthlyExpensesList: {
    gap: 6,
  },
  monthlyExpenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  monthlyExpenseMerchant: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  monthlyExpenseAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  moreExpensesText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginTop: 4,
  },
  testText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 12,
    color: "#007AFF",
    backgroundColor: "#f0f8ff",
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
    fontFamily: "monospace",
  },
});
