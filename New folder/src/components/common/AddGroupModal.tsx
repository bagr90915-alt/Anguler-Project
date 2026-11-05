import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useExpenseSplitter } from '../../context/ExpenseContext';
import { CURRENCIES } from '../../utils/currency';
import { CurrencyCode, Group } from '../../types';
import { Plus, X } from 'lucide-react';

export interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (groupId: string) => void;
}

export const AddGroupModal: React.FC<AddGroupModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { createGroup, selectedCurrency } = useExpenseSplitter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(selectedCurrency);
  const [category, setCategory] = useState<Group['category']>('trip');
  const [color, setColor] = useState('#0EA5E9');
  const [members, setMembers] = useState<string[]>(['You', 'Partner / Friend']);
  const [newMemberName, setNewMemberName] = useState('');
  const [error, setError] = useState('');

  const groupColors = ['#0EA5E9', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#6366F1'];

  const categoryOptions = [
    { value: 'trip', label: 'Trip & Travel' },
    { value: 'home', label: 'Apartment & Living' },
    { value: 'event', label: 'Event & Celebration' },
    { value: 'project', label: 'Team Project' },
    { value: 'other', label: 'General / Other' },
  ];

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    setMembers([...members, newMemberName.trim()]);
    setNewMemberName('');
  };

  const handleRemoveMember = (idx: number) => {
    if (members.length <= 1) return;
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a group name.');
      return;
    }

    if (members.length === 0) {
      setError('Please specify at least one member.');
      return;
    }

    const newGroupId = createGroup(
      name.trim(),
      description.trim(),
      currency,
      color,
      category,
      members
    );

    setName('');
    setDescription('');
    setMembers(['You', 'Friend']);
    if (onCreated) onCreated(newGroupId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Expense Group"
      subtitle="Organize shared expenses for roommates, trips, or dining"
      maxWidth="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Create Group
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

        <Input
          label="Group Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Barcelona Summer Trip, Apt 4B, Friday Dinner Club"
          required
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Group['category'])}
            options={categoryOptions}
          />

          <Select
            label="Base Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            options={Object.keys(CURRENCIES).map((c) => ({
              value: c,
              label: `${c} (${CURRENCIES[c as CurrencyCode].symbol})`,
            }))}
          />
        </div>

        <Input
          label="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary or purpose of this ledger"
        />

        {/* Theme Accent Color */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Accent Color Theme
          </label>
          <div className="flex items-center gap-2">
            {groupColors.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                  color === c ? 'scale-110 ring-2 ring-offset-2 ring-emerald-500' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Initial Members */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Group Members ({members.length})
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMember();
                }
              }}
              placeholder="Add member name..."
              className="flex-1 py-1.5 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddMember}
            >
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {members.map((memberName, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                <span>{memberName}</span>
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(idx)}
                    className="text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
