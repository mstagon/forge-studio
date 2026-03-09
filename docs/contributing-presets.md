# Preset Development Guide

How to add a new tech stack preset to Forge Studio.

---

## Overview

A **preset** is a complete Claude Code configuration for a specific tech stack. When a user creates a new project with your preset, Forge Studio generates:

- `CLAUDE.md` — Project rules, tech stack, coding conventions
- `.claude/agents/*.md` — AI agents with stack-specific expertise
- `.claude/commands/*.md` — Workflow commands (plan, implement, review)
- `.claude/skills/*/SKILL.md` — Reusable code patterns and templates
- `.claude/settings.json` — Hooks and permissions
- `docs/templates/` — PRD and spec templates

---

## Architecture

```
User picks preset in wizard
        ↓
NewProjectWizard.tsx  →  IPC  →  preset-applier.ts
                                     ↓
                              preset-registry.ts (PRESETS array)
                                     ↓
                              Writes files to project directory
```

**Key files:**

| File | Role |
|------|------|
| `src/shared/types/preset.types.ts` | TypeScript interfaces |
| `src/main/services/preset-registry.ts` | All built-in presets + base agents |
| `src/main/services/preset-applier.ts` | Applies preset to a project directory |
| `src/main/services/preset-exporter.ts` | Exports existing project as a preset |
| `src/renderer/src/components/wizard/NewProjectWizard.tsx` | UI for preset selection |

---

## Type Definitions

```typescript
// src/shared/types/preset.types.ts

interface TechStackPreset {
  id: string                          // unique kebab-case ID (e.g., 'go-gin')
  name: string                       // display name (e.g., 'Go + Gin')
  description: string                // one-line description
  icon: string                       // emoji
  category: 'mobile' | 'web' | 'backend' | 'fullstack' | 'custom'

  stack: {
    language: string                 // e.g., 'Go 1.22+'
    framework: string               // e.g., 'Gin v1.10'
    stateManagement?: string
    backend?: string
    router?: string
    database?: string
    styling?: string
    packages?: string[]              // key packages
  }

  architecture: {
    pattern: string                  // e.g., 'Clean Architecture'
    structure: string                // e.g., 'cmd/api/ + internal/{handler,service,repo}/'
    reference?: string               // example directory path
  }

  build: {
    setup: string                    // e.g., 'go mod tidy'
    analyze?: string                 // e.g., 'golangci-lint run'
    test?: string                    // e.g., 'go test ./...'
    format?: string                  // e.g., 'gofmt -w .'
    codegen?: string                 // e.g., 'go generate ./...'
  }

  codingRules: string[]              // coding conventions
  forbiddenPatterns: string[]        // anti-patterns to avoid

  agents: PresetAgent[]              // AI agent definitions
  commands: PresetCommand[]          // workflow command definitions
  skills: PresetSkill[]              // code pattern definitions

  hooks: {
    PostToolUse?: PresetHook[]       // run after file edits
    PreToolUse?: PresetHook[]        // run before tool usage
    SessionStart?: PresetHook[]      // run when session starts
  }

  recommendedMcp: PresetMcp[]        // recommended MCP servers
}

interface PresetAgent { fileName: string; content: string }
interface PresetCommand { fileName: string; content: string }
interface PresetSkill { dirName: string; content: string }
interface PresetHook { matcher?: string; command: string }
interface PresetMcp { name: string; command: string; args: string[]; required: boolean }
```

---

## Step-by-Step Guide

### 1. Plan your preset

Decide what your preset provides:

- **2-3 stack-specific agents** (e.g., `gin-handler`, `gorm-model`)
- **Coding rules** specific to your stack
- **Skills** with actual code templates
- **Hooks** for auto-formatting, linting, etc.

### 2. Add to PRESETS array

Open `src/main/services/preset-registry.ts` and add your preset to the `PRESETS` array:

```typescript
// Add after the last preset in the PRESETS array
{
  id: 'go-gin',
  name: 'Go + Gin',
  description: 'Go REST API with Gin framework and GORM ORM',
  icon: '🔵',
  category: 'backend',

  stack: {
    language: 'Go 1.22+',
    framework: 'Gin v1.10',
    database: 'PostgreSQL + GORM',
    packages: ['validator/v10', 'jwt-go', 'viper']
  },

  architecture: {
    pattern: 'Clean Architecture',
    structure: 'cmd/api/ + internal/{handler,service,repository}/',
    reference: 'internal/user/'
  },

  build: {
    setup: 'go mod tidy',
    analyze: 'golangci-lint run ./...',
    test: 'go test ./... -v -cover',
    format: 'gofmt -w .'
  },

  codingRules: [
    'Return errors, don\'t panic',
    'Use context.Context for cancellation and deadlines',
    'Interface-based dependency injection',
    'Table-driven tests',
    'No global state (pass dependencies explicitly)'
  ],

  forbiddenPatterns: [
    'panic() in production code',
    'init() functions (use explicit initialization)',
    'Hardcoded configuration values',
    'SQL string concatenation (use parameterized queries)'
  ],

  agents: [
    // Base agents — leave content empty, auto-filled by the loop below
    { fileName: 'product-planner', content: '' },
    { fileName: 'tech-architect', content: '' },
    { fileName: 'task-decomposer', content: '' },
    { fileName: 'code-reviewer', content: '' },
    { fileName: 'security-auditor', content: '' },
    { fileName: 'doc-writer', content: '' },

    // Stack-specific agents — write full content
    { fileName: 'gin-handler', content: `# gin-handler

