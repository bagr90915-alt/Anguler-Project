import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { ARRAY_OPERATIONS_CATALOG } from '../../utils/arrayDemos';
import { useExpenseSplitter } from '../../context/ExpenseContext';
import { Code2, Play, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ArrayOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArrayOperationsModal: React.FC<ArrayOperationsModalProps> = ({ isOpen, onClose }) => {
  const { groups, activeGroupId } = useExpenseSplitter();
  const targetGroup = groups.find((g) => g.id === activeGroupId) || groups[0];
  const [selectedOpIndex, setSelectedOpIndex] = useState(0);

  if (!targetGroup) return null;

  const activeOp = ARRAY_OPERATIONS_CATALOG[selectedOpIndex];
  const currentResult = activeOp.resultSummary(targetGroup);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dynamic Rendering & Array Operations"
      subtitle="Inspect how functional JavaScript array methods transform data in real time"
      maxWidth="2xl"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close Inspector
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Active Data Context */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Active Data Source:{' '}
            <strong className="text-slate-900 dark:text-slate-100 font-semibold">{targetGroup.name}</strong>
          </span>
          <span className="font-mono text-slate-500">
            {targetGroup.expenses.length} expenses · {targetGroup.members.length} members
          </span>
        </div>

        {/* Operation Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
          {ARRAY_OPERATIONS_CATALOG.map((op, idx) => {
            const isSelected = selectedOpIndex === idx;
            return (
              <button
                key={op.name}
                onClick={() => setSelectedOpIndex(idx)}
                className={`px-2.5 py-1.5 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                .{op.name.split('.')[2]?.replace('()', '') || op.name}
              </button>
            );
          })}
        </div>

        {/* Selected Operation Detail */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h4 className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
              {activeOp.name}
            </h4>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {activeOp.description}
          </p>

          <div className="text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">SplitCraft Architecture Role: </span>
            <span className="text-slate-500 dark:text-slate-400">{activeOp.useCaseInApp}</span>
          </div>

          {/* Syntax Code block */}
          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 p-3 text-emerald-400 font-mono text-xs overflow-x-auto">
            <span className="text-slate-500">// Example syntax used in engine:</span>
            <div className="mt-1">{activeOp.syntax}</div>
          </div>

          {/* Live Evaluation Box */}
          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <Play className="w-3 h-3 fill-current" />
              <span>Live Evaluation Result</span>
            </div>
            <p className="text-xs font-mono text-emerald-900 dark:text-emerald-200">
              {currentResult}
            </p>
          </div>
        </div>

        {/* Technical Checklist */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Pure immutability (No state mutations)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>useMemo() memoized execution</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
