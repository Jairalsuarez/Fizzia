import { useEffect, useRef } from 'react';

export function Modal({ isOpen, open, onClose, title, children, size = 'md' }) {
  const modalRef = useRef(null);
  const isModalOpen = isOpen ?? open ?? false;

  useEffect(() => {
    if (!isModalOpen) return;
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isModalOpen, onClose]);

  if (!isModalOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain p-3 sm:p-5" onClick={onClose}>
      <div
        className="fixed inset-0 bg-dark-950/80 backdrop-blur-md"
        style={{ animation: 'modalFadeIn 160ms ease-out both' }}
      />
      <div className="relative flex min-h-full items-start justify-center py-3 sm:items-center sm:py-6">
        <div
          ref={modalRef}
          className={`relative flex max-h-[calc(100dvh-1.5rem)] w-full ${sizes[size]} flex-col overflow-hidden rounded-2xl border border-dark-700/80 bg-dark-900 shadow-2xl shadow-black/40 ring-1 ring-white/5 sm:max-h-[calc(100dvh-3rem)]`}
          onClick={(e) => e.stopPropagation()}
          style={{ animation: 'modalEnter 190ms cubic-bezier(.2,.8,.2,1) both' }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className={`flex shrink-0 items-center justify-between gap-3 border-b border-dark-800 bg-dark-950/55 px-4 py-3 sm:px-5 ${title ? '' : 'justify-end'}`}>
            {title && <h2 className="min-w-0 truncate text-base font-semibold text-white sm:text-lg">{title}</h2>}
            <button onClick={onClose} className="cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-dark-400 transition-colors hover:bg-dark-800 hover:text-white">
              <span className="material-symbols-rounded text-xl">close</span>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
        </div>
      </div>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalEnter {
          from { opacity: 0; transform: translateY(10px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
