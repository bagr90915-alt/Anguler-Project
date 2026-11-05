import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Avatar } from '../ui/Avatar';
import { Group, SplitType, SplitDetail, ItemizedReceiptItem, CategoryId } from '../../types';
import { CATEGORY_LIST } from '../../utils/categories';
import { useExpenseSplitter } from '../../context/ExpenseContext';
import { formatCurrency } from '../../utils/currency';
import { Plus, Trash2, Check, AlertCircle, Receipt } from 'lucide-react';

export interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  group?: Group;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, group: propGroup }) => {
  const { groups, activeGroupId, createExpense } = useExpenseSplitter();
  
  // Resolve active group
  const group = propGroup || groups.find((g) => g.id === activeGroupId) || groups[0];

  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId>('food');
  const [payerId, setPayerId] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Selected members for equal split
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Exact amounts map: memberId -> string
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});

  // Percentage map: memberId -> string
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  // Shares map: memberId -> number
  const [shares, setShares] = useState<Record<string, number>>({});

  // Itemized receipt items
  const [receiptItems, setReceiptItems] = useState<ItemizedReceiptItem[]>([
    { id: 'item-1', title: 'Main dishes', price: 0, assignedMemberIds: [] },
  ]);
  const [receiptTax, setReceiptTax] = useState('0');
  const [receiptTip, setReceiptTip] = useState('0');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && group) {
      setTitle('');
      setTotalAmount('');
      setCategoryId('food');
      setPayerId(group.members[0]?.id || '');
      setSplitType('equal');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError('');

      const allIds = group.members.map((m) => m.id);
      setSelectedMemberIds(allIds);

      // Default exact amounts
      const initExact: Record<string, string> = {};
      allIds.forEach((id) => (initExact[id] = ''));
      setExactAmounts(initExact);

      // Default percentages
      const initPercent: Record<string, string> = {};
      const equalPct = (100 / (allIds.length || 1)).toFixed(1);
      allIds.forEach((id) => (initPercent[id] = equalPct));
      setPercentages(initPercent);

      // Default shares
      const initShares: Record<string, number> = {};
      group.members.forEach((m) => (initShares[m.id] = m.defaultShare || 1));
      setShares(initShares);

      // Default receipt item
      setReceiptItems([
        { id: `item-${Date.now()}-1`, title: 'Dinner bill item 1', price: 0, assignedMemberIds: [...allIds] },
      ]);
      setReceiptTax('0');
      setReceiptTip('0');
    }
  }, [isOpen, group]);

  // Handle itemized receipt calculations
  const itemizedCalculation = useMemo(() => {
    if (splitType !== 'itemized' || !group) return null;

    const itemsSubtotal = receiptItems.reduce((sum, item) => sum + (item.price || 0), 0);
    const taxNum = parseFloat(receiptTax) || 0;
    const tipNum = parseFloat(receiptTip) || 0;
    const finalTotal = itemsSubtotal + taxNum + tipNum;

    // Per member base breakdown from items
    const memberSubtotals: Record<string, number> = {};
    group.members.forEach((m) => (memberSubtotals[m.id] = 0));

    receiptItems.forEach((item) => {
      if (item.assignedMemberIds.length > 0 && item.price > 0) {
        const share = item.price / item.assignedMemberIds.length;
        item.assignedMemberIds.forEach((mId) => {
          memberSubtotals[mId] = (memberSubtotals[mId] || 0) + share;
        });
      }
    });

    // Distribute tax and tip proportionally to each member's subtotal
    const calculatedSplits: SplitDetail[] = group.members.map((m) => {
      const sub = memberSubtotals[m.id] || 0;
      const proportion = itemsSubtotal > 0 ? sub / itemsSubtotal : 1 / group.members.length;
      const memberTax = taxNum * proportion;
      const memberTip = tipNum * proportion;
      const memberTotal = Math.round((sub + memberTax + memberTip) * 100) / 100;

      return {
        memberId: m.id,
        amount: memberTotal,
      };
    });

    return {
      itemsSubtotal,
      finalTotal,
      calculatedSplits,
    };
  }, [splitType, group, receiptItems, receiptTax, receiptTip]);

  // Sync totalAmount input when in itemized mode
  useEffect(() => {
    if (splitType === 'itemized' && itemizedCalculation) {
      setTotalAmount(itemizedCalculation.finalTotal.toFixed(2));
    }
  }, [splitType, itemizedCalculation]);

  if (!group) return null;

  const handleToggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleAddItem = () => {
    setReceiptItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        title: `Item ${prev.length + 1}`,
        price: 0,
        assignedMemberIds: group.members.map((m) => m.id),
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (receiptItems.length <= 1) return;
    setReceiptItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemToggleMember = (itemId: string, memberId: string) => {
    setReceiptItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.assignedMemberIds.includes(memberId);
        return {
          ...item,
          assignedMemberIds: exists
            ? item.assignedMemberIds.filter((id) => id !== memberId)
            : [...item.assignedMemberIds, memberId],
        };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(totalAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid expense total greater than zero.');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a title or description for this expense.');
      return;
    }

    if (!payerId) {
      setError('Please designate who paid for this expense.');
      return;
    }

    let finalSplits: SplitDetail[] = [];

    if (splitType === 'equal') {
      if (selectedMemberIds.length === 0) {
        setError('At least one member must be selected for the equal split.');
        return;
      }
      const count = selectedMemberIds.length;
      const baseShare = Math.floor((parsedAmount / count) * 100) / 100;
      let remainder = Math.round((parsedAmount - baseShare * count) * 100) / 100;

      finalSplits = selectedMemberIds.map((mId, index) => {
        // Distribute 1-cent remainders cleanly
        const addCent = remainder > 0 ? 0.01 : 0;
        if (remainder > 0) remainder = Math.round((remainder - 0.01) * 100) / 100;
        return {
          memberId: mId,
          amount: Math.round((baseShare + addCent) * 100) / 100,
        };
      });
    } else if (splitType === 'exact') {
      let sum = 0;
      finalSplits = group.members.map((m) => {
        const amt = parseFloat(exactAmounts[m.id] || '0') || 0;
        sum += amt;
        return {
          memberId: m.id,
          amount: Math.round(amt * 100) / 100,
        };
      });

      const diff = Math.round((parsedAmount - sum) * 100) / 100;
      if (Math.abs(diff) > 0.05) {
        setError(
          `Exact split sum (${group.currency} ${sum.toFixed(2)}) must match total amount (${group.currency} ${parsedAmount.toFixed(2)}). Difference: ${group.currency} ${Math.abs(diff).toFixed(2)}.`
        );
        return;
      }
    } else if (splitType === 'percentage') {
      let totalPct = 0;
      group.members.forEach((m) => {
        totalPct += parseFloat(percentages[m.id] || '0') || 0;
      });

      if (Math.abs(totalPct - 100) > 0.5) {
        setError(`Split percentages must add up to exactly 100%. Current sum: ${totalPct.toFixed(1)}%.`);
        return;
      }

      finalSplits = group.members.map((m) => {
        const pct = parseFloat(percentages[m.id] || '0') || 0;
        const amt = Math.round(((parsedAmount * pct) / 100) * 100) / 100;
        return {
          memberId: m.id,
          amount: amt,
          percentage: pct,
        };
      });
    } else if (splitType === 'shares') {
      const totalShares = group.members.reduce((acc, m) => acc + (shares[m.id] || 0), 0);
      if (totalShares <= 0) {
        setError('Total shares must be at least 1.');
        return;
      }

      finalSplits = group.members.map((m) => {
        const mShares = shares[m.id] || 0;
        const amt = Math.round(((parsedAmount * mShares) / totalShares) * 100) / 100;
        return {
          memberId: m.id,
          amount: amt,
          shares: mShares,
        };
      });
    } else if (splitType === 'itemized') {
      if (!itemizedCalculation) return;
      finalSplits = itemizedCalculation.calculatedSplits;
    }

    createExpense(group.id, {
      title: title.trim(),
      amount: parsedAmount,
      currency: group.currency,
      categoryId,
      date,
      payerId,
      splitType,
      splits: finalSplits,
      notes: notes.trim() || undefined,
      receiptItems: splitType === 'itemized' ? receiptItems : undefined,
      receiptTax: splitType === 'itemized' ? parseFloat(receiptTax) || 0 : undefined,
      receiptTip: splitType === 'itemized' ? parseFloat(receiptTip) || 0 : undefined,
    });

    onClose();
  };

  const splitOptions = [
    { value: 'equal' as SplitType, label: 'Equal' },
    { value: 'exact' as SplitType, label: 'Exact' },
    { value: 'percentage' as SplitType, label: 'Percent' },
    { value: 'shares' as SplitType, label: 'Shares' },
    { value: 'itemized' as SplitType, label: 'Receipt' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Expense"
      subtitle={`Logging transaction in ${group.name}`}
      maxWidth="2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save Expense
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Expense Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dinner at Gion, Train tickets, Groceries"
              required
              autoFocus
            />
          </div>
          <div>
            <Input
              label="Total Amount"
              type="number"
              step="0.01"
              min="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0.00"
              prefixElement={group.currency}
              disabled={splitType === 'itemized'}
              required
            />
          </div>
        </div>

        {/* Category & Payer & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value as CategoryId)}
              options={CATEGORY_LIST.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>

          <div>
            <Select
              label="Paid By"
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              options={group.members.map((m) => ({ value: m.id, label: m.name }))}
            />
          </div>

          <div>
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Split Mode Selector */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Split Mode
            </span>
            <span className="text-xs text-slate-400">
              {splitType === 'equal' && 'Split equally among selected members'}
              {splitType === 'exact' && 'Specify exact amounts for each member'}
              {splitType === 'percentage' && 'Split by custom percentages totaling 100%'}
              {splitType === 'shares' && 'Split by weights/shares ratio'}
              {splitType === 'itemized' && 'Itemize dish by dish with tax & tip'}
            </span>
          </div>

          <SegmentedControl
            options={splitOptions}
            value={splitType}
            onChange={(val) => setSplitType(val)}
            size="sm"
            className="w-full justify-between"
          />
        </div>

        {/* Split Method Custom Panels */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
          {/* EQUAL SPLIT */}
          {splitType === 'equal' && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Included Members ({selectedMemberIds.length}/{group.members.length}):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {group.members.map((m) => {
                  const isChecked = selectedMemberIds.includes(m.id);
                  const perPerson =
                    selectedMemberIds.length > 0 && parseFloat(totalAmount) > 0
                      ? (parseFloat(totalAmount) / selectedMemberIds.length).toFixed(2)
                      : '0.00';

                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => handleToggleMember(m.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isChecked
                          ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-xs'
                          : 'bg-transparent border-slate-200 dark:border-slate-700 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={m.name} color={m.color} size="sm" />
                        <div className="truncate">
                          <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                            {m.name}
                          </p>
                          {isChecked && (
                            <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                              {group.currency} {perPerson}
                            </p>
                          )}
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* EXACT AMOUNTS SPLIT */}
          {splitType === 'exact' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Avatar name={m.name} color={m.color} size="sm" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-24 truncate">
                      {m.name}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={exactAmounts[m.id] || ''}
                      onChange={(e) =>
                        setExactAmounts({ ...exactAmounts, [m.id]: e.target.value })
                      }
                      placeholder="0.00"
                      prefixElement={group.currency}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PERCENTAGE SPLIT */}
          {splitType === 'percentage' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Avatar name={m.name} color={m.color} size="sm" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-24 truncate">
                      {m.name}
                    </span>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={percentages[m.id] || ''}
                      onChange={(e) =>
                        setPercentages({ ...percentages, [m.id]: e.target.value })
                      }
                      suffixElement="%"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SHARES SPLIT */}
          {splitType === 'shares' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Avatar name={m.name} color={m.color} size="sm" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-24 truncate">
                      {m.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setShares({
                            ...shares,
                            [m.id]: Math.max(0, (shares[m.id] || 0) - 1),
                          })
                        }
                      >
                        -
                      </Button>
                      <span className="font-mono text-sm w-6 text-center">
                        {shares[m.id] || 0}
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setShares({
                            ...shares,
                            [m.id]: (shares[m.id] || 0) + 1,
                          })
                        }
                      >
                        +
                      </Button>
                      <span className="text-xs text-slate-400">share(s)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ITEMIZED RECEIPT SPLIT */}
          {splitType === 'itemized' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  Line Items & Shared Assignment
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddItem}
                >
                  Add Item
                </Button>
              </div>

              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {receiptItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) =>
                          setReceiptItems((prev) =>
                            prev.map((it) =>
                              it.id === item.id ? { ...it, title: e.target.value } : it
                            )
                          )
                        }
                        placeholder={`Dish/Item ${idx + 1}`}
                        className="flex-1 text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setReceiptItems((prev) =>
                              prev.map((it) => (it.id === item.id ? { ...it, price: val } : it))
                            );
                          }}
                          placeholder="0.00"
                          className="w-full text-xs font-mono px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={receiptItems.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Member Avatars selection for who ate/shared this item */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 mr-1">Shared by:</span>
                      {group.members.map((m) => {
                        const isShared = item.assignedMemberIds.includes(m.id);
                        return (
                          <button
                            type="button"
                            key={m.id}
                            onClick={() => handleItemToggleMember(item.id, m.id)}
                            className={`px-2 py-0.5 text-[11px] rounded transition-colors flex items-center gap-1 cursor-pointer ${
                              isShared
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            <span>{m.name.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tax & Tip Add-ons */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <Input
                  label="Tax Amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={receiptTax}
                  onChange={(e) => setReceiptTax(e.target.value)}
                  prefixElement={group.currency}
                />
                <Input
                  label="Tip Amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={receiptTip}
                  onChange={(e) => setReceiptTip(e.target.value)}
                  prefixElement={group.currency}
                />
              </div>

              {itemizedCalculation && (
                <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg text-xs flex justify-between font-mono">
                  <span>Calculated Receipt Total:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {group.currency} {itemizedCalculation.finalTotal.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <Input
          label="Notes / Receipt memo (Optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Paid with credit card ending 4012"
        />
      </form>
    </Modal>
  );
};
