# Forge Studio - 시스템 아키텍처 설계서

## 메타데이터
- 작성일: 2026-03-06
- 최종 수정일: 2026-03-09
- 버전: 1.1
- 상태: Implemented
- PRD 참조: docs/prd/forge-studio-prd.md

---

## 1. 시스템 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                      Forge Studio (Electron)                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Renderer (React + TS)                   │  │
│  │                                                           │  │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │  │
│  │  │Dashboard│ │Workflow  │ │ Agent    │ │  Planning    │ │  │
│  │  │         │ │Engine    │ │ Studio   │ │  Hub         │ │  │
│  │  └─────────┘ └──────────┘ └──────────┘ └──────────────┘ │  │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │  │
│  │  │CLAUDE.md│ │Command & │ │  MCP     │ │  Knowledge   │ │  │
│  │  │Editor   │ │Skill Bldr│ │ Studio   │ │  Dashboard   │ │  │
│  │  └─────────┘ └──────────┘ └──────────┘ └──────────────┘ │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────────────┐│  │
│  │  │ Hooks    │ │ Timeline │ │  Command Palette (⌘K)      ││  │
│  │  └──────────┘ └──────────┘ └────────────────────────────┘│  │
│  │  ┌──────────────────────────────────────────────────────┐│  │
│  │  │  RunBar (scripts + commands) + Terminal (xterm.js)   ││  │
│  │  └──────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                     IPC (contextBridge)                         │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Main Process (Node.js)                  │  │
│  │                                                           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │  │
│  │  │Project   │ │Claude CLI│ │ File     │ │  MCP       │ │  │
│  │  │Manager   │ │Bridge    │ │ Watcher  │ │  Manager   │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │  │
│  │  │Preset    │ │Workflow  │ │ Config   │ │  Knowledge │ │  │
│  │  │Registry  │ │Runner    │ │ Manager  │ │  DB (SQLite)│ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │  │
│  │  │Escalation│ │Agent Team│ │ PTY      │ │  Preset    │ │  │
│  │  │          │ │          │ │ Manager  │ │  Exporter  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
       ┌──────▼──────┐ ┌──────▼──────┐ ┌───────▼──────┐
       │ Claude Code │ │  File       │ │   MCP        │
       │ CLI         │ │  System     │ │   Servers    │
       │ (child proc)│ │ (.claude/)  │ │  (stdio/sse) │
       └─────────────┘ └─────────────┘ └──────────────┘
