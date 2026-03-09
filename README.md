# Forge Studio

**AI Development Cockpit** — Design, manage, and orchestrate your Claude Code harness visually.

> Stop editing scattered text files. Build your AI development workflow with a visual desktop app.

<p align="center">
<img width="1512" height="1012" alt="dashboard" src="https://github.com/user-attachments/assets/dbbde606-c31b-4afc-bea3-18fc925c89b9" />
</p>

---

## Why Forge Studio?

Claude Code is powerful, but setting it up is tedious:

- **CLAUDE.md**, agents, commands, skills, hooks, MCP servers — all separate text files
- No visual overview of your workflow pipeline
- Every new project starts from scratch
- Lessons learned don't transfer between projects

**Forge Studio** wraps Claude Code CLI with a native desktop app that lets you:

- **Visually design** your AI development workflow
- **GUI-manage** agents, commands, skills, hooks, and MCP servers
- **Apply presets** for any tech stack in seconds
- **Track progress** with timeline and knowledge management
- **Share configurations** via export/import

---

## Features

### Core

| Feature | Description |
|---------|-------------|
| **Project Setup** | 3-step wizard with tech stack presets. Generates CLAUDE.md + .claude/ automatically |
| **Planning Hub** | Project-level & feature-level AI team planning. Document import (text/data/web files). Auto-detect features from roadmap. Tab-based UI (Documents / AI Team) |
| **Workflow Engine** | Preset pipeline selector (Dev / Quick). Step editor with gate approvals and output streaming. Auto-selects Dev pipeline when project docs exist |
| **Agent Studio** | CRUD agents with React Flow node graph visualization |
| **CLAUDE.md Editor** | Section-based visual editor + raw markdown mode |
| **Command & Skill Builder** | GUI forms that auto-manage .claude/commands/ and .claude/skills/ |
| **Hook Configuration** | Visual settings for SessionStart, PreToolUse, PostToolUse hooks |
| **MCP Server Manager** | Add/remove MCP servers with quick-add for popular ones |
| **Knowledge Base** | SQLite-backed lessons-learned with escalation to CLAUDE.md |
| **Timeline** | Git commit history + project setup progress tracker |
| **Integrated Terminal** | xterm.js + node-pty with RunBar for one-click script/command execution |
| **Command Palette** | `Cmd+K` with 13 actions, keyboard navigation |

### Planning System

Forge Studio separates **planning** and **execution** into dedicated views:

| Mode | AI Team | Output |
|------|---------|--------|
| **Project Planning** | Product Strategist → System Architect → Feature Planner | `docs/planning/` (overview, architecture, roadmap) |
| **Feature Planning** | Product Manager → Tech Architect → Task Decomposer | `docs/prd/`, `docs/specs/` (PRD, spec, tasks) |

- **Document Import**: Import external planning docs (markdown, text, data files) into categorized directories
- **Feature Auto-Detection**: Scans `docs/prd/`, `docs/specs/`, and `docs/planning/feature-roadmap.md` for feature names
- **Context Injection**: All AI team agents automatically reference existing project documents

### Workflow Presets

| Preset | Steps | Use Case |
|--------|-------|----------|
| **Dev Pipeline** | Implement → Code Review → Approval → Test → Document | After project planning is complete |
| **Quick Pipeline** | Implement → Review → Approval | Fast iteration, bug fixes |

Presets are fully customizable — edit step names, prompts, add/remove steps and gates.

### UX

