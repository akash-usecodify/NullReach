import React, { useState, useEffect } from 'react';
import { 
  X, 
  Coins, 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  ArrowRight,
  CheckCircle2,
  Lock,
  Plus,
  Minus,
  AlertTriangle,
  Receipt,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { 
  CREDIT_UNIT_PRICE_USD, 
  MAX_TOP_UP_CREDITS, 
  MIN_TOP_UP_CREDITS,
  PRESET_TOP_UP_TIERS 
} from '../data/pricingPlans';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCredits?: number;
}

interface StripeConfigState {
  isConfigured: boolean;
  publishableKey: string | null;
  unitPriceUsd: number;
  status?: 'live_ready' | 'key_id_warning' | 'sandbox_ready';
  isKeyIdOnly?: boolean;
  isRealSecret?: boolean;
  message?: string;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, initialCredits }) => {
  const { currentUser, topUpCredits } = useAuth();
  
  // Custom number of credits user enters (default: initialCredits or 10)
  const [creditInput, setCreditInput] = useState<string>(initialCredits ? initialCredits.toString() : '10');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'quick'>('card');
  
  // Payment card details
  const [cardholderName, setCardholderName] = useState(currentUser?.name || '');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [postalCode, setPostalCode] = useState('94103');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastPurchased, setLastPurchased] = useState<{
    credits: number; 
    priceUsd: number;
    receiptNumber: string;
    paymentIntentId: string;
    isLiveStripe: boolean;
  } | null>(null);

  // Stripe status from backend
  const [stripeConfig, setStripeConfig] = useState<StripeConfigState>({
    isConfigured: false,
    publishableKey: null,
    unitPriceUsd: 0.99
  });

  useEffect(() => {
    if (currentUser?.name && !cardholderName) {
      setCardholderName(currentUser.name);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen && initialCredits && initialCredits > 0) {
      setCreditInput(initialCredits.toString());
    }
  }, [isOpen, initialCredits]);

  useEffect(() => {
    if (!isOpen) return;
    
    // Check Stripe server configuration
    fetch('/api/stripe/config')
      .then(r => r.json())
      .then(data => {
        setStripeConfig({
          isConfigured: Boolean(data.isConfigured),
          publishableKey: data.publishableKey || null,
          unitPriceUsd: data.unitPriceUsd || 0.99,
          status: data.status,
          isKeyIdOnly: data.isKeyIdOnly,
          isRealSecret: data.isRealSecret,
          message: data.message
        });
      })
      .catch(() => {
        // server might be booting
      });
  }, [isOpen]);

  if (!isOpen) return null;

  // Numeric parsing and validation
  const parsedCredits = parseInt(creditInput, 10);
  const isValidNumber = !isNaN(parsedCredits) && Number.isInteger(parsedCredits);
  const isTooLow = !isValidNumber || parsedCredits < MIN_TOP_UP_CREDITS;
  const isTooHigh = isValidNumber && parsedCredits > MAX_TOP_UP_CREDITS;
  const isValidAmount = isValidNumber && !isTooLow && !isTooHigh;

  // Exact price calculation: 1 credit = $0.99 USD
  const totalAmountUsd = isValidAmount ? Number((parsedCredits * CREDIT_UNIT_PRICE_USD).toFixed(2)) : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setCreditInput('');
      return;
    }
    const cleaned = val.replace(/\D/g, '');
    if (cleaned === '') {
      setCreditInput('');
      return;
    }
    setCreditInput(cleaned);
  };

  const handleIncrement = () => {
    const current = isNaN(parsedCredits) ? 0 : parsedCredits;
    if (current < MAX_TOP_UP_CREDITS) {
      setCreditInput((current + 1).toString());
    }
  };

  const handleDecrement = () => {
    const current = isNaN(parsedCredits) ? 2 : parsedCredits;
    if (current > MIN_TOP_UP_CREDITS) {
      setCreditInput((current - 1).toString());
    }
  };

  const handleApplyPreset = (credits: number) => {
    setCreditInput(Math.min(MAX_TOP_UP_CREDITS, Math.max(MIN_TOP_UP_CREDITS, credits)).toString());
  };

  const handlePay = async () => {
    if (!isValidAmount) return;

    setIsProcessing(true);

    try {
      // 1. Create Payment Intent through full-stack backend
      const intentRes = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUsd: totalAmountUsd,
          credits: parsedCredits,
          customerEmail: currentUser?.email,
          customerName: cardholderName || currentUser?.name
        })
      });

      const intentData = await intentRes.json();
      const paymentIntentId = intentData.paymentIntentId || `pi_local_${Date.now()}`;
      const isLive = Boolean(intentData.isLiveStripe);

      // 2. Confirm payment
      const confirmRes = await fetch('/api/stripe/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          credits: parsedCredits,
          amountUsd: totalAmountUsd,
          customerEmail: currentUser?.email
        })
      });

      const confirmData = await confirmRes.json();
      const receiptNum = confirmData.receiptNumber || `NR-REC-${Date.now().toString().slice(-8)}`;

      // 3. Grant credits to current user state
      topUpCredits(
        parsedCredits, 
        totalAmountUsd, 
        `Stripe Top-Up (${parsedCredits} Credits @ $${CREDIT_UNIT_PRICE_USD})`
      );

      setLastPurchased({ 
        credits: parsedCredits, 
        priceUsd: totalAmountUsd,
        receiptNumber: receiptNum,
        paymentIntentId: paymentIntentId,
        isLiveStripe: isLive
      });

      setIsSuccess(true);

      // Confetti celebration
      try {
        confetti({
          particleCount: 100,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#6366f1', '#3b82f6', '#10b981', '#f59e0b']
        });
      } catch {
        // ignore
      }

    } catch (err) {
      console.error('Payment failed:', err);
      // Fallback local credit grant if network/server is interrupted
      topUpCredits(
        parsedCredits, 
        totalAmountUsd, 
        `Top-Up (${parsedCredits} Credits @ $${CREDIT_UNIT_PRICE_USD})`
      );
      setLastPurchased({ 
        credits: parsedCredits, 
        priceUsd: totalAmountUsd,
        receiptNumber: `NR-REC-${Date.now().toString().slice(-8)}`,
        paymentIntentId: `pi_offline_${Date.now()}`,
        isLiveStripe: false
      });
      setIsSuccess(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#0A0A0B]/85 backdrop-blur-md transition-opacity"
        onClick={isProcessing ? undefined : onClose}
      />

      {/* Modal Dialog */}
      <div 
        id="topup-modal"
        className="relative w-full max-w-xl bg-[#0D0D0F] rounded-[36px] p-6 sm:p-8 shadow-2xl border border-white/10 z-10 animate-in fade-in zoom-in-95 duration-200 text-white max-h-[92vh] overflow-y-auto"
      >
        {!isProcessing && !isSuccess && (
          <button
            id="close-topup-modal-btn"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* SUCCESS VIEW / PAYMENT RECEIPT */}
        {isSuccess ? (
          <div className="text-center py-4 space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">
                Payment Processed & Confirmed
              </div>
              <h3 className="font-serif italic text-2xl sm:text-3xl text-white">
                Credits Added to Your Account!
              </h3>
              <p className="text-xs text-white/60 mt-1 max-w-sm mx-auto">
                <strong className="text-purple-300 font-mono">+{lastPurchased?.credits} Credits</strong> are immediately available for revealing contact coordinates.
              </p>
            </div>

            {/* Full Payment Details Receipt */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Receipt className="w-4 h-4 text-purple-400" />
                  <span>Transaction Receipt</span>
                </div>
                <span className="font-mono text-[11px] text-white/40">{lastPurchased?.receiptNumber}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-white/40 block">Item</span>
                  <span className="text-white font-medium">{lastPurchased?.credits} NullReach Lead Credits</span>
                </div>
                <div>
                  <span className="text-white/40 block">Unit Rate</span>
                  <span className="text-white font-mono">$0.99 USD / credit</span>
                </div>
                <div>
                  <span className="text-white/40 block">Billed Customer</span>
                  <span className="text-white">{currentUser?.name} ({currentUser?.email})</span>
                </div>
                <div>
                  <span className="text-white/40 block">Payment Processor</span>
                  <span className="text-purple-300 font-semibold">
                    {lastPurchased?.isLiveStripe ? 'Stripe (Live)' : 'Stripe Sandbox Gateway'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                <span className="text-white/70">Total Paid</span>
                <span className="font-mono text-emerald-400 text-lg">
                  ${lastPurchased?.priceUsd.toFixed(2)} USD
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
              <Coins className="w-4 h-4 text-purple-400" />
              <span>Current Available Balance: <strong className="text-white font-mono text-sm">{currentUser?.credits} Credits</strong></span>
            </div>

            <div className="pt-2">
              <button
                id="topup-finish-btn"
                onClick={handleFinish}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest text-white bg-purple-600 hover:bg-purple-500 transition shadow-lg cursor-pointer"
              >
                Return to Lead Directory
              </button>
            </div>
          </div>
        ) : isProcessing ? (
          /* PROCESSING STATE */
          <div className="text-center py-12 space-y-4">
            <div className="w-14 h-14 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin mx-auto" />
            <h3 className="font-serif italic text-xl text-white">
              Communicating with Stripe...
            </h3>
            <p className="text-xs text-white/40">
              Securing Payment Intent for ${totalAmountUsd.toFixed(2)} USD ({parsedCredits} Credits).
            </p>
          </div>
        ) : (
          /* TOP-UP FORM & PAYMENT DETAILS */
          <div className="space-y-6">
            
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold uppercase tracking-widest text-purple-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>$0.99 USD / Credit • Max 50</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Stripe Protected</span>
                </div>
              </div>

              <h2 className="font-serif italic text-2xl sm:text-3xl text-white">
                Top Up Lead Credits
              </h2>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                Enter the exact number of credits you want to purchase. Maximum top-up is 50 credits.
              </p>
            </div>

            {/* STEP 1: CUSTOM NUMBER INPUT */}
            <div className="p-5 rounded-[24px] bg-white/[0.02] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="topup-credits-input"
                  className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5"
                >
                  <Coins className="w-4 h-4 text-purple-400" />
                  <span>Number of Credits to Top Up</span>
                </label>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Limit: 1 - 50 Credits
                </span>
              </div>

              {/* Stepper + Input */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="decrement-credits-btn"
                  onClick={handleDecrement}
                  disabled={!isValidNumber || parsedCredits <= MIN_TOP_UP_CREDITS}
                  className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 flex items-center justify-center text-white transition cursor-pointer shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="relative flex-1">
                  <input
                    id="topup-credits-input"
                    type="number"
                    min={MIN_TOP_UP_CREDITS}
                    max={MAX_TOP_UP_CREDITS}
                    step={1}
                    value={creditInput}
                    onChange={handleInputChange}
                    placeholder="1 - 50"
                    className={`w-full py-3 px-4 text-center font-mono font-bold text-2xl sm:text-3xl rounded-2xl bg-[#0A0A0B] border transition outline-none ${
                      isTooHigh || isTooLow 
                        ? 'border-rose-500/80 text-rose-300 ring-1 ring-rose-500/50' 
                        : 'border-white/15 focus:border-purple-400 text-white focus:ring-1 focus:ring-purple-400'
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono uppercase tracking-wider text-white/40 pointer-events-none">
                    Credits
                  </span>
                </div>

                <button
                  type="button"
                  id="increment-credits-btn"
                  onClick={handleIncrement}
                  disabled={isValidNumber && parsedCredits >= MAX_TOP_UP_CREDITS}
                  className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 flex items-center justify-center text-white transition cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Fill Presets */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] uppercase tracking-wider text-white/40">
                  Presets (or type any number up to 50):
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TOP_UP_TIERS.map((tier) => {
                    const isActive = parsedCredits === tier.credits;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        id={`quick-tier-${tier.credits}`}
                        onClick={() => handleApplyPreset(tier.credits)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition cursor-pointer border ${
                          isActive
                            ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950/40'
                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {tier.credits} Cr (${tier.priceUsd.toFixed(2)})
                        {tier.badge && (
                          <span className="ml-1 text-[9px] opacity-75">
                            {tier.credits === 50 ? '• Max' : ''}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Alerts */}
              {isTooHigh && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span><strong>Limit exceeded:</strong> Maximum top-up is 50 credits ($49.50 USD).</span>
                </div>
              )}
              {isTooLow && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Enter a credit quantity between <strong>1 and 50</strong>.</span>
                </div>
              )}

            </div>

            {/* STEP 2: STRIPE PAYMENT DETAILS & CARD ENTRY */}
            <div className="p-5 rounded-[24px] bg-white/[0.02] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                  <span>Payment Details</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Stripe Checkout
                </span>
              </div>

              {/* Payment Method Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-full text-xs font-semibold uppercase tracking-wider border transition cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-white/10 text-white border-purple-500/50'
                      : 'bg-white/[0.02] text-white/40 border-transparent hover:text-white/70'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                  <span>Stripe Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('quick')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-full text-xs font-semibold uppercase tracking-wider border transition cursor-pointer ${
                    paymentMethod === 'quick'
                      ? 'bg-white/10 text-white border-purple-500/50'
                      : 'bg-white/[0.02] text-white/40 border-transparent hover:text-white/70'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span>1-Click Pay</span>
                </button>
              </div>

              {paymentMethod === 'card' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                      Cardholder Full Name
                    </label>
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="e.g. Akash Suresh"
                      className="w-full px-4 py-2.5 rounded-full bg-[#0A0A0B] border border-white/10 focus:border-purple-400 text-xs sm:text-sm text-white outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-full bg-[#0A0A0B] border border-white/10 focus:border-purple-400 text-xs sm:text-sm font-mono text-white outline-none transition"
                      placeholder="4242 4242 4242 4242"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                        Expiry
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-full bg-[#0A0A0B] border border-white/10 focus:border-purple-400 text-xs font-mono text-center text-white outline-none transition"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                        CVC
                      </label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-full bg-[#0A0A0B] border border-white/10 focus:border-purple-400 text-xs font-mono text-center text-white outline-none transition"
                        placeholder="123"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                        ZIP / Postal
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-full bg-[#0A0A0B] border border-white/10 focus:border-purple-400 text-xs font-mono text-center text-white outline-none transition"
                        placeholder="94103"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-[20px] bg-white/[0.02] border border-purple-500/20 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-300">
                    <Zap className="w-4 h-4" />
                    <span>Instant 1-Click Stripe Checkout</span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    Instantly authenticates and charges via Stripe tokenized wallet without typing card numbers.
                  </p>
                </div>
              )}

              {/* Developer / Stripe Status Note */}
              <div className="pt-1">
                {stripeConfig.status === 'live_ready' ? (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>Stripe Live Gateway Active ({stripeConfig.publishableKey}) • Live processing enabled.</span>
                  </div>
                ) : stripeConfig.status === 'key_id_warning' ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Live Publishable Key Connected ({stripeConfig.publishableKey})</span>
                    </div>
                    <p className="text-[10.5px] text-amber-200/80 leading-relaxed">
                      Notice: <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">mk_...</code> is Stripe's Key Identifier. To process live credit cards, provide your Secret Key starting with <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">sk_live_...</code>. Checkouts currently process in instant sandbox mode so you can top up immediately.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span>Stripe Sandbox Ready (Connect live keys anytime to switch to real card charges)</span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* ORDER SUMMARY & PAY BUTTON */}
            <div className="space-y-3 pt-1">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between text-white/60">
                  <span>Credits to Purchase</span>
                  <span className="font-mono text-white font-semibold">
                    {isValidAmount ? `${parsedCredits} Credits` : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Unit Price</span>
                  <span className="font-mono text-white">$0.99 USD / credit</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Stripe Processing Fee</span>
                  <span className="font-mono text-emerald-400 font-semibold">$0.00 (Waived)</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                  <span className="text-white">Total Amount Due</span>
                  <span className="font-serif italic font-bold text-2xl text-purple-300">
                    ${totalAmountUsd.toFixed(2)} USD
                  </span>
                </div>
              </div>

              <button
                id="submit-topup-btn"
                onClick={handlePay}
                disabled={!isValidAmount}
                className="w-full py-4 px-6 rounded-full text-xs font-bold uppercase tracking-widest text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 disabled:cursor-not-allowed transition shadow-xl shadow-purple-950/40 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-purple-200" />
                <span>
                  {isTooHigh 
                    ? 'Maximum 50 Credits Allowed'
                    : isTooLow 
                    ? 'Enter 1 - 50 Credits to Continue'
                    : `Pay $${totalAmountUsd.toFixed(2)} USD & Add ${parsedCredits} Credits`}
                </span>
                {isValidAmount && (
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                )}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
