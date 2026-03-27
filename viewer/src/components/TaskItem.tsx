import type { Task } from '../types'
import { TagBadge, DueBadge } from './TagBadge'

interface TaskItemProps {
  task: Task
  currentDate: string
}

export function TaskItem({ task, currentDate }: TaskItemProps) {
  // Remove tags and metadata from display text
  const cleanText = task.text
    .replace(/#\w+/g, '')
    .replace(/@\w+/g, '')
    .replace(/due:\d{4}-\d{2}-\d{2}/g, '')
    .replace(/_done:\d{4}-\d{2}-\d{2}/g, '')
    .replace(/effort:\w+/g, '')
    .replace(/impact:\w+/g, '')
    .trim()

  return (
    <div className={`flex items-start gap-2 py-1 ${task.completed ? 'opacity-60' : ''}`}>
      <span className="text-lg leading-none mt-0.5">
        {task.completed ? (
          <span className="text-green-600">&#x2611;</span>
        ) : (
          <span className="text-gray-400">&#x2610;</span>
        )}
      </span>
      <div className="flex-1">
        <span className={task.completed ? 'line-through' : ''}>{cleanText}</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {task.tags.map((tag, i) => (
            <TagBadge key={i} tag={tag} />
          ))}
          {task.due && <DueBadge due={task.due} currentDate={currentDate} />}
        </div>
      </div>
    </div>
  )
}