You are a Go Gin handler specialist.

## Role
Implement HTTP handlers with Gin framework.

## Rules
- Read the spec from docs/specs/ before implementing
- Use context7 MCP to verify Gin APIs
- Always bind and validate request bodies with ShouldBindJSON
- Return consistent JSON responses with proper status codes
- Use Gin middleware for auth, logging, CORS
- Group routes by resource

## Output
internal/handler/{resource}_handler.go` },

    { fileName: 'gorm-model', content: `# gorm-model

You are a GORM data modeling specialist.

## Role
Define database models and repository layer.

## Rules
- Use struct tags for column mapping
- Implement repository interface pattern
- Always use transactions for multi-table operations
- Migration files in migrations/ directory
- No raw SQL unless absolutely necessary

## Output
internal/repository/{resource}_repo.go + internal/model/{resource}.go` }
  ],

  commands: [
    // plan-feature, implement, review, full-cycle, retrospective
    // Copy the pattern from flutter-supabase preset
    // and adapt for Go commands (go test, golangci-lint, etc.)
  ],

  skills: [
    { dirName: 'gin-handler-pattern', content: `# Gin Handler Pattern

\`\`\`go
func (h *Handler) Create(c *gin.Context) {
    var req CreateRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    result, err := h.service.Create(c.Request.Context(), req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, result)
}
\`\`\`
` }
  ],

  hooks: {
    PostToolUse: [
      { matcher: 'Write(*.go)', command: 'gofmt -w "$FILEPATH"' }
    ]
  },

  recommendedMcp: [
    { name: 'context7', command: 'npx', args: ['-y', '@upstash/context7-mcp@latest'], required: true }
  ]
}
```

### 3. Base agents (auto-filled)

Six agents are provided by the `BASE_AGENTS` object and auto-filled if you leave their `content` as `''`:

| fileName | Role |
|----------|------|
| `product-planner` | Creates PRDs from feature requests |
| `tech-architect` | Creates technical specs from PRDs |
| `task-decomposer` | Breaks specs into ordered tasks |
| `code-reviewer` | Reviews code against coding rules |
| `security-auditor` | Checks for security vulnerabilities |
| `doc-writer` | Writes and maintains documentation |

These base agents automatically receive your preset's `stack`, `architecture`, and `codingRules` as context. **You only need to write the stack-specific agents.**

### 4. Commands pattern

All presets share the same 5 command patterns. Copy from an existing preset and adjust:

| Command | Purpose |
|---------|---------|
| `plan-feature` | PM → Architect → Task Decomposer pipeline |
| `implement` | Execute tasks based on spec |
| `review` | Run reviewers + security audit |
| `full-cycle` | plan → implement → review → docs → commit |
| `retrospective` | Analyze session, record lessons |

Adapt the tool commands inside (e.g., `flutter test` → `go test ./...`).

### 5. Skills: write real code patterns

Skills should contain **actual code** that Claude can reference. Good skills:

- Common file patterns (handler, model, test)
- Project-specific boilerplate
- Configuration examples

### 6. Hooks: auto-format on save

Common PostToolUse hooks by stack:

| Stack | Hook |
|-------|------|
| Go | `gofmt -w "$FILEPATH"` |
| Rust | `rustfmt "$FILEPATH"` |
| Python | `black "$FILEPATH"` |
| JS/TS | `npx prettier --write "$FILEPATH"` |
| Dart | `dart format "$FILEPATH"` |

---

## Checklist

Before submitting your preset:

- [ ] Unique `id` in kebab-case
- [ ] All 6 base agents included (content empty)
- [ ] At least 1-2 stack-specific agents with full content
- [ ] `codingRules` has 5+ rules specific to the stack
- [ ] `forbiddenPatterns` has 3+ anti-patterns
- [ ] `build` commands all work on a fresh project
- [ ] At least 1 skill with real code
- [ ] Hooks for auto-formatting (if the stack has a formatter)
- [ ] `context7` in `recommendedMcp`
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Test: create a new project with your preset in the wizard

---

## Testing your preset

```bash
npm run dev
```

1. Click **New Project** on the welcome screen
2. Select your preset in the Tech Stack step
3. Choose a test directory
4. Click **Apply & Open**
5. Verify all files were generated correctly:
   - `CLAUDE.md` contains your stack info
   - `.claude/agents/` has all agents
   - `.claude/commands/` has all commands
   - `.claude/skills/` has all skills
   - `.claude/settings.json` has hooks

---

## Export/Import (Alternative)

Users can also create presets from existing projects:

1. **Dashboard → Export Preset** — exports current project as a `.json` preset
2. **Dashboard → Import Preset** — imports a `.json` preset file

The export reads from the project's `.claude/` directory and `CLAUDE.md` to reconstruct a `TechStackPreset` object. This is handled by `preset-exporter.ts`.

---

## FAQ

**Q: Can I override base agent content?**
A: Yes. If you provide non-empty `content` for a base agent filename (e.g., `product-planner`), the auto-fill loop skips it.

**Q: How are skills stored on disk?**
A: Each skill gets its own directory: `.claude/skills/{dirName}/SKILL.md`

**Q: Can I add multiple hooks for the same event?**
A: Yes. Each hook entry in the array becomes a separate hook in `settings.json`.

**Q: What if my stack doesn't need a `router` or `styling` field?**
A: All `stack` fields except `language` and `framework` are optional. Omit what doesn't apply.
