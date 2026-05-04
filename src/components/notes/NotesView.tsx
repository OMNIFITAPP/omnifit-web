import { useEffect, useMemo, useState } from 'react'
import {
  useNotesStore,
  noteTagColor,
  relativeDate,
  expiresInLabel,
  type Note,
  type NoteTag,
} from '../../store/notesStore'

interface Props {
  open: boolean
  onClose: () => void
  /** When provided, the view opens directly into the edit sheet for a new note. */
  initialDraft?: { tag?: NoteTag; linkedSessionId?: string | null } | null
}

type Tab = 'active' | 'saved' | 'archive'

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'active',  label: 'Active'  },
  { key: 'saved',   label: 'Saved'   },
  { key: 'archive', label: 'Archive' },
]

const TAGS: NoteTag[] = ['thought', 'intention', 'lesson', 'gratitude']

export function NotesView({ open, onClose, initialDraft }: Props) {
  const notes = useNotesStore((s) => s.notes)
  const load = useNotesStore((s) => s.load)
  const create = useNotesStore((s) => s.create)
  const update = useNotesStore((s) => s.update)
  const archive = useNotesStore((s) => s.archive)
  const restore = useNotesStore((s) => s.restore)

  const [tab, setTab] = useState<Tab>('active')
  const [editing, setEditing] = useState<Note | null>(null)
  const [creating, setCreating] = useState<{ tag: NoteTag; linkedSessionId: string | null } | null>(null)

  useEffect(() => { if (open) load() }, [open, load])
  useEffect(() => {
    if (open && initialDraft) {
      setCreating({
        tag: initialDraft.tag ?? 'thought',
        linkedSessionId: initialDraft.linkedSessionId ?? null,
      })
    }
  }, [open, initialDraft])

  const filtered = useMemo(() => {
    const archiveCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    if (tab === 'active') return notes.filter((n) => !n.archived_at)
    if (tab === 'saved')  return notes.filter((n) => n.saved)
    return notes.filter((n) => n.archived_at && new Date(n.archived_at).getTime() > archiveCutoff)
  }, [notes, tab])

  if (!open) return null

  const closeButton = (
    <button
      type="button"
      aria-label="Close notes"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 999,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'var(--card)',
        border: '1px solid var(--line)',
        color: 'var(--ink)',
        fontSize: '18px',
        lineHeight: 1,
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: '0 2px 8px rgba(61, 40, 23, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      ✕
    </button>
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        height: '100dvh',
        background: 'var(--cream)',
        zIndex: 400,
        maxWidth: '430px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {closeButton}

      <div style={{ padding: '20px 20px 0' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
          Notes
        </h1>
        <div
          role="tablist"
          style={{
            marginTop: '14px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '3px',
            gap: '3px',
          }}
        >
          {TABS.map((t) => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  padding: '7px 4px',
                  borderRadius: '9px',
                  border: 'none',
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--cream)' : 'var(--ink2)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textTransform: 'uppercase',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 36px' }}>
        {tab === 'active' && (
          <button
            type="button"
            onClick={() => setCreating({ tag: 'thought', linkedSessionId: null })}
            style={{
              width: '100%',
              padding: '14px',
              background: 'var(--card)',
              border: '1px dashed var(--line)',
              borderRadius: '14px',
              cursor: 'pointer',
              color: 'var(--ink)',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '10px',
            }}
          >
            + New note
          </button>
        )}

        {filtered.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--ink2)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
            {tab === 'active'  && 'No notes yet. Tap + to write one.'}
            {tab === 'saved'   && 'Save important notes from Active to keep them here.'}
            {tab === 'archive' && 'Archived notes appear here for 30 days before being permanently deleted.'}
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map((n) => (
              <NoteRow
                key={n.id}
                note={n}
                tab={tab}
                onTap={() => setEditing(n)}
                onRestore={() => restore(n.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <NoteEditSheet
        note={editing}
        creating={creating}
        onClose={() => { setEditing(null); setCreating(null) }}
        onSave={async (patch, isNew) => {
          if (isNew) {
            await create({
              content: patch.content!,
              tag: patch.tag,
              saved: !!patch.saved,
              expiresInDays: patch.saved ? null : (patch.expiresInDays ?? 7),
              linkedSessionId: patch.linkedSessionId,
            })
          } else if (editing) {
            const expires_at = patch.saved
              ? null
              : patch.expiresInDays === null
              ? null
              : patch.expiresInDays !== undefined
              ? new Date(Date.now() + patch.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
              : editing.expires_at
            await update(editing.id, {
              content: patch.content,
              tag: patch.tag,
              saved: !!patch.saved,
              expires_at,
            })
          }
          setEditing(null)
          setCreating(null)
        }}
        onDelete={async () => {
          if (editing) await archive(editing.id)
          setEditing(null)
        }}
      />
    </div>
  )
}

function NoteRow({
  note, tab, onTap, onRestore,
}: { note: Note; tab: Tab; onTap: () => void; onRestore: () => void }) {
  const expires = expiresInLabel(note.expires_at)
  return (
    <li>
      <button
        type="button"
        onClick={onTap}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '14px',
          padding: '12px 14px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: 'var(--ink)',
          opacity: tab === 'archive' ? 0.7 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: '6px',
              background: noteTagColor(note.tag),
              color: 'var(--cream)',
            }}
          >
            {note.tag}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--ink2)' }}>{relativeDate(note.created_at)}</span>
          {expires && tab !== 'archive' && (
            <span style={{ fontSize: '11px', color: 'var(--ink2)', opacity: 0.7 }}>· {expires}</span>
          )}
        </div>
        <p
          style={{
            fontSize: '14px',
            lineHeight: 1.55,
            color: 'var(--ink)',
            margin: '8px 0 0',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {note.content}
        </p>
      </button>
      {tab === 'archive' && (
        <button
          type="button"
          onClick={onRestore}
          style={{
            display: 'block',
            marginTop: '4px',
            background: 'none',
            border: 'none',
            color: 'var(--ink2)',
            fontSize: '11px',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          Restore
        </button>
      )}
    </li>
  )
}

function NoteEditSheet({
  note,
  creating,
  onClose,
  onSave,
  onDelete,
}: {
  note: Note | null
  creating: { tag: NoteTag; linkedSessionId: string | null } | null
  onClose: () => void
  onSave: (
    patch: { content?: string; tag?: NoteTag; saved?: boolean; expiresInDays?: number | null; linkedSessionId?: string | null },
    isNew: boolean
  ) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const isOpen = !!note || !!creating
  const isNew = !!creating && !note

  const [content, setContent] = useState('')
  const [tag, setTag] = useState<NoteTag>('thought')
  const [saved, setSaved] = useState(false)
  const [expiresInDays, setExpiresInDays] = useState<number | null>(7)

  // Sync state when opening
  useEffect(() => {
    if (note) {
      setContent(note.content)
      setTag(note.tag)
      setSaved(note.saved)
      if (note.expires_at) {
        const days = Math.ceil((new Date(note.expires_at).getTime() - Date.now()) / (24 * 3600 * 1000))
        setExpiresInDays(days > 0 ? days : 7)
      } else {
        setExpiresInDays(null)
      }
    } else if (creating) {
      setContent('')
      setTag(creating.tag)
      setSaved(false)
      setExpiresInDays(7)
    }
  }, [note, creating])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(61, 40, 23, 0.35)',
          zIndex: 410,
        }}
      />
      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 0,
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '430px',
          background: 'var(--cream)',
          borderRadius: '28px 28px 0 0',
          padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
          zIndex: 411,
          maxHeight: '85dvh',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '40px', height: '4px', background: 'var(--line)', borderRadius: '2px', margin: '0 auto 16px' }} />

        {/* Tag chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {TAGS.map((t) => {
            const active = tag === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: 'none',
                  background: active ? noteTagColor(t) : 'var(--card)',
                  color: active ? 'var(--cream)' : 'var(--ink2)',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {t}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write…"
          rows={6}
          style={{
            width: '100%',
            resize: 'vertical',
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: '14px',
            padding: '12px 14px',
            fontSize: '15px',
            lineHeight: 1.55,
            fontFamily: 'inherit',
            color: 'var(--ink)',
            outline: 'none',
            minHeight: '120px',
            maxHeight: '40vh',
          }}
        />

        {/* Save toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '12px',
            padding: '8px 4px',
          }}
        >
          <span style={{ fontSize: '13px', color: 'var(--ink)' }}>Save permanently</span>
          <button
            type="button"
            role="switch"
            aria-checked={saved}
            onClick={() => setSaved(!saved)}
            style={{
              width: '44px', height: '26px', borderRadius: '13px',
              background: saved ? 'var(--ink)' : 'rgba(61,40,23,0.15)',
              border: 'none', cursor: 'pointer', position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute', top: '3px', left: saved ? '21px' : '3px',
                width: '20px', height: '20px', borderRadius: '50%', background: 'var(--cream)',
                transition: 'left 0.2s ease',
              }}
            />
          </button>
        </div>

        {/* Expires selector */}
        {!saved && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setExpiresInDays(d)}
                style={chipStyle(expiresInDays === d)}
              >
                {d} days
              </button>
            ))}
            <button
              type="button"
              onClick={() => setExpiresInDays(null)}
              style={chipStyle(expiresInDays === null)}
            >
              Never
            </button>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              color: 'var(--ink)',
              fontFamily: 'inherit',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={content.trim().length === 0}
            onClick={() =>
              onSave({
                content: content.trim(),
                tag,
                saved,
                expiresInDays,
                linkedSessionId: creating?.linkedSessionId ?? null,
              }, isNew)
            }
            style={{
              flex: 1,
              padding: '12px',
              background: content.trim().length === 0 ? 'var(--line)' : 'var(--ink)',
              border: 'none',
              borderRadius: '14px',
              color: 'var(--cream)',
              fontFamily: 'inherit',
              cursor: content.trim().length === 0 ? 'default' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {isNew ? 'Save note' : 'Update'}
          </button>
        </div>

        {!isNew && (
          <button
            type="button"
            onClick={onDelete}
            style={{
              display: 'block',
              margin: '12px auto 0',
              background: 'none',
              border: 'none',
              color: 'var(--emotional)',
              fontSize: '12px',
              fontFamily: 'inherit',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Delete
          </button>
        )}
      </div>
    </>
  )
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    borderRadius: '999px',
    border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
    background: active ? 'var(--ink)' : 'transparent',
    color: active ? 'var(--cream)' : 'var(--ink2)',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}

/** Notebook icon — outline SVG, 22px. */
export function NotebookIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z" />
      <path d="M5 4v16" />
      <line x1="9"  y1="8"  x2="16" y2="8" />
      <line x1="9"  y1="12" x2="16" y2="12" />
      <line x1="9"  y1="16" x2="14" y2="16" />
    </svg>
  )
}
