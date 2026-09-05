import {
  Banknote,
  Building2,
  Check,
  CreditCard,
  Smartphone,
  Wallet,
  X
} from 'lucide-react';
import { KTA, cur } from './ethioTravelData';
import { HOLIDAY_CHECKOUT_PAD } from './HolidayCheckoutShell';
import {
  paymentTypeKind,
  paymentTypeSubtitle,
  parsePaymentPercent,
  paymentTotalWithFee,
  type ApiPaymentType
} from '../../services/guestApi';

type PaymentOption = {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  icon: typeof Wallet;
};

function paymentOptionsFor(
  currency: string,
  rate = 1,
  walletBalanceEtb = 0,
  apiPaymentTypes: ApiPaymentType[] = []
): PaymentOption[] {
  const code =
    String(currency || 'ETB')
      .trim()
      .toUpperCase() || 'ETB';
  const walletBalance = Math.abs(walletBalanceEtb) * (code === 'ETB' ? 1 : rate);
  if (apiPaymentTypes.length > 0) {
    return apiPaymentTypes.map((type) => {
      const kind = paymentTypeKind(type);
      const isWallet = kind === 'wallet';
      return {
        id: isWallet ? 'mkash' : `api:${type.Id}`,
        title: isWallet ? 'mKash Wallet' : type.PaymentType,
        subtitle: isWallet ?
          `Balance: ${cur(walletBalance, code)}` :
          paymentTypeSubtitle(type),
        badge: isWallet ? 'Recommended' : type.Type || undefined,
        icon:
          kind === 'wallet' ?
          Wallet :
          kind === 'bank' ?
          Building2 :
          kind === 'upi' ?
          Smartphone :
          kind === 'card' ?
          CreditCard :
          Banknote
      };
    });
  }
  return PAYMENT_OPTIONS.map((option) =>
    option.id === 'mkash' ?
      {
        ...option,
        subtitle: `Balance: ${cur(walletBalance, code)}`
      } :
      option
  );
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'mkash',
    title: 'mKash Wallet',
    subtitle: 'Balance: ETB 12,450',
    icon: Wallet
  },
  {
    id: 'bnpl',
    title: 'Buy Now, Pay Later',
    subtitle: 'Split into 3 payments',
    badge: 'NEW',
    icon: Banknote
  },
  {
    id: 'mobile',
    title: 'Mobile Money',
    subtitle: 'Telebirr · CBE Birr · M-Pesa',
    icon: Smartphone
  },
  {
    id: 'card',
    title: 'Debit / Credit Card',
    subtitle: 'Visa · Mastercard',
    icon: CreditCard
  },
  {
    id: 'bank',
    title: 'Bank Transfer',
    subtitle: 'Pay from your linked bank account',
    icon: Building2
  },
  {
    id: 'cod',
    title: 'Cash on Delivery',
    subtitle: 'Pay when your voucher is delivered',
    icon: Banknote
  }
];

const BANK_ACCOUNTS = [
  { id: 'cbe', name: 'Commercial Bank of Ethiopia', last4: '1234' },
  { id: 'awash', name: 'Awash Bank', last4: '5678' }
];

