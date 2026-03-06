# Forge Studio - 시스템 아키텍처 설계서

## 메타데이터
- 작성일: 2026-03-06
- 버전: 1.0
- 상태: Draft
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
│  │  ┌──────────────────────────────────────────────────────┐│  │
│  │  │              Integrated Terminal                      ││  │
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
│  │  │Template  │ │Workflow  │ │ Config   │ │  Plugin    │ │  │
│  │  │Engine    │ │Runtime   │ │ Store    │ │  System    │ │  │
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
| 마크다운 | MDXEditor 또는 Milkdown | CLAUDE.md 리치 에디터 |
| 코드 에디터 | Monaco Editor | 에이전트/커맨드 마크다운 편집 |
| 빌드 | Vite + electron-vite | 빠른 HMR, Electron 최적화 |
| 패키징 | electron-builder | macOS DMG, Windows NSIS, Linux AppImage |
| 테스트 | Vitest + Playwright | 단위 + E2E 테스트 |
| 로컬 DB | SQLite (better-sqlite3) | 워크플로우 이력, 지식 DB |
| IPC 타입 | electron-trpc 또는 typesafe-ipc | Main-Renderer 간 타입 안전 통신 |

---

## 3. 디렉토리 구조

```
forge-studio/
├── src/
│   ├── main/                          # Electron Main Process
│   │   ├── index.ts                   # 앱 진입점
│   │   ├── windows.ts                 # 윈도우 관리
│   │   ├── ipc/                       # IPC 핸들러
│   │   │   ├── project.ipc.ts         # 프로젝트 관리 IPC
│   │   │   ├── claude-cli.ipc.ts      # Claude CLI 브릿지 IPC
│   │   │   ├── file-system.ipc.ts     # 파일 시스템 IPC
│   │   │   ├── mcp.ipc.ts            # MCP 관리 IPC
│   │   │   └── workflow.ipc.ts        # 워크플로우 실행 IPC
│   │   ├── services/                  # 비즈니스 로직
│   │   │   ├── project-manager.ts     # 프로젝트 CRUD, 설정 감지
│   │   │   ├── claude-bridge.ts       # Claude Code CLI 래핑
│   │   │   ├── file-watcher.ts        # .claude/ 파일 변경 감지
│   │   │   ├── config-parser.ts       # CLAUDE.md, settings.json 파서
│   │   │   ├── template-engine.ts     # 기술 스택 프리셋 생성
│   │   │   ├── mcp-manager.ts         # MCP 서버 관리
│   │   │   ├── workflow-runtime.ts    # 워크플로우 실행 엔진
│   │   │   ├── knowledge-db.ts        # lessons-learned SQLite
│   │   │   └── plugin-system.ts       # 플러그인 로더
│   │   └── utils/
│   │       ├── markdown-parser.ts     # 마크다운 ↔ 구조체 변환
│   │       └── shell.ts               # 안전한 shell 실행
│   │
│   ├── renderer/                      # Electron Renderer (React)
│   │   ├── App.tsx
│   │   ├── main.tsx                   # React 진입점
│   │   ├── routes/                    # 페이지 라우팅
│   │   │   ├── dashboard.tsx          # 프로젝트 대시보드
│   │   │   ├── workflow.tsx           # 워크플로우 엔진 뷰
│   │   │   ├── agents.tsx             # 에이전트 스튜디오
│   │   │   ├── planning.tsx           # 기획 허브
│   │   │   ├── claude-md.tsx          # CLAUDE.md 에디터
│   │   │   ├── commands.tsx           # 커맨드 빌더
│   │   │   ├── skills.tsx             # 스킬 빌더
│   │   │   ├── hooks.tsx              # Hook 설정
│   │   │   ├── mcp.tsx               # MCP 스튜디오
│   │   │   └── knowledge.tsx          # 지식 대시보드
│   │   ├── components/                # 재사용 컴포넌트
│   │   │   ├── layout/               # 레이아웃 (사이드바, 헤더 등)
│   │   │   ├── terminal/             # xterm.js 터미널 래퍼
│   │   │   ├── editor/               # 마크다운/코드 에디터
│   │   │   ├── node-graph/           # React Flow 노드 에디터
│   │   │   ├── workflow/             # 워크플로우 UI 컴포넌트
│   │   │   └── common/               # 버튼, 카드, 모달 등
│   │   ├── stores/                    # Zustand 상태 관리
│   │   │   ├── project.store.ts
│   │   │   ├── workflow.store.ts
│   │   │   ├── agent.store.ts
│   │   │   └── ui.store.ts
│   │   ├── hooks/                     # React 커스텀 훅
│   │   │   ├── useClaudeCli.ts        # CLI 실행 훅
│   │   │   ├── useFileWatcher.ts      # 파일 변경 감지 훅
│   │   │   └── useProject.ts          # 프로젝트 컨텍스트
│   │   └── styles/
│   │       └── globals.css            # Tailwind 설정
│   │
│   ├── shared/                        # Main/Renderer 공유
│   │   ├── types/                     # 공유 타입 정의
│   │   │   ├── project.types.ts       # 프로젝트 설정 타입
│   │   │   ├── agent.types.ts         # 에이전트 구조 타입
│   │   │   ├── workflow.types.ts      # 워크플로우 타입
│   │   │   ├── command.types.ts       # 커맨드 타입
│   │   │   ├── skill.types.ts         # 스킬 타입
│   │   │   ├── mcp.types.ts           # MCP 서버 타입
│   │   │   ├── claude-md.types.ts     # CLAUDE.md 파싱 타입
│   │   │   └── ipc.types.ts           # IPC 채널 타입 정의
│   │   ├── constants/
│   │   │   └── channels.ts            # IPC 채널 이름 상수
│   │   └── utils/
│   │       └── validators.ts          # 공유 유효성 검사
│   │
│   └── preload/
│       └── index.ts                   # contextBridge 설정
│
├── templates/                         # 기술 스택 프리셋
│   ├── flutter-supabase/             # Flutter + Supabase 프리셋
│   │   ├── CLAUDE.md.hbs
│   │   ├── agents/
│   │   ├── commands/
│   │   └── skills/
│   ├── nextjs-fullstack/             # Next.js 풀스택 프리셋
│   ├── python-fastapi/               # Python + FastAPI 프리셋
│   ├── react-native/                 # React Native 프리셋
│   └── _base/                        # 공통 베이스 (모든 스택 공유)
│       ├── agents/
│       │   ├── product-planner.md.hbs
│       │   ├── tech-architect.md.hbs
│       │   ├── task-decomposer.md.hbs
│       │   ├── code-reviewer.md.hbs
│       │   ├── security-auditor.md.hbs
│       │   └── doc-writer.md.hbs
│       └── commands/
│           ├── plan-feature.md.hbs
│           ├── implement.md.hbs
│           ├── review.md.hbs
│           └── full-cycle.md.hbs
│
├── plugins/                           # 플러그인 (향후 확장)
├── docs/                              # 프로젝트 문서
├── tests/                             # 테스트
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── electron.vite.config.ts
├── package.json
├── tsconfig.json
└── tailwind.config.ts
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

## 6. IPC 설계

Electron Main ↔ Renderer 간 통신은 타입 안전한 IPC를 사용.

```typescript
// src/shared/types/ipc.types.ts

