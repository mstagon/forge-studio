export interface ClaudeMdSection {
  heading: string
  level: number
  content: string
  raw: string
}

export interface ClaudeMdConfig {
  title: string
  description: string
  sections: ClaudeMdSection[]
  raw: string
}

export interface TechStackInfo {
  items: string[]
}

export interface CodingRule {
  id: string
  text: string
  enabled: boolean
}

export interface ForbiddenPattern {
  id: string
  text: string
  enabled: boolean
}
