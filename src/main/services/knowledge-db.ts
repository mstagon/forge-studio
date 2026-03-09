import { app } from 'electron'
import { join } from 'path'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require('better-sqlite3')

export interface KnowledgeEntry {
  id: number
  projectPath: string
  category: 'lesson' | 'pattern' | 'decision' | 'tip'
  title: string
  content: string
  tags: string
  repeatCount: number
  createdAt: string
  updatedAt: string
}

export interface KnowledgeSearchResult {
  entries: KnowledgeEntry[]
  total: number
}

let db: ReturnType<typeof Database> | null = null

function getDb(): ReturnType<typeof Database> {
  if (db) return db

  const dbPath = join(app.getPath('userData'), 'knowledge.db')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_path TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'lesson',
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      repeat_count INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_knowledge_project ON knowledge(project_path);
    CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge(category);
    CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge(tags);
  `)

  return db
}

function rowToEntry(row: Record<string, unknown>): KnowledgeEntry {
  return {
    id: row.id as number,
    projectPath: row.project_path as string,
    category: row.category as KnowledgeEntry['category'],
    title: row.title as string,
    content: row.content as string,
    tags: row.tags as string,
    repeatCount: row.repeat_count as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export function addKnowledge(entry: {
  projectPath: string
  category: KnowledgeEntry['category']
  title: string
  content: string
  tags: string[]
}): KnowledgeEntry {
  const d = getDb()

  // Check for duplicates by title in same project
  const existing = d.prepare(
    'SELECT * FROM knowledge WHERE project_path = ? AND title = ?'
  ).get(entry.projectPath, entry.title) as Record<string, unknown> | undefined

  if (existing) {
    d.prepare(
      `UPDATE knowledge SET repeat_count = repeat_count + 1, content = ?, tags = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(entry.content, entry.tags.join(','), existing.id)
    return rowToEntry({
      ...existing,
      content: entry.content,
      tags: entry.tags.join(','),
      repeat_count: (existing.repeat_count as number) + 1,
      updated_at: new Date().toISOString()
    })
  }

  const result = d.prepare(
    'INSERT INTO knowledge (project_path, category, title, content, tags) VALUES (?, ?, ?, ?, ?)'
  ).run(entry.projectPath, entry.category, entry.title, entry.content, entry.tags.join(','))

  return rowToEntry(
    d.prepare('SELECT * FROM knowledge WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>
  )
}

export function searchKnowledge(query: {
  projectPath?: string
  category?: KnowledgeEntry['category']
  search?: string
  limit?: number
  offset?: number
}): KnowledgeSearchResult {
  const d = getDb()
  const conditions: string[] = []
  const params: unknown[] = []

  if (query.projectPath) {
    conditions.push('project_path = ?')
    params.push(query.projectPath)
  }
  if (query.category) {
    conditions.push('category = ?')
    params.push(query.category)
  }
  if (query.search) {
    conditions.push('(title LIKE ? OR content LIKE ? OR tags LIKE ?)')
    const term = `%${query.search}%`
    params.push(term, term, term)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = query.limit || 50
  const offset = query.offset || 0

  const total = (d.prepare(`SELECT COUNT(*) as count FROM knowledge ${where}`).get(...params) as { count: number }).count
  const rows = d.prepare(
    `SELECT * FROM knowledge ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as Record<string, unknown>[]

  return {
    entries: rows.map(rowToEntry),
    total
  }
}

export function getEscalationCandidates(projectPath: string): KnowledgeEntry[] {
  const d = getDb()
  const rows = d.prepare(
    'SELECT * FROM knowledge WHERE project_path = ? AND repeat_count >= 3 ORDER BY repeat_count DESC'
  ).all(projectPath) as Record<string, unknown>[]
  return rows.map(rowToEntry)
}

export function deleteKnowledge(id: number): void {
  getDb().prepare('DELETE FROM knowledge WHERE id = ?').run(id)
}

export function updateKnowledge(id: number, updates: { title?: string; content?: string; tags?: string[]; category?: string }): void {
  const d = getDb()
  const sets: string[] = []
  const params: unknown[] = []

  if (updates.title !== undefined) { sets.push('title = ?'); params.push(updates.title) }
  if (updates.content !== undefined) { sets.push('content = ?'); params.push(updates.content) }
  if (updates.tags !== undefined) { sets.push('tags = ?'); params.push(updates.tags.join(',')) }
  if (updates.category !== undefined) { sets.push('category = ?'); params.push(updates.category) }

  if (sets.length === 0) return

  sets.push("updated_at = datetime('now')")
  params.push(id)
  d.prepare(`UPDATE knowledge SET ${sets.join(', ')} WHERE id = ?`).run(...params)
}

export function getAllProjectPaths(): string[] {
  const d = getDb()
  const rows = d.prepare('SELECT DISTINCT project_path FROM knowledge ORDER BY project_path').all() as { project_path: string }[]
  return rows.map((r) => r.project_path)
}

export function importLessonsFromFile(projectPath: string, content: string): number {
  const sections = content.split(/^### /gm).slice(1)
  let imported = 0

  for (const section of sections) {
    const lines = section.trim().split('\n')
    const titleLine = lines[0] || ''
    const title = titleLine.replace(/\[\d{4}-\d{2}-\d{2}\]\s*/, '').trim()
    if (!title) continue

    let rootCause = ''
    let prevention = ''

    for (const line of lines) {
      if (line.match(/^- (근본 원인|Root cause):/)) {
        rootCause = line.replace(/^- (근본 원인|Root cause):\s*/, '')
      }
      if (line.match(/^- (방지책|Prevention):/)) {
        prevention = line.replace(/^- (방지책|Prevention):\s*/, '')
      }
    }

    addKnowledge({
      projectPath,
      category: 'lesson',
      title,
      content: `Root cause: ${rootCause}\nPrevention: ${prevention}`,
      tags: ['lesson', 'imported']
    })
    imported++
  }

  return imported
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
