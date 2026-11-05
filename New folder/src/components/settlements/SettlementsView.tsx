import React, { useState } from 'react';
import { Group, Settlement } from '../../types';
import { useExpenseSplitter } from '../../context/ExpenseContext';
import { formatCurrency } from '../../utils/currency';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { QuickSettleModal } from '../common/QuickSettleModal';
import { CheckCircle2, ArrowRight, Trash2, Plus, Calendar, CreditCard } from 'lucide-react';

export interface SettlementsViewProps {
  group: Group;
}

export const SettlementsView: React.FC<SettlementsViewProps> = ({ group }) => {
  const { deleteSettlement } = useExpenseSplitter();
  const [settleModalOpen, setSettleModalOpen] = useState(false);

  const paymentLabels: Record<Settlement['paymentMethod'], string> = {
    venmo: 'Venmo',
    cash: 'Cash',
    paypal: 'PayPal',
    zelle: 'Zelle',
    bank_transfer: 'Bank Transfer',
    revolut: 'Revolut',
    other: 'Direct Payment',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Settlement Payment History
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit log of direct cash, Venmo, and bank payments recorded in {group.name}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setSettleModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Record Payment
        </Button>
      </div>

      {group.settlements.length > 0 ? (
        <div className="space-y-2.5">
          {group.settlements.map((settlement) => {
            const debtor = group.members.find((m) => m.id === settlement.fromMemberId);
            const creditor = group.members.find((m) => m.id === settlement.toMemberId);

            return (
              <div
                key={settlement.id}
                className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
              >
                {/* Visual Pathway */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={debtor?.name || 'Payer'} color={debtor?.color} size="sm" />
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                        {debtor?.name || 'Unknown'}
                      </span>
                      <span className="text-[10px] text-slate-400">Payer</span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />

                  <div className="flex items-center gap-2">
                    <Avatar name={creditor?.name || 'Receiver'} color={creditor?.color} size="sm" />
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                        {creditor?.name || 'Unknown'}
                      </span>
                      <span className="text-[10px] text-slate-400">Recipient</span>
                    </div>
                  </div>
                </div>

                {/* Amount, Method & Metadata */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(settlement.amount, settlement.currency)}
                    </div>
                    {/* Zero-pill metadata as required by design guidelines */}
                    <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{paymentLabels[settlement.paymentMethod] || 'Payment'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {settlement.date}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteSettlement(group.id, settlement.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Undo settlement"
                    aria-label="Undo settlement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            No payments recorded yet
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            When members pay back debts in cash or Venmo, record them here to settle outstanding balances.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettleModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Record First Payment
            </Button>
          </div>
        </div>
      )}

      <QuickSettleModal
        isOpen={settleModalOpen}
        onClose={() => setSettleModalOpen(false)}
        group={group}
      />
    </div>
  );
};
