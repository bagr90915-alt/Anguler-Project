import React, { useState } from 'react';
import { Expense, Group } from '../../types';
import { CATEGORIES } from '../../utils/categories';
import { formatCurrency } from '../../utils/currency';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useExpenseSplitter } from '../../context/ExpenseContext';
import { ChevronDown, ChevronUp, Trash2, Receipt, Calendar } from 'lucide-react';

export interface ExpenseCardProps {
  expense: Expense;
  group: Group;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, group }) => {
  const { deleteExpense } = useExpenseSplitter();
  const [isExpanded, setIsExpanded] = useState(false);

  const category = CATEGORIES[expense.categoryId] || CATEGORIES.general;
  const payer = group.members.find((m) => m.id === expense.payerId);

  const splitLabels = {
    equal: 'Equal Split',
    exact: 'Exact Amounts',
    percentage: 'Percentage Split',
    shares: 'Shares Split',
    itemized: 'Itemized Receipt',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-xs">
      <div
        className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Left: Category Icon & Title & Metadata */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-semibold shadow-xs"
            style={{ backgroundColor: category.color }}
            title={category.name}
          >
            {category.name[0]}
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {expense.title}
            </h4>
            {/* Zero-pill metadata as required by design guidelines */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{category.name}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {expense.date}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Paid by <strong className="font-medium text-slate-700 dark:text-slate-300">{payer?.name || 'Someone'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Amount & Split Badge & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {formatCurrency(expense.amount, expense.currency)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-end gap-1">
              {expense.receiptItems && expense.receiptItems.length > 0 && (
                <Receipt className="w-3 h-3 text-emerald-600 dark:text-emerald-400 inline" />
              )}
              <span>{splitLabels[expense.splitType]}</span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label={isExpanded ? 'Collapse breakdown' : 'Expand breakdown'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Split Breakdown Drawer */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 rounded-b-xl space-y-3 text-xs animate-in fade-in-50 duration-150">
          {expense.notes && (
            <p className="text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
              "{expense.notes}"
            </p>
          )}

          {/* Itemized Receipts Details if present */}
          {expense.receiptItems && expense.receiptItems.length > 0 && (
            <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Receipt Line Items:
              </span>
              {expense.receiptItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/50 last:border-none">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.title}</span>
                    <span className="text-[11px] text-slate-400">
                      ({item.assignedMemberIds.length} person{item.assignedMemberIds.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {formatCurrency(item.price, expense.currency)}
                  </span>
                </div>
              ))}
              {(expense.receiptTax || expense.receiptTip) && (
                <div className="pt-1.5 flex items-center justify-between text-slate-500 font-mono text-[11px]">
                  <span>Tax: {formatCurrency(expense.receiptTax || 0, expense.currency)}</span>
                  <span>Tip: {formatCurrency(expense.receiptTip || 0, expense.currency)}</span>
                </div>
              )}
            </div>
          )}

          {/* Member Split Breakdown Table */}
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">
              Individual Member Shares:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {expense.splits.map((split) => {
                const member = group.members.find((m) => m.id === split.memberId);
                const isPayer = split.memberId === expense.payerId;

                return (
                  <div
                    key={split.memberId}
                    className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={member?.name || 'User'} color={member?.color} size="xs" />
                      <span className="truncate text-slate-700 dark:text-slate-300">
                        {member?.name || 'Unknown'} {isPayer && <span className="text-slate-400">(Payer)</span>}
                      </span>
                    </div>
                    <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(split.amount, expense.currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delete Action */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => deleteExpense(group.id, expense.id)}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 p-1 hover:underline cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete this expense</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
