import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/app.store'

export function useProjectData<T>(fetcher: (projectPath: string) => Promise<T>, deps: unknown[] = []) {
  const project = useAppStore((s) => s.project)
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      const result = await fetcher(project.path)
      setData(result)
    } catch (err) {
      console.error('Failed to fetch project data:', err)
    } finally {
      setLoading(false)
    }
  }, [project?.path, ...deps])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Listen for file changes
  useEffect(() => {
    if (!project) return
    const unsubscribe = window.forgeApi.project.onFileChanged(() => {
      refresh()
    })
    return unsubscribe
  }, [project?.path, refresh])

  return { data, loading, refresh, setData }
}
