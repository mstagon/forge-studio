import { useState, useEffect } from 'react'
import { FileText, Upload, FolderOpen, ChevronRight } from 'lucide-react'
import { useAppStore } from '../stores/app.store'
import { clsx } from 'clsx'

interface DocFile {
  name: string
  path: string
  category: 'prd' | 'spec' | 'planningdocs' | 'architecture'
}

const CATEGORY_LABELS: Record<string, string> = {
  prd: 'PRD',
  spec: 'Specs',
  planningdocs: 'Planning Docs',
  architecture: 'Architecture'
}

export function PlanningView(): React.ReactElement {
  const project = useAppStore((s) => s.project)
  const [docs, setDocs] = useState<DocFile[]>([])
  const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(null)
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!project) return
    loadDocs()
  }, [project?.path])

  const loadDocs = async (): Promise<void> => {
    if (!project) return
    const allDocs: DocFile[] = []

    for (const category of ['prd', 'specs', 'planningdocs', 'architecture'] as const) {
      try {
        const entries = await window.forgeApi.project.readDir(`${project.path}/docs/${category}`)
        for (const entry of entries) {
          if (entry.name.endsWith('.md')) {
            allDocs.push({
              name: entry.name,
              path: `${project.path}/docs/${category}/${entry.name}`,
              category: category === 'specs' ? 'spec' : category
            })
          }
        }
      } catch {
        // directory doesn't exist
      }
    }
    setDocs(allDocs)
  }

  const handleSelect = async (doc: DocFile): Promise<void> => {
    setSelectedDoc(doc)
    try {
      const text = await window.forgeApi.fs.readFile(doc.path)
      setContent(text)
    } catch {
      setContent('Failed to read file.')
    }
  }

  // Group by category
  const grouped = new Map<string, DocFile[]>()
  for (const doc of docs) {
    const list = grouped.get(doc.category) || []
    list.push(doc)
    grouped.set(doc.category, list)
  }

  return (
    <div className="h-full flex">
      {/* Document list */}
      <div className="w-[260px] border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Planning Hub</h2>
          <p className="text-xs text-text-secondary mt-1">docs/ directory</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {docs.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-sm">
              <FolderOpen size={24} className="mx-auto mb-2 opacity-30" />
              <p>No documents yet.</p>
              <p className="text-xs mt-1">Create docs/prd/ or docs/specs/</p>
            </div>
          ) : (
            ['prd', 'spec', 'planningdocs', 'architecture'].map((cat) => {
              const items = grouped.get(cat)
              if (!items?.length) return null
              return (
                <div key={cat} className="mb-3">
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-2 mb-1">
                    {CATEGORY_LABELS[cat] || cat}
                  </div>
                  {items.map((doc) => (
                    <button
                      key={doc.path}
                      onClick={() => handleSelect(doc)}
                      className={clsx(
                        'w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2',
                        selectedDoc?.path === doc.path
                          ? 'bg-accent/10 text-accent'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                      )}
                    >
                      <FileText size={14} />
                      <span className="truncate">{doc.name}</span>
                    </button>
                  ))}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Document viewer */}
      <div className="flex-1 overflow-y-auto">
        {selectedDoc ? (
          <div className="p-6">
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
              <span>{CATEGORY_LABELS[selectedDoc.category]}</span>
              <ChevronRight size={14} />
              <span className="text-text-primary">{selectedDoc.name}</span>
            </div>
            <pre className="text-sm text-text-primary font-mono whitespace-pre-wrap leading-relaxed">
              {content}
            </pre>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FileText size={48} className="text-text-secondary mx-auto mb-4 opacity-20" />
              <p className="text-text-secondary mb-4">Select a document to view</p>
              <p className="text-xs text-text-secondary max-w-sm">
                Use <code className="bg-surface px-1 rounded">/plan-feature</code> in the terminal
                to generate PRDs and specs, or drag planning documents into <code className="bg-surface px-1 rounded">docs/planningdocs/</code>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
