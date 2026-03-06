import type { ClaudeMdConfig, ClaudeMdSection } from '../../shared/types/claude-md.types'

export function parseClaudeMd(raw: string): ClaudeMdConfig {
  const lines = raw.split('\n')
  let title = ''
  let description = ''
  const sections: ClaudeMdSection[] = []

  let currentSection: ClaudeMdSection | null = null
  let contentLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)

    if (headingMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.content = contentLines.join('\n').trim()
        currentSection.raw = `${currentSection.raw}\n${currentSection.content}`
        sections.push(currentSection)
      }

      const level = headingMatch[1].length
      const heading = headingMatch[2].trim()

      if (level === 1 && !title) {
        title = heading
        // Next non-empty line might be description
        const nextLine = lines[i + 1]?.trim()
        if (nextLine && !nextLine.startsWith('#')) {
          description = nextLine
        }
        currentSection = null
        contentLines = []
        continue
      }

      currentSection = { heading, level, content: '', raw: line }
      contentLines = []
    } else if (currentSection) {
      contentLines.push(line)
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = contentLines.join('\n').trim()
    currentSection.raw = `${currentSection.raw}\n${currentSection.content}`
    sections.push(currentSection)
  }

  return { title, description, sections, raw }
}

export function serializeClaudeMd(config: ClaudeMdConfig): string {
  const parts: string[] = []

  parts.push(`# ${config.title}`)
  if (config.description) {
    parts.push('')
    parts.push(config.description)
  }

  for (const section of config.sections) {
    parts.push('')
    parts.push(`${'#'.repeat(section.level)} ${section.heading}`)
    if (section.content) {
      parts.push('')
      parts.push(section.content)
    }
  }

  parts.push('')
  return parts.join('\n')
}

export function updateSection(config: ClaudeMdConfig, heading: string, newContent: string): ClaudeMdConfig {
  const sections = config.sections.map((s) => {
    if (s.heading === heading) {
      return { ...s, content: newContent }
    }
    return s
  })
  return { ...config, sections, raw: serializeClaudeMd({ ...config, sections }) }
}
