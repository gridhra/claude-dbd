import type { TaskFile } from '../types'
import { TaskItem } from './TaskItem'
import { Section } from './Section'

interface TaskListProps {
  taskFile: TaskFile
}

export function TaskList({ taskFile }: TaskListProps) {
  const { carryoverTasks, todayTasks, doneItems, handoff, notes, date } = taskFile

  return (
    <div>
      {carryoverTasks.length > 0 && (
        <Section title="Carryover">
          {carryoverTasks.map((task) => (
            <TaskItem key={task.index} task={task} currentDate={date} />
          ))}
        </Section>
      )}

      <Section title="Tasks" empty={todayTasks.length === 0}>
        {todayTasks.map((task) => (
          <TaskItem key={task.index} task={task} currentDate={date} />
        ))}
      </Section>

      <Section title="Done" empty={doneItems.length === 0}>
        {doneItems.map((item, i) => (
          <div key={i} className="text-sm py-0.5 text-gray-700">
            - {item}
          </div>
        ))}
      </Section>

      <Section title="Handoff" empty={!handoff.trim()}>
        <div className="text-sm text-gray-700 whitespace-pre-wrap">{handoff}</div>
      </Section>

      <Section title="Notes" empty={!notes.trim()}>
        <div className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</div>
      </Section>
    </div>
  )
}
