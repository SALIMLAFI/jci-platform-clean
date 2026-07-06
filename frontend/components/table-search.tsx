'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

interface TableSearchProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export function TableSearch({ placeholder, value, onChange, onClear }: TableSearchProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative flex w-full items-center overflow-hidden rounded-2xl border bg-card/95 px-3 py-2 transition-all duration-300 ${
        isFocused
          ? 'border-brand-primary/50 shadow-lg shadow-brand-primary/10 ring-4 ring-brand-primary/5'
          : 'border-border hover:border-brand-primary/30 hover:shadow-md'
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary transition-colors group-hover:bg-brand-primary/15">
        <Search className="h-5 w-5" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="flex-1 border-none bg-transparent px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
      />
      {value && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          className="mr-1 flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Effacer la recherche"
        >
          <X className="w-4 h-4" />
        </motion.button>
      )}
    </motion.div>
  );
}
