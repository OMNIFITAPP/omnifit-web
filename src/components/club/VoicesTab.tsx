import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'

interface WeeklyQuestion {
  id: string
  question: string
  week_start: string
}

interface MonthlyChallenge {
  id: string
  title: string
  description: string
  month_start: string
}

interface VoiceRow {
  id: string
  user_id: string
  question_id: string
  content: string
  resonance_count: number
  created_at: string
}

interface AuthorInfo {
  name: string | null
  member_since: string | null
}

const MIN_LEN = 20
const MAX_LEN = 400

function firstName(full: string | null | undefined): string {
  if (!full) return 'A member'
  return full.trim().split(/\s+/)[0] || 'A member'
}

function formatMemberSince(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function startOfWeekISO(): string {
  // Monday-anchored, matches PostgreSQL date_trunc('week', current_date)
  const today = new Date()
  const dow = (today.getDay() + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dow)
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate())
    .toISOString()
    .split('T')[0]
}

function startOfMonthISO(): string {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
}

export function VoicesTab() {
  const userId = useUserStore((s) => s.userId)

  const [challenge, setChallenge] = useState<MonthlyChallenge | null>(null)
  const [question, setQuestion] = useState<WeeklyQuestion | null>(null)
  const [questionMissing, setQuestionMissing] = useState(false)
  const [voices, setVoices] = useState<VoiceRow[]>([])
  const [authors, setAuthors] = useState<Record<string, AuthorInfo>>({})
  const [resonatedIds, setResonatedIds] = useState<Set<string>>(new Set())
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set())
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const weekStart = startOfWeekISO()
    const monthStart = startOfMonthISO()
    setLoading(true)

    ;(async () => {
      try {
        // Monthly challenge
        const ch = await supabase
          .from('monthly_challenges')
          .select('*')
          .eq('month_start', monthStart)
          .maybeSingle()
        if (!cancelled && ch.data) setChallenge(ch.data as MonthlyChallenge)

        // Weekly question
        const q = await supabase
          .from('weekly_questions')
          .select('*')
          .eq('week_start', weekStart)
          .maybeSingle()
        if (cancelled) return
        if (!q.data) {
          setQuestionMissing(true)
          setLoading(false)
          return
        }
        const qRow = q.data as WeeklyQuestion
        setQuestion(qRow)

        // Voices for this question
        const v = await supabase
          .from('voices')
          .select('*')
          .eq('question_id', qRow.id)
          .order('created_at', { ascending: false })
        if (cancelled) return
        const rows = (v.data ?? []) as VoiceRow[]
        setVoices(rows)

        // Authors lookup
        const ids = Array.from(new Set(rows.map((r) => r.user_id)))
        if (ids.length > 0) {
          const a = await supabase
            .from('profiles')
            .select('id, name, member_since')
            .in('id', ids)
          if (!cancelled && a.data) {
            const map: Record<string, AuthorInfo> = {}
            for (const row of a.data as Array<{
              id: string
              name: string | null
              member_since: string | null
            }>) {
              map[row.id] = { name: row.name, member_since: row.member_since }
            }
            setAuthors(map)
          }
        }

        // User-specific: resonances + reports
        if (userId && rows.length > 0) {
          const voiceIds = rows.map((r) => r.id)
          const [res, rep] = await Promise.all([
            supabase
              .from('voice_resonances')
              .select('voice_id')
              .eq('user_id', userId)
              .in('voice_id', voiceIds),
            supabase
              .from('voice_reports')
              .select('voice_id')
              .eq('reporter_id', userId)
              .in('voice_id', voiceIds),
          ])
          if (!cancelled) {
            setResonatedIds(
              new Set((res.data ?? []).map((r: { voice_id: string }) => r.voice_id))
            )
            setReportedIds(
              new Set((rep.data ?? []).map((r: { voice_id: string }) => r.voice_id))
            )
          }
        }
      } catch {
        /* offline / not migrated yet */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [userId])

  async function submit() {
    const content = draft.trim()
    if (content.length < MIN_LEN || submitting || !question || !userId) return
    setSubmitting(true)
    try {
      const insert = await supabase
        .from('voices')
        .insert({ user_id: userId, question_id: question.id, content })
        .select('*')
        .single()
      if (insert.data) {
        const newRow = insert.data as VoiceRow
        setVoices((prev) => [newRow, ...prev])
        const u = useUserStore.getState()
        setAuthors((prev) => ({
          ...prev,
          [userId]: { name: u.name || null, member_since: u.memberSince || null },
        }))
        setDraft('')
      }
    } catch {
      /* leave draft so user can retry */
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleResonance(voice: VoiceRow) {
    if (!userId || voice.user_id === userId) return
    const already = resonatedIds.has(voice.id)
    setResonatedIds((prev) => {
      const next = new Set(prev)
      if (already) next.delete(voice.id); else next.add(voice.id)
      return next
    })
    setVoices((prev) =>
      prev.map((v) =>
        v.id === voice.id
          ? { ...v, resonance_count: Math.max(0, v.resonance_count + (already ? -1 : 1)) }
          : v
      )
    )
    try {
      if (already) {
        await supabase
          .from('voice_resonances')
          .delete()
          .eq('user_id', userId)
          .eq('voice_id', voice.id)
      } else {
        await supabase
          .from('voice_resonances')
          .insert({ user_id: userId, voice_id: voice.id })
      }
    } catch {
      /* trigger maintains resonance_count server-side */
    }
  }

  async function reportVoice(voice: VoiceRow) {
    if (!userId || reportedIds.has(voice.id)) return
    setReportingId(voice.id)
    try {
      await supabase
        .from('voice_reports')
        .insert({ reporter_id: userId, voice_id: voice.id })
    } catch {
      /* swallow — silent moderation */
    }
    setTimeout(() => {
      setReportedIds((prev) => {
        const next = new Set(prev)
        next.add(voice.id)
        return next
      })
      setReportingId(null)
    }, 1000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Monthly challenge */}
      {challenge && (
        <section style={{ background: 'var(--rose)', borderRadius: '20px', padding: '18px' }}>
          <div
            style={{
              fontSize: '9px',
              fontWeight: 700,
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
            {challenge.title}
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--ink)', margin: '6px 0 0' }}>
            {challenge.description}
          </p>
        </section>
      )}

      {/* Weekly question */}
      <section
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '20px',
          padding: '18px',
        }}
      >
        <div
          style={{
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink2)',
          }}
        >
          This week's question
        </div>
        {questionMissing ? (
          <p style={{ fontSize: '14px', color: 'var(--ink2)', marginTop: '8px', fontStyle: 'italic' }}>
            This week's question is on its way.
          </p>
        ) : question ? (
          <>
            <div
              style={{
                fontSize: '17px',
                fontWeight: 600,
                color: 'var(--ink)',
                lineHeight: 1.35,
                marginTop: '6px',
              }}
            >
              {question.question}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--ink2)',
                fontStyle: 'italic',
                marginTop: '10px',
              }}
            >
              {voices.length} {voices.length === 1 ? 'member has' : 'members have'} responded
            </div>
          </>
        ) : (
          <div style={{ height: '24px' }} />
        )}
      </section>

      {/* Add your voice */}
      {question && !questionMissing && (
        <section>
          <div style={{ position: 'relative' }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
              placeholder="Add your voice when you have one. Not before."
              rows={3}
              maxLength={MAX_LEN}
              disabled={submitting}
              className="voice-textarea"
              style={{
                width: '100%',
                resize: 'none',
                background: 'var(--card)',
                border: '1px solid var(--line)',
                borderRadius: '16px',
                padding: '12px 14px 28px',
                fontSize: '14px',
                lineHeight: 1.55,
                fontFamily: 'inherit',
                color: 'var(--ink)',
                outline: 'none',
              }}
            />
            {draft.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '14px',
                  fontSize: '10px',
                  color: 'var(--ink2)',
                  opacity: 0.7,
                }}
              >
                {draft.length} / {MAX_LEN}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              onClick={submit}
              disabled={draft.trim().length < MIN_LEN || submitting}
              style={{
                background: draft.trim().length >= MIN_LEN ? 'var(--ink)' : 'var(--line)',
                color: 'var(--cream)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: draft.trim().length >= MIN_LEN && !submitting ? 'pointer' : 'default',
                fontFamily: 'inherit',
              }}
            >
              Post
            </button>
          </div>
          <style>{`
            .voice-textarea::placeholder {
              color: var(--ink2);
              opacity: 0.5;
              font-style: italic;
            }
          `}</style>
        </section>
      )}

      {/* Voices list */}
      {!questionMissing && (
        <section>
          {loading ? (
            <SkeletonRows />
          ) : voices.length === 0 ? (
            <div
              style={{
                fontSize: '13px',
                color: 'var(--ink2)',
                fontStyle: 'italic',
                textAlign: 'center',
                padding: '24px 0',
              }}
            >
              No voices yet this week. Be the first.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {voices.map((v, i) => {
                const author = authors[v.user_id]
                const since = formatMemberSince(author?.member_since)
                const isOwn = v.user_id === userId
                const resonated = resonatedIds.has(v.id)
                const reported = reportedIds.has(v.id)
                const isReportingNow = reportingId === v.id
                const others = Math.max(0, v.resonance_count - (resonated ? 1 : 0))
                return (
                  <li
                    key={v.id}
                    style={{
                      padding: '14px 0',
                      borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                    }}
                  >
                    <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--ink)', margin: 0 }}>
                      {v.content}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginTop: '8px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '9px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'var(--ink2)',
                          fontWeight: 600,
                        }}
                      >
                        — {firstName(author?.name)}
                        {since && ` · member since ${since}`}
                      </div>
                      {isOwn ? (
                        <span
                          style={{
                            fontSize: '9px',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--ink2)',
                            fontStyle: 'italic',
                          }}
                        >
                          Your voice
                        </span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <button
                            type="button"
                            onClick={() => toggleResonance(v)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              fontSize: '10px',
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                              color: resonated ? 'var(--ink)' : 'var(--ink2)',
                              fontWeight: resonated ? 700 : 600,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            {resonated
                              ? `You resonated${others > 0 ? ` · ${others} ${others === 1 ? 'other' : 'others'}` : ''}`
                              : 'This resonated'}
                          </button>
                          {!reported && !isReportingNow && (
                            <button
                              type="button"
                              onClick={() => reportVoice(v)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                fontSize: '9px',
                                letterSpacing: '0.08em',
                                color: 'var(--ink2)',
                                opacity: 0.5,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              Report
                            </button>
                          )}
                          {isReportingNow && (
                            <span
                              style={{
                                fontSize: '9px',
                                letterSpacing: '0.08em',
                                color: 'var(--ink2)',
                                fontStyle: 'italic',
                              }}
                            >
                              Reported
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {/* Quiet line */}
      <div
        style={{
          fontSize: '13px',
          color: 'var(--ink2)',
          fontStyle: 'italic',
          textAlign: 'center',
          marginTop: '8px',
        }}
      >
        Add your voice when you have one. Not before.
      </div>
    </div>
  )
}

function SkeletonRows() {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          style={{
            padding: '14px 0',
            borderTop: i === 0 ? 'none' : '1px solid var(--line)',
          }}
        >
          <div
            style={{
              height: '14px',
              borderRadius: '4px',
              background: 'var(--line)',
              opacity: 0.6,
              marginBottom: '6px',
              width: '90%',
            }}
          />
          <div
            style={{
              height: '14px',
              borderRadius: '4px',
              background: 'var(--line)',
              opacity: 0.6,
              width: '60%',
              marginBottom: '8px',
            }}
          />
          <div
            style={{
              height: '8px',
              borderRadius: '4px',
              background: 'var(--line)',
              opacity: 0.4,
              width: '40%',
            }}
          />
        </li>
      ))}
    </ul>
  )
}
