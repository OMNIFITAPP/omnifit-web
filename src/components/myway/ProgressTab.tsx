import { useState } from 'react'
import { ActivityGrid } from './ActivityGrid'
import { CapacityBars } from './CapacityBars'
import { WeeklyDebrief } from './WeeklyDebrief'
import { MonthlyCalendar } from './MonthlyCalendar'
import { useUserStore } from '../../store/userStore'

export function ProgressTab() {
  const activeDims = useUserStore((s) => s.activeDims)
  const [calendarOpen, setCalendarOpen] = useState(false)

  return (
    <div>
      {/* 1. Activity — current-season grid (toggle lives in the calendar modal) */}
      <ActivityGrid variant="season" onOpenCalendar={() => setCalendarOpen(true)} />

      {/* 2. Capacity */}
      <CapacityBars activeDims={activeDims} />

      {/* 3. Weekly debrief */}
      <WeeklyDebrief />

      <MonthlyCalendar open={calendarOpen} onClose={() => setCalendarOpen(false)} />
    </div>
  )
}
