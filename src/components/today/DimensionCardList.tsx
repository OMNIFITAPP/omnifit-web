import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DimensionCard } from './DimensionCard'
import type { DimConfig, Tier, Dimension } from '../../types'

interface Props {
  items: DimConfig[]
  plan: Record<Dimension, Tier>
  checked: Record<Dimension, boolean>
  dayComplete: boolean
  allowSwap: boolean
  greyAll: boolean
  onOpenDetail: (dim: Dimension) => void
  onOpenSwap: (dim: DimConfig) => void
  onToggleCheck: (dim: Dimension) => void
  onReorder: (order: Dimension[]) => void
}

function SortableCard({
  dim,
  tier,
  checked,
  dayComplete,
  allowSwap,
  greyed,
  onOpenDetail,
  onOpenSwap,
  onToggleCheck,
}: {
  dim: DimConfig
  tier: Tier
  checked: boolean
  dayComplete: boolean
  allowSwap: boolean
  greyed: boolean
  onOpenDetail: () => void
  onOpenSwap: () => void
  onToggleCheck: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dim.key })

  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1)',
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <DimensionCard
      ref={setNodeRef}
      dim={dim}
      tier={tier}
      checked={checked}
      dayComplete={dayComplete}
      allowSwap={allowSwap}
      greyed={greyed}
      dragStyle={dragStyle}
      dragHandleProps={{ ...attributes, ...listeners }}
      isDragging={isDragging}
      onOpenDetail={onOpenDetail}
      onOpenSwap={onOpenSwap}
      onToggleCheck={onToggleCheck}
    />
  )
}

export function DimensionCardList({
  items,
  plan,
  checked,
  dayComplete,
  allowSwap,
  greyAll,
  onOpenDetail,
  onOpenSwap,
  onToggleCheck,
  onReorder,
}: Props) {
  const sensors = useSensors(
    // 500ms long-press for touch, 150ms + 5px tolerance for mouse so normal
    // taps don't accidentally start a drag.
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 500, tolerance: 5 } })
  )

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((d) => d.key === active.id)
    const newIndex = items.findIndex((d) => d.key === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(items, oldIndex, newIndex).map((d) => d.key as Dimension)
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(30)
    }
    onReorder(next)
  }

  const ids = items.map((d) => d.key)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((dim) => (
            <SortableCard
              key={dim.key}
              dim={dim}
              tier={plan[dim.key as Dimension]}
              checked={checked[dim.key as Dimension]}
              dayComplete={dayComplete}
              allowSwap={allowSwap}
              greyed={greyAll}
              onOpenDetail={() => onOpenDetail(dim.key as Dimension)}
              onOpenSwap={() => onOpenSwap(dim)}
              onToggleCheck={() => onToggleCheck(dim.key as Dimension)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
