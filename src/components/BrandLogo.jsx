import { useEffect, useState } from 'react'

const LOGO_MARK = '/images/Logo%20Fizzia.svg'
const LOGO_THEME_LIGHT = '/images/Fizzia%20theme%20clare.svg'
const LOGO_THEME_DARK = '/images/Fizzia%20thme%20dark.svg'

function useIsDarkTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    const root = document.documentElement
    const update = () => setIsDark(root.classList.contains('dark'))
    const observer = new MutationObserver(update)

    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    update()

    return () => observer.disconnect()
  }, [])

  return isDark
}

export function BrandLogo({
  className = '',
  markClassName = 'h-9',
  themeClassName = 'h-12',
  theme = 'auto',
  mode = 'responsive',
  decorative = false,
}) {
  const isDarkTheme = useIsDarkTheme()
  const themeSrc =
    theme === 'auto'
      ? isDarkTheme ? LOGO_THEME_DARK : LOGO_THEME_LIGHT
      : theme === 'light' ? LOGO_THEME_LIGHT : LOGO_THEME_DARK
  const alt = decorative ? '' : 'Fizzia'

  if (mode === 'mark') {
    return (
      <img
        src={LOGO_MARK}
        alt={alt}
        aria-hidden={decorative ? 'true' : undefined}
        className={`${markClassName} w-auto object-contain ${className}`}
      />
    )
  }

  if (mode === 'theme') {
    return (
      <img
        src={themeSrc}
        alt={alt}
        aria-hidden={decorative ? 'true' : undefined}
        className={`${themeClassName} w-auto object-contain ${className}`}
      />
    )
  }

  return (
    <span
      className={`inline-flex items-center ${className}`}
      aria-label={decorative ? undefined : 'Fizzia'}
      aria-hidden={decorative ? 'true' : undefined}
    >
      <img src={LOGO_MARK} alt="" className={`${markClassName} w-auto object-contain sm:hidden`} />
      <img src={themeSrc} alt="" className={`hidden ${themeClassName} w-auto object-contain sm:block`} />
    </span>
  )
}
