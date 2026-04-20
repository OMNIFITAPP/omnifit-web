import { useUserStore } from '../../store/userStore'
import { DIM_MAP } from '../../data/dims'

function formatMemberSince(iso: string): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function AccountTab() {
  const { name, commitWhy, focusDim, memberSince, subscriptionStatus, planTier } = useUserStore()
  const planLabel =
    subscriptionStatus === 'trial'
      ? 'Trial'
      : planTier
      ? planTier.charAt(0).toUpperCase() + planTier.slice(1)
      : subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)
  const focus = focusDim ? DIM_MAP[focusDim] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Identity */}
      <section
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '20px',
          padding: '18px 18px 16px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink2)',
          }}
        >
          Member
        </div>
        <div
          style={{
            fontSize: '22px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            marginTop: '4px',
          }}
        >
          {name || 'Friend'}
        </div>

        <dl style={{ margin: '14px 0 0', display: 'grid', gap: '10px' }}>
          <Row label="Member since" value={formatMemberSince(memberSince)} />
          <Row label="Plan" value={planLabel} />
          {focus && <Row label="Focus" value={focus.label} valueColor={focus.color} />}
        </dl>
      </section>

      {/* Commitment */}
      {commitWhy && (
        <section
          style={{
            background: 'var(--rose)',
            borderRadius: '20px',
            padding: '18px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink2)',
              marginBottom: '6px',
            }}
          >
            Commitment
          </div>
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.5,
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            This matters to me because{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--ink)' }}>{commitWhy}</em>
          </p>
        </section>
      )}
    </div>
  )
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <dt style={{ fontSize: '12px', color: 'var(--ink2)' }}>{label}</dt>
      <dd
        style={{
          margin: 0,
          fontSize: '13px',
          fontWeight: 600,
          color: valueColor ?? 'var(--ink)',
        }}
      >
        {value}
      </dd>
    </div>
  )
}
