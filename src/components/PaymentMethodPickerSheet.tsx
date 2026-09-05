import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Wallet,
  CalendarClock,
  Smartphone,
  CreditCard,
  Landmark,
  Banknote,
  Check,
  ChevronRight,
  AlertCircle,
  Info,
  Plus } from
'lucide-react';
import {
  paymentTypeKind,
  paymentTypeSubtitle,
  parsePaymentPercent,
  paymentTotalWithFee,
  type ApiPaymentType
} from '../services/guestApi';
export type PaymentMethodId =
'wallet' |
'bnpl' |
'mobile_money' |
'card' |
'bank' |
'cod' |
'gateway';
export interface InstallmentPlan {
  id: string;
  count: number;
  intervalDays: number;
  feeRate: number; // e.g. 0.02 = 2%
}
export const INSTALLMENT_PLANS: InstallmentPlan[] = [
{
  id: '3m',
  count: 3,
  intervalDays: 30,
  feeRate: 0
},
{
  id: '4b',
  count: 4,
  intervalDays: 14,
  feeRate: 0.02
},
{
  id: '6m',
  count: 6,
  intervalDays: 30,
  feeRate: 0.05
}];

export interface MobileMoneyProvider {
  id: string;
  name: string;
  color: string;
  initial: string;
}
export const MOBILE_MONEY_PROVIDERS: MobileMoneyProvider[] = [
{
  id: 'telebirr',
  name: 'Telebirr',
  color: 'bg-orange-500',
  initial: 'T'
},
{
  id: 'cbe',
  name: 'CBE Birr',
  color: 'bg-teal-600',
  initial: 'C'
},
{
  id: 'awash',
  name: 'Awash Birr',
  color: 'bg-rose-600',
  initial: 'A'
},
{
  id: 'dashen',
  name: 'Dashen Birr',
  color: 'bg-blue-600',
  initial: 'D'
}];

export interface SavedCard {
  id: string;
  brand: 'Visa' | 'Mastercard';
  last4: string;
  expiry: string;
}
export const SAVED_CARDS: SavedCard[] = [
{
  id: 'c1',
  brand: 'Visa',
  last4: '4242',
  expiry: '08/27'
},
{
  id: 'c2',
  brand: 'Mastercard',
  last4: '5588',
  expiry: '03/26'
}];

export interface LinkedBank {
  id: string;
  name: string;
  last4: string;
}
export const LINKED_BANKS: LinkedBank[] = [
{
  id: 'cbe',
  name: 'Commercial Bank of Ethiopia',
  last4: '1234'
},
{
  id: 'dashen',
  name: 'Dashen Bank',
  last4: '5678'
}];

