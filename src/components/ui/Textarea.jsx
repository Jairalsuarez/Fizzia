import { useTheme } from '../../theme/ThemeContext'

export function Textarea({ label, value, onChange, placeholder, required = false, error, className = '', name, rows = 4, autoFocus = false }) {
  const { palette } = useTheme()
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-sm font-medium text-dark-200">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        name={name}
        rows={rows}
        autoFocus={autoFocus}
        className={`w-full bg-dark-950 border border-dark-700 rounded-lg px-4 py-2.5 text-white ${palette.focusBorder} outline-none placeholder:text-dark-400 resize-none`}
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
