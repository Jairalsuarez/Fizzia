import { AvatarIcon } from '../data/avatars.jsx'

export function ChatListItem({
  avatarId,
  name,
  subtitle,
  lastMessage,
  isOnline,
  isCurrentUser,
  roleIcon,
  onClick,
  rightContent,
}) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-dark-800/60 transition-all text-left active:translate-y-px"
    >
      <div className="relative shrink-0">
        <div className="h-9 w-9 rounded-full bg-white overflow-hidden">
          <AvatarIcon id={avatarId} name={name} size={36} />
        </div>
        {isOnline !== undefined && (
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-dark-900 ${
            isOnline ? 'bg-green-500' : 'bg-dark-500'
          }`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-white text-sm font-medium truncate">
            {name}
          </p>
          {isCurrentUser && (
            <span className="text-[10px] text-dark-500 font-medium shrink-0">(tú)</span>
          )}
          {roleIcon && (
            <span className="material-symbols-rounded text-[14px] text-dark-500 shrink-0">
              {roleIcon}
            </span>
          )}
        </div>
        {lastMessage !== undefined ? (
          <p className="text-dark-500 text-xs truncate mt-0.5">
            {lastMessage || 'Sin mensajes'}
          </p>
        ) : subtitle ? (
          <p className="text-dark-500 text-xs truncate mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {rightContent && (
        <div className="shrink-0">{rightContent}</div>
      )}
    </button>
  )
}
