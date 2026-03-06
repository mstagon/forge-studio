import { Construction } from 'lucide-react'

export function PlaceholderView({ title }: { title: string }): React.ReactElement {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <Construction size={48} className="text-text-secondary mx-auto mb-4 opacity-30" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">{title}</h2>
        <p className="text-text-secondary text-sm">Coming in Phase 2</p>
      </div>
    </div>
  )
}
