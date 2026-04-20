import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { MONTHLY_CHALLENGE, WEEKLY_QUESTION } from '../../data/voices'

interface VoiceRow {
  id: string
  user_id: string | null
  type: 'monthly' | 'weekly'
  content: string
  week_number: number
  created_at: string
}

export function VoicesTab() {
  const [rows, setRows] = useState<VoiceRow[]>([])
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

    // Optimistic insert so the UI updates immediately
    const optimistic: VoiceRow = {
      id: `local-${Date.now()}`,
      user_id: null,
      type: 'weekly',
      content,
      week_number: WEEKLY_QUESTION.weekNumber,
      created_at: new Date().toISOString(),
    }
    setRows((r) => [optimistic, ...r])
    setInput('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      await supabase.from('voices').insert({
        user_id: session?.user.id ?? null,
        type: 'weekly',
        content,
        week_number: WEEKLY_QUESTION.weekNumber,
      })
    } catch {
      /* leave the optimistic row — will reconcile on reload */
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Monthly challenge */}
      <section style={{ background: 'var(--rose)', borderRadius: '20px', padding: '18px' }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink2)',
          }}
        >
          Monthly challenge
        </div>
        <div
          style={{
            fontSize: '18px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: 'var(--ink)',
            marginTop: '6px',
          }}
        >
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
        <div
          style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink2)',
          }}
        >
          This week's question
        </div>
        <div
          style={{
            fontSize: '18px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: 'var(--ink)',
            marginTop: '6px',
            lineHeight: 1.3,
          }}
        >
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
            {rows.map((r) => (
              <li
                key={r.id}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: '14px',
                  padding: '12px 14px',
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
                  — A member
                </div>
              </li>
            ))}
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
