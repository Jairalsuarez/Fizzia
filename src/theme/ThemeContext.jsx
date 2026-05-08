import { createContext, useContext } from 'react'
import { appThemes } from './appTheme'

const ThemeContext = createContext({
  theme: 'fizzia',
  palette: appThemes.fizzia,
})

export function ThemeProvider({ children, value }) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
