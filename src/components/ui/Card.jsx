import { useTheme } from '../../theme/ThemeContext'

export function Card({ children, className = '', onClick, hoverable = false }) {
  const { palette } = useTheme()
  const base = 'bg-dark-900/80 border border-dark-800 rounded-xl p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
  const hover = hoverable ? `hover:-translate-y-0.5 ${palette.border} hover:bg-dark-900 transition-all duration-200 cursor-pointer active:translate-y-0` : ''
  return <div className={`${base} ${hover} ${className}`} onClick={onClick}>{children}</div>
}