```

---

## 2. 기술 스택

| 레이어 | 기술 | 근거 |
|--------|------|------|
| 프레임워크 | Electron 34+ | 크로스 플랫폼, 웹 기술 활용, 터미널 내장 용이 |
| 프론트엔드 | React 19 + TypeScript 5.x | 컴포넌트 기반, 생태계 풍부, 타입 안전 |
| 상태관리 | Zustand | 가볍고 직관적, Electron과 궁합 좋음 |
| 스타일링 | Tailwind CSS 4 + Radix UI | 유틸리티 퍼스트, 접근성 내장 컴포넌트 |
| 노드 그래프 | React Flow | 에이전트/워크플로우 노드 에디터용 |
| 터미널 | xterm.js | Electron 내장 터미널 표준 |
| 마크다운 | textarea + 직접 편집 | CLAUDE.md Visual/Raw 에디터 |
| 국제화 | i18next + react-i18next | 한국어/영어 전환 |
| 빌드 | Vite + electron-vite | 빠른 HMR, Electron 최적화 |
| 패키징 | electron-builder | macOS DMG, Windows NSIS, Linux AppImage |
| 테스트 | Vitest + Playwright | 단위 + E2E 테스트 |
| 로컬 DB | SQLite (better-sqlite3) | 워크플로우 이력, 지식 DB |
| IPC 타입 | contextBridge + channels.ts 상수 | Main-Renderer 간 타입 안전 통신 |

---

## 3. 디렉토리 구조 (실제 구현)

```
forge-studio/
├── src/
│   ├── main/                          # Electron Main Process
│   │   ├── index.ts                   # 앱 진입점 (BrowserWindow 생성)
│   │   ├── ipc/
│   │   │   └── register.ts            # 모든 IPC 핸들러 통합 등록 (49채널)
│   │   └── services/                  # 비즈니스 로직 (13개)
│   │       ├── project-manager.ts     # 프로젝트 열기/통계 + git log/diff
│   │       ├── claude-bridge.ts       # Claude Code CLI 설치 확인/버전
│   │       ├── claude-md-parser.ts    # CLAUDE.md 파싱/직렬화
│   │       ├── config-manager.ts      # 에이전트/커맨드/스킬/설정/MCP CRUD
│   │       ├── file-watcher.ts        # chokidar 파일 변경 감지
│   │       ├── pty-manager.ts         # node-pty 터미널 세션 관리
│   │       ├── workflow-runner.ts     # 워크플로우 PTY 실행 엔진
│   │       ├── agent-team.ts          # AI 에이전트팀 순차 실행
│   │       ├── knowledge-db.ts        # SQLite 지식 DB (better-sqlite3)
│   │       ├── escalation.ts          # 반복 패턴 → CLAUDE.md 자동 추가
│   │       ├── preset-registry.ts     # 4개 빌트인 프리셋 관리
│   │       ├── preset-applier.ts      # 프리셋 → 파일 생성
│   │       └── preset-exporter.ts     # 프로젝트 → 프리셋 JSON 내보내기
│   │
│   ├── renderer/                      # Electron Renderer (React 19)
│   │   └── src/
│   │       ├── App.tsx                # 메인 레이아웃 + 라우팅 + 키보드 단축키
│   │       ├── main.tsx               # React 진입점
│   │       ├── routes/                # 페이지 뷰 (12개)
│   │       │   ├── WelcomeView.tsx    # 시작 화면 + 최근 프로젝트
│   │       │   ├── DashboardView.tsx  # 프로젝트 대시보드 + Quick Actions
│   │       │   ├── WorkflowView.tsx   # 워크플로우 편집/실행
│   │       │   ├── AgentsView.tsx     # 에이전트 CRUD + 그래프 뷰
│   │       │   ├── PlanningView.tsx   # 기획 허브 + AI Team
│   │       │   ├── ClaudeMdView.tsx   # CLAUDE.md 비주얼 에디터
│   │       │   ├── CommandsView.tsx   # 커맨드 빌더
│   │       │   ├── SkillsView.tsx     # 스킬 빌더
│   │       │   ├── HooksView.tsx      # Hook 설정
│   │       │   ├── McpView.tsx        # MCP 서버 관리
│   │       │   ├── KnowledgeView.tsx  # 지식 대시보드
│   │       │   └── TimelineView.tsx   # 타임라인 (git + 셋업 진행률)
│   │       ├── components/
│   │       │   ├── layout/
│   │       │   │   ├── Sidebar.tsx    # 사이드바 (11 nav + 닫기 + 축소)
│   │       │   │   └── StatusBar.tsx  # 하단 상태바
│   │       │   ├── terminal/
│   │       │   │   ├── TerminalPanel.tsx  # xterm.js 터미널
│   │       │   │   └── RunBar.tsx     # 동적 스크립트/커맨드 실행 바
│   │       │   ├── agents/
│   │       │   │   └── AgentGraph.tsx # React Flow 노드 그래프
│   │       │   ├── wizard/
│   │       │   │   └── NewProjectWizard.tsx # 프로젝트 생성 위저드
│   │       │   ├── common/
│   │       │   │   ├── ToastContainer.tsx   # 토스트 알림
│   │       │   │   └── ConfirmDialog.tsx    # 확인 다이얼로그
│   │       │   └── CommandPalette.tsx  # ⌘K 커맨드 팔레트 (13 액션)
│   │       ├── stores/
│   │       │   └── app.store.ts       # Zustand 통합 스토어
│   │       ├── i18n/
│   │       │   ├── index.ts           # i18next 설정
│   │       │   └── locales/
│   │       │       ├── en.json        # 영어 번역
│   │       │       └── ko.json        # 한국어 번역
│   │       └── assets/
│   │           └── index.css          # Tailwind CSS 4 + @theme 변수
│   │
│   ├── shared/
│   │   ├── types/
│   │   │   └── ipc.types.ts           # ForgeAPI 타입 정의
│   │   └── constants/
│   │       └── channels.ts            # IPC 채널 이름 상수 (49개)
│   │
│   └── preload/
│       └── index.ts                   # contextBridge (15 모듈 노출)
│
├── templates/                         # 기술 스택 프리셋 (4개)
│   ├── _base/                         # 공통 베이스 (에이전트 6 + 커맨드 4)
│   ├── flutter-supabase/              # Flutter + Supabase
│   ├── nextjs-fullstack/              # Next.js 풀스택
│   └── python-fastapi/                # Python + FastAPI
│
├── e2e/                               # E2E 테스트 (Playwright)
│   ├── smoke.test.ts                  # 종합 스모크 테스트
│   ├── theme.test.ts                  # 테마 전환
│   ├── timeline-check.test.ts         # 타임라인 뷰
│   ├── ux-nav-check.test.ts           # UX 네비게이션
│   └── theme-diag.test.ts            # 테마 진단
│
├── docs/                              # 프로젝트 문서
│   ├── prd/forge-studio-prd.md        # PRD
│   ├── design/system-architecture.md  # 아키텍처 (이 파일)
│   └── implementation-status.md       # 구현 현황
│
├── electron.vite.config.ts
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
└── CLAUDE.md
```

---

## 4. 핵심 모듈 설계

### 4.1 Claude CLI Bridge

Claude Code CLI를 child process로 실행하고 입출력을 관리하는 핵심 모듈.

```typescript
// src/main/services/claude-bridge.ts