export function HolidayPaymentMethod({
  total,
  currency,
  currencyRate = 1,
  walletBalanceEtb = 0,
  selected,
  onSelect,
  onClose,
  onConfirm,
  loading,
  error: _error,
  apiPaymentTypes = []
}: {
  total: number;
  currency: string;
  currencyRate?: number;
  /** Live TravellerDashboard AvailableCredit in ETB. */
  walletBalanceEtb?: number;
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  /** Receives the method chosen at confirm-click time (avoids stale wallet gate). */
  onConfirm: (method: string) => void;
  loading?: boolean;
  error?: string | null;
  apiPaymentTypes?: ApiPaymentType[];
}) {
  const uiCurrency =
    String(currency || 'ETB')
      .trim()
      .toUpperCase() || 'ETB';
  const options = paymentOptionsFor(
    uiCurrency,
    currencyRate,
    walletBalanceEtb,
    apiPaymentTypes
  );
  const activeSelected =
    options.some((option) => option.id === selected) ? selected : 'mkash';
  const walletDisplay =
    Math.abs(walletBalanceEtb) * (uiCurrency === 'ETB' ? 1 : currencyRate);
  const selectedApiType = activeSelected.startsWith('api:')
    ? apiPaymentTypes.find((type) => type.Id === Number(activeSelected.slice(4)))
    : activeSelected === 'mkash'
      ? apiPaymentTypes.find((type) => paymentTypeKind(type) === 'wallet')
      : undefined;
  const chargedTotal = paymentTotalWithFee(
    total,
    parsePaymentPercent(selectedApiType?.Percentage)
  );
  const walletShort = walletDisplay + 0.005 < chargedTotal;
  /** Any payment method requires sufficient wallet credit before booking API. */
  const confirmDisabled = loading || walletShort;

  return (
    <div className="fixed inset-0 z-[100] bg-black/35 flex items-end">
      <div className="w-full max-h-[92vh] max-w-lg mx-auto bg-[#f4f6f8] rounded-t-[24px] overflow-hidden flex flex-col min-w-0">
        <div className={`${HOLIDAY_CHECKOUT_PAD} py-3.5 border-b border-slate-200 bg-white flex items-start justify-between gap-3`}>
          <div>
            <h2 className="text-[18px] font-bold text-slate-900">Payment method</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Order total: {cur(chargedTotal, uiCurrency)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto ${HOLIDAY_CHECKOUT_PAD} py-3 space-y-2.5`}>
          {walletShort &&
          <div className="rounded-[14px] border border-rose-200 bg-rose-50 px-3 py-2.5 text-[12px] text-rose-700">
              Insufficient balance. Available {cur(walletDisplay, uiCurrency)} —
              required {cur(chargedTotal, uiCurrency)}. Add money to continue.
            </div>
          }
          {options.map((option) => {
            const Icon = option.icon;
            const active = activeSelected === option.id;
            const isBank = option.id === 'bank';

            return (
              <div
                key={option.id}
                className={`rounded-[18px] bg-white border overflow-hidden ${
                  active ? 'border-emerald-600' : 'border-slate-200'
                }`}>
                <button
                  type="button"
                  onClick={() => onSelect(option.id)}
                  className="w-full p-4 flex items-center gap-3 text-left">
                  <span className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-slate-700" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-bold text-slate-900">
                        {option.title}
                      </p>
                      {active &&
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          CURRENT
                        </span>
                      }
                      {!active && option.badge &&
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          {option.badge}
                        </span>
                      }
                    </div>
                    <p className="text-[12px] text-slate-500 mt-0.5">{option.subtitle}</p>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      active ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                    }`}>
                    {active && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                </button>

                {isBank && active &&
                <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
                    {BANK_ACCOUNTS.map((bank, index) =>
                    <button
                      key={bank.id}
                      type="button"
                      className={`w-full rounded-[14px] border p-3 flex items-center justify-between text-left ${
                        index === 0 ?
                          'border-emerald-600 bg-emerald-50' :
                          'border-slate-200 bg-white'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600">
                            {bank.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <p className="text-[13px] font-bold text-slate-900">
                              {bank.name}
                            </p>
                            <p className="text-[12px] text-slate-500">
                              •••• {bank.last4}
                            </p>
                          </div>
                        </div>
                        {index === 0 &&
                        <Check className="w-4 h-4 text-emerald-700" />
                        }
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={loading || walletShort}
                      onClick={() => {
                        if (loading || walletShort) return;
                        onSelect('bank');
                        onConfirm('bank');
                      }}
                      className="w-full h-11 rounded-xl text-white font-bold text-[14px] disabled:opacity-50 mt-1"
                      style={{ backgroundColor: KTA.green }}>
                      Continue with bank transfer
                    </button>
                  </div>
                }
              </div>
            );
          })}
        </div>

        {activeSelected !== 'bank' &&
        <div className={`${HOLIDAY_CHECKOUT_PAD} py-3 pb-safe border-t border-slate-200 bg-white`}>
            {walletShort &&
            <p className="text-[12px] text-rose-600 mb-2">
                Insufficient balance. Available {cur(walletDisplay, uiCurrency)} —
                required {cur(chargedTotal, uiCurrency)}.
              </p>
            }
            <button
              type="button"
              disabled={confirmDisabled}
              onClick={() => {
                if (confirmDisabled) return;
                onSelect(activeSelected);
                onConfirm(activeSelected);
              }}
              className="w-full h-12 rounded-2xl text-white font-bold text-[15px] disabled:opacity-50 active:scale-[0.99]"
              style={{ backgroundColor: '#047857' }}>
              {loading ?
                'Submitting booking…' :
                activeSelected === 'bnpl' ?
                  `Pay later · ${cur(chargedTotal, uiCurrency)}` :
                  activeSelected === 'cod' ?
                    `Reserve · ${cur(chargedTotal, uiCurrency)}` :
                    `Confirm payment · ${cur(chargedTotal, uiCurrency)}`}
            </button>
          </div>
        }
      </div>
    </div>
  );
}
