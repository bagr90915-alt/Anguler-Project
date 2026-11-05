import { Category, CategoryId } from '../types';

export const CATEGORIES: Record<CategoryId, Category> = {
  food: {
    id: 'food',
    name: 'Food & Dining',
    icon: 'Utensils',
    color: '#F97316', // Orange
  },
  groceries: {
    id: 'groceries',
    name: 'Groceries',
    icon: 'ShoppingCart',
    color: '#10B981', // Emerald
  },
  transport: {
    id: 'transport',
    name: 'Transportation',
    icon: 'Car',
    color: '#0EA5E9', // Sky blue
  },
  housing: {
    id: 'housing',
    name: 'Housing & Rent',
    icon: 'Home',
    color: '#8B5CF6', // Purple
  },
  utilities: {
    id: 'utilities',
    name: 'Utilities & Bills',
    icon: 'Zap',
    color: '#F59E0B', // Amber
  },
  entertainment: {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'Film',
    color: '#EC4899', // Pink
  },
  shopping: {
    id: 'shopping',
    name: 'Shopping',
    icon: 'Tag',
    color: '#6366F1', // Indigo
  },
  health: {
    id: 'health',
    name: 'Health & Personal',
    icon: 'HeartPulse',
    color: '#14B8A6', // Teal
  },
  general: {
    id: 'general',
    name: 'General & Other',
    icon: 'Package',
    color: '#64748B', // Slate
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);