interface ClaudeBridgeConfig {
  projectPath: string;
  model?: string;
  effortLevel?: 'low' | 'medium' | 'high';
}

interface ClaudeSession {
  id: string;
  process: ChildProcess;
  status: 'idle' | 'running' | 'waiting_approval';
  send(input: string): void;
  onOutput(callback: (data: ClaudeOutput) => void): void;
  kill(): void;
}

interface ClaudeOutput {
  type: 'text' | 'tool_use' | 'tool_result' | 'error' | 'approval_request';
  content: string;
  metadata?: Record<string, unknown>;
}

class ClaudeBridge {
  // Claude Code CLI를 pty(pseudo-terminal)로 실행
  // node-pty를 사용하여 ANSI 컬러, 인터랙션 지원
  startSession(config: ClaudeBridgeConfig): ClaudeSession;

  // 슬래시 커맨드 실행 (GUI에서 버튼 클릭 → CLI 커맨드)
  executeCommand(session: ClaudeSession, command: string): Promise<void>;

  // 실행 중인 세션 목록
  getSessions(): ClaudeSession[];

  // CLI 설치 여부 확인
  isCliInstalled(): Promise<boolean>;

  // CLI 버전 확인
  getCliVersion(): Promise<string>;
}
```

**구현 전략:**
- `node-pty`로 pseudo-terminal 생성 → xterm.js와 직접 연결
- CLI 출력을 파싱하여 구조화된 이벤트로 변환 (에이전트 상태, 승인 요청 등)
- 여러 세션 동시 관리 (에이전트 팀 지원)

### 4.2 Config Parser

CLAUDE.md와 .claude/ 파일들을 구조체로 파싱/직렬화하는 모듈.

```typescript
// src/main/services/config-parser.ts

interface ClaudeMdConfig {
  projectName: string;
  description: string;
  techStack: TechStackSection;
  architecture: ArchitectureSection;
  buildCommands: string[];
  workflow: WorkflowSection;
  codingRules: CodingRule[];
  forbiddenPatterns: ForbiddenPattern[];
  selfImprovementRules: string[];
  documentRules: string[];
  customSections: CustomSection[];
}

interface AgentConfig {
  name: string;
  role: string;
  description: string;
  tools: string[];
  constraints: string[];
  outputFormat: string;
  references: string[];
}

