import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ExpenseProvider } from './context/ExpenseContext';
import { Navbar } from './components/common/Navbar';
import { ToastContainer } from './components/ui/ToastContainer';
import { DashboardPage } from './pages/DashboardPage';
import { GroupDetailPage } from './pages/GroupDetailPage';
import { BillCalculatorPage } from './pages/BillCalculatorPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AddExpenseModal } from './components/common/AddExpenseModal';
import { ArrayOperationsModal } from './components/common/ArrayOperationsModal';

export default function App() {
  const [globalAddExpenseOpen, setGlobalAddExpenseOpen] = useState(false);
  const [arrayInspectorOpen, setArrayInspectorOpen] = useState(false);

  return (
    <ExpenseProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
          {/* Top Bar Contract (Wordmark, Nav Links, Currency & Theme Controls, CTA) */}
          <Navbar
            onOpenNewExpense={() => setGlobalAddExpenseOpen(true)}
            onOpenArrayInspector={() => setArrayInspectorOpen(true)}
          />

          {/* Main App Canvas */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/group/:groupId" element={<GroupDetailPage />} />
              <Route path="/calculator" element={<BillCalculatorPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          {/* Quiet, clean editorial footer */}
          <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">SplitCraft</span>
                <span aria-hidden="true">·</span>
                <span>Component-based expense splitting & debt settlement engine</span>
              </div>
              <div className="flex items-center gap-4 text-slate-500">
                <button
                  onClick={() => setArrayInspectorOpen(true)}
                  className="hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  Array Operations Inspector
                </button>
                <span aria-hidden="true">·</span>
                <span>Powered by React & Tailwind CSS</span>
              </div>
            </div>
          </footer>

          {/* Modals and notifications */}
          <AddExpenseModal
            isOpen={globalAddExpenseOpen}
            onClose={() => setGlobalAddExpenseOpen(false)}
          />
          <ArrayOperationsModal
            isOpen={arrayInspectorOpen}
            onClose={() => setArrayInspectorOpen(false)}
          />
          <ToastContainer />
        </div>
      </Router>
    </ExpenseProvider>
  );
}
