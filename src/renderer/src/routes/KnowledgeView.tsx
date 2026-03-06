import { useState, useEffect } from 'react'
import { BookOpen, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react'
import { useAppStore } from '../stores/app.store'

interface Lesson {
  date: string
  title: string
  rootCause: string
  prevention: string
  repeatCount: number
}

export function KnowledgeView(): React.ReactElement {
  const project = useAppStore((s) => s.project)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [rawContent, setRawContent] = useState('')

  useEffect(() => {
    if (!project) return
    window.forgeApi.fs.readFile(`${project.path}/docs/lessons-learned.md`)
      .then((content: string) => {
        setRawContent(content)
        setLessons(parseLessons(content))
      })
      .catch(() => {
        setRawContent('')
        setLessons([])
      })
  }, [project?.path])

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <BookOpen size={20} className="text-text-secondary" />
        <h2 className="text-lg font-semibold text-text-primary">Knowledge Base</h2>
        <span className="text-sm text-text-secondary">Self-Improvement Loop</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl">
          <div className="bg-surface border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-text-primary">{lessons.length}</div>
            <div className="text-sm text-text-secondary">Total Lessons</div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-warning">{lessons.filter((l) => l.repeatCount >= 3).length}</div>
            <div className="text-sm text-text-secondary">Repeat Patterns</div>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-success">
              {lessons.length > 0 ? Math.round((lessons.filter((l) => l.repeatCount < 3).length / lessons.length) * 100) : 100}%
            </div>
            <div className="text-sm text-text-secondary">Learning Rate</div>
          </div>
        </div>

        {/* Escalation alerts */}
        {lessons.filter((l) => l.repeatCount >= 3).length > 0 && (
          <div className="mb-6 max-w-2xl">
            <h3 className="text-sm font-semibold text-warning flex items-center gap-2 mb-3">
              <AlertTriangle size={14} />
              Patterns to Escalate to CLAUDE.md
            </h3>
            {lessons.filter((l) => l.repeatCount >= 3).map((lesson, i) => (
              <div key={i} className="bg-warning/5 border border-warning/20 rounded-lg p-3 mb-2 flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-primary">{lesson.title}</div>
                  <div className="text-xs text-text-secondary">{lesson.repeatCount}x repeated — {lesson.prevention}</div>
                </div>
                <button className="text-xs text-warning hover:text-warning/80 border border-warning/30 rounded px-2 py-1">
                  Add to Rules
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Lessons list */}
        <div className="max-w-2xl">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Lessons Learned</h3>
          {lessons.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-sm">
              <BookOpen size={32} className="mx-auto mb-3 opacity-20" />
              <p>No lessons recorded yet.</p>
              <p className="text-xs mt-1">Run <code className="bg-surface px-1 rounded">/project:retrospective</code> after completing features.</p>
            </div>
          ) : (
            lessons.map((lesson, i) => (
              <div key={i} className="bg-surface border border-border rounded-lg p-4 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {lesson.repeatCount >= 3 ? (
                      <AlertTriangle size={14} className="text-warning" />
                    ) : (
                      <CheckCircle2 size={14} className="text-success" />
                    )}
                    <span className="text-sm font-medium text-text-primary">{lesson.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {lesson.repeatCount > 1 && (
                      <span className="text-xs bg-warning/10 text-warning px-1.5 py-0.5 rounded">{lesson.repeatCount}x</span>
                    )}
                    <span className="text-xs text-text-secondary">{lesson.date}</span>
                  </div>
                </div>
                <div className="text-xs text-text-secondary">
                  <span className="text-text-secondary/60">Root cause:</span> {lesson.rootCause}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  <span className="text-text-secondary/60">Prevention:</span> {lesson.prevention}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function parseLessons(content: string): Lesson[] {
  const lessons: Lesson[] = []
  const sections = content.split(/^### /gm).slice(1)

  for (const section of sections) {
    const lines = section.trim().split('\n')
    const titleLine = lines[0] || ''
    const dateMatch = titleLine.match(/\[(\d{4}-\d{2}-\d{2})\]/)
    const date = dateMatch ? dateMatch[1] : ''
    const title = titleLine.replace(/\[\d{4}-\d{2}-\d{2}\]\s*/, '').trim()

    let rootCause = ''
    let prevention = ''
    let repeatCount = 1

    for (const line of lines) {
      if (line.startsWith('- 근본 원인:') || line.startsWith('- Root cause:')) {
        rootCause = line.replace(/^- (근본 원인|Root cause):\s*/, '')
      }
      if (line.startsWith('- 방지책:') || line.startsWith('- Prevention:')) {
        prevention = line.replace(/^- (방지책|Prevention):\s*/, '')
      }
      const repeatMatch = line.match(/반복 횟수:\s*(\d+)/)
      if (repeatMatch) repeatCount = parseInt(repeatMatch[1])
    }

    if (title) {
      lessons.push({ date, title, rootCause, prevention, repeatCount })
    }
  }

  return lessons
}
