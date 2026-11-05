import React, { useState, useMemo } from 'react';
import { useExpenseSplitter } from '../context/ExpenseContext';
import { formatCurrency } from '../utils/currency';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Calculator, Copy, Check, Users, Percent, DollarSign, Plus, Trash2, ArrowRight } from 'lucide-react';

interface QuickItem {
  id: string;
  name: string;
  price: number;
  sharedBy: number; // number of diners sharing
}

export const BillCalculatorPage: React.FC = () => {
  const { selectedCurrency, addToast } = useExpenseSplitter();

  const [billAmount, setBillAmount] = useState<string>('84.50');
  const [tipPercent, setTipPercent] = useState<number>(18);
  const [customTip, setCustomTip] = useState<string>('');
  const [taxPercent, setTaxPercent] = useState<string>('8.875'); // NYC rate example
  const [numPeople, setNumPeople] = useState<number>(3);
  const [roundUp, setRoundUp] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Quick Tip Presets
  const tipPresets = [0, 15, 18, 20, 25];

  const calculations = useMemo(() => {
    const rawBill = parseFloat(billAmount) || 0;
    const taxRate = (parseFloat(taxPercent) || 0) / 100;
    const effectiveTipRate = customTip ? (parseFloat(customTip) || 0) / 100 : tipPercent / 100;

    const taxAmount = rawBill * taxRate;
    const tipAmount = rawBill * effectiveTipRate;
    let totalWithTaxAndTip = rawBill + taxAmount + tipAmount;

    if (roundUp) {
      totalWithTaxAndTip = Math.ceil(totalWithTaxAndTip);
    }

    const diners = Math.max(1, numPeople);
    const perPerson = totalWithTaxAndTip / diners;

    return {
      subtotal: rawBill,
      taxAmount,
      tipAmount,
      total: totalWithTaxAndTip,
      perPerson,
    };
  }, [billAmount, tipPercent, customTip, taxPercent, numPeople, roundUp]);

  const handleCopy = () => {
    const text = [
      `🧾 Bill Split Breakdown`,
      `Subtotal: ${formatCurrency(calculations.subtotal, selectedCurrency)}`,
      `Tax: ${formatCurrency(calculations.taxAmount, selectedCurrency)} (${taxPercent}%)`,
      `Tip: ${formatCurrency(calculations.tipAmount, selectedCurrency)} (${customTip ? customTip + '%' : tipPercent + '%'})`,
      `Total: ${formatCurrency(calculations.total, selectedCurrency)}`,
      `Split among ${numPeople} people:`,
      `👉 ${formatCurrency(calculations.perPerson, selectedCurrency)} per person`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast({
      type: 'success',
      title: 'Copied Bill Split',
      message: 'Share details copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Calculator className="w-6 h-6 text-emerald-600" />
          Interactive Bill Split Calculator
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Quickly compute tip, sales tax, and equal dining shares for dinners and group tabs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Inputs Column */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
          <Input
            label="Bill Subtotal (Before Tax & Tip)"
            type="number"
            step="0.01"
            min="0"
            value={billAmount}
            onChange={(e) => setBillAmount(e.target.value)}
            placeholder="0.00"
            prefixElement={selectedCurrency}
            autoFocus
          />

          {/* Tip Presets */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tip Percentage
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {tipPresets.map((pct) => (
                <button
                  type="button"
                  key={pct}
                  onClick={() => {
                    setTipPercent(pct);
                    setCustomTip('');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    tipPercent === pct && !customTip
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {pct}%
                </button>
              ))}

              <div className="w-24">
                <input
                  type="number"
                  placeholder="Custom %"
                  value={customTip}
                  onChange={(e) => {
                    setCustomTip(e.target.value);
                  }}
                  className={`w-full py-1.5 px-2.5 text-xs rounded-lg border bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none ${
                    customTip ? 'border-emerald-500 font-semibold' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Tax Rate & Number of Diners */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sales Tax (%)"
              type="number"
              step="0.001"
              min="0"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
              suffixElement="%"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Number of Diners
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setNumPeople(Math.max(1, numPeople - 1))}
                >
                  -
                </Button>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 w-8 text-center">
                  {numPeople}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setNumPeople(numPeople + 1)}
                >
                  +
                </Button>
                <span className="text-xs text-slate-400">person(s)</span>
              </div>
            </div>
          </div>

          {/* Round up toggle */}
          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-2 border-t border-slate-100 dark:border-slate-800">
            <input
              type="checkbox"
              checked={roundUp}
              onChange={(e) => setRoundUp(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Round up final bill to nearest whole dollar for clean cash/tip</span>
          </label>
        </div>

        {/* Right Output Summary Card */}
        <div className="md:col-span-5 bg-emerald-900 text-white p-6 rounded-2xl shadow-lg space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300 block">
              Each Person Pays
            </span>
            <div className="mt-2 text-4xl font-extrabold font-mono tabular-nums tracking-tight text-white">
              {formatCurrency(calculations.perPerson, selectedCurrency)}
            </div>
            <span className="text-xs text-emerald-200 mt-1 block">
              Split evenly across {numPeople} diner{numPeople !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="pt-4 border-t border-emerald-800/80 space-y-2 text-xs">
            <div className="flex justify-between text-emerald-200">
              <span>Subtotal:</span>
              <span className="font-mono text-white">
                {formatCurrency(calculations.subtotal, selectedCurrency)}
              </span>
            </div>
            <div className="flex justify-between text-emerald-200">
              <span>Tax ({taxPercent}%):</span>
              <span className="font-mono text-white">
                {formatCurrency(calculations.taxAmount, selectedCurrency)}
              </span>
            </div>
            <div className="flex justify-between text-emerald-200">
              <span>Tip ({customTip ? customTip + '%' : tipPercent + '%'}):</span>
              <span className="font-mono text-white">
                {formatCurrency(calculations.tipAmount, selectedCurrency)}
              </span>
            </div>
            <div className="pt-2 border-t border-emerald-800 flex justify-between font-bold text-sm text-emerald-100">
              <span>Grand Total:</span>
              <span className="font-mono text-white">
                {formatCurrency(calculations.total, selectedCurrency)}
              </span>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Breakdown for Chat'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