interface CommandConfig {
  name: string;
  description: string;
  arguments: CommandArgument[];
  steps: CommandStep[];
}

class ConfigParser {
  // CLAUDE.md → 구조체
  parseClaudeMd(content: string): ClaudeMdConfig;

  // 구조체 → CLAUDE.md
  serializeClaudeMd(config: ClaudeMdConfig): string;

  // agent .md → 구조체
  parseAgent(content: string): AgentConfig;
  serializeAgent(config: AgentConfig): string;

  // command .md → 구조체
  parseCommand(content: string): CommandConfig;
  serializeCommand(config: CommandConfig): string;

  // settings.json → 구조체
  parseSettings(content: string): SettingsConfig;
  serializeSettings(config: SettingsConfig): string;
}
```

**핵심 과제:**
- CLAUDE.md는 자유 형식 마크다운이므로, 섹션 헤더 기반 + 유연한 파싱 필요
- 파싱 → 수정 → 직렬화 시 원본 포맷/주석 최대한 보존
- 에이전트/커맨드 마크다운도 구조적 패턴 인식

### 4.3 Workflow Runtime

워크플로우 파이프라인을 정의하고 실행하는 엔진.

```typescript
// src/main/services/workflow-runtime.ts

interface WorkflowStep {
  id: string;
  name: string;
  type: 'command' | 'agent' | 'approval_gate' | 'conditional';
  config: {
    command?: string;        // /plan-feature, /implement 등
    agent?: string;          // agent name
    condition?: string;      // 조건부 분기
    approvalMessage?: string;
  };
  dependsOn: string[];       // 선행 스텝 ID
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_approval';
}

interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  variables: Record<string, string>;  // 예: featureName
}

interface WorkflowExecution {
  workflowId: string;
  startedAt: Date;
  steps: WorkflowStepExecution[];
  status: 'running' | 'paused' | 'completed' | 'failed';
}

class WorkflowRuntime {
  // 워크플로우 정의 로드
  loadWorkflow(path: string): Workflow;

  // 워크플로우 실행
  execute(workflow: Workflow, variables: Record<string, string>): WorkflowExecution;

  // 승인 게이트 응답
  approve(executionId: string, stepId: string): void;
  reject(executionId: string, stepId: string, reason: string): void;

  // 실행 이력 조회
  getHistory(projectId: string): WorkflowExecution[];
}
```

### 4.4 Template Engine

기술 스택별 프리셋을 생성하는 엔진.

```typescript
// src/main/services/template-engine.ts

interface TechStackPreset {
  id: string;
  name: string;           // "Flutter + Supabase", "Next.js Fullstack"
  description: string;
  languages: string[];    // ["dart", "typescript"]
  frameworks: string[];   // ["flutter", "supabase"]
  generates: {
    claudeMd: string;     // Handlebars 템플릿 경로
    agents: string[];     // 에이전트 템플릿들
    commands: string[];   // 커맨드 템플릿들
    skills: string[];     // 스킬 템플릿들
    hooks: HookConfig[];  // Hook 설정
  };
}

class TemplateEngine {
  // 사용 가능한 프리셋 목록
  getPresets(): TechStackPreset[];

  // 프리셋 적용 → .claude/ + CLAUDE.md 생성
  applyPreset(preset: TechStackPreset, projectPath: string, options: Record<string, string>): void;

  // 커스텀 프리셋 저장
  saveCustomPreset(preset: TechStackPreset): void;
}
```

### 4.5 MCP Manager

MCP 서버의 설치/관리/모니터링을 담당.

```typescript
// src/main/services/mcp-manager.ts

interface McpServer {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  status: 'running' | 'stopped' | 'error';
  tools: McpTool[];
  resources: McpResource[];
}

class McpManager {
  // 설치된 MCP 서버 목록 (Claude Code 설정에서 읽기)
  listServers(): McpServer[];

  // MCP 서버 추가
  addServer(name: string, command: string, args: string[]): void;

  // MCP 서버 제거
  removeServer(name: string): void;

