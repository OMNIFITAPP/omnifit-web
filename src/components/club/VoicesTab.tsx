import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { MONTHLY_CHALLENGE, WEEKLY_QUESTION } from '../../data/voices'

const REPORT_EMAIL = 'admin@omnifit.app'

interface VoiceRow {
  id: string
  user_id: string | null
  type: 'monthly' | 'weekly'
  content: string
  week_number: number
  created_at: string
  // Denormalized attribution (populated on insert)
  display_name: string | null
  member_since: string | null
}

function firstName(full: string | null | undefined): string {
  if (!full) return 'A member'
  const trimmed = full.trim().split(/\s+/)[0]
  return trimmed || 'A member'
}

function formatMemberSince(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function VoicesTab() {
  const [rows, setRows] = useState<VoiceRow[]>([])
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const userName = useUserStore((s) => s.name)
  const memberSince = useUserStore((s) => s.memberSince)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('voices')
          .select('*')
          .eq('type', 'weekly')
          .eq('week_number', WEEKLY_QUESTION.weekNumber)
          .order('created_at', { ascending: false })
          .limit(50)
        if (cancelled) return
        if (!error && data) setRows(data as VoiceRow[])
      } catch {
        /* offline — empty list */
      }
    })()
    return () => { cancelled = true }
  }, [])

  async function submit() {
    const content = input.trim()
    if (!content || submitting) return
    setSubmitting(true)

    const { data: { session } } = await supabase.auth.getSession()
    const uid = session?.user.id ?? null

    const optimistic: VoiceRow = {
      id: `local-${Date.now()}`,
      user_id: uid,
      type: 'weekly',
      content,
      week_number: WEEKLY_QUESTION.weekNumber,
      created_at: new Date().toISOString(),
      display_name: userName || null,
      member_since: memberSince ? `${memberSince}T00:00:00Z` : null,
    }
    setRows((r) => [optimistic, ...r])
    setInput('')

    try {
      await supabase.from('voices').insert({
        user_id: uid,
        type: 'weekly',
        content,
        week_number: WEEKLY_QUESTION.weekNumber,
        display_name: userName || null,
        member_since: memberSince ? `${memberSince}T00:00:00Z` : null,
      })
    } catch {
      /* leave optimistic row — will reconcile on reload */
    } finally {
      setSubmitting(false)
    }
  }

  function reportVoice(row: VoiceRow) {
    const reporterId = useUserStore.getState().userId ?? 'unknown'
    const subject = encodeURIComponent('OMNIFIT — Voice report')
    const body = encodeURIComponent(
      `Reported message:\n\n"${row.content}"\n\n` +
      `Voice id: ${row.id}\n` +
      `Author user id: ${row.user_id ?? 'unknown'}\n` +
      `Reporter user id: ${reporterId}\n` +
      `Reported at: ${new Date().toISOString()}`
    )
    window.location.href = `mailto:${REPORT_EMAIL}?subject=${subject}&body=${body}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Monthly challenge */}
      <section style={{ background: 'var(--rose)', borderRadius: '20px', padding: '18px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink2)' }}>
          Monthly challenge
        </div>
        <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--ink)', marginTop: '6px' }}>
          {MONTHLY_CHALLENGE.title}
        </div>
        <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--ink)', margin: '6px 0 10px' }}>
          {MONTHLY_CHALLENGE.description}
        </p>
        <div style={{ fontSize: '11px', color: 'var(--ink2)', fontWeight: 600 }}>
          {MONTHLY_CHALLENGE.memberCount} members in
        </div>
      </section>

      {/* Weekly question */}
      <section style={{ background: 'var(--rose)', borderRadius: '20px', padding: '18px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink2)' }}>
          This week's question
        </div>
        <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--ink)', marginTop: '6px', lineHeight: 1.3 }}>
          {WEEKLY_QUESTION.text}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--ink2)', fontWeight: 600, marginTop: '10px' }}>
          {WEEKLY_QUESTION.memberCount + rows.length} voices
        </div>
      </section>

      {/* Responses */}
      <section>
        {rows.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--ink2)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
            No voices yet this week. Yours can be the first.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rows.map((r) => {
              const since = formatMemberSince(r.member_since)
              return (
                <li
                  key={r.id}
                  style={{
                    position: 'relative',
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: '14px',
                    padding: '12px 14px 28px',
                  }}
                >
                  <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--ink)', margin: 0 }}>
                    {r.content}
                  </p>
                  <div
                    style={{
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--ink2)',
                      fontWeight: 600,
                      marginTop: '6px',
                    }}
                  >
                    {firstName(r.display_name)}
                    {since && ` · Member since ${since}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => reportVoice(r)}
                    aria-label="Report voice"
                    style={{
                      position: 'absolute',
                      right: '10px',
                      bottom: '8px',
                      background: 'none',
                      border: 'none',
                      fontSize: '10px',
                      color: 'var(--ink2)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      opacity: 0.6,
                      letterSpacing: '0.04em',
                      padding: '2px 4px',
                    }}
                  >
                    Report
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        style={{
          display: 'flex',
          gap: '8px',
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '14px',
          padding: '4px 4px 4px 14px',
          alignItems: 'center',
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add your voice"
          maxLength={280}
          disabled={submitting}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            fontSize: '14px',
            color: 'var(--ink)',
            outline: 'none',
            fontFamily: 'inherit',
            padding: '10px 0',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || submitting}
          style={{
            border: 'none',
            background: input.trim() ? 'var(--ink)' : 'var(--line)',
            color: 'var(--cream)',
            fontSize: '12px',
            fontWeight: 600,
            padding: '8px 14px',
            borderRadius: '10px',
            cursor: input.trim() ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}
