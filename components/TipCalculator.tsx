'use client';

import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { calculateTipFromPercent } from '@/lib/calculations';
import Input from './Input';
import Button from './Button';

interface TipCalculatorProps {
  subtotal: number;
  tax: number;
  onTaxChange: (tax: number) => void;
  tipAmount: number;
  onTipChange: (tip: number) => void;
  splitEvenly: boolean;
  onSplitEvenlyChange: (value: boolean) => void;
}

export default function TipCalculator({
  subtotal,
  tax,
  onTaxChange,
  tipAmount,
  onTipChange,
  splitEvenly,
  onSplitEvenlyChange,
}: TipCalculatorProps) {
  const [tipMode, setTipMode] = useState<'percent' | 'dollar'>('percent');
  const [tipPercent, setTipPercent] = useState(20);
  const [tipDollar, setTipDollar] = useState('');
  const [taxInput, setTaxInput] = useState(tax === 0 ? '' : tax.toFixed(2));
  const taxInputFocused = useRef(false);

  useEffect(() => {
    if (tipMode === 'percent') {
      onTipChange(calculateTipFromPercent(subtotal, tax, tipPercent));
    }
  }, [tipMode, tipPercent, subtotal, tax, onTipChange]);

  // Only sync from prop when not actively editing (e.g., receipt upload)
  useEffect(() => {
    if (!taxInputFocused.current) {
      setTaxInput(tax === 0 ? '' : tax.toFixed(2));
    }
  }, [tax]);

  const handleTaxChange = (value: string) => {
    setTaxInput(value);
    const parsed = parseFloat(value);
    if (value === '' || (parsed === 0)) {
      onTaxChange(0);
    } else if (!isNaN(parsed) && parsed >= 0) {
      onTaxChange(parsed);
    }
  };

  const handleTaxBlur = () => {
    taxInputFocused.current = false;
    // Format on blur, keep empty if 0
    const parsed = parseFloat(taxInput);
    if (taxInput === '' || parsed === 0) {
      setTaxInput('');
      onTaxChange(0);
    } else if (!isNaN(parsed) && parsed >= 0) {
      setTaxInput(parsed.toFixed(2));
    }
  };

  const handleTipDollarChange = (value: string) => {
    setTipDollar(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      onTipChange(parsed);
    }
  };

  const handlePercentClick = (percent: number) => {
    setTipMode('percent');
    setTipPercent(percent);
  };

  const total = subtotal + tax + tipAmount;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h2 className="text-xl font-semibold text-slate-700 mb-4">Tax & Tip</h2>

      {/* Tax input */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-slate-700 mb-2">Tax</label>
        <Input
          type="number"
          value={taxInput}
          onChange={(e) => handleTaxChange(e.target.value)}
          onFocus={() => { taxInputFocused.current = true; }}
          onBlur={handleTaxBlur}
          prefix="$"
          step="0.01"
          min="0"
        />
      </div>

      {/* Tip section */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-slate-700 mb-2">Tip</label>

        {/* Quick percent buttons */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[15, 18, 20, 25].map((percent) => (
            <Button
              key={percent}
              variant="chip"
              active={tipMode === 'percent' && tipPercent === percent}
              onClick={() => handlePercentClick(percent)}
              className="text-sm"
            >
              {percent}%
            </Button>
          ))}
        </div>

        {/* Custom input */}
        <div className="flex gap-2">
          <Input
            type="number"
            value={tipMode === 'dollar' ? tipDollar : tipAmount.toFixed(2)}
            onChange={(e) => {
              setTipMode('dollar');
              handleTipDollarChange(e.target.value);
            }}
            onFocus={() => setTipMode('dollar')}
            prefix="$"
            step="0.01"
            min="0"
            placeholder="Custom"
          />
          <Input
            type="number"
            value={tipMode === 'percent' ? tipPercent : ''}
            onChange={(e) => {
              setTipMode('percent');
              setTipPercent(parseFloat(e.target.value) || 0);
            }}
            onFocus={() => setTipMode('percent')}
            suffix="%"
            step="1"
            min="0"
            placeholder="Custom"
          />
        </div>
      </div>

      {/* Split evenly checkbox */}
      <label className="flex items-center gap-3 cursor-pointer py-2 mb-3">
        <input
          type="checkbox"
          checked={splitEvenly}
          onChange={(e) => onSplitEvenlyChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-4 h-4 border border-slate-300 rounded flex items-center justify-center peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-colors">
          {splitEvenly && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>
        <span className="text-sm text-slate-700">Split tax & tip evenly</span>
      </label>

      {/* Totals */}
      <div className="h-px bg-slate-200" />

      <div className="pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span className="text-slate-700 tabular-nums">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Tax</span>
          <span className="text-slate-700 tabular-nums">${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">
            Tip {tipMode === 'percent' && <span className="text-slate-400">({tipPercent}%)</span>}
          </span>
          <span className="text-slate-700 tabular-nums">${tipAmount.toFixed(2)}</span>
        </div>
        <div className="h-px bg-slate-200 mt-7" />
        <div className="flex justify-between items-center pt-4">
          <span className="font-semibold text-slate-900">Total</span>
          <span className="text-xl font-bold text-slate-900 tabular-nums">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