// 채널 정의 (타입 안전)
interface IpcChannels {
  // 프로젝트
  'project:list': () => ForgeProject[];
  'project:open': (path: string) => ForgeProject;
  'project:create': (config: CreateProjectConfig) => ForgeProject;

  // Claude CLI
  'claude:start-session': (config: ClaudeBridgeConfig) => string; // session ID
  'claude:send': (sessionId: string, input: string) => void;
  'claude:kill': (sessionId: string) => void;

  // 파일 시스템 (양방향 동기화)
  'fs:read-claude-md': (projectPath: string) => ClaudeMdConfig;
  'fs:write-claude-md': (projectPath: string, config: ClaudeMdConfig) => void;
  'fs:list-agents': (projectPath: string) => Agent[];
  'fs:save-agent': (projectPath: string, agent: Agent) => void;
  'fs:delete-agent': (projectPath: string, name: string) => void;
  // ... commands, skills, hooks 동일 패턴

  // MCP
  'mcp:list': () => McpServer[];
  'mcp:add': (config: McpServerConfig) => void;
  'mcp:remove': (name: string) => void;
  'mcp:status': (name: string) => McpServer;

  // 워크플로우
  'workflow:execute': (workflow: WorkflowConfig, vars: Record<string, string>) => string;
  'workflow:approve': (executionId: string, stepId: string) => void;
  'workflow:history': (projectId: string) => WorkflowExecution[];

  // 지식
  'knowledge:lessons': (projectId?: string) => Lesson[];
  'knowledge:metrics': (projectId: string) => QualityMetric[];
}

