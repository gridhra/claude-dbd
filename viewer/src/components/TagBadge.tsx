interface TagBadgeProps {
  tag: string
}

export function TagBadge({ tag }: TagBadgeProps) {
  const isProject = tag.startsWith('#')
  const isMention = tag.startsWith('@')

  let colorClass = 'bg-gray-200 text-gray-700'
  if (isProject) {
    colorClass = 'bg-blue-100 text-blue-800'
  } else if (isMention) {
    colorClass = 'bg-green-100 text-green-800'
  }

  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${colorClass}`}>
      {tag}
    </span>
  )
}

interface DueBadgeProps {
  due: string
  currentDate: string
}

export function DueBadge({ due, currentDate }: DueBadgeProps) {
  const dueDate = new Date(due)
  const current = new Date(currentDate)
  const isOverdue = dueDate < current
  const isToday = due === currentDate

  let colorClass = 'bg-gray-200 text-gray-700'
  if (isOverdue) {
    colorClass = 'bg-red-100 text-red-800'
  } else if (isToday) {
    colorClass = 'bg-yellow-100 text-yellow-800'
  }

  const displayDate = due.slice(5) // MM-DD

  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${colorClass}`}>
      {isOverdue ? '!' : ''}due:{displayDate}
    </span>
  )
}
