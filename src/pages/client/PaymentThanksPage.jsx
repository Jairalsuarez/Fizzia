import { Link, useLocation } from 'react-router-dom'
import { FileCheck2 } from 'lucide-react'
import { formatMoney } from '../../utils/format'

export function PaymentThanksPage() {
  const { state } = useLocation()

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-[#b9ddc1] bg-white p-6 text-center shadow-lg sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf8f0] text-[#16843a]">
          <FileCheck2 className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-[#0b120d]">Gracias por tu pago</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#526154]">
          En un momento tu pago se hara efectivo. Si requiere revision, el equipo de Fizzia validara el movimiento y actualizara tu proyecto.
        </p>

        {(state?.projectName || state?.amount) && (
          <div className="mt-6 rounded-2xl border border-[#d7e4da] bg-[#f7fbf7] p-4 text-left">
            {state?.projectName && (
              <div className="flex items-center justify-between gap-4 border-b border-[#d7e4da] pb-3">
                <span className="text-sm text-[#526154]">Proyecto</span>
                <span className="text-right text-sm font-bold text-[#0b120d]">{state.projectName}</span>
              </div>
            )}
            {state?.amount && (
              <div className="flex items-center justify-between gap-4 pt-3">
                <span className="text-sm text-[#526154]">Monto</span>
                <span className="text-right text-lg font-black text-[#16843a]">{formatMoney(state.amount)}</span>
              </div>
            )}
          </div>
        )}

        <Link
          to="/cliente"
          className="mt-6 inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-[#2fb65d] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#27a650]"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
