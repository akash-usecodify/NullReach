import React from 'react';
import { 
  X, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Coins, 
  Sparkles, 
  Clock,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTopUp: () => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  onOpenTopUp,
}) => {
  const { currentUser, transactions } = useAuth();

  if (!isOpen) return null;

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Liquid backdrop */}
      <div 
        className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        id="history-modal"
        className="relative w-full max-w-lg bg-[#0D0D0F] rounded-[36px] p-6 sm:p-8 shadow-2xl border border-white/10 z-10 animate-in fade-in zoom-in-95 duration-200 text-white"
      >
        <button
          id="close-history-modal-btn"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold uppercase tracking-widest text-purple-300 mb-2">
              <History className="w-3.5 h-3.5" />
              <span>Credit Ledger</span>
            </div>
            <h2 className="font-serif italic text-2xl sm:text-3xl text-white">
              Credit History
            </h2>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-white/40 block">Available Balance</span>
            <span className="font-serif italic font-bold text-xl text-purple-300">
              {currentUser?.credits || 0} Credits
            </span>
          </div>
        </div>

        {/* Ledger List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-white/40 text-xs">
              No transactions recorded yet.
            </div>
          ) : (
            transactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-[22px] bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'bonus' 
                        ? 'bg-purple-500/15 text-purple-300' 
                        : isPositive 
                        ? 'bg-emerald-500/15 text-emerald-300' 
                        : 'bg-white/5 text-white/40'
                    }`}>
                      {tx.type === 'bonus' ? (
                        <Sparkles className="w-4 h-4" />
                      ) : isPositive ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-white">
                        {tx.description}
                      </p>
                      <p className="text-[11px] text-white/40 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-white/30" />
                        <span>{formatDate(tx.timestamp)}</span>
                        {tx.priceUsd && (
                          <span className="text-purple-300 font-medium">
                            • ${tx.priceUsd.toFixed(2)} USD
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className={`font-mono font-bold text-sm ${
                    isPositive ? 'text-emerald-400' : 'text-white/40'
                  }`}>
                    {isPositive ? `+${tx.amount}` : tx.amount}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Top Up trigger */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenTopUp();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-purple-200 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Top Up More Credits (10 for $2 USD)</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white/50 bg-white/5 hover:bg-white/10 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
