import { useEffect } from 'react'

export default function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, 4500)
    return () => clearTimeout(t)
  }, [message, onClose])

  if (!message) return null

  const colors = {
    error:   { bg: 'rgba(220,38,38,0.12)',   border: '#DC2626', text: '#FCA5A5' },
    success: { bg: 'rgba(22,163,74,0.12)',    border: '#16A34A', text: '#86EFAC' },
    info:    { bg: 'var(--surface-2)',         border: 'var(--border-lit)', text: 'var(--white-dim)' },
  }
  const c = colors[type] || colors.info

  return (
    <div
      className="fixed bottom-8 right-8 z-[300] flex items-start gap-3 px-5 py-4 max-w-sm"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 3,
        animation: 'toastSlide 0.4s cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      {/* Icon */}
      {type === 'error' && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      {type === 'success' && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
          <polyline points="20,6 9,17 4,12" />
        </svg>
      )}

      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: c.text, lineHeight: 1.6 }}>
        {message}
      </span>

      <button
        onClick={onClose}
        style={{ marginLeft: 'auto', color: c.text, opacity: 0.5, flexShrink: 0, paddingLeft: 8 }}
      >
        ✕
      </button>
    </div>
  )
}