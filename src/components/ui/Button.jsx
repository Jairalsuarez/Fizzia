import { Icon } from './Icon'
import { useTheme } from '../../theme/ThemeContext'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  icon,
  disabled,
  className = '',
  ...props
}) {
  const { palette } = useTheme()
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 cursor-pointer select-none active:translate-y-px disabled:cursor-not-allowed'
  
  const variants = {
    primary: `${palette.bg} text-white ${palette.hoverBg} shadow-lg ${palette.shadow}`,
    outline: `border border-dark-700 text-white ${palette.hoverText} bg-transparent`,
    ghost: `text-dark-300 ${palette.hoverText} bg-transparent`,
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const classes = `${base} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`

  const content = (
    <>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </>
  )

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    )
  }

  return (
    <button className={classes} onClick={onClick} disabled={disabled} {...props}>
      {content}
    </button>
  )
}
