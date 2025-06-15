import { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert
} from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { Bell, Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react-native';

import { database, Expense } from '@/lib/database';

export default function HomeScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [totalThisMonth, setTotalThisMonth] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      // Get recent expenses
      const recentExpenses = await database.getExpenses(10);
      setExpenses(recentExpenses);

      // Get uncategorized count
      const uncategorized = await database.getUncategorizedExpenses();
      setUncategorizedCount(uncategorized.length);

      // Calculate this month's total
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const monthlyExpenses = await database.getExpensesByDateRange(startOfMonth, endOfMonth);
      const total = monthlyExpenses
        .filter(expense => expense.is_categorized)
        .reduce((sum, expense) => sum + expense.amount, 0);
      setTotalThisMonth(total);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load expense data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCategorizePress = () => {
    if (uncategorizedCount > 0) {
      router.push('/categorize');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}!</Text>
          <Text style={styles.subtitle}>Track your expenses automatically</Text>
        </View>
        {uncategorizedCount > 0 && (
          <TouchableOpacity style={styles.notificationBadge} onPress={handleCategorizePress}>
            <Bell size={20} color="#FFFFFF" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{uncategorizedCount}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.primaryCard]}>
          <View style={styles.statHeader}>
            <DollarSign size={24} color="#FFFFFF" />
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <Text style={styles.statValue}>{formatCurrency(totalThisMonth)}</Text>
        </View>

        <View style={styles.statRow}>
          <View style={[styles.statCard, styles.secondaryCard]}>
            <TrendingUp size={20} color="#34C759" />
            <Text style={styles.statLabelSmall}>Total Expenses</Text>
            <Text style={styles.statValueSmall}>{expenses.length}</Text>
          </View>
          
          <View style={[styles.statCard, styles.secondaryCard]}>
            <TrendingDown size={20} color="#FF3B30" />
            <Text style={styles.statLabelSmall}>Uncategorized</Text>
            <Text style={styles.statValueSmall}>{uncategorizedCount}</Text>
          </View>
        </View>
      </View>

      {/* Uncategorized Alert */}
      {uncategorizedCount > 0 && (
        <TouchableOpacity style={styles.alertCard} onPress={handleCategorizePress}>
          <View style={styles.alertContent}>
            <Bell size={24} color="#FF9500" />
            <View style={styles.alertText}>
              <Text style={styles.alertTitle}>
                {uncategorizedCount} expense{uncategorizedCount > 1 ? 's' : ''} need{uncategorizedCount === 1 ? 's' : ''} categorization
              </Text>
              <Text style={styles.alertSubtitle}>Tap to categorize now</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Recent Expenses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Plus size={48} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>No expenses yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Your SMS-based expenses will appear here automatically
            </Text>
          </View>
        ) : (
          <View style={styles.expensesList}>
            {expenses.slice(0, 5).map((expense) => (
              <View key={expense.id} style={styles.expenseItem}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseCategory}>
                    {expense.category}
                    {!expense.is_categorized && (
                      <Text style={styles.uncategorizedTag}> • Uncategorized</Text>
                    )}
                  </Text>
                  <Text style={styles.expenseDescription}>
                    {expense.description || 'No description'}
                  </Text>
                  <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                </View>
                <Text style={styles.expenseAmount}>
                  {formatCurrency(expense.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  notificationBadge: {
    position: 'relative',
    padding: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  primaryCard: {
    backgroundColor: '#007AFF',
  },
  secondaryCard: {
    flex: 1,
    marginHorizontal: 6,
  },
  statRow: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    opacity: 0.9,
  },
  statLabelSmall: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 8,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  statValueSmall: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  alertCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  alertSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  seeAllText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  expensesList: {
    gap: 12,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  uncategorizedTag: {
    color: '#FF9500',
    fontWeight: 'normal',
  },
  expenseDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: '#C7C7CC',
    marginTop: 4,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
});