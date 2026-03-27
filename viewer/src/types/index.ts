export interface Task {
  index: number
  text: string
  completed: boolean
  tags: string[]
  due?: string
  doneDate?: string
}

export interface TaskFile {
  date: string
  weekday: string
  prev: string
  content: string
  tasks: Task[]
  doneItems: string[]
  carryoverTasks: Task[]
  todayTasks: Task[]
  handoff: string
  notes: string
}

export interface CalendarDay {
  date: string
  hasFile: boolean
}
