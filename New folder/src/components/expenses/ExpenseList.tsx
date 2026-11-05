import React, { useState, useMemo } from 'react';
import { Group, CategoryId } from '../../types';
import { ExpenseCard } from './ExpenseCard';
import { CATEGORY_LIST } from '../../utils/categories';
import { formatCurrency } from '../../utils/currency';
import { Search, Plus, Filter, ArrowUpDown, Receipt } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ExpenseListProps {
  group: Group;
  onOpenAddExpense: () => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ group, onOpenAddExpense }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Filter and Sort using JavaScript Array Operations: .filter() and .sort()
  const filteredAndSortedExpenses = useMemo(() => {
    return group.expenses
      .filter((exp) => {
        // 1. Text Search Filter
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          exp.title.toLowerCase().includes(query) ||
          (exp.notes && exp.notes.toLowerCase().includes(query));

        // 2. Category Filter
        const matchesCategory = selectedCategory === 'all' || exp.categoryId === selectedCategory;

        // 3. Member Filter (either payer or debtor)
        const matchesMember =
          selectedMemberId === 'all' ||
          exp.payerId === selectedMemberId ||
          exp.splits.some((s) => s.memberId === selectedMemberId);

        return matchesQuery && matchesCategory && matchesMember;
      })
      .sort((a, b) => {
        if (sortOption === 'newest') return b.createdAt - a.createdAt;
        if (sortOption === 'oldest') return a.createdAt - b.createdAt;
        if (sortOption === 'highest') return b.amount - a.amount;
        if (sortOption === 'lowest') return a.amount - b.amount;
        return 0;
      });
  }, [group.expenses, searchQuery, selectedCategory, selectedMemberId, sortOption]);

  // Aggregate stats using Array.reduce()
  const totalFilteredAmount = useMemo(() => {
    return filteredAndSortedExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredAndSortedExpenses]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expenses by title or note..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Member Filter */}
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="text-xs py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 shadow-xs"
          >
            <option value="all">All Members</option>
            {group.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Sort Selector */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="text-xs py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 shadow-xs"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>

          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAddExpense}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Category Pills (Functional filter buttons as permitted by §1.A) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          All Categories ({group.expenses.length})
        </button>
        {CATEGORY_LIST.map((cat) => {
          const count = group.expenses.filter((e) => e.categoryId === cat.id).length;
          if (count === 0 && selectedCategory !== cat.id) return null;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>{cat.name}</span>
              <span className="font-mono text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Filter Summary Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing {filteredAndSortedExpenses.length} of {group.expenses.length} transaction
          {group.expenses.length !== 1 ? 's' : ''}
        </span>
        <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
          Subtotal: {formatCurrency(totalFilteredAmount, group.currency)}
        </span>
      </div>

      {/* Expense Card Ledger (Dynamic Array Rendering via .map()) */}
      {filteredAndSortedExpenses.length > 0 ? (
        <div className="space-y-2.5">
          {filteredAndSortedExpenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} group={group} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No expenses found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all' || selectedMemberId !== 'all'
                ? 'Try adjusting your search filters or clearing the selected category.'
                : 'Start tracking shared bills, meals, and bookings by logging your first expense.'}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAddExpense}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Log First Expense
          </Button>
        </div>
      )}
    </div>
  );
};