  // MCP 서버 상태 확인
  getStatus(name: string): McpServer;

  // MCP 서버 도구 목록 조회
  listTools(name: string): McpTool[];

  // 새 MCP 서버 스캐폴딩 생성
  scaffoldServer(config: McpScaffoldConfig): string; // 생성된 경로
}
```

---

## 5. 데이터 모델

### 5.1 프로젝트

```typescript
interface ForgeProject {
  id: string;                    // UUID
  name: string;
  path: string;                  // 프로젝트 절대 경로
  techStack: string;             // 프리셋 ID
  createdAt: Date;
  lastOpenedAt: Date;
  settings: {
    claudeMdPath: string;        // 보통 ./CLAUDE.md
    claudeDir: string;           // 보통 ./.claude/
  };
  workflows: WorkflowConfig[];
  metadata: Record<string, unknown>;
}
```

### 5.2 에이전트

```typescript
interface Agent {
  id: string;
  name: string;                  // 파일명 (kebab-case)
  displayName: string;           // 표시명
  group: 'planning' | 'development' | 'review' | 'documentation' | 'custom';
  role: string;                  // 역할 설명
  systemPrompt: string;          // 에이전트 프롬프트 전문
  tools: string[];               // 사용 가능 도구
  constraints: string[];         // 제약조건
  references: string[];          // 참조 파일/패턴
  isActive: boolean;
  filePath: string;              // .claude/agents/xxx.md
}
```

### 5.3 워크플로우

```typescript
interface WorkflowConfig {
  id: string;
  name: string;                  // "Feature Development", "Bug Fix", "Refactoring"
  description: string;
  steps: WorkflowStepConfig[];
  isDefault: boolean;
}

interface WorkflowStepConfig {
  id: string;
  name: string;
  type: 'command' | 'agent' | 'agent_team' | 'approval' | 'hook';
  position: { x: number; y: number };  // React Flow 노드 위치
  config: Record<string, unknown>;
  connections: string[];               // 다음 스텝 ID들
}
```

### 5.4 지식 베이스 (SQLite)

```sql
-- 프로젝트 메타데이터
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  tech_stack TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_opened_at DATETIME
);

