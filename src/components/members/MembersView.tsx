import React, { useState } from 'react';
import { Group, Member } from '../../types';
import { useExpenseSplitter } from '../../context/ExpenseContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { AddMemberModal } from '../common/AddMemberModal';
import { formatCurrency } from '../../utils/currency';
import { UserPlus, Mail, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export interface MembersViewProps {
  group: Group;
}

export const MembersView: React.FC<MembersViewProps> = ({ group }) => {
  const { getGroupBalances, removeMemberFromGroup, addToast } = useExpenseSplitter();
  const { memberBalances } = getGroupBalances(group.id);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const handleRemove = (member: Member) => {
    // Check if member has transactions
    const hasTransactions = group.expenses.some(
      (e) => e.payerId === member.id || e.splits.some((s) => s.memberId === member.id)
    );

    if (hasTransactions) {
      addToast({
        type: 'error',
        title: 'Cannot Remove Member',
        message: `${member.name} has recorded expenses or splits in this group.`,
      });
      return;
    }

    if (group.members.length <= 1) {
      addToast({
        type: 'warning',
        title: 'Last Member',
        message: 'A group must have at least one member.',
      });
      return;
    }

    removeMemberFromGroup(group.id, member.id);
    addToast({
      type: 'info',
      title: 'Member Removed',
      message: `${member.name} was removed from the group.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Group Members ({group.members.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            People splitting expenses in {group.name}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setAddMemberOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Add Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {group.members.map((member) => {
          const balance = memberBalances.find((b) => b.memberId === member.id);
          const isOwed = (balance?.netBalance || 0) > 0.01;
          const owes = (balance?.netBalance || 0) < -0.01;

          const hasTransactions = group.expenses.some(
            (e) => e.payerId === member.id || e.splits.some((s) => s.memberId === member.id)
          );

          return (
            <div
              key={member.id}
              className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} color={member.color} size="lg" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {member.name}
                    </h4>
                    {member.email ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {member.email}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 mt-0.5 block">No email added</span>
                    )}
                  </div>
                </div>

                {!hasTransactions && group.members.length > 1 && (
                  <button
                    onClick={() => handleRemove(member)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Member Financial Snapshot */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Paid</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(balance?.totalPaid || 0, group.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Share</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(balance?.totalOwed || 0, group.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Net</span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      isOwed
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : owes
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {isOwed ? '+' : ''}
                    {formatCurrency(balance?.netBalance || 0, group.currency)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AddMemberModal
        isOpen={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        groupId={group.id}
      />
    </div>
  );
};
