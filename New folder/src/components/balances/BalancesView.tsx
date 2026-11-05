import React, { useState } from 'react';
import { Group, MemberBalance, SimplifiedDebt } from '../../types';
import { useExpenseSplitter } from '../../context/ExpenseContext';
import { formatCurrency } from '../../utils/currency';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { QuickSettleModal } from '../common/QuickSettleModal';
import { ArrowRight, CheckCircle2, Sparkles, Scale, Info, Check } from 'lucide-react';

export interface BalancesViewProps {
  group: Group;
}

export const BalancesView: React.FC<BalancesViewProps> = ({ group }) => {
  const { getGroupBalances } = useExpenseSplitter();
  const { memberBalances, pairwiseDebts, simplifiedDebts } = getGroupBalances(group.id);

  const [useSimplification, setUseSimplification] = useState(true);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedDebtorId, setSelectedDebtorId] = useState<string | undefined>();
  const [selectedCreditorId, setSelectedCreditorId] = useState<string | undefined>();
  const [selectedAmount, setSelectedAmount] = useState<number | undefined>();

  const activeDebts = useSimplification ? simplifiedDebts : pairwiseDebts;
  const isAllSettled = activeDebts.length === 0;

  const handleOpenSettle = (debt?: SimplifiedDebt) => {
    if (debt) {
      setSelectedDebtorId(debt.fromMemberId);
      setSelectedCreditorId(debt.toMemberId);
      setSelectedAmount(debt.amount);
    } else {
      setSelectedDebtorId(undefined);
      setSelectedCreditorId(undefined);
      setSelectedAmount(undefined);
    }
    setSettleModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Net Balances Overview Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600" />
            Member Balances
          </h3>
          <span className="text-xs text-slate-500">
            Net position = Total Paid minus Total Share
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {memberBalances.map((b) => {
            const isOwed = b.netBalance > 0.01;
            const owes = b.netBalance < -0.01;

            return (
              <div
                key={b.memberId}
                className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={b.member.name} color={b.member.color} size="md" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {b.member.name}
                    </h4>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {b.member.email || 'Group Member'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Paid in Total:</span>
                    <span className="font-mono">{formatCurrency(b.totalPaid, group.currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Total Share:</span>
                    <span className="font-mono">{formatCurrency(b.totalOwed, group.currency)}</span>
                  </div>
                  <div className="pt-1.5 flex justify-between items-baseline font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">Net Balance:</span>
                    <span
                      className={`font-mono text-sm tabular-nums ${
                        isOwed
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : owes
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {isOwed ? '+' : ''}
                      {formatCurrency(b.netBalance, group.currency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Debt Settlement Strategy & Transfers */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Suggested Settlement Plan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {useSimplification
                ? `Min-Cash-Flow algorithm simplified this to ${simplifiedDebts.length} transaction(s)`
                : `Showing all ${pairwiseDebts.length} individual direct bilateral obligations`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Algorithm Simplification Toggle */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
              <button
                onClick={() => setUseSimplification(true)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  useSimplification
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Simplified ({simplifiedDebts.length})
              </button>
              <button
                onClick={() => setUseSimplification(false)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  !useSimplification
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All Pairwise ({pairwiseDebts.length})
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenSettle()}
              disabled={isAllSettled}
            >
              Record Payment
            </Button>
          </div>
        </div>

        {/* Algorithm Savings Callout */}
        {pairwiseDebts.length > simplifiedDebts.length && useSimplification && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Debt Simplification Active:</strong> Instead of having members pass money back and forth across {pairwiseDebts.length} separate transfers, the greedy algorithm resolved the matrix into just <strong>{simplifiedDebts.length} optimal transfer{simplifiedDebts.length !== 1 ? 's' : ''}</strong>.
            </p>
          </div>
        )}

        {/* Transfers List */}
        {!isAllSettled ? (
          <div className="space-y-2.5">
            {activeDebts.map((debt, idx) => {
              const debtor = group.members.find((m) => m.id === debt.fromMemberId);
              const creditor = group.members.find((m) => m.id === debt.toMemberId);

              return (
                <div
                  key={`${debt.fromMemberId}-${debt.toMemberId}-${idx}`}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Visual Transfer Pathway */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={debtor?.name || 'Debtor'} color={debtor?.color} size="sm" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {debtor?.name || 'Someone'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 px-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider">owes</span>
                      <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>

                    <div className="flex items-center gap-2">
                      <Avatar name={creditor?.name || 'Creditor'} color={creditor?.color} size="sm" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {creditor?.name || 'Someone'}
                      </span>
                    </div>
                  </div>

                  {/* Transfer Amount & Settle Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(debt.amount, group.currency)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenSettle(debt)}
                    >
                      Settle Up
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <Check className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              All settled up!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nobody in this group owes any money. All shared expenses are balanced.
            </p>
          </div>
        )}
      </div>

      {/* Quick Settle Modal */}
      <QuickSettleModal
        isOpen={settleModalOpen}
        onClose={() => setSettleModalOpen(false)}
        group={group}
        defaultDebtorId={selectedDebtorId}
        defaultCreditorId={selectedCreditorId}
        defaultAmount={selectedAmount}
      />
    </div>
  );
};