// Renderer → Main 이벤트 (단방향)
interface IpcEvents {
  'claude:output': (sessionId: string, output: ClaudeOutput) => void;
  'fs:changed': (event: FileChangeEvent) => void;
  'workflow:step-update': (execution: WorkflowStepExecution) => void;
  'mcp:status-change': (name: string, status: string) => void;
}
```

---

## 7. UI 구조

### 7.1 메인 레이아웃

```
┌────────────────────────────────────────────────────────────────┐
│  [< >] Forge Studio    project-name    [🔍] [⚙️] [👤]        │
├────────┬───────────────────────────────────────────────────────┤
│        │                                                       │
│  📊    │  ┌─────────────────────────────────────────────────┐ │
│ Dash   │  │                                                 │ │
│        │  │              Main Content Area                  │ │
│  🔄    │  │                                                 │ │
│ Work   │  │  (Dashboard / Workflow / Agent Studio /         │ │
│ flow   │  │   Planning Hub / CLAUDE.md Editor /             │ │
│        │  │   Command Builder / MCP Studio / ...)           │ │
│  🤖    │  │                                                 │ │
│ Agent  │  │                                                 │ │
│        │  │                                                 │ │
│  📋    │  │                                                 │ │
│ Plan   │  ├─────────────────────────────────────────────────┤ │
│        │  │                                                 │ │
│  📝    │  │         Integrated Terminal Panel               │ │
│ Edit   │  │         (xterm.js - Claude Code CLI)            │ │
│        │  │                                                 │ │
│  🔧    │  └─────────────────────────────────────────────────┘ │
│ MCP    │                                                       │
│        │                                                       │
│  📚    │                                                       │
│ Know   │                                                       │
│        │                                                       │
├────────┴───────────────────────────────────────────────────────┤
│  Status: ● Claude CLI Connected  | Project: my-app | Branch:  │
└────────────────────────────────────────────────────────────────┘
```

### 7.2 주요 화면

**Dashboard**: 프로젝트 개요, 최근 활동, 빠른 액션 버튼
**Workflow**: React Flow 기반 파이프라인 뷰, 실행 상태, 이력
**Agent Studio**: 에이전트 목록 (카드뷰), 편집 폼, 노드 그래프
**Planning Hub**: 기획문서 목록, PRD/스펙/태스크 뷰, traceability 매트릭스
**CLAUDE.md Editor**: 섹션별 탭, 리치 에디터, 실시간 프리뷰
**Command Builder**: 커맨드 목록, 폼 에디터, 테스트 실행
**MCP Studio**: 서버 목록, 상태 대시보드, 도구 탐색기
**Knowledge**: lessons-learned 목록, 반복 패턴 차트, 크로스 프로젝트 뷰

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

## 10. 개발 페이즈

### Phase 1: Foundation (MVP Core)
- Electron + React + Vite 보일러플레이트
- 메인 레이아웃 (사이드바 + 콘텐츠 + 터미널)
- xterm.js 내장 터미널 (Claude Code CLI 직접 연결)
- 프로젝트 열기/생성
- CLAUDE.md 파서 + 비주얼 에디터 (기본)

### Phase 2: Config Management
- 에이전트 CRUD GUI
- 커맨드 CRUD GUI
- 스킬 CRUD GUI
- Hook 설정 GUI
- settings.json 비주얼 에디터
- 파일 양방향 동기화 (File Watcher)

### Phase 3: Workflow & Planning
- 워크플로우 파이프라인 시각화 (React Flow)
- 워크플로우 실행 엔진
- 기획 허브 (문서 import, PRD/스펙 관리)
- 에이전트팀 서비스 기획 기능

### Phase 4: MCP & Intelligence
- MCP 서버 관리 GUI
- MCP 서버 스캐폴딩 위저드
- Knowledge DB (lessons-learned 크로스 프로젝트)
- 자기개선 루프 GUI
- 품질 메트릭 대시보드

### Phase 5: Templates & Community
- 기술 스택 프리셋 시스템
- flutter-forge 프리셋 마이그레이션
- 템플릿 export/import
- 커뮤니티 공유 준비

---

## 11. 태스크 분해 (Phase 1 상세)

| ID | 태스크 | 의존성 | 담당 영역 | 완료 기준 |
|----|--------|--------|----------|---------|
| T-001 | Electron + React + Vite 프로젝트 초기화 | 없음 | 인프라 | electron-vite로 빌드/실행 가능 |
| T-002 | Tailwind CSS + Radix UI 셋업 | T-001 | 스타일 | 다크/라이트 테마 전환 동작 |
| T-003 | 메인 레이아웃 (사이드바 + 콘텐츠 + 터미널 패널) | T-002 | UI | 리사이즈 가능한 3영역 레이아웃 |
| T-004 | IPC 타입 시스템 + preload 설정 | T-001 | 인프라 | 타입 안전한 IPC 통신 동작 |
| T-005 | xterm.js 터미널 통합 | T-003, T-004 | 터미널 | 앱 내에서 Claude Code CLI 실행 가능 |
| T-006 | Claude CLI Bridge (node-pty) | T-004 | 코어 | CLI child process 관리, 입출력 스트리밍 |
| T-007 | 프로젝트 매니저 (열기/생성) | T-004 | 코어 | 폴더 선택 → 프로젝트 로드 동작 |
| T-008 | CLAUDE.md 파서 | T-007 | 코어 | 마크다운 → 구조체 → 마크다운 라운드트립 |
| T-009 | CLAUDE.md 비주얼 에디터 (기본) | T-003, T-008 | UI | 섹션별 편집 + 실시간 프리뷰 |
| T-010 | File Watcher (chokidar) | T-007 | 코어 | .claude/ 변경 감지 → IPC 이벤트 |
| T-011 | Dashboard 페이지 | T-003, T-007 | UI | 프로젝트 개요, 빠른 액션 |
| T-012 | Zustand 스토어 설정 | T-004 | 상태관리 | 프로젝트, UI 상태 관리 |
