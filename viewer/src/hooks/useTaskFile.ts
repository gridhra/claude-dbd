import { useState, useEffect, useCallback } from 'react'
import type { TaskFile, CalendarDay } from '../types'

export function useTaskFile(date: string) {
  const [taskFile, setTaskFile] = useState<TaskFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTaskFile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/tasks/${date}`)
      if (res.ok) {
        const data = await res.json()
        setTaskFile(data)
      } else if (res.status === 404) {
        setTaskFile(null)
      } else {
        const errData = await res.json()
        setError(errData.error || 'Failed to fetch task file')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    fetchTaskFile()
  }, [fetchTaskFile])

  return { taskFile, loading, error, refetch: fetchTaskFile }
}

export function useCalendar(year: number, month: number) {
  const [days, setDays] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCalendar = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/calendar/${year}/${month}`)
        if (res.ok) {
          const data = await res.json()
          setDays(data.days)
        }
      } catch {
        // Ignore errors, just show empty calendar
      } finally {
        setLoading(false)
      }
    }
    fetchCalendar()
  }, [year, month])

  return { days, loading }
}