- Dark/Light theme with `Cmd+K` toggle
- Full keyboard navigation (`Cmd+1-0` for views, `Cmd+B` sidebar, `` Cmd+` `` terminal)
- i18n: English + Korean
- macOS native titlebar with traffic light integration
- Empty state guides for onboarding

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Electron 34+ |
| Frontend | React 19 + TypeScript 5.x |
| State | Zustand |
| Styling | Tailwind CSS 4 |
| Graph | React Flow v11 |
| Terminal | xterm.js + node-pty |
| Database | SQLite (better-sqlite3) |
| Build | Vite (electron-vite) |
| i18n | i18next |
| Test | Playwright (E2E) |

---

## Getting Started

### Prerequisites

| Requirement | macOS | Windows |
|-------------|-------|---------|
| **Node.js** | 22+ | 22+ |
| **Claude Code CLI** | `claude` command available | `claude` command available |
| **Build Tools** | Xcode Command Line Tools | [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (C++ workload) |
| **Python** | Pre-installed | 3.10+ (for native module compilation) |

> **Why Build Tools?** Forge Studio uses native Node.js modules (`node-pty`, `better-sqlite3`) that compile from C/C++ source during `npm install`.

### macOS

```bash
# 1. Install prerequisites (if not already)
xcode-select --install               # Xcode CLI tools (for node-gyp)
brew install node@22                  # or use nvm

# 2. Clone & run
git clone https://github.com/mstagon/forge-studio.git
cd forge-studio
npm install
npm run dev
```

### Windows

```powershell
# 1. Install prerequisites
# Option A: Install everything via npm (run as Administrator)
npm install -g windows-build-tools

# Option B: Manual install
#   - Visual Studio Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/
#     → Select "Desktop development with C++" workload
#   - Python 3.10+: https://www.python.org/downloads/

# 2. Clone & run
git clone https://github.com/mstagon/forge-studio.git
cd forge-studio
npm install
npm run dev
```

> **Windows troubleshooting:**
> - If `node-pty` fails to install, ensure Build Tools are installed and run `npm config set msvs_version 2022`
> - If `better-sqlite3` fails, try `npm install --build-from-source`
> - PowerShell execution policy error: run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### Build

```bash
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run lint         # ESLint
```

### Platform Notes

| Feature | macOS | Windows |
|---------|-------|---------|
| Titlebar | Native traffic light integration | Windows overlay controls |
| Terminal | Uses `$SHELL` (zsh/bash) | Uses PowerShell |
| Keyboard shortcuts | `Cmd` based | `Ctrl` based |
| Claude CLI detection | `which claude` | `where claude` |

---

## Tech Stack Presets

Presets are the fastest way to set up a new project. Each preset generates a complete CLAUDE.md, agents, commands, and skills tailored for a specific tech stack.

### Built-in Presets

| Preset | Stack | Agents | Commands |
|--------|-------|:------:|:--------:|
| `flutter-supabase` | Flutter + Supabase + Riverpod | 8 | 6 |
| `nextjs-fullstack` | Next.js 15 + TypeScript + Prisma | 8 | 6 |
| `python-fastapi` | Python + FastAPI + SQLAlchemy | 8 | 6 |
| `_base` | Stack-agnostic foundation | 6 | 4 |

Every preset includes the **base agents** (Product Planner, Tech Architect, Task Decomposer, Code Reviewer, Security Auditor, Doc Writer) plus stack-specific specialists.

---

## Contributing

We welcome contributions! Here's how you can help:

### 1. Add a Tech Stack Preset (Easiest way to contribute!)

Presets are the most impactful contribution. If you use a tech stack that's not covered, you can add one.

> Full development guide: **[docs/contributing-presets.md](docs/contributing-presets.md)**

**What a preset generates:**

| Output | Path | Description |
|--------|------|-------------|
| CLAUDE.md | `./CLAUDE.md` | Tech stack, coding rules, forbidden patterns |
| Agents | `.claude/agents/*.md` | 6 base + your stack-specific specialists |
| Commands | `.claude/commands/*.md` | plan, implement, review, full-cycle, retrospective |
| Skills | `.claude/skills/*/SKILL.md` | Real code patterns and templates |
| Hooks | `.claude/settings.json` | Auto-format on save, permissions |

**Quick start:**

1. Fork the repo
2. Open `src/main/services/preset-registry.ts`
3. Add your preset to the `PRESETS` array:

```typescript
{
  id: 'go-gin',                              // unique kebab-case ID
  name: 'Go + Gin',
  description: 'Go REST API with Gin and GORM',
  icon: '🔵',
  category: 'backend',                       // mobile | web | backend | fullstack | custom

  stack: {
    language: 'Go 1.22+',
    framework: 'Gin v1.10',
    database: 'PostgreSQL + GORM',            // optional fields
    packages: ['validator/v10', 'jwt-go']     // optional
  },

  architecture: {
    pattern: 'Clean Architecture',
    structure: 'cmd/api/ + internal/{handler,service,repository}/'
  },

  build: {
    setup: 'go mod tidy',
    test: 'go test ./... -v',
    format: 'gofmt -w .'
  },

  codingRules: [ 'Return errors, don\'t panic', 'Table-driven tests', /* ... */ ],
  forbiddenPatterns: [ 'panic() in production', 'SQL string concatenation', /* ... */ ],

  agents: [
    // Base agents — leave content empty (auto-filled with your stack context)
    { fileName: 'product-planner', content: '' },
    { fileName: 'tech-architect', content: '' },
    { fileName: 'task-decomposer', content: '' },
    { fileName: 'code-reviewer', content: '' },
    { fileName: 'security-auditor', content: '' },
    { fileName: 'doc-writer', content: '' },

    // Stack-specific agents — write full content
    { fileName: 'gin-handler', content: '# gin-handler\n\nYou are a Go Gin handler specialist.\n\n## Role\n...' }
  ],

  commands: [ /* copy pattern from existing preset, adapt tool commands */ ],
  skills: [
    { dirName: 'gin-handler-pattern', content: '# Gin Handler Pattern\n\n```go\nfunc (h *Handler) Create(c *gin.Context) {\n  ...\n}\n```' }
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

4. Run `npm run typecheck` to verify
5. Test: `npm run dev` → New Project → select your preset
6. Submit a PR

**Preset ideas we'd love:**

| Preset ID | Stack |
|-----------|-------|
| `go-gin` | Go + Gin + GORM |
| `rust-axum` | Rust + Axum + SQLx |
| `react-native-expo` | React Native + Expo |
| `svelte-kit` | SvelteKit + Drizzle |
| `django-rest` | Django + DRF |
| `spring-boot` | Java + Spring Boot |
| `rails` | Ruby on Rails |
| `laravel` | PHP + Laravel |
| `dotnet-minimal` | .NET Minimal API |
| `elixir-phoenix` | Elixir + Phoenix |

### 2. Add Translations

Currently supported: English, Korean.

To add a new language:

1. Copy `src/renderer/src/i18n/locales/en.json`
2. Rename to your locale code (e.g., `ja.json`, `zh.json`, `es.json`)
3. Translate all values (keys stay the same)
4. Register it in `src/renderer/src/i18n/index.ts`
5. Add a language toggle option in `StatusBar.tsx`

### 3. Improve Existing Features

Check the [Issues](https://github.com/mstagon/forge-studio/issues) tab for open tasks. Some areas that need help:

- **Workflow drag-and-drop** — Replace button-based reordering with DnD
- **MCP server wizard** — GUI to scaffold new MCP servers
- **Planning document editing** — Edit docs directly in the Planning Hub
- **Workflow execution history** — Persist and display past runs
- **More E2E tests** — Expand Playwright coverage

### 4. Report Bugs & Suggest Features

Open an [issue](https://github.com/mstagon/forge-studio/issues/new) with:
- What you expected vs what happened
- Steps to reproduce
- Screenshots if applicable

---

## Project Structure

```
forge-studio/
├── src/
│   ├── main/              # Electron Main Process
│   │   ├── ipc/           # IPC handlers (51 channels)
│   │   └── services/      # Business logic (13 services)
│   ├── renderer/          # React 19 Frontend
│   │   └── src/
│   │       ├── routes/    # 12 view components
│   │       ├── components/# Shared UI components
│   │       ├── stores/    # Zustand state
│   │       └── i18n/      # Translations (EN, KO)
│   ├── shared/            # Shared types & constants
│   └── preload/           # contextBridge API (17 modules)
├── templates/             # Tech stack presets
├── e2e/                   # Playwright E2E tests
└── docs/                  # PRD, architecture, status
```

---

## Keyboard Shortcuts

| Action | macOS | Windows |
|--------|-------|---------|
| Command Palette | `Cmd+K` | `Ctrl+K` |
| Switch views | `Cmd+1` ~ `Cmd+0` | `Ctrl+1` ~ `Ctrl+0` |
| Toggle terminal | `` Cmd+` `` | `` Ctrl+` `` |
| Toggle sidebar | `Cmd+B` | `Ctrl+B` |

### Sidebar Order

| Shortcut | View |
|:--------:|------|
| `Cmd+1` | Dashboard |
| `Cmd+2` | Planning |
| `Cmd+3` | Workflow |
| `Cmd+4` | Agents |
| `Cmd+5` | CLAUDE.md |
| `Cmd+6` | Commands |
| `Cmd+7` | Skills |
| `Cmd+8` | Hooks |
| `Cmd+9` | MCP |
| `Cmd+0` | Knowledge |

---

## Roadmap

### v1.0 (Current)
- [x] Project create/open with preset wizard
- [x] All 10 PRD epics core features implemented
- [x] 12 views with full i18n (EN/KO)
- [x] Integrated terminal with RunBar
- [x] E2E test suite
- [x] Project-level & feature-level AI team planning
- [x] Document import and context injection
- [x] Preset-based workflow pipelines (Dev / Quick)
- [x] GitHub issue & PR templates

### v1.1
- [ ] Workflow drag-and-drop editor
- [ ] MCP server scaffolding wizard
- [ ] Workflow execution history persistence
- [ ] Cross-project knowledge transfer UI
- [ ] electron-builder packaging (DMG/AppImage)

### v2.0
- [ ] Community preset marketplace
- [ ] MCP server playground
- [ ] Quality metrics dashboard
- [ ] Team settings sync
- [ ] Plugin system

---

## License

[MIT](LICENSE)

---

<p align="center">
  Built with Claude Code + Forge Studio
</p>
