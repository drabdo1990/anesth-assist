import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Delete, Check } from 'lucide-react';
import { useDialogFocus } from '../lib/useDialogFocus';

interface KeypadModalProps {
  title: string;
  initialValue: number;
  unit: string;
  min?: number;
  max?: number;
  allowDecimal?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (val: number) => void;
}

export const KeypadModal: React.FC<KeypadModalProps> = ({
  title,
  initialValue,
  unit,
  min = 1,
  max = 350,
  allowDecimal = true,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [valueStr, setValueStr] = useState<string>(initialValue.toString());
  const [isPristine, setIsPristine] = useState<boolean>(true);
  const dialogRef = useDialogFocus<HTMLDivElement>(isOpen, onClose);

  // Re-sync with the current value each time the keypad opens
  useEffect(() => {
    if (isOpen) {
      setValueStr(initialValue.toString());
      setIsPristine(true);
    }
  }, [isOpen, initialValue]);

  const handleDigit = (digit: string) => {
    if (isPristine) {
      setIsPristine(false);
      if (digit === '.') {
        if (!allowDecimal) return;
        setValueStr('0.');
      } else {
        setValueStr(digit);
      }
      return;
    }

    if (valueStr.length >= 8) return;
    if (digit === '.') {
      if (!allowDecimal || valueStr.includes('.')) return;
      setValueStr((prev) => (prev === '' ? '0.' : prev + '.'));
    } else {
      if (valueStr === '0') {
        setValueStr(digit);
      } else {
        setValueStr((prev) => prev + digit);
      }
    }
  };

  const handleBackspace = () => {
    setIsPristine(false);
    setValueStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : ''));
  };

  const handleClear = () => {
    setIsPristine(false);
    setValueStr('');
  };

  const parsedValue = parseFloat(valueStr);
  // Out-of-range or empty input is rejected, never silently clamped.
  const rangeError =
    valueStr === '' || isNaN(parsedValue)
      ? null
      : parsedValue < min || parsedValue > max
        ? `Must be between ${min} and ${max} ${unit}.`
        : null;
  const canConfirm = valueStr !== '' && !isNaN(parsedValue) && rangeError === null;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(parsedValue);
    onClose();
  };

  // Keyboard support for desktop / laptop users
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === '.') {
        handleDigit('.');
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, valueStr, isPristine, canConfirm]);

  if (!isOpen) return null;

  // Portal to <body>: the sticky header's backdrop-filter would otherwise become the
  // containing block for this fixed overlay, clipping it to the header's height.
  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 sm:gap-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-sm font-semibold tracking-wider text-slate-200 uppercase block">{title}</span>
            <span className="text-[10px] text-slate-400 font-mono">Range: {min} – {max} {unit}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg active:bg-slate-800 touch-target flex items-center justify-center"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display */}
        <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-3 flex items-baseline justify-end gap-2 shadow-inner">
          <span className="text-3xl font-mono font-bold text-cyan-300">
            {valueStr || '0'}
          </span>
          <span className="text-sm font-semibold text-slate-400">{unit}</span>
        </div>
        {rangeError && (
          <p role="alert" className="-mt-1 text-xs font-semibold text-red-300">
            {rangeError}
          </p>
        )}

        {/* Keypad Grid (Touch targets >= 52px) */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((key) => (
            <button
              key={key}
              onClick={() => handleDigit(key)}
              className="h-14 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 active:text-white text-slate-100 font-mono text-2xl font-bold rounded-xl border border-slate-700/60 shadow transition-colors flex items-center justify-center select-none"
            >
              {key}
            </button>
          ))}

          {/* Bottom row */}
          <button
            onClick={() => handleDigit('.')}
            disabled={!allowDecimal}
            className={`h-14 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-slate-100 font-mono text-2xl font-bold rounded-xl border border-slate-700/60 shadow flex items-center justify-center ${
              !allowDecimal ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            .
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="h-14 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 active:text-white text-slate-100 font-mono text-2xl font-bold rounded-xl border border-slate-700/60 shadow flex items-center justify-center select-none"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="h-14 bg-slate-800/80 hover:bg-slate-700 active:bg-red-600 text-slate-300 active:text-white rounded-xl border border-slate-700/60 shadow flex items-center justify-center"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Action row */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={handleClear}
            className="h-12 bg-slate-800 text-slate-400 hover:text-slate-100 font-semibold rounded-xl border border-slate-700 flex items-center justify-center"
          >
            Clear
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="h-12 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-xl shadow-glow-cyan flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            Set
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
