'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
}

export function TablePagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  itemsPerPage,
  totalItems 
}: TablePaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between gap-4">
      {totalItems !== undefined && itemsPerPage !== undefined && (
        <div className="text-sm text-muted-foreground">
          Affichage de {(currentPage - 1) * itemsPerPage + 1} à{' '}
          {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} éléments
        </div>
      )}

      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-card border border-border text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-card border border-border text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={typeof page === 'string'}
              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                currentPage === page
                  ? 'bg-gradient-to-r from-brand-primary to-brand-primary-light text-white shadow-lg shadow-brand-primary/20'
                  : typeof page === 'string'
                  ? 'text-muted-foreground cursor-default'
                  : 'bg-card border border-border text-foreground hover:bg-secondary'
              }`}
            >
              {page}
            </motion.button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-card border border-border text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-card border border-border text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
