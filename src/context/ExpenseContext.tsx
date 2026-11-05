import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Group, Member, Expense, Settlement, ActivityLog, CurrencyCode, MemberBalance, SimplifiedDebt, CategoryId } from '../types';
import { INITIAL_GROUPS, INITIAL_LOGS } from '../utils/mockData';
import { calculateMemberBalances, calculatePairwiseDebts, calculateSimplifiedDebts } from '../utils/debtSimplifier';
import { CATEGORIES } from '../utils/categories';
import { CURRENCIES, convertCurrency } from '../utils/currency';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

interface ExpenseContextType {
  groups: Group[];
  activityLogs: ActivityLog[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  activeGroup: Group | null;
  selectedCurrency: CurrencyCode;
  setSelectedCurrency: (curr: CurrencyCode) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Group mutations
  createGroup: (name: string, description: string, currency: CurrencyCode, color: string, category: Group['category'], initialMembers: string[]) => string;
  updateGroup: (groupId: string, data: Partial<Group>) => void;
  deleteGroup: (groupId: string) => void;

  // Member mutations
  addMemberToGroup: (groupId: string, name: string, email?: string, color?: string, defaultShare?: number) => void;
  removeMemberFromGroup: (groupId: string, memberId: string) => void;

  // Expense mutations
  createExpense: (groupId: string, expenseData: Omit<Expense, 'id' | 'createdAt' | 'groupId'>) => void;
  updateExpense: (groupId: string, expenseId: string, updates: Partial<Expense>) => void;
  deleteExpense: (groupId: string, expenseId: string) => void;

  // Settlement mutations
  recordSettlement: (groupId: string, settlementData: Omit<Settlement, 'id' | 'createdAt' | 'groupId'>) => void;
  deleteSettlement: (groupId: string, settlementId: string) => void;

  // Utilities & Exports
  resetToSampleData: () => void;
  exportGroupCSV: (groupId: string) => void;
  exportGroupJSON: (groupId: string) => void;
  getGroupBalances: (groupId: string) => {
    memberBalances: MemberBalance[];
    pairwiseDebts: SimplifiedDebt[];
    simplifiedDebts: SimplifiedDebt[];
    totalSpent: number;
    categoryTotals: { categoryId: CategoryId; name: string; color: string; total: number; percentage: number }[];
  };
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const STORAGE_KEY_GROUPS = 'splitcraft_groups_v2';
const STORAGE_KEY_LOGS = 'splitcraft_logs_v2';
const STORAGE_KEY_THEME = 'splitcraft_theme_v1';
const STORAGE_KEY_CURRENCY = 'splitcraft_currency_v1';

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Persistent State with localStorage
  const [groups, setGroups] = useState<Group[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GROUPS);
      if (saved) {
        const parsed: Group[] = JSON.parse(saved);
        // Ensure Rahul, Rohit, Amit, Sourav group is included
        const hasFriendsTrip = parsed.some((g) => g.id === 'group-friends-trip');
        return hasFriendsTrip ? parsed : [INITIAL_GROUPS[0], ...parsed];
      }
      return INITIAL_GROUPS;
    } catch (e) {
      console.error('Failed to load groups from localStorage', e);
      return INITIAL_GROUPS;
    }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    } catch (e) {
      console.error('Failed to load logs from localStorage', e);
      return INITIAL_LOGS;
    }
  });

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENCY) as CurrencyCode;
      return saved && CURRENCIES[saved] ? saved : 'USD';
    } catch {
      return 'USD';
    }
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply dark theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }, [theme]);

  // Sync groups to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
    } catch (e) {
      console.error('Failed to save groups to localStorage', e);
    }
  }, [groups]);

  // Sync logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(activityLogs));
    } catch (e) {
      console.error('Failed to save logs to localStorage', e);
    }
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRENCY, selectedCurrency);
  }, [selectedCurrency]);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Compute activeGroup
  const activeGroup = useMemo(() => {
    if (!activeGroupId) return null;
    return groups.find((g) => g.id === activeGroupId) || null;
  }, [groups, activeGroupId]);

  // Group mutations
  const createGroup = useCallback((
    name: string,
    description: string,
    currency: CurrencyCode,
    color: string,
    category: Group['category'] = 'trip',
    initialMemberNames: string[]
  ): string => {
    const groupId = `group-${Date.now()}`;
    const defaultColors = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];

    const members: Member[] = initialMemberNames
      .map((nameStr) => nameStr.trim())
      .filter(Boolean)
      .map((cleanName, idx) => ({
        id: `m-${Date.now()}-${idx}`,
        name: cleanName,
        color: defaultColors[idx % defaultColors.length],
        defaultShare: 1,
      }));

    // If no members provided, add standard "You"
    if (members.length === 0) {
      members.push({
        id: `m-${Date.now()}-0`,
        name: 'You',
        color: '#3B82F6',
        defaultShare: 1,
      });
    }

    const newGroup: Group = {
      id: groupId,
      name,
      description,
      currency,
      category,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      members,
      expenses: [],
      settlements: [],
    };

    setGroups((prev) => [newGroup, ...prev]);

    const log: ActivityLog = {
      id: `log-${Date.now()}`,
      groupId,
      groupName: name,
      type: 'group_created',
      description: `Created new group "${name}" with ${members.length} member(s)`,
      timestamp: Date.now(),
    };
    setActivityLogs((prev) => [log, ...prev]);

    addToast({
      type: 'success',
      title: 'Group Created',
      message: `"${name}" is ready for expense splitting.`,
    });

    return groupId;
  }, [addToast]);

  const updateGroup = useCallback((groupId: string, data: Partial<Group>) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...data, updatedAt: Date.now() } : g))
    );
    addToast({
      type: 'info',
      title: 'Group Updated',
      message: 'Group settings have been updated.',
    });
  }, [addToast]);

  const deleteGroup = useCallback((groupId: string) => {
    const groupToDelete = groups.find((g) => g.id === groupId);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (activeGroupId === groupId) {
      setActiveGroupId(null);
    }
    addToast({
      type: 'warning',
      title: 'Group Deleted',
      message: groupToDelete ? `"${groupToDelete.name}" was removed.` : 'Group removed.',
    });
  }, [groups, activeGroupId, addToast]);

  // Member mutations
  const addMemberToGroup = useCallback((
    groupId: string,
    name: string,
    email?: string,
    color?: string,
    defaultShare: number = 1
  ) => {
    const palette = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316'];
    const newMember: Member = {
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: name.trim(),
      email: email?.trim(),
      color: color || palette[Math.floor(Math.random() * palette.length)],
      defaultShare,
    };

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          members: [...g.members, newMember],
          updatedAt: Date.now(),
        };
      })
    );

    addToast({
      type: 'success',
      title: 'Member Added',
      message: `${name} has been added to the group.`,
    });
  }, [addToast]);

  const removeMemberFromGroup = useCallback((groupId: string, memberId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        // Check if member has expenses or splits
        const hasExpenses = g.expenses.some(
          (e) => e.payerId === memberId || e.splits.some((s) => s.memberId === memberId)
        );
        if (hasExpenses) {
          return g; // Handled with toast error
        }
        return {
          ...g,
          members: g.members.filter((m) => m.id !== memberId),
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  // Expense mutations
  const createExpense = useCallback((
    groupId: string,
    expenseData: Omit<Expense, 'id' | 'createdAt' | 'groupId'>
  ) => {
    const expenseId = `exp-${Date.now()}`;
    const newExpense: Expense = {
      ...expenseData,
      id: expenseId,
      groupId,
      createdAt: Date.now(),
    };

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          expenses: [newExpense, ...g.expenses],
          updatedAt: Date.now(),
        };
      })
    );

    const targetGroup = groups.find((g) => g.id === groupId);
    const payer = targetGroup?.members.find((m) => m.id === expenseData.payerId);

    const log: ActivityLog = {
      id: `log-${Date.now()}`,
      groupId,
      groupName: targetGroup?.name || 'Group',
      type: 'expense_added',
      description: `${payer?.name || 'Someone'} paid ${expenseData.currency} ${expenseData.amount.toFixed(2)} for "${expenseData.title}"`,
      timestamp: Date.now(),
      amount: expenseData.amount,
      currency: expenseData.currency,
    };
    setActivityLogs((prev) => [log, ...prev]);

    addToast({
      type: 'success',
      title: 'Expense Added',
      message: `"${expenseData.title}" recorded successfully.`,
    });
  }, [groups, addToast]);

  const updateExpense = useCallback((
    groupId: string,
    expenseId: string,
    updates: Partial<Expense>
  ) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          expenses: g.expenses.map((e) => (e.id === expenseId ? { ...e, ...updates } : e)),
          updatedAt: Date.now(),
        };
      })
    );

    addToast({
      type: 'info',
      title: 'Expense Updated',
      message: 'Changes saved successfully.',
    });
  }, [addToast]);

  const deleteExpense = useCallback((groupId: string, expenseId: string) => {
    let deletedTitle = '';
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const target = g.expenses.find((e) => e.id === expenseId);
        if (target) deletedTitle = target.title;
        return {
          ...g,
          expenses: g.expenses.filter((e) => e.id !== expenseId),
          updatedAt: Date.now(),
        };
      })
    );

    addToast({
      type: 'warning',
      title: 'Expense Removed',
      message: deletedTitle ? `"${deletedTitle}" was deleted.` : 'Expense deleted.',
    });
  }, [addToast]);

  // Settlements
  const recordSettlement = useCallback((
    groupId: string,
    settlementData: Omit<Settlement, 'id' | 'createdAt' | 'groupId'>
  ) => {
    const settlementId = `stl-${Date.now()}`;
    const newSettlement: Settlement = {
      ...settlementData,
      id: settlementId,
      groupId,
      createdAt: Date.now(),
    };

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          settlements: [newSettlement, ...g.settlements],
          updatedAt: Date.now(),
        };
      })
    );

    const targetGroup = groups.find((g) => g.id === groupId);
    const debtor = targetGroup?.members.find((m) => m.id === settlementData.fromMemberId);
    const creditor = targetGroup?.members.find((m) => m.id === settlementData.toMemberId);

    const log: ActivityLog = {
      id: `log-${Date.now()}`,
      groupId,
      groupName: targetGroup?.name || 'Group',
      type: 'settlement_recorded',
      description: `${debtor?.name || 'Member'} paid ${creditor?.name || 'Member'} ${settlementData.currency} ${settlementData.amount.toFixed(2)} via ${settlementData.paymentMethod.toUpperCase()}`,
      timestamp: Date.now(),
      amount: settlementData.amount,
      currency: settlementData.currency,
    };
    setActivityLogs((prev) => [log, ...prev]);

    addToast({
      type: 'success',
      title: 'Settlement Recorded',
      message: `Payment of ${settlementData.currency} ${settlementData.amount.toFixed(2)} recorded.`,
    });
  }, [groups, addToast]);

  const deleteSettlement = useCallback((groupId: string, settlementId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          settlements: g.settlements.filter((s) => s.id !== settlementId),
          updatedAt: Date.now(),
        };
      })
    );

    addToast({
      type: 'warning',
      title: 'Settlement Removed',
      message: 'Settlement transaction was undone.',
    });
  }, [addToast]);

  // Balances calculation function for any group
  const getGroupBalances = useCallback((groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) {
      return {
        memberBalances: [],
        pairwiseDebts: [],
        simplifiedDebts: [],
        totalSpent: 0,
        categoryTotals: [],
      };
    }

    const memberBalances = calculateMemberBalances(group.members, group.expenses, group.settlements);
    const pairwiseDebts = calculatePairwiseDebts(group.expenses, group.settlements);
    const simplifiedDebts = calculateSimplifiedDebts(memberBalances);

    // Total spent using Array.reduce()
    const totalSpent = group.expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Category totals using Array.reduce()
    const catMap = group.expenses.reduce<Record<string, number>>((acc, exp) => {
      acc[exp.categoryId] = (acc[exp.categoryId] || 0) + exp.amount;
      return acc;
    }, {});

    const categoryTotals = Object.entries(catMap)
      .map(([catId, total]) => {
        const cat = CATEGORIES[catId as CategoryId] || CATEGORIES.general;
        const percentage = totalSpent > 0 ? (total / totalSpent) * 100 : 0;
        return {
          categoryId: catId as CategoryId,
          name: cat.name,
          color: cat.color,
          total: Math.round(total * 100) / 100,
          percentage: Math.round(percentage * 10) / 10,
        };
      })
      .sort((a, b) => b.total - a.total);

    return {
      memberBalances,
      pairwiseDebts,
      simplifiedDebts,
      totalSpent,
      categoryTotals,
    };
  }, [groups]);

  // Reset to default sample presets
  const resetToSampleData = useCallback(() => {
    setGroups(INITIAL_GROUPS);
    setActivityLogs(INITIAL_LOGS);
    addToast({
      type: 'info',
      title: 'Sample Data Restored',
      message: 'Sample groups and expense logs have been loaded.',
    });
  }, [addToast]);

  // Export to CSV
  const exportGroupCSV = useCallback((groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const headers = ['Expense ID', 'Date', 'Title', 'Category', 'Payer', 'Total Amount', 'Currency', 'Split Type', 'Notes'];
    const rows = group.expenses.map((exp) => {
      const payer = group.members.find((m) => m.id === exp.payerId)?.name || exp.payerId;
      return [
        `"${exp.id}"`,
        `"${exp.date}"`,
        `"${exp.title.replace(/"/g, '""')}"`,
        `"${exp.categoryId}"`,
        `"${payer}"`,
        exp.amount.toFixed(2),
        `"${exp.currency}"`,
        `"${exp.splitType}"`,
        `"${(exp.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${group.name.toLowerCase().replace(/\s+/g, '_')}_expenses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'CSV Exported',
      message: `Downloaded CSV report for ${group.name}.`,
    });
  }, [groups, addToast]);

  // Export to JSON
  const exportGroupJSON = useCallback((groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(group, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${group.name.toLowerCase().replace(/\s+/g, '_')}_data.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addToast({
      type: 'success',
      title: 'JSON Exported',
      message: `Saved full group JSON backup.`,
    });
  }, [groups, addToast]);

  const value = {
    groups,
    activityLogs,
    activeGroupId,
    setActiveGroupId,
    activeGroup,
    selectedCurrency,
    setSelectedCurrency,
    theme,
    setTheme,
    toasts,
    addToast,
    removeToast,
    createGroup,
    updateGroup,
    deleteGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    createExpense,
    updateExpense,
    deleteExpense,
    recordSettlement,
    deleteSettlement,
    resetToSampleData,
    exportGroupCSV,
    exportGroupJSON,
    getGroupBalances,
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

export const useExpenseSplitter = (): ExpenseContextType => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenseSplitter must be used within an ExpenseProvider');
  }
  return context;
};
