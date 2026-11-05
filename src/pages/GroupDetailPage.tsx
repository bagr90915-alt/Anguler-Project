import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useExpenseSplitter } from '../context/ExpenseContext';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Button } from '../components/ui/Button';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { BalancesView } from '../components/balances/BalancesView';
import { AnalyticsView } from '../components/analytics/AnalyticsView';
import { MembersView } from '../components/members/MembersView';
import { SettlementsView } from '../components/settlements/SettlementsView';
import { AddExpenseModal } from '../components/common/AddExpenseModal';
import { AddMemberModal } from '../components/common/AddMemberModal';
import { formatCurrency } from '../utils/currency';
import {
  Receipt,
  Scale,
  PieChart,
  Users,
  CheckCircle2,
  Plus,
  ArrowLeft,
  Trash2,
  Download,
  Share2,
} from 'lucide-react';

export const GroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { groups, setActiveGroupId, deleteGroup, exportGroupCSV } = useExpenseSplitter();

  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'analytics' | 'members' | 'settlements'>('expenses');
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const group = groups.find((g) => g.id === groupId);

  useEffect(() => {
    if (groupId) {
      setActiveGroupId(groupId);
    }
    return () => {
      setActiveGroupId(null);
    };
  }, [groupId, setActiveGroupId]);

  if (!group) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Group Not Found</h3>
        <p className="text-xs text-slate-500">The expense group you are looking for does not exist or was deleted.</p>
        <Button variant="primary" size="sm" onClick={() => navigate('/')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const handleDeleteGroup = () => {
    if (window.confirm(`Are you sure you want to delete "${group.name}"? This action cannot be undone.`)) {
      deleteGroup(group.id);
      navigate('/');
    }
  };

  const tabs = [
    { value: 'expenses' as const, label: 'Expenses', icon: <Receipt className="w-3.5 h-3.5" />, count: group.expenses.length },
    { value: 'balances' as const, label: 'Balances & Settle', icon: <Scale className="w-3.5 h-3.5" /> },
    { value: 'analytics' as const, label: 'Breakdown & Charts', icon: <PieChart className="w-3.5 h-3.5" /> },
    { value: 'members' as const, label: 'Members', icon: <Users className="w-3.5 h-3.5" />, count: group.members.length },
    { value: 'settlements' as const, label: 'Settlements', icon: <CheckCircle2 className="w-3.5 h-3.5" />, count: group.settlements.length },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Contextual Header & Breadcrumb */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link
            to="/"
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>All Groups</span>
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 dark:text-slate-100 font-semibold truncate">{group.name}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: group.color }}
              />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {group.name}
              </h1>
            </div>
            {group.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                {group.description}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportGroupCSV(group.id)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              title="Download CSV statement"
            >
              CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddMemberOpen(true)}
              leftIcon={<Users className="w-3.5 h-3.5" />}
            >
              + Member
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setAddExpenseOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Expense
            </Button>

            <button
              onClick={handleDeleteGroup}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              title="Delete group"
              aria-label="Delete group"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Workspace Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
        <SegmentedControl
          options={tabs}
          value={activeTab}
          onChange={(tab) => setActiveTab(tab)}
          className="w-full sm:w-auto overflow-x-auto scrollbar-none"
        />
      </div>

      {/* 3. Tab Content Panes */}
      <div className="transition-all">
        {activeTab === 'expenses' && (
          <ExpenseList group={group} onOpenAddExpense={() => setAddExpenseOpen(true)} />
        )}
        {activeTab === 'balances' && <BalancesView group={group} />}
        {activeTab === 'analytics' && <AnalyticsView group={group} />}
        {activeTab === 'members' && <MembersView group={group} />}
        {activeTab === 'settlements' && <SettlementsView group={group} />}
      </div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        group={group}
      />
      <AddMemberModal
        isOpen={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        groupId={group.id}
      />
    </div>
  );
};
