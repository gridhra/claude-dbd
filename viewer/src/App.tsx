import { useState } from 'react'
import { useTaskFile } from './hooks/useTaskFile'
import { TaskList } from './components/TaskList'
import { Calendar } from './components/Calendar'

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getWeekdayJa(dateStr: string): string {
  const date = new Date(dateStr)
  return WEEKDAYS[date.getDay()]
}

export default function App() {
  const today = formatDate(new Date())
  const [currentDate, setCurrentDate] = useState(today)
  const { taskFile, loading, error } = useTaskFile(currentDate)

  const goToPrev = () => setCurrentDate(addDays(currentDate, -1))
  const goToNext = () => setCurrentDate(addDays(currentDate, 1))
  const goToToday = () => setCurrentDate(today)

  const weekday = getWeekdayJa(currentDate)
  const isToday = currentDate === today

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">
            DBD Viewer
          </h1>
          {/* Date Navigation */}
          <div className="flex items-center justify-center gap-4 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
            <button
              onClick={goToPrev}
              className="p-2 rounded hover:bg-gray-100 text-gray-600"
              title="Previous day"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {currentDate} ({weekday})
              </div>
              {!isToday && (
                <button
                  onClick={goToToday}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Today
                </button>
              )}
            </div>
            <button
              onClick={goToNext}
              className="p-2 rounded hover:bg-gray-100 text-gray-600"
              title="Next day"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </header>

        {/* Calendar */}
        <Calendar currentDate={currentDate} onDateSelect={setCurrentDate} />

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center text-gray-400">Loading...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-lg border border-red-200 p-8">
            <div className="text-center text-red-600">{error}</div>
          </div>
        ) : taskFile ? (
          <TaskList taskFile={taskFile} />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center text-gray-400">
              No task file for this date
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
