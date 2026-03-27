import { useCalendar } from '../hooks/useTaskFile'

interface CalendarProps {
  currentDate: string
  onDateSelect: (date: string) => void
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function Calendar({ currentDate, onDateSelect }: CalendarProps) {
  const [year, month] = currentDate.split('-').map(Number)
  const { days, loading } = useCalendar(year, month)

  // Get first day of month's weekday
  const firstDay = new Date(year, month - 1, 1).getDay()

  // Group days into weeks
  const weeks: (typeof days[0] | null)[][] = []
  let currentWeek: (typeof days[0] | null)[] = Array(firstDay).fill(null)

  for (const day of days) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-center text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <h2 className="text-sm font-semibold text-gray-600 text-center">
          {year}年{month}月
        </h2>
      </div>
      <div className="p-2">
        <div className="grid grid-cols-7 gap-0.5 text-xs">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={`text-center py-1 font-medium ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              {label}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-0.5 text-xs">
            {week.map((day, di) => {
              if (!day) {
                return <div key={di} className="py-1" />
              }
              const isSelected = day.date === currentDate
              const dayNum = parseInt(day.date.split('-')[2], 10)
              const weekday = new Date(day.date).getDay()

              return (
                <button
                  key={day.date}
                  onClick={() => onDateSelect(day.date)}
                  className={`py-1 text-center rounded relative ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : day.hasFile
                      ? 'hover:bg-blue-100 cursor-pointer'
                      : 'text-gray-400 hover:bg-gray-100'
                  } ${!isSelected && weekday === 0 ? 'text-red-500' : ''} ${
                    !isSelected && weekday === 6 ? 'text-blue-500' : ''
                  }`}
                >
                  {dayNum}
                  {day.hasFile && !isSelected && (
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
