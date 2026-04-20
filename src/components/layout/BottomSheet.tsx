import { useEffect, type ReactNode } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  /** Small uppercase label above the title (e.g. dimension name) */
  eyebrow?: string
  title?: string
  children: ReactNode
}

export function BottomSheet({ open, onClose, eyebrow, title, children }: BottomSheetProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(61, 40, 23, 0.35)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
          zIndex: 200,
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className="no-scrollbar"
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 0,
          width: '100%',
          maxWidth: '430px',
          background: 'var(--cream)',
          borderRadius: '28px 28px 0 0',
          padding: '24px 20px 36px',
          transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
          transform: `translateX(-50%) translateY(${open ? '0' : '100%'})`,
          zIndex: 201,
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: '40px',
            height: '4px',
            background: 'var(--line)',
            borderRadius: '2px',
            margin: '0 auto 16px',
          }}
        />

        {eyebrow && (
          <div
            style={{
              fontSize: '11px',
              color: 'var(--ink2)',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </div>
        )}
        {title && (
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: 'var(--ink)',
              marginTop: eyebrow ? '2px' : 0,
            }}
          >
            {title}
          </h2>
        )}

        <div>{children}</div>
      </div>
    </>
  )
}