-- lessons learned (크로스 프로젝트)
CREATE TABLE lessons (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  category TEXT,            -- 'code_pattern', 'architecture', 'tool_usage', 'performance'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  root_cause TEXT,
  prevention TEXT,
  related_files TEXT,       -- JSON array
  repeat_count INTEGER DEFAULT 1,
  severity TEXT,            -- 'critical', 'warning', 'info'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_occurred_at DATETIME,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 워크플로우 실행 이력
CREATE TABLE workflow_executions (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  workflow_name TEXT,
  status TEXT,              -- 'completed', 'failed', 'cancelled'
  started_at DATETIME,
  completed_at DATETIME,
  steps_json TEXT,          -- JSON: 각 스텝 실행 결과
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 품질 메트릭 (시계열)
CREATE TABLE quality_metrics (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  measured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  review_pass_rate REAL,
  critical_issues INTEGER,
  warning_issues INTEGER,
  test_coverage REAL,
  lesson_count INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

---

## 6. IPC 설계 (실제 구현)

Electron Main ↔ Renderer 간 통신은 contextBridge + ipcRenderer.invoke 패턴 사용.

채널 상수는 `src/shared/constants/channels.ts`에 중앙 정의.
핸들러는 `src/main/ipc/register.ts`에 통합 등록.
Preload API는 `src/preload/index.ts`에서 15개 모듈로 노출.

```
총 49개 IPC 채널:

Terminal (5):   create, data, resize, dispose, on-data/on-exit
Project (3):    open, read-dir, get-recent
FileSystem (4): read, write, changed, start-watching
CLAUDE.md (2):  read, write
Agents (4):     list, save, delete, rename
Commands (3):   list, save, delete
Skills (3):     list, save, delete
Settings (2):   read, write
MCP (3):        list, add, remove
Claude CLI (2): check-installed, get-version
Presets (4):    list, apply, export, import
Workflow (5):   start, approve, skip, stop, get-state/state/output
Knowledge (6):  add, search, delete, update, import-lessons, get-escalation, apply-escalation
Team (4):       start, stop, get-state/state/output
Git (2):        log, diff-stat
App (2):        get-path, open-directory
```

### Preload API 구조 (window.forgeApi)

```typescript
window.forgeApi = {
  terminal:  { create, write, resize, dispose, onData, onExit },
  project:   { open, readDir, startWatching, onFileChanged },
  fs:        { readFile, writeFile },
  claudeMd:  { read, write },
  agents:    { list, save, delete, rename },
  commands:  { list, save, delete },
  skills:    { list, save, delete },
  settings:  { read, write },
  mcp:       { list, add, remove },
  presets:   { list, apply, export, import },
  workflow:  { start, approve, skip, stop, getState, onState, onOutput },
  knowledge: { add, search, delete, update, importLessons, getEscalation, applyEscalation },
  team:      { start, stop, getState, onState, onOutput },
  git:       { log, diffStat },
  claude:    { checkInstalled, getVersion },
  app:       { getPath, openDirectory },
}
```

---

## 7. UI 구조

### 7.1 메인 레이아웃 (실제 구현)

```
┌────────────────────────────────────────────────────────────────┐
│ ● ● ●  [78px]  project-name  [X close]       (38px titlebar)  │
├────────┬───────────────────────────────────────────────────────┤
│        │                                                       │
│ ⌘1 Dash│  ┌─────────────────────────────────────────────────┐ │
│ ⌘2 Work│  │                                                 │ │
│ ⌘3 Agnt│  │              Main Content Area                  │ │
│ ⌘4 Plan│  │                                                 │ │
│ ⌘5 MD  │  │  (12 views: Welcome/Dashboard/Workflow/         │ │
│ ⌘6 Cmds│  │   Agents/Planning/CLAUDE.md/Commands/           │ │
│ ⌘7 Skil│  │   Skills/Hooks/MCP/Knowledge/Timeline)          │ │
│ ⌘8 Hook│  │                                                 │ │
│ ⌘9 MCP │  ├─────────────────────────────────────────────────┤ │
│ ⌘0 Know│  │  RunBar: [dev] [build] [test] | [claude] [/cmd]│ │
│ ───────│  ├─────────────────────────────────────────────────┤ │
│   Time │  │                                                 │ │
│ ───────│  │         Integrated Terminal (xterm.js)           │ │
│  Close │  │         Drag-resize. ⌘` toggle.                 │ │
│  [<>]  │  │                                                 │ │
│        │  └─────────────────────────────────────────────────┘ │
├────────┴───────────────────────────────────────────────────────┤
│  Claude CLI v1.x  |  ⌘K Command Palette  |  🌙/☀ Theme      │
└────────────────────────────────────────────────────────────────┘
```

### 7.2 주요 화면 (12개 뷰)

| 뷰 | 설명 | 단축키 |
|----|------|:------:|
| **Welcome** | 시작 화면 + 최근 프로젝트 5개 + Open/New Project | - |
| **Dashboard** | 프로젝트 개요 (agents/commands/skills/MCP 카운트, git, Quick Actions) | ⌘1 |
| **Workflow** | 파이프라인 편집/실행 + 게이트 승인 + 출력 스트리밍 | ⌘2 |
| **Agents** | 에이전트 CRUD + React Flow 그래프 뷰 + 빈 상태 가이드 | ⌘3 |
| **Planning** | docs/ 문서 브라우저 + AI Team (PM→Architect→Decomposer) | ⌘4 |
| **CLAUDE.md** | 섹션별 비주얼 에디터 (Visual/Raw 토글) | ⌘5 |
| **Commands** | 커맨드 빌더 CRUD + 빈 상태 가이드 | ⌘6 |
| **Skills** | 스킬 빌더 CRUD + 빈 상태 가이드 | ⌘7 |
| **Hooks** | SessionStart/PreToolUse/PostToolUse 설정 | ⌘8 |
| **MCP** | 서버 목록 + Quick-add + 추가 폼 | ⌘9 |
| **Knowledge** | SQLite 지식 DB + 검색/필터 + Escalation → CLAUDE.md | ⌘0 |
| **Timeline** | git 커밋 이력 (날짜 그룹) + 프로젝트 셋업 진행률 | - |

---

## 8. 핵심 플로우

### 8.1 새 프로젝트 시작 플로우

```
사용자: "Create New Project" 클릭
  │
  ├── 1. 프로젝트 경로 선택 (기존 폴더 or 새 폴더)
  │
  ├── 2. 기술 스택 프리셋 선택
  │     ┌─────────┐ ┌─────────┐ ┌─────────┐
  │     │ Flutter  │ │ Next.js │ │ Python  │ ...
  │     │+Supabase│ │Fullstack│ │+FastAPI │
  │     └─────────┘ └─────────┘ └─────────┘
  │
  ├── 3. 커스터마이징 (선택)
  │     - 에이전트 on/off 토글
  │     - 추가 MCP 서버 선택
  │     - 코딩 규칙 프리셋
  │
  ├── 4. 생성 실행
  │     - CLAUDE.md 생성
  │     - .claude/agents/ 에이전트 생성
  │     - .claude/commands/ 커맨드 생성
  │     - .claude/skills/ 스킬 생성
  │     - settings.json (hooks 포함) 생성
  │
  └── 5. Dashboard로 이동 → "첫 피처를 기획하세요" 안내
```

### 8.2 에이전트팀 서비스 기획 플로우

```
사용자: "서비스 기획하기" 클릭 (또는 "이런 앱 만들어줘" 입력)
  │
  ├── 1. 아이디어 입력 (자연어)
  │     "반려동물 산책 매칭 앱을 만들고 싶어"
  │
  ├── 2. Agent Team 자동 구성
  │     ┌──────────┐
  │     │ CTO Lead │ (오케스트레이터)
  │     └────┬─────┘
  │     ┌────┼──────────────┬──────────────┐
  │     │    │              │              │
  │  ┌──▼──┐ ┌──▼──┐   ┌───▼───┐  ┌──────▼─────┐
  │  │ PM  │ │Arch │   │UX     │  │Biz Analyst │
  │  └──┬──┘ └──┬──┘   └───┬───┘  └──────┬─────┘
  │     │       │          │              │
  │     └───────┴──────────┴──────────────┘
  │                    │
  │              ┌─────▼─────┐
  │              │ 통합 결과 │
  │              └───────────┘
  │
  ├── 3. 자동 생성 (사용자 승인 게이트 포함)
  │     Phase 1: 서비스 기획서 (PM) → 승인
  │     Phase 2: 시스템 아키텍처 (Architect) → 승인
  │     Phase 3: UI/UX 와이어프레임 (UX) → 승인
  │     Phase 4: 수익 모델 & 로드맵 (Biz Analyst) → 승인
  │     Phase 5: PRD 통합 (CTO Lead) → 승인
  │     Phase 6: 기술 스펙 & 태스크 분해 → 승인
  │
  ├── 4. 결과물
  │     - docs/prd/ (PRD)
  │     - docs/specs/ (기술 스펙)
  │     - docs/architecture/ (시스템 설계)
  │     - TodoWrite (태스크 목록)
  │
  └── 5. "구현 시작" 버튼 활성화
```

### 8.3 파일 양방향 동기화 플로우

```
GUI에서 수정한 경우:
  GUI 폼 수정 → Zustand store 업데이트 → IPC → Main Process
  → ConfigParser.serialize() → 파일 쓰기 → File Watcher 무시 (자체 변경)

외부에서 수정한 경우 (에디터, CLI, git pull 등):
  파일 변경 → File Watcher 감지 → ConfigParser.parse()
  → IPC 이벤트 → Renderer → Zustand store 업데이트 → UI 자동 리프레시

충돌 감지:
  GUI 수정 중 외부 변경 감지 → "외부에서 변경됨" 알림
  → 선택: "내 변경 유지" / "외부 변경 적용" / "병합"
```

---

## 9. 보안 고려사항

| 위협 | 대응 |
|------|------|
| API 키 노출 | OS 키체인(macOS Keychain, Windows Credential) 사용. .env 파일 never read |
| 임의 명령 실행 | claude-bridge의 shell 실행은 화이트리스트 기반. 위험 명령 자동 차단 |
| IPC 공격 | contextBridge로 노출 최소화. 모든 IPC 입력 유효성 검사 |
| 파일 시스템 접근 | 프로젝트 경로 외 접근 차단. 심볼릭 링크 추적 제한 |
| XSS | React의 기본 이스케이프 + DOMPurify for 마크다운 렌더링 |
| 플러그인 보안 | 샌드박스 실행 + 권한 선언 (향후) |

---

## 10. 개발 페이즈 (실제 진행 현황)

### Phase 1: Foundation (MVP Core) ✅ 완료
- Electron 34 + React 19 + Vite (electron-vite) 보일러플레이트
- 메인 레이아웃 (사이드바 + 콘텐츠 + 터미널)
- xterm.js + node-pty 내장 터미널
- 프로젝트 열기/생성
- CLAUDE.md 파서 + 비주얼 에디터
- Zustand 상태관리 + Tailwind CSS 4 테마

### Phase 2: Config Management ✅ 완료
- 에이전트 CRUD GUI + React Flow 그래프 뷰
- 커맨드 CRUD GUI
- 스킬 CRUD GUI
- Hook 설정 GUI (3 타입)
- settings.json 비주얼 에디터
- chokidar 파일 양방향 동기화

### Phase 3: Workflow & Planning ✅ 완료
- 워크플로우 파이프라인 시각화 + 편집 모드
- PTY 기반 워크플로우 실행 엔진 + 게이트 승인
- 기획 허브 (docs/ 문서 브라우저)
- AI 에이전트팀 서비스 기획 (PM→Architect→Decomposer)

### Phase 4: MCP & Intelligence ✅ 완료
- MCP 서버 관리 GUI + Quick-add
- Knowledge DB (SQLite better-sqlite3)
- 자기개선 루프 GUI (Escalation → CLAUDE.md)
- ~~MCP 서버 스캐폴딩 위저드~~ (미구현)
- ~~품질 메트릭 대시보드~~ (미구현)

### Phase 5: Templates & Community ✅ 완료
- 기술 스택 프리셋 시스템 (4개: base, flutter, nextjs, python)
- 프리셋 export/import (JSON)
- ~~커뮤니티 마켓플레이스~~ (미구현)

### Phase 6: UX Polish ✅ 완료 (추가)
- i18n 국제화 (EN/KO)
- macOS 타이틀바 + 트래픽 라이트 처리
- 빈 상태 가이드 (Agents/Commands/Skills)
- 선택 해제 + 프로젝트 닫기 UX 경로
- RunBar (동적 스크립트/커맨드)
- Timeline 뷰 (git 이력 + 셋업 진행률)
- Command Palette (⌘K, 13개 액션)
- E2E 테스트 (Playwright, 5개 파일)

---

## 11. 태스크 완료 현황

모든 Phase 1~6 태스크 완료. 상세한 구현 현황은 `docs/implementation-status.md` 참조.

### 핵심 완료 항목
- ✅ Electron 34 + React 19 + Vite (electron-vite) 인프라
- ✅ Tailwind CSS 4 + @theme CSS 변수 테마 시스템
- ✅ 메인 레이아웃 (타이틀바 + 사이드바 + 콘텐츠 + RunBar + 터미널)
- ✅ IPC 타입 시스템 (49채널) + contextBridge preload (15 모듈)
- ✅ xterm.js + node-pty 터미널 통합
- ✅ Zustand 통합 스토어 (12 뷰 상태)
- ✅ 12개 Renderer 뷰 + 13개 Main 서비스
- ✅ i18next 국제화 (EN/KO)
- ✅ Playwright E2E 테스트 (5개 파일)
- ✅ 4개 기술 스택 프리셋 + export/import
