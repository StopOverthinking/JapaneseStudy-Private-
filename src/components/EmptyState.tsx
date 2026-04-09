import type { LucideIcon } from 'lucide-react'
import { GlassPanel } from '@/components/GlassPanel'

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <GlassPanel padding="lg">
      <div className="empty-state">
        <Icon size={30} strokeWidth={1.7} color="var(--accent-ice)" />
        <strong>{title}</strong>
        <p className="section-copy">{description}</p>
      </div>
    </GlassPanel>
  )
}
