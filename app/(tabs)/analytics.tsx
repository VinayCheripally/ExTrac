import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart, TrendingUp, Calendar } from 'lucide-react-native';

import { database } from '@/lib/database';

const { width } = Dimensions.get('window');

interface CategoryTotal {
  category: string;
  total: number;
  color: string;
}

interface MonthlyData {
  month: string;
  total: number;
}

export default function AnalyticsScreen() {
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      // Get category totals
      const categoryData = await database.getTotalExpensesByCategory();
      setCategoryTotals(categoryData);

      // Calculate total expenses
      const total = categoryData.reduce((sum, item) => sum + item.total, 0);
      setTotalExpenses(total);

      // Get monthly data for the last 6 months
      const monthlyTotals: MonthlyData[] = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
        
        const expenses = await database.getExpensesByDateRange(startOfMonth, endOfMonth);
        const monthTotal = expenses
          .filter(expense => expense.is_categorized)
          .reduce((sum, expense) => sum + expense.amount, 0);
        
        monthlyTotals.push({
          month: date.toLocaleDateString('en-IN', { month: 'short' }),
          total: monthTotal,
        });
      }
      
      setMonthlyData(monthlyTotals);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPercentage = (amount: number) => {
    if (totalExpenses === 0) return 0;
    return ((amount / totalExpenses) * 100).toFixed(1);
  };

  const maxMonthlyAmount = Math.max(...monthlyData.map(item => item.total));

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
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
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Categorized</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalExpenses)}</Text>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <PieChart size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>Spending by Category</Text>
        </View>

        {categoryTotals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No categorized expenses yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start categorizing your expenses to see analytics
            </Text>
          </View>
        ) : (
          <View style={styles.categoryList}>
            {categoryTotals.map((item, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View
                    style={[
                      styles.categoryColor,
                      { backgroundColor: item.color || '#8E8E93' },
                    ]}
                  />
                  <Text style={styles.categoryName}>{item.category}</Text>
                </View>
                <View style={styles.categoryStats}>
                  <Text style={styles.categoryAmount}>
                    {formatCurrency(item.total)}
                  </Text>
                  <Text style={styles.categoryPercentage}>
                    {getPercentage(item.total)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Monthly Trend */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TrendingUp size={24} color="#34C759" />
          <Text style={styles.sectionTitle}>Monthly Trend</Text>
        </View>

        {monthlyData.every(item => item.total === 0) ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No monthly data available</Text>
            <Text style={styles.emptyStateSubtext}>
              Your monthly spending trends will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.chartContainer}>
            {monthlyData.map((item, index) => {
              const barHeight = maxMonthlyAmount > 0 
                ? (item.total / maxMonthlyAmount) * 120 
                : 0;
              
              return (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(barHeight, 4),
                          backgroundColor: item.total > 0 ? '#007AFF' : '#E5E5EA',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.monthLabel}>{item.month}</Text>
                  <Text style={styles.monthAmount}>
                    {item.total > 0 ? `₹${(item.total / 1000).toFixed(0)}k` : '₹0'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Calendar size={24} color="#FF9500" />
          <Text style={styles.sectionTitle}>Quick Stats</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {categoryTotals.length}
            </Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {totalExpenses > 0 ? formatCurrency(totalExpenses / categoryTotals.length) : '₹0'}
            </Text>
            <Text style={styles.statLabel}>Avg per Category</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {categoryTotals.length > 0 ? categoryTotals[0].category : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Top Category</Text>
          </View>
        </View>
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
    marginBottom: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  categoryStats: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingHorizontal: 8,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  monthLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  monthAmount: {
    fontSize: 10,
    color: '#C7C7CC',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
});