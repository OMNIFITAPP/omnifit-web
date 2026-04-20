import type { DailyPlan, CompletionState } from '../../types'
import { dayWeight, completedWeight, MAX_DAY_WEIGHT } from '../../data/week'

export interface WaveDay {
  date: string
  label: string
  isToday: boolean
  isPast: boolean
  isFuture: boolean
  plan: DailyPlan
  checked: CompletionState
}

interface WaveChartProps {
  days: WaveDay[]
  onSelectDay: (date: string) => void
}

const CHART_H = 110
const COL_GAP = 6

export function WaveChart({ days, onSelectDay }: WaveChartProps) {
  return (
    <div style={{ display: 'flex', gap: `${COL_GAP}px`, alignItems: 'flex-end' }}>
      {days.map((day) => {
        const total = dayWeight(day.plan)
        const heightPct = total === 0 ? 0 : (total / MAX_DAY_WEIGHT) * 100
        const barH = Math.max(heightPct * (CHART_H / 100), total === 0 ? 6 : 10)

        const completedPct =
          day.isToday && total > 0 ? completedWeight(day.plan, day.checked) / total : 1

        return (
          <button
            key={day.date}
            type="button"
            onClick={() => onSelectDay(day.date)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {/* Column (full height clickable) */}
            <div
              style={{
                height: `${CHART_H}px`,
                width: '100%',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${barH}px`,
                  borderRadius: '6px',
                  position: 'relative',
                  overflow: 'hidden',
                  ...(day.isFuture
                    ? {
                        background: 'transparent',
                        border: '1px dashed var(--line)',
                      }
                    : day.isPast
                    ? { background: 'var(--ink)' }
                    : {
                        background: 'color-mix(in oklab, var(--physical) 22%, transparent)',
                        outline: '1.5px solid var(--physical)',
                      }),
                }}
              >
                {day.isToday && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: `${completedPct * 100}%`,
                      background: 'var(--physical)',
                      transition: 'height 0.3s ease',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Day label */}
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: day.isToday ? 'var(--physical)' : 'var(--ink2)',
              }}
            >
              {day.label}
            </div>
          </button>
        )
      })}
    </div>
  )
}
