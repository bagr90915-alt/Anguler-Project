import React, { useMemo } from 'react';
import { Group } from '../../types';
import { useExpenseSplitter } from '../../context/ExpenseContext';
import { formatCurrency } from '../../utils/currency';
import { Avatar } from '../ui/Avatar';
import { StatCard } from '../ui/StatCard';
import { Button } from '../ui/Button';
import { PieChart, TrendingUp, DollarSign, Download, Copy, Check } from 'lucide-react';

export interface AnalyticsViewProps {
  group: Group;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ group }) => {
  const { getGroupBalances, exportGroupCSV, exportGroupJSON, addToast } = useExpenseSplitter();
  const { totalSpent, categoryTotals, memberBalances } = getGroupBalances(group.id);

  const [copied, setCopied] = React.useState(false);

  // Spender stats calculated via Array.sort() and Array.reduce()
  const highestSpender = useMemo(() => {
    if (memberBalances.length === 0) return null;
    return [...memberBalances].sort((a, b) => b.totalPaid - a.totalPaid)[0];
  }, [memberBalances]);

  const topExpense = useMemo(() => {
    if (group.expenses.length === 0) return null;
    return [...group.expenses].sort((a, b) => b.amount - a.amount)[0];
  }, [group.expenses]);

  const averagePerExpense = useMemo(() => {
    if (group.expenses.length === 0) return 0;
    return totalSpent / group.expenses.length;
  }, [totalSpent, group.expenses.length]);

  const averagePerMember = useMemo(() => {
    if (group.members.length === 0) return 0;
    return totalSpent / group.members.length;
  }, [totalSpent, group.members.length]);

  const handleCopySummary = () => {
    const lines = [
      `📊 SplitCraft Report: ${group.name}`,
      `Total Spent: ${group.currency} ${totalSpent.toFixed(2)} across ${group.expenses.length} expenses`,
      `Average per member: ${group.currency} ${averagePerMember.toFixed(2)}`,
      '',
      '👥 Member Balances:',
      ...memberBalances.map((b) => {
        const sign = b.netBalance >= 0 ? '+' : '';
        return `• ${b.member.name}: Paid ${group.currency} ${b.totalPaid.toFixed(2)} | Net: ${sign}${group.currency} ${b.netBalance.toFixed(2)}`;
      }),
      '',
      '🏷️ Category Breakdown:',
      ...categoryTotals.map((c) => `• ${c.name}: ${group.currency} ${c.total.toFixed(2)} (${c.percentage}%)`),
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    addToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: 'Group expense summary ready to share in chat.',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Key Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Group Spend"
          value={formatCurrency(totalSpent, group.currency)}
          subValue={`${group.expenses.length} bills`}
          icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Average Per Member"
          value={formatCurrency(averagePerMember, group.currency)}
          subValue={`${group.members.length} members`}
          icon={<TrendingUp className="w-4 h-4 text-sky-600" />}
        />
        <StatCard
          label="Top Contributor"
          value={highestSpender?.member.name || 'None'}
          subValue={highestSpender ? formatCurrency(highestSpender.totalPaid, group.currency) : '$0'}
          icon={<Avatar name={highestSpender?.member.name || 'Top'} color={highestSpender?.member.color} size="xs" />}
        />
        <StatCard
          label="Largest Single Bill"
          value={topExpense ? formatCurrency(topExpense.amount, group.currency) : '$0'}
          subValue={topExpense?.title || 'None'}
          icon={<PieChart className="w-4 h-4 text-purple-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Category Spending Breakdown */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              Category Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {categoryTotals.length} active categories
            </span>
          </div>

          {categoryTotals.length > 0 ? (
            <div className="space-y-3.5">
              {categoryTotals.map((cat) => (
                <div key={cat.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(cat.total, group.currency)}
                      </span>
                      <span className="text-slate-400 text-[11px] w-10 text-right">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Progress Bar width demonstrating multiple styling techniques */}
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(3, cat.percentage))}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No expenses recorded yet.</p>
          )}
        </div>

        {/* 3. Member Contribution Distribution */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Contribution vs Fair Share
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Fair share: ~{formatCurrency(averagePerMember, group.currency)}
            </span>
          </div>

          <div className="space-y-3">
            {memberBalances.map((b) => {
              const paidPercent = totalSpent > 0 ? (b.totalPaid / totalSpent) * 100 : 0;

              return (
                <div
                  key={b.memberId}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar name={b.member.name} color={b.member.color} size="sm" />
                      <div>
                        <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {b.member.name}
                        </h5>
                        <span className="text-[10px] text-slate-400">
                          Contributed {paidPercent.toFixed(1)}% of total
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(b.totalPaid, group.currency)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        owed: {formatCurrency(b.totalOwed, group.currency)}
                      </div>
                    </div>
                  </div>

                  {/* Relative bar compared to fair share */}
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(2, paidPercent))}%`,
                        backgroundColor: b.member.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Export & Sharing Strip */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div>
          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Export & Share Group Ledger
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Download your transactions spreadsheet or copy a text summary for WhatsApp, Slack, or email.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySummary}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copied!' : 'Copy Summary'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportGroupCSV(group.id)}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Download CSV
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportGroupJSON(group.id)}
          >
            Backup JSON
          </Button>
        </div>
      </div>
    </div>
  );
};
