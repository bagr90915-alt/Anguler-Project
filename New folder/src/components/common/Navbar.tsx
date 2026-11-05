import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useExpenseSplitter } from '../../context/ExpenseContext';
import { CURRENCIES } from '../../utils/currency';
import { CurrencyCode } from '../../types';
import { Sun, Moon, Plus, Code2, Calculator, Layers } from 'lucide-react';
import { Button } from '../ui/Button';

interface NavbarProps {
  onOpenNewExpense?: () => void;
  onOpenArrayInspector?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewExpense, onOpenArrayInspector }) => {
  const { theme, setTheme, selectedCurrency, setSelectedCurrency } = useExpenseSplitter();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Groups & Ledgers', icon: <Layers className="w-3.5 h-3.5" /> },
    { to: '/calculator', label: 'Bill Split Calculator', icon: <Calculator className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <Link
          to="/"
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
            ÷
          </span>
          <span>SplitCraft</span>
        </Link>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  isActive
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'border-transparent hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}

          {onOpenArrayInspector && (
            <button
              onClick={onOpenArrayInspector}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Inspect JavaScript Array Operations (.reduce, .map, .filter)"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Array Ops Inspector</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Action + Currency & Theme Toggles */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Currency Selector */}
          <div className="relative">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
              className="text-xs font-semibold font-mono py-1.5 pl-2.5 pr-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
              aria-label="Select currency"
            >
              {Object.keys(CURRENCIES).map((code) => (
                <option key={code} value={code} className="dark:bg-slate-900">
                  {code} ({CURRENCIES[code as CurrencyCode].symbol})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Primary CTA */}
          {onOpenNewExpense && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={onOpenNewExpense}
            >
              Add Expense
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
