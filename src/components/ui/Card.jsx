import { useTheme } from '../../theme/ThemeContext'

export function Card({ children, className = '', onClick, hoverable = false, ...props }) {
  const { palette } = useTheme()
  const base = 'bg-dark-900/80 border border-dark-800 rounded-xl p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
  const hover = hoverable ? `hover:-translate-y-0.5 ${palette.border} hover:bg-dark-900 transition-all duration-200 cursor-pointer active:translate-y-0` : ''
  return <div className={`${base} ${hover} ${className}`} onClick={onClick} {...props}>{children}</div>
}

export function CardHeader({ children, className = '', ...props }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>{children}</div>
}

export function CardTitle({ children, className = '', ...props }) {
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>{children}</h3>
}

export function CardDescription({ children, className = '', ...props }) {
  return <p className={`text-sm text-dark-300 ${className}`} {...props}>{children}</p>
}

export function CardContent({ children, className = '', ...props }) {
  return <div className={`p-6 pt-0 ${className}`} {...props}>{children}</div>
}

export function CardFooter({ children, className = '', ...props }) {
  return <div className={`flex items-center p-6 pt-0 ${className}`} {...props}>{children}</div>
}
