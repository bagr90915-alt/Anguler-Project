import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useExpenseSplitter } from '../../context/ExpenseContext';
import { UserPlus } from 'lucide-react';

export interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, groupId }) => {
  const { addMemberToGroup } = useExpenseSplitter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [defaultShare, setDefaultShare] = useState('1');
  const [error, setError] = useState('');

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316', '#64748B'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Member name is required.');
      return;
    }

    const parsedShare = parseFloat(defaultShare) || 1;
    addMemberToGroup(groupId, name.trim(), email.trim() || undefined, color, parsedShare);

    setName('');
    setEmail('');
    setDefaultShare('1');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Group Member"
      subtitle="Include another person to split future or existing expenses"
      maxWidth="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} leftIcon={<UserPlus className="w-4 h-4" />}>
            Add Member
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Taylor Swift, Marcus Lee"
          required
          autoFocus
        />

        <Input
          label="Email (Optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="taylor@example.com"
          helperText="For notification or contact reference"
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Avatar Color
          </label>
          <div className="flex items-center gap-2">
            {colors.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                  color === c ? 'scale-110 ring-2 ring-offset-2 ring-emerald-500' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        <Input
          label="Default Split Weight"
          type="number"
          step="0.1"
          min="0.1"
          value={defaultShare}
          onChange={(e) => setDefaultShare(e.target.value)}
          helperText="Standard share is 1.0 (set 2.0 for couples sharing a bill)"
        />
      </form>
    </Modal>
  );
};
