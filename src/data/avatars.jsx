import { useMemo } from 'react'
import { avatars } from './avatarOptions'

function getInitials(name) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return `hsl(${Math.abs(hash) % 360}, 55%, 45%)`
}

export function AvatarIcon({ id, name, size = 40, className = '', zoom = 1.5 }) {
  if (!id) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          color: '#555',
          flexShrink: 0,
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: size * 0.6 }}>person</span>
      </div>
    )
  }

  const avatar = avatars.find(a => a.id === id) || avatars[0]
  return (
    <div className={className} style={{ width: size, height: size, overflow: 'hidden', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img
        src={avatar.src}
        alt={avatar.label}
        style={{
          width: `${zoom * 100}%`,
          height: `${zoom * 100}%`,
          objectFit: 'cover',
          display: 'block',
        }}
        loading="lazy"
      />
    </div>
  )
}
