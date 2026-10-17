import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Calendar, Pill, Receipt, Stethoscope, ArrowRight, X, Sparkles } from 'lucide-react';
import { hospitalService } from '../../services/hospitalService';
import { SearchResultItem } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Record<string, SearchResultItem[]>>({
    patients: [],
    doctors: [],
    appointments: [],
    medicines: [],
    invoices: [],
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ patients: [], doctors: [], appointments: [], medicines: [], invoices: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ patients: [], doctors: [], appointments: [], medicines: [], invoices: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await hospitalService.globalSearch(query);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (link: string) => {
    onClose();
    navigate(link);
  };

  const hasAnyResults = Object.values(results).some((arr) => arr.length > 0);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'patients':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'doctors':
        return <Stethoscope className="w-4 h-4 text-emerald-500" />;
      case 'appointments':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'medicines':
        return <Pill className="w-4 h-4 text-amber-500" />;
      case 'invoices':
        return <Receipt className="w-4 h-4 text-teal-500" />;
      default:
        return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <Search className="w-5 h-5 text-brand-500 mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patients by MRN, doctors, appointments, medications, invoices... (Ctrl + K)"
                className="w-full text-base bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Actions if query is empty */}
            {!query && (
              <div className="p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 block px-2">
                  Quick Navigation
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'Book Appointment', link: '/appointments', icon: <Calendar className="w-4 h-4 text-blue-500" /> },
                    { label: 'Patient Directory', link: '/patients', icon: <User className="w-4 h-4 text-emerald-500" /> },
                    { label: 'Find Doctors', link: '/doctors', icon: <Stethoscope className="w-4 h-4 text-purple-500" /> },
                    { label: 'Pharmacy Stock', link: '/pharmacy', icon: <Pill className="w-4 h-4 text-amber-500" /> },
                    { label: 'Bed Allocation', link: '/beds', icon: <Sparkles className="w-4 h-4 text-rose-500" /> },
                    { label: 'Billing Invoices', link: '/billing', icon: <Receipt className="w-4 h-4 text-teal-500" /> },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(item.link)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">{item.icon}</div>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results Display */}
            {query && (
              <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
                {loading ? (
                  <div className="py-8 text-center text-sm text-slate-400 animate-pulse">
                    Searching clinical database...
                  </div>
                ) : hasAnyResults ? (
                  Object.entries(results).map(([category, items]) => {
                    if (items.length === 0) return null;
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {getCategoryIcon(category)}
                          <span>{category}</span>
                        </div>
                        {items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelect(item.link)}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer group transition-colors"
                          >
                            <div>
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                                {item.title}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {item.subtitle}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                          </div>
                        ))}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-sm text-slate-400">
                    No clinical records matching "{query}"
                  </div>
                )}
              </div>
            )}

            {/* Footer shortcut info */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Navigate with cursor or arrows</span>
              <span>ESC to close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
