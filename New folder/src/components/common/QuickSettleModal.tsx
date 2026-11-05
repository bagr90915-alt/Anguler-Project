import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Group, Member, Settlement } from '../../types';
import { useExpenseSplitter } from '../../context/ExpenseContext';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export interface QuickSettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  defaultDebtorId?: string;
  defaultCreditorId?: string;
  defaultAmount?: number;
}

export const QuickSettleModal: React.FC<QuickSettleModalProps> = ({
  isOpen,
  onClose,
  group,
  defaultDebtorId,
  defaultCreditorId,
  defaultAmount,
}) => {
  const { recordSettlement } = useExpenseSplitter();

  const [debtorId, setDebtorId] = useState<string>('');
  const [creditorId, setCreditorId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<Settlement['paymentMethod']>('venmo');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const firstDebtor = defaultDebtorId || group.members[0]?.id || '';
      const firstCreditor = defaultCreditorId || group.members.find((m) => m.id !== firstDebtor)?.id || '';
      
      setDebtorId(firstDebtor);
      setCreditorId(firstCreditor);
      setAmount(defaultAmount ? defaultAmount.toFixed(2) : '');
      setNote('');
      setError('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, defaultDebtorId, defaultCreditorId, defaultAmount, group.members]);

  const debtor = group.members.find((m) => m.id === debtorId);
  const creditor = group.members.find((m) => m.id === creditorId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (!debtorId || !creditorId) {
      setError('Please select both payer and receiver.');
      return;
    }

    if (debtorId === creditorId) {
      setError('Debtor and creditor cannot be the same person.');
      return;
    }

    recordSettlement(group.id, {
      fromMemberId: debtorId,
      toMemberId: creditorId,
      amount: parsedAmount,
      currency: group.currency,
      date,
      paymentMethod,
      note: note.trim() || undefined,
    });

    // Trigger celebratory confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#F59E0B', '#EC4899'],
      });
    } catch {
      // Ignore if canvas is restricted
    }

    onClose();
  };

  const paymentOptions = [
    { value: 'venmo', label: 'Venmo' },
    { value: 'cash', label: 'Cash in Person' },
    { value: 'zelle', label: 'Zelle' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'bank_transfer', label: 'Bank Transfer / Wire' },
    { value: 'revolut', label: 'Revolut' },
    { value: 'other', label: 'Other Direct Payment' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Settlement Payment"
      subtitle={`Log a direct payment between members in ${group.name}`}
      maxWidth="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Confirm Settlement
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Transfer Visual Direction */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex-1 text-center font-medium text-slate-700 dark:text-slate-300">
            <span className="text-slate-400 block text-[10px] uppercase">Paid By</span>
            <span className="font-semibold">{debtor?.name || 'Select'}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex-1 text-center font-medium text-slate-700 dark:text-slate-300">
            <span className="text-slate-400 block text-[10px] uppercase">Paid To</span>
            <span className="font-semibold">{creditor?.name || 'Select'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="From (Payer)"
            value={debtorId}
            onChange={(e) => setDebtorId(e.target.value)}
            options={group.members.map((m) => ({ value: m.id, label: m.name }))}
          />

          <Select
            label="To (Recipient)"
            value={creditorId}
            onChange={(e) => setCreditorId(e.target.value)}
            options={group.members.map((m) => ({
              value: m.id,
              label: m.name,
              disabled: m.id === debtorId,
            }))}
          />
        </div>

        <Input
          label="Amount Settled"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          prefixElement={group.currency}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as Settlement['paymentMethod'])}
            options={paymentOptions}
          />

          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <Input
          label="Note / Reference (Optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Venmo confirmation #8291"
        />
      </form>
    </Modal>
  );
};
