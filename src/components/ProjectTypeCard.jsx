export function ProjectTypeCard({ icon, label, desc, isSelected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer flex min-h-[140px] flex-col items-start rounded-xl border p-4 text-left transition-all duration-200 active:translate-y-px ${
        isSelected
          ? 'border-fizzia-500 bg-fizzia-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
          : 'border-dark-700 bg-dark-900/50 hover:-translate-y-0.5 hover:border-dark-600 hover:bg-dark-900'
      }`}
    >
      <span className={`material-symbols-rounded text-2xl mb-2 ${
        isSelected ? 'text-fizzia-400' : 'text-dark-400'
      }`}>{icon}</span>
      <p className="text-white text-sm font-medium leading-snug mb-1">{label}</p>
      <p className="text-dark-500 text-xs leading-snug line-clamp-2">{desc}</p>
    </button>
  )
}
