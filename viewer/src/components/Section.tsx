import { ReactNode } from 'react'

interface SectionProps {
  title: string
  children: ReactNode
  empty?: boolean
}

export function Section({ title, children, empty }: SectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <h2 className="text-sm font-semibold text-gray-600">{title}</h2>
      </div>
      <div className="px-4 py-3">
        {empty ? (
          <p className="text-sm text-gray-400 italic">No items</p>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
