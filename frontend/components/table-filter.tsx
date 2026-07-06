'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, ChevronDown } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface TableFilterProps {
  title: string;
  options: FilterOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export function TableFilter({ title, options, selectedValue, onChange, onClear }: TableFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = options.find(opt => opt.value === selectedValue)?.label || title;

  return (
    <div className="relative w-full sm:w-auto">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 sm:min-w-[220px] ${
          selectedValue
            ? 'border-brand-primary/35 bg-brand-primary/5 text-foreground shadow-sm'
            : 'border-border bg-card/95 text-foreground hover:border-brand-primary/25 hover:shadow-md'
        }`}
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
            <Filter className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {title}
            </p>
            <p className="truncate text-sm font-semibold text-foreground">{selectedLabel}</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-border bg-card/98 shadow-xl backdrop-blur-xl"
          >
            <div className="p-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                    selectedValue === option.value
                      ? 'bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/20'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  {selectedValue === option.value && (
                    <span className="h-2 w-2 rounded-full bg-brand-primary" />
                  )}
                </button>
              ))}
            </div>
            {onClear && selectedValue && (
              <div className="border-t border-border p-2">
                <button
                  onClick={() => {
                    onClear();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/10"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm">Effacer le filtre</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
