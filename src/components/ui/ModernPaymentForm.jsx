import { Building2 } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  )
}

const methodStyles = {
  paypal: {
    label: 'PayPal',
    icon: (
      <span className="text-base font-black tracking-[-0.08em] text-[#003087]">
        Pay<span className="text-[#009cde]">Pal</span>
      </span>
    ),
  },
  transfer: {
    label: 'Transferencia',
    icon: <Building2 className="h-5 w-5 text-fizzia-600" />,
  },
  google_pay: {
    label: 'Google Pay',
    icon: <GoogleIcon />,
  },
}

export function ModernPaymentForm({ selectedMethod, onSelectMethod, disabled = false }) {
  return (
    <div className="grid grid-cols-3 gap-3">
        {Object.entries(methodStyles).map(([method, config]) => {
          const isActive = selectedMethod === method
          return (
            <button
              key={method}
              type="button"
              disabled={disabled}
              onClick={() => onSelectMethod(method)}
              className={`flex h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 text-sm font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                isActive
                  ? 'border-[#2fb65d] bg-[#edf8f0] text-[#0b120d] shadow-[0_12px_22px_-20px_rgba(29,185,84,0.9)]'
                  : 'border-[#cbd8cd] bg-[#ffffff] text-[#263529] hover:border-[#69c983]'
              }`}
            >
              {config.icon}
              <span className="min-w-0 truncate">{config.label}</span>
            </button>
          )
        })}
    </div>
  )
}
