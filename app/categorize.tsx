import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { X, Check, Plus, Tag } from 'lucide-react-native';

import { database, Expense, Category } from '@/lib/database';

export default function CategorizeScreen() {
  const [uncategorizedExpenses, setUncategorizedExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentExpenseIndex, setCurrentExpenseIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [customDescription, setCustomDescription] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expenses, categoriesData] = await Promise.all([
        database.getUncategorizedExpenses(),
        database.getCategories(),
      ]);
      
      setUncategorizedExpenses(expenses);
      setCategories(categoriesData);
      
      if (expenses.length > 0) {
        setCustomDescription(expenses[0].description || '');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const currentExpense = uncategorizedExpenses[currentExpenseIndex];

  const handleCategorize = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    try {
      await database.updateExpense(currentExpense.id!, {
        category: selectedCategory,
        description: customDescription.trim(),
        is_categorized: true,
      });

      // Move to next expense or close if done
      if (currentExpenseIndex < uncategorizedExpenses.length - 1) {
        const nextIndex = currentExpenseIndex + 1;
        setCurrentExpenseIndex(nextIndex);
        setSelectedCategory('');
        setCustomDescription(uncategorizedExpenses[nextIndex].description || '');
      } else {
        // All expenses categorized
        Alert.alert(
          'All Done!',
          'All expenses have been categorized.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error categorizing expense:', error);
      Alert.alert('Error', 'Failed to categorize expense');
    }
  };

  const handleSkip = () => {
    if (currentExpenseIndex < uncategorizedExpenses.length - 1) {
      const nextIndex = currentExpenseIndex + 1;
      setCurrentExpenseIndex(nextIndex);
      setSelectedCategory('');
      setCustomDescription(uncategorizedExpenses[nextIndex].description || '');
    } else {
      router.back();
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      await database.addCategory({
        name: newCategoryName.trim(),
        color: randomColor,
        icon: 'tag',
      });

      setNewCategoryName('');
      setShowAddCategory(false);
      await loadData();
      setSelectedCategory(newCategoryName.trim());
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (uncategorizedExpenses.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Check size={64} color="#34C759" />
        <Text style={styles.emptyTitle}>All Caught Up!</Text>
        <Text style={styles.emptySubtitle}>
          No uncategorized expenses found
        </Text>
        <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categorize Expense</Text>
        <Text style={styles.progressText}>
          {currentExpenseIndex + 1} of {uncategorizedExpenses.length}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Expense Card */}
        <View style={styles.expenseCard}>
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>{formatCurrency(currentExpense.amount)}</Text>
            <Text style={styles.date}>{formatDate(currentExpense.date)}</Text>
          </View>
          
          {currentExpense.sms_content && (
            <View style={styles.smsContainer}>
              <Text style={styles.smsLabel}>Original SMS:</Text>
              <Text style={styles.smsContent}>{currentExpense.sms_content}</Text>
            </View>
          )}
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={customDescription}
            onChangeText={setCustomDescription}
            placeholder="Add a description for this expense"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Category</Text>
            <TouchableOpacity
              style={styles.addCategoryButton}
              onPress={() => setShowAddCategory(true)}
            >
              <Plus size={16} color="#007AFF" />
              <Text style={styles.addCategoryText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.name && styles.categoryItemSelected,
                  { borderColor: category.color },
                ]}
                onPress={() => setSelectedCategory(category.name)}
              >
                <View
                  style={[styles.categoryColor, { backgroundColor: category.color }]}
                />
                <Text
                  style={[
                    styles.categoryName,
                    selectedCategory === category.name && styles.categoryNameSelected,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categorizeButton, !selectedCategory && styles.categorizeButtonDisabled]}
          onPress={handleCategorize}
          disabled={!selectedCategory}
        >
          <Text style={styles.categorizeButtonText}>Categorize</Text>
        </TouchableOpacity>
      </View>

      {/* Add Category Modal */}
      <Modal
        visible={showAddCategory}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddCategory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Category</Text>
              <TouchableOpacity onPress={() => setShowAddCategory(false)}>
                <X size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Category name"
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddCategory(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={handleAddCategory}
              >
                <Text style={styles.modalAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  expenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000000',
  },
  date: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  smsContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
  },
  smsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  smsContent: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
  },
  addCategoryText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: 44,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: '45%',
  },
  categoryItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  categoryNameSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  categorizeButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  categorizeButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  categorizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  doneButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  modalAddButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalAddText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});