export interface PaymentSelection {
  method: PaymentMethodId;
  label: string;
  sublabel: string;
  apiPaymentTypeId?: number;
  installmentPlanId?: string;
  mobileMoneyProviderId?: string;
  mobileMoneyPhone?: string;
  cardId?: string;
  bankId?: string;
}
export const WALLET_BALANCE = 0;
interface Props {
  open: boolean;
  total: number;
  currencyCode?: string;
  currencyRate?: number;
  /** Live TravellerDashboard AvailableCredit in ETB. */
  walletBalanceEtb?: number;
  apiPaymentTypes?: ApiPaymentType[];
  current: PaymentSelection;
  onClose: () => void;
  onSelect: (selection: PaymentSelection) => void;
}
export function PaymentMethodPickerSheet({
  open,
  total,
  currencyCode = 'ETB',
  currencyRate = 1,
  walletBalanceEtb = 0,
  apiPaymentTypes = [],
  current,
  onClose,
  onSelect
}: Props) {
  const code =
    String(currencyCode || 'ETB')
      .trim()
      .toUpperCase() || 'ETB';
  const walletBalance =
    Math.abs(walletBalanceEtb) * (code === 'ETB' ? 1 : currencyRate);
  const fmt = (n: number) =>
    `${code} ${n.toLocaleString(undefined, {
      maximumFractionDigits: code === 'ETB' ? 0 : 2
    })}`;
  const chargedForType = (type?: ApiPaymentType) =>
    paymentTotalWithFee(total, parsePaymentPercent(type?.Percentage));
  const currentApiType = current.apiPaymentTypeId
    ? apiPaymentTypes.find((type) => type.Id === current.apiPaymentTypeId)
    : current.method === 'wallet'
      ? apiPaymentTypes.find((type) => paymentTypeKind(type) === 'wallet')
      : undefined;
  const headerTotal = chargedForType(currentApiType);
  const [expanded, setExpanded] = useState<PaymentMethodId | null>(null);
  const [planId, setPlanId] = useState(
    current.installmentPlanId ?? INSTALLMENT_PLANS[0].id
  );
  const [mmProvider, setMmProvider] = useState(
    current.mobileMoneyProviderId ?? ''
  );
  const [mmPhone, setMmPhone] = useState(current.mobileMoneyPhone ?? '');
  const [cardId, setCardId] = useState(
    current.cardId ?? SAVED_CARDS[0]?.id ?? ''
  );
  const [bankId, setBankId] = useState(
    current.bankId ?? LINKED_BANKS[0]?.id ?? ''
  );
  useEffect(() => {
    if (open) {
      setExpanded(null);
      setPlanId(current.installmentPlanId ?? INSTALLMENT_PLANS[0].id);
      setMmProvider(current.mobileMoneyProviderId ?? '');
      setMmPhone(current.mobileMoneyPhone ?? '');
      setCardId(current.cardId ?? SAVED_CARDS[0]?.id ?? '');
      setBankId(current.bankId ?? LINKED_BANKS[0]?.id ?? '');
    }
  }, [open, current]);
  const walletInsufficient = walletBalance < total;
  const confirm = (id: PaymentMethodId) => {
    let selection: PaymentSelection | null = null;
    if (id === 'wallet') {
      selection = {
        method: 'wallet',
        label: 'mKash Wallet',
        sublabel: `Balance ${fmt(walletBalance)}`
      };
    } else if (id === 'bnpl') {
      const plan = INSTALLMENT_PLANS.find((p) => p.id === planId);
      if (!plan) return;
      const totalWithFee = total * (1 + plan.feeRate);
      const per = totalWithFee / plan.count;
      selection = {
        method: 'bnpl',
        label: 'Buy Now, Pay Later',
        sublabel: `${plan.count} × ${fmt(Math.round(per))} every ${plan.intervalDays}d`,
        installmentPlanId: plan.id
      };
    } else if (id === 'mobile_money') {
      const provider = MOBILE_MONEY_PROVIDERS.find((p) => p.id === mmProvider);
      if (!provider || mmPhone.trim().length < 9) return;
      selection = {
        method: 'mobile_money',
        label: provider.name,
        sublabel: mmPhone.trim(),
        mobileMoneyProviderId: provider.id,
        mobileMoneyPhone: mmPhone.trim()
      };
    } else if (id === 'card') {
      const card = SAVED_CARDS.find((c) => c.id === cardId);
      if (!card) return;
      selection = {
        method: 'card',
        label: `${card.brand} •••• ${card.last4}`,
        sublabel: `Expires ${card.expiry}`,
        cardId: card.id
      };
    } else if (id === 'bank') {
      const bank = LINKED_BANKS.find((b) => b.id === bankId);
      if (!bank) return;
      selection = {
        method: 'bank',
        label: bank.name,
        sublabel: `Account •••• ${bank.last4}`,
        bankId: bank.id
      };
    } else if (id === 'cod') {
      selection = {
        method: 'cod',
        label: 'Cash on Delivery',
        sublabel: 'Pay the courier in cash'
      };
    }
    if (selection) {
      onSelect(selection);
      onClose();
    }
  };
  const confirmApiType = (type: ApiPaymentType) => {
    const kind = paymentTypeKind(type);
    if (kind === 'wallet') {
      confirm('wallet');
      return;
    }
    const method: PaymentMethodId =
      kind === 'card' ? 'card' : kind === 'bank' ? 'bank' : 'gateway';
    onSelect({
      method,
      label: type.PaymentType,
      sublabel: paymentTypeSubtitle(type),
      apiPaymentTypeId: type.Id
    });
    onClose();
  };
  const apiIcon = (type: ApiPaymentType) => {
    const kind = paymentTypeKind(type);
    if (kind === 'wallet') return <Wallet className="w-4 h-4" />;
    if (kind === 'bank') return <Landmark className="w-4 h-4" />;
    if (kind === 'upi') return <Smartphone className="w-4 h-4" />;
    if (kind === 'card') return <CreditCard className="w-4 h-4" />;
    return <Banknote className="w-4 h-4" />;
  };
  const hasApiTypes = apiPaymentTypes.length > 0;
  const renderRow = (
  id: PaymentMethodId,
  icon: React.ReactNode,
  title: string,
  subtitle: string,
  badge?: string,
  disabled?: boolean) =>
  {
    const isExpanded = expanded === id;
    const isCurrent = current.method === id;
    return (
      <div
        key={id}
        className={
        'rounded-ios-lg shadow-ios-sm transition-all duration-ios overflow-hidden ' + (
        isExpanded ?
        'ring-2 ring-primary bg-primary-light/20' :
        isCurrent ?
        'ring-1 ring-primary/50 glass-card' :
        'glass-card')
        }>
        
        <button
          onClick={() => !disabled && setExpanded(isExpanded ? null : id)}
          disabled={disabled}
          className="w-full flex items-center gap-3 p-3.5 text-left active:opacity-90 disabled:opacity-50">
          
          <div
            className={
            'w-10 h-10 rounded-ios-md flex items-center justify-center shrink-0 ' + (
            isExpanded || isCurrent ?
            'bg-primary text-white' :
            'glass-muted text-text-secondary')
            }>
            
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[13px] font-semibold text-text-primary">
                {title}
              </p>
              {isCurrent &&
              <span className="text-[11px] uppercase tracking-wide font-bold text-primary bg-primary-light/60 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" />
                  Current
                </span>
              }
              {badge && !isCurrent &&
              <span className="text-[11px] uppercase tracking-wide font-bold text-primary bg-primary-light/60 px-1.5 py-0.5 rounded">
                  {badge}
                </span>
              }
            </div>
            <p className="text-[11px] text-text-secondary truncate">
              {isCurrent ? current.sublabel : subtitle}
            </p>
          </div>
          <div
            className={
            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ' + (
            isCurrent ?
            'border-primary bg-primary' :
            'border-border')
            }>
            
            {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
        </button>
        {/* Inline config */}
        <AnimatePresence initial={false}>
          {isExpanded &&
          <motion.div
            initial={{
              height: 0,
              opacity: 0
            }}
            animate={{
              height: 'auto',
              opacity: 1
            }}
            exit={{
              height: 0,
              opacity: 0
            }}
            transition={{
              duration: 0.2
            }}>
            
              <div className="px-3.5 pb-3.5">{renderConfig(id)}</div>
            </motion.div>
          }
        </AnimatePresence>
      </div>);

  };
  const renderConfig = (id: PaymentMethodId) => {
    if (id === 'wallet') {
      return (
        <div className="space-y-2">
          <div className="rounded-ios-md glass-muted p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-text-secondary">
                Available
              </p>
              <p className="text-[16px] font-bold text-text-primary font-mono">
                {fmt(walletBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-text-secondary">
                Order total
              </p>
              <p className="text-[14px] font-semibold text-text-primary font-mono">
                {fmt(total)}
              </p>
            </div>
          </div>
          {walletInsufficient ?
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-error/10">
              <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
              <p className="text-[11px] text-error">
                Insufficient balance. Available {fmt(walletBalance)} — order total{' '}
                {fmt(total)}. Add money or use another method.
              </p>
            </div> :

          <p className="text-[11px] text-text-secondary inline-flex items-center gap-1">
              <Check className="w-3 h-3 text-success" />
              Instant payment · No fees
            </p>
          }
          <button
            onClick={() => confirm('wallet')}
            disabled={walletInsufficient}
            className="ui-btn-primary h-11 text-[13px] w-full disabled:opacity-50">
            
            Use mKash Wallet
          </button>
        </div>);

    }
    if (id === 'bnpl') {
      const plan = INSTALLMENT_PLANS.find((p) => p.id === planId);
      const totalWithFee = plan ? total * (1 + plan.feeRate) : total;
      const per = plan ? totalWithFee / plan.count : total;
      const dueDates: string[] = [];
      if (plan) {
        for (let i = 0; i < plan.count; i++) {
          const d = new Date();
          d.setDate(d.getDate() + plan.intervalDays * i);
          dueDates.push(
            d.toLocaleDateString([], {
              month: 'short',
              day: 'numeric'
            })
          );
        }
      }
      return (
        <div className="space-y-3">
          <p className="text-[11px] text-text-secondary">
            Choose an installment plan. The first payment is due today.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {INSTALLMENT_PLANS.map((p) => {
              const active = p.id === planId;
              const ptotal = total * (1 + p.feeRate);
              const pper = ptotal / p.count;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlanId(p.id)}
                  className={
                  'rounded-ios-md shadow-ios-xs p-2 text-center transition-all duration-ios ' + (
                  active ?
                  'border-primary bg-primary-light/40' :
                  'glass-muted')
                  }>
                  
                  <p
                    className={
                    'text-[16px] font-bold ' + (
                    active ? 'text-primary' : 'text-text-primary')
                    }>
                    
                    {p.count}×
                  </p>
                  <p className="text-[11px] font-mono text-text-secondary mt-0.5">
                    {fmt(Math.round(pper))}
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {p.feeRate === 0 ? 'No fee' : `+${p.feeRate * 100}% fee`}
                  </p>
                </button>);

            })}
          </div>
          {plan &&
          <div className="rounded-ios-md glass-muted p-3">
              <p className="text-[11px] uppercase tracking-wide text-text-secondary mb-2">
                Schedule
              </p>
              <div className="space-y-1.5">
                {dueDates.map((d, i) =>
              <div key={i} className="flex justify-between text-[12px]">
                    <span
                  className={
                  i === 0 ?
                  'font-semibold text-primary' :
                  'text-text-secondary'
                  }>
                  
                      {i === 0 ? `Today · ${d}` : d}
                    </span>
                    <span className="font-mono font-semibold text-text-primary">
                      {fmt(Math.round(per))}
                    </span>
                  </div>
              )}
              </div>
              {plan.feeRate > 0 &&
            <div className="mt-2 pt-2 border-t border-border flex justify-between text-[11px] text-text-secondary">
                  <span>Service fee ({plan.feeRate * 100}%)</span>
                  <span className="font-mono">
                    {fmt(Math.round(totalWithFee - total))}
                  </span>
                </div>
            }
            </div>
          }
          <button
            onClick={() => confirm('bnpl')}
            className="ui-btn-primary h-11 text-[13px] w-full">
            
            Continue with {plan?.count}× plan
          </button>
        </div>);

    }
    if (id === 'mobile_money') {
      return (
        <div className="space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-text-secondary mb-2">
              Choose provider
            </p>
            <div className="grid grid-cols-4 gap-2">
              {MOBILE_MONEY_PROVIDERS.map((p) => {
                const active = mmProvider === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setMmProvider(p.id)}
                    className={
                    'rounded-ios-md shadow-ios-xs p-2 flex flex-col items-center transition-all duration-ios ' + (
                    active ?
                    'ring-2 ring-primary bg-primary-light/40' :
                    'glass-muted')
                    }>
                    
                    <div
                      className={
                      'w-9 h-9 rounded-full text-white font-bold text-[14px] flex items-center justify-center mb-1 ' +
                      p.color
                      }>
                      
                      {p.initial}
                    </div>
                    <p className="text-[11px] font-medium text-text-primary leading-tight text-center">
                      {p.name}
                    </p>
                  </button>);

              })}
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-text-secondary mb-2">
              Phone number
            </p>
            <input
              type="tel"
              value={mmPhone}
              onChange={(e) => setMmPhone(e.target.value)}
              placeholder="+251 9XX XXX XXX"
              className="ui-input h-11 text-[13px]" />
            
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-ios-md glass-muted">
            <Info className="w-3.5 h-3.5 text-text-secondary shrink-0 mt-0.5" />
            <p className="text-[11px] text-text-secondary">
              We'll send an approval request to your phone. Approve it to
              complete payment.
            </p>
          </div>
          <button
            onClick={() => confirm('mobile_money')}
            disabled={!mmProvider || mmPhone.trim().length < 9}
            className="ui-btn-primary h-11 text-[13px] w-full disabled:opacity-50">
            
            Continue
          </button>
        </div>);

    }
    if (id === 'card') {
      return (
        <div className="space-y-2">
          {SAVED_CARDS.map((c) => {
            const active = cardId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCardId(c.id)}
                className={
                'w-full flex items-center gap-3 p-3 rounded-ios-md shadow-ios-xs transition-all duration-ios ' + (
                active ?
                'border-primary bg-primary-light/40' :
                'glass-card')
                }>
                
                <div className="w-10 h-7 rounded-md bg-gradient-to-br from-text-primary to-text-secondary text-white text-[11px] font-bold flex items-center justify-center">
                  {c.brand === 'Visa' ? 'VISA' : 'MC'}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[12px] font-semibold text-text-primary">
                    {c.brand} •••• {c.last4}
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    Exp {c.expiry}
                  </p>
                </div>
                <div
                  className={
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center ' + (
                  active ?
                  'border-primary bg-primary' :
                  'border-border')
                  }>
                  
                  {active && <div className="w-1 h-1 rounded-full bg-white" />}
                </div>
              </button>);

          })}
          <button className="w-full h-10 rounded-ios-md glass-muted text-primary font-semibold text-[12px] inline-flex items-center justify-center gap-1.5 active:opacity-70 transition-opacity duration-ios">
            <Plus className="w-3.5 h-3.5" />
            Add a new card
          </button>
          <button
            onClick={() => confirm('card')}
            className="w-full h-11 rounded-xl bg-primary text-white font-semibold text-[13px] active:scale-98 transition-transform mt-2">
            
            Use this card
          </button>
        </div>);

    }
    if (id === 'bank') {
      return (
        <div className="space-y-2">
          {LINKED_BANKS.map((b) => {
            const active = bankId === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setBankId(b.id)}
                className={
                'w-full flex items-center gap-3 p-3 rounded-ios-md shadow-ios-xs transition-all duration-ios ' + (
                active ?
                'border-primary bg-primary-light/40' :
                'glass-card')
                }>
                
                <div className="w-9 h-9 rounded-full bg-primary-light/40 text-primary flex items-center justify-center">
                  <Landmark className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[12px] font-semibold text-text-primary truncate">
                    {b.name}
                  </p>
                  <p className="text-[11px] font-mono text-text-secondary">
                    •••• {b.last4}
                  </p>
                </div>
                <div
                  className={
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center ' + (
                  active ?
                  'border-primary bg-primary' :
                  'border-border')
                  }>
                  
                  {active && <div className="w-1 h-1 rounded-full bg-white" />}
                </div>
              </button>);

          })}
          <button
            onClick={() => confirm('bank')}
            className="w-full h-11 rounded-xl bg-primary text-white font-semibold text-[13px] active:scale-98 transition-transform mt-2">
            
            Continue with bank transfer
          </button>
        </div>);

    }
    if (id === 'cod') {
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-2.5 rounded-ios-md glass-muted">
            <Info className="w-3.5 h-3.5 text-text-secondary shrink-0 mt-0.5" />
            <p className="text-[11px] text-text-secondary">
              Pay the courier in cash when your order arrives. Make sure to have
              {fmt(total)} ready.
            </p>
          </div>
          <button
            onClick={() => confirm('cod')}
            className="ui-btn-primary h-11 text-[13px] w-full">
            
            Confirm cash on delivery
          </button>
        </div>);

    }
    return null;
  };
  return (
    <AnimatePresence>
      {open &&
      <>
          <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          onClick={onClose}
          className="absolute inset-0 glass-overlay z-sheet" />
        
          <motion.div
          initial={{
            y: '100%'
          }}
          animate={{
            y: 0
          }}
          exit={{
            y: '100%'
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30
          }}
          className="absolute bottom-0 left-0 right-0 glass-sheet rounded-t-ios-xl z-sheet flex flex-col max-h-[92vh]">
          
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-9 h-1 rounded-full bg-gray-300/80" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 shrink-0">
              <div>
                <h2 className="text-[17px] font-bold text-text-primary">
                  Payment method
                </h2>
                <p className="text-[11px] text-gray-500">
                  Order total: {fmt(headerTotal)}
                </p>
              </div>
              <button
              onClick={onClose}
              aria-label="Close"
              className="ui-touch w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center active:scale-95">
              
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2.5">
              {hasApiTypes ?
              <>
                  {apiPaymentTypes.map((type) => {
                    const kind = paymentTypeKind(type);
                    const isWallet = kind === 'wallet';
                    const isCurrent =
                      current.apiPaymentTypeId === type.Id ||
                      (isWallet &&
                      current.method === 'wallet' &&
                      !current.apiPaymentTypeId);
                    if (isWallet) {
                      return (
                        <div key={type.Id}>
                          {renderRow(
                            'wallet',
                            <Wallet className="w-4 h-4" />,
                            type.PaymentType.trim() || 'Wallet',
                            walletInsufficient ?
                            'Insufficient balance' :
                            paymentTypeSubtitle(type),
                            'Recommended',
                            false
                          )}
                        </div>
                      );
                    }
                    return (
                      <button
                        key={type.Id}
                        type="button"
                        onClick={() => confirmApiType(type)}
                        className={
                          'w-full rounded-ios-lg shadow-ios-sm text-left p-3.5 flex items-center gap-3 ' +
                          (isCurrent ?
                          'ring-1 ring-primary/50 glass-card' :
                          'glass-card')
                        }>
                        <div
                          className={
                            'w-10 h-10 rounded-ios-md flex items-center justify-center shrink-0 ' +
                            (isCurrent ?
                            'bg-primary text-white' :
                            'glass-muted text-text-secondary')
                          }>
                          {apiIcon(type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[13px] font-semibold text-text-primary">
                              {type.PaymentType}
                            </p>
                            {isCurrent &&
                            <span className="text-[11px] uppercase tracking-wide font-bold text-primary bg-primary-light/60 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" />
                                Current
                              </span>
                            }
                            {type.Type ?
                            <span className="text-[11px] uppercase tracking-wide font-bold text-text-secondary bg-gray-100 px-1.5 py-0.5 rounded">
                                {type.Type}
                              </span> :
                            null}
                          </div>
                          <p className="text-[11px] text-text-secondary truncate">
                            {paymentTypeSubtitle(type)}
                          </p>
                          <p className="text-[12px] font-semibold text-text-primary mt-0.5">
                            {fmt(chargedForType(type))}
                          </p>
                        </div>
                        <div
                          className={
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ' +
                            (isCurrent ?
                            'border-primary bg-primary' :
                            'border-border')
                          }>
                          {isCurrent &&
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </> :

              <>
              {renderRow(
              'wallet',
              <Wallet className="w-4 h-4" />,
              'mKash Wallet',
              walletInsufficient ?
              'Insufficient balance' :
              'Instant · No fees',
              'Recommended'
            )}
              {renderRow(
              'bnpl',
              <CalendarClock className="w-4 h-4" />,
              'Buy Now, Pay Later',
              'Split into installments',
              'New'
            )}
              {renderRow(
              'mobile_money',
              <Smartphone className="w-4 h-4" />,
              'Mobile Money',
              'Telebirr, CBE Birr, Awash, Dashen'
            )}
              {renderRow(
              'card',
              <CreditCard className="w-4 h-4" />,
              'Debit / Credit Card',
              'Visa & Mastercard'
            )}
              {renderRow(
              'bank',
              <Landmark className="w-4 h-4" />,
              'Bank Transfer',
              'From linked bank accounts'
            )}
              {renderRow(
              'cod',
              <Banknote className="w-4 h-4" />,
              'Cash on Delivery',
              'Pay the courier in cash'
            )}
              </>}
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>);

}