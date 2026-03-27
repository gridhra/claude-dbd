import express from 'express'
import * as fs from 'node:fs'
import * as path from 'node:path'

const app = express()
const PORT = 3001

// Get DBD_ROOT from environment or use default relative path
const DBD_ROOT = process.env.DBD_ROOT || path.resolve(process.cwd(), '../..')
const TASKS_DIR = path.join(DBD_ROOT, 'tasks')

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Task {
  index: number
  text: string
  completed: boolean
  tags: string[]
  due?: string
  doneDate?: string
}

interface ParsedTaskFile {
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

function getWeekday(dateStr: string): string {
  const date = new Date(dateStr)
  return WEEKDAYS[date.getDay()]
}

function getTaskFilePath(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  return path.join(TASKS_DIR, year, month, `${dateStr}.md`)
}

function taskFileExists(dateStr: string): boolean {
  const filePath = getTaskFilePath(dateStr)
  return fs.existsSync(filePath)
}

function parseTaskLine(text: string, index: number, completed: boolean): Task {
  const tags: string[] = []
  let due: string | undefined
  let doneDate: string | undefined

  // Extract #tags
  const tagMatches = text.matchAll(/#(\w+)/g)
  for (const match of tagMatches) {
    tags.push(`#${match[1]}`)
  }

  // Extract @mentions as tags too
  const mentionMatches = text.matchAll(/@(\w+)/g)
  for (const match of mentionMatches) {
    tags.push(`@${match[1]}`)
  }

  // Extract due date
  const dueMatch = text.match(/due:(\d{4}-\d{2}-\d{2})/)
  if (dueMatch) {
    due = dueMatch[1]
  }

  // Extract done date
  const doneMatch = text.match(/_done:(\d{4}-\d{2}-\d{2})/)
  if (doneMatch) {
    doneDate = doneMatch[1]
  }

  return { index, text, completed, tags, due, doneDate }
}

function parseTaskFile(content: string, dateStr: string): ParsedTaskFile {
  const lines = content.split('\n')
  const carryoverTasks: Task[] = []
  const todayTasks: Task[] = []
  const doneItems: string[] = []
  const handoffLines: string[] = []
  const notesLines: string[] = []

  let frontmatter = { date: dateStr, weekday: getWeekday(dateStr), prev: '' }
  let inFrontmatter = false
  let currentSection = ''
  let taskIndex = 1

  for (const line of lines) {
    if (line === '---') {
      inFrontmatter = !inFrontmatter
      continue
    }

    if (inFrontmatter) {
      const match = line.match(/^(\w+):\s*(.*)$/)
      if (match) {
        const [, key, value] = match
        if (key === 'date') frontmatter.date = value
        if (key === 'weekday') frontmatter.weekday = value
        if (key === 'prev') frontmatter.prev = value
      }
      continue
    }

    if (line.startsWith('## ')) {
      currentSection = line.slice(3).trim()
      continue
    }

    if (currentSection === 'Carryover') {
      const taskMatch = line.match(/^- \[([ x])\] (.+)$/)
      if (taskMatch) {
        const [, checkmark, text] = taskMatch
        const completed = checkmark === 'x'
        const task = parseTaskLine(text, taskIndex, completed)
        carryoverTasks.push(task)
        taskIndex++
      }
    }

    if (currentSection === 'Tasks') {
      const taskMatch = line.match(/^- \[([ x])\] (.+)$/)
      if (taskMatch) {
        const [, checkmark, text] = taskMatch
        const completed = checkmark === 'x'
        const task = parseTaskLine(text, taskIndex, completed)
        todayTasks.push(task)
        taskIndex++
      }
    }

    if (currentSection === 'Done') {
      const doneMatch = line.match(/^- (.+)$/)
      if (doneMatch) {
        doneItems.push(doneMatch[1])
      }
    }

    if (currentSection === 'Handoff') {
      if (!line.startsWith('<!--') && line.trim() !== '') {
        handoffLines.push(line)
      }
    }

    if (currentSection === 'Notes') {
      if (!line.startsWith('<!--') && line.trim() !== '') {
        notesLines.push(line)
      }
    }
  }

  return {
    date: frontmatter.date,
    weekday: frontmatter.weekday,
    prev: frontmatter.prev,
    content,
    tasks: [...carryoverTasks, ...todayTasks],
    doneItems,
    carryoverTasks,
    todayTasks,
    handoff: handoffLines.join('\n'),
    notes: notesLines.join('\n'),
  }
}

function readTaskFile(dateStr: string): ParsedTaskFile | null {
  const filePath = getTaskFilePath(dateStr)
  if (!fs.existsSync(filePath)) {
    return null
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  return parseTaskFile(content, dateStr)
}

// API endpoints
app.get('/api/tasks/:date', (req, res) => {
  const { date } = req.params

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' })
  }

  const taskFile = readTaskFile(date)
  if (!taskFile) {
    return res.status(404).json({ error: 'Task file not found', date })
  }

  res.json(taskFile)
})

app.get('/api/calendar/:year/:month', (req, res) => {
  const { year, month } = req.params

  // Validate year and month
  const yearNum = parseInt(year, 10)
  const monthNum = parseInt(month, 10)
  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({ error: 'Invalid year or month' })
  }

  const monthDir = path.join(TASKS_DIR, year, month.padStart(2, '0'))
  const days: { date: string; hasFile: boolean }[] = []

  // Get number of days in month
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${month.padStart(2, '0')}-${String(day).padStart(2, '0')}`
    days.push({
      date: dateStr,
      hasFile: taskFileExists(dateStr),
    })
  }

  res.json({ year: yearNum, month: monthNum, days })
})

app.listen(PORT, () => {
  console.log(`DBD Viewer API server running on http://localhost:${PORT}`)
  console.log(`DBD_ROOT: ${DBD_ROOT}`)
  console.log(`Tasks directory: ${TASKS_DIR}`)
})
