import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenseSplitter } from '../context/ExpenseContext';
import { formatCurrency } from '../utils/currency';
import { Avatar } from '../components/ui/Avatar';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { AddGroupModal } from '../components/common/AddGroupModal';
import {
  Plus,
  Layers,
  DollarSign,
  Users,
  Activity,
  ArrowRight,
  RotateCcw,
  Compass,
  Home,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { groups, activityLogs, selectedCurrency, resetToSampleData } = useExpenseSplitter();

  const [addGroupOpen, setAddGroupOpen] = useState(false);

  // Global calculations across all groups using Array.reduce()
  const globalTotalSpent = useMemo(() => {
    return groups.reduce((total, group) => {
      const groupSpend = group.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      return total + groupSpend;
    }, 0);
  }, [groups]);

  const totalMembersCount = useMemo(() => {
    const uniqueEmailsOrNames = new Set<string>();
    groups.forEach((g) => {
      g.members.forEach((m) => uniqueEmailsOrNames.add(m.email || m.name));
    });
    return uniqueEmailsOrNames.size;
  }, [groups]);

  const totalExpensesCount = useMemo(() => {
    return groups.reduce((acc, g) => acc + g.expenses.length, 0);
  }, [groups]);

  const categoryIcons: Record<string, React.ReactNode> = {
    trip: <Compass className="w-4 h-4 text-sky-500" />,
    home: <Home className="w-4 h-4 text-purple-500" />,
    event: <Calendar className="w-4 h-4 text-amber-500" />,
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Dashboard Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Expense Groups & Ledgers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track shared bills, calculate equal or itemized splits, and simplify debt settlement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToSampleData}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            title="Reload realistic sample trip & roommate presets"
          >
            Reset Presets
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setAddGroupOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Group
          </Button>
        </div>
      </div>

      {/* 2. Global Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Active Groups"
          value={groups.length}
          subValue="Shared ledgers"
          icon={<Layers className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Total Tracked Spend"
          value={formatCurrency(globalTotalSpent, selectedCurrency)}
          subValue={`across ${groups.length} groups`}
          icon={<DollarSign className="w-4 h-4 text-sky-600" />}
        />
        <StatCard
          label="Connected Members"
          value={totalMembersCount}
          subValue="Across all groups"
          icon={<Users className="w-4 h-4 text-purple-600" />}
        />
        <StatCard
          label="Total Transactions"
          value={totalExpensesCount}
          subValue="Logged expenses"
          icon={<Activity className="w-4 h-4 text-amber-600" />}
        />
      </div>

      {/* Featured Scenario Spotlight: Rahul, Rohit, Amit, Sourav */}
      {(() => {
        const friendsGroup = groups.find((g) => g.id === 'group-friends-trip');
        if (!friendsGroup) return null;

        const totalSpent = friendsGroup.expenses.reduce((sum, e) => sum + e.amount, 0);
        const perPerson = totalSpent / (friendsGroup.members.length || 1);

        return (
          <div className="p-5 sm:p-6 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl border border-emerald-800/60 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-base">
                  👥
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Friends Shared Expenses: Rahul, Rohit, Amit & Sourav
                    </h2>
                    <span className="text-[11px] font-mono bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/50">
                      Live Example
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Real-world trip expenses calculated with automatic min-cash-flow debt simplification.
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/group/group-friends-trip')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View Full Ledger & Settlements
              </Button>
            </div>

            {/* Individual Spending & Debt Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {friendsGroup.members.map((member) => {
                const totalPaid = friendsGroup.expenses
                  .filter((e) => e.payerId === member.id)
                  .reduce((sum, e) => sum + e.amount, 0);

                const totalShare = friendsGroup.expenses.reduce((sum, e) => {
                  const s = e.splits.find((sp) => sp.memberId === member.id);
                  return sum + (s ? s.amount : 0);
                }, 0);

                // Check settlements
                const paidInSettlements = friendsGroup.settlements
                  .filter((s) => s.fromMemberId === member.id)
                  .reduce((sum, s) => sum + s.amount, 0);
                const receivedInSettlements = friendsGroup.settlements
                  .filter((s) => s.toMemberId === member.id)
                  .reduce((sum, s) => sum + s.amount, 0);

                const net = (totalPaid + paidInSettlements) - (totalShare + receivedInSettlements);
                const isOwed = net > 0.01;
                const owes = net < -0.01;

                return (
                  <div
                    key={member.id}
                    className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={member.name} color={member.color} size="sm" />
                      <div>
                        <h4 className="text-xs font-bold text-white">{member.name}</h4>
                        <span className="text-[10px] text-slate-400">Total Spent</span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-700/60 text-xs">
                      <div className="flex justify-between items-baseline font-mono">
                        <span className="text-slate-400 text-[11px]">Paid:</span>
                        <span className="font-semibold text-white">
                          {formatCurrency(totalPaid, friendsGroup.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline font-mono">
                        <span className="text-slate-400 text-[11px]">Status:</span>
                        <span
                          className={`font-bold tabular-nums ${
                            isOwed
                              ? 'text-emerald-400'
                              : owes
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {isOwed
                            ? `Gets back ${formatCurrency(net, friendsGroup.currency)}`
                            : owes
                            ? `Owes ${formatCurrency(Math.abs(net), friendsGroup.currency)}`
                            : 'Settled'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Summary Strip */}
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-4 flex-wrap font-mono">
                <span>
                  Total Group Spend:{' '}
                  <strong className="text-white">
                    {formatCurrency(totalSpent, friendsGroup.currency)}
                  </strong>
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>
                  Fair Share:{' '}
                  <strong className="text-white">
                    ~{formatCurrency(perPerson, friendsGroup.currency)} / person
                  </strong>
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-emerald-400">
                  {friendsGroup.expenses.length} expenses logged across trip, dining & entertainment
                </span>
              </div>

              <button
                onClick={() => navigate('/group/group-friends-trip')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Calculate who owes whom in detail</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* 3. Groups Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            All Expense Groups ({groups.length})
          </h2>
          <span className="text-xs text-slate-400">Click any card to open group ledger</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const groupTotal = group.expenses.reduce((sum, exp) => sum + exp.amount, 0);

            return (
              <div
                key={group.id}
                onClick={() => navigate(`/group/${group.id}`)}
                className="group p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/80 dark:hover:border-emerald-500/80 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {group.name}
                      </h3>
                    </div>
                    {group.category && categoryIcons[group.category]}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {group.description || 'Shared expense tracking ledger.'}
                  </p>
                </div>

                {/* Financial Summary & Members row */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400">Total Expenses</span>
                    <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                      {formatCurrency(groupTotal, group.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Member Avatar Stack */}
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {group.members.slice(0, 4).map((member) => (
                        <Avatar
                          key={member.id}
                          name={member.name}
                          color={member.color}
                          size="sm"
                          className="ring-2 ring-white dark:ring-slate-900"
                        />
                      ))}
                      {group.members.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                          +{group.members.length - 4}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                      <span>Open Ledger</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Create Group Card */}
          <div
            onClick={() => setAddGroupOpen(true)}
            className="p-6 bg-slate-50/70 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 min-h-[180px]"
          >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-600 shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Create Another Group
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                New trip, apartment, or project
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Activity Stream */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Recent Activity Feed
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {activityLogs.length} events logged
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {activityLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <div className="truncate">
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {log.description}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    in <strong className="font-medium text-slate-600 dark:text-slate-300">{log.groupName}</strong>
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                {new Date(log.timestamp).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Group Modal */}
      <AddGroupModal
        isOpen={addGroupOpen}
        onClose={() => setAddGroupOpen(false)}
        onCreated={(id) => navigate(`/group/${id}`)}
      />
    </div>
  );
};
