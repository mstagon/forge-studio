# Forge Studio - Implementation Status Report

> PRD 대비 구현 현황. 사용자 경로(User Story)별 정리.
>
> 작성일: 2026-03-09 | 기준: Phase 1~5 + UX 개선 완료 시점

---

## 전체 요약

```
Must-Have    █████████████████████░  25/26  (96%)
Should-Have  ███░░░░░░░░░░░░░░░░░░   3/9   (33%)
Nice-to-Have █░░░░░░░░░░░░░░░░░░░░   1/4   (25%)

✅ 완료: 22  |  ⚠️ 부분: 8  |  ❌ 미구현: 9  |  전체: 39
```

**핵심 기능(Must-Have) 96% 구현 완료. 앱의 모든 주요 사용자 경로가 동작하는 상태.**

### 최근 변경사항 (2026-03-08~09)

- Timeline 뷰 추가 (git 커밋 이력 + 프로젝트 셋업 진행률)
- RunBar 컴포넌트 추가 (package.json 스크립트 + Claude 커맨드 동적 표시)
- 빈 상태 가이드 추가 (Agents/Commands/Skills 뷰)
- i18n 구현 완료 (EN/KO 2개 언어)
- macOS 타이틀바 수정 (38px drag-region + 트래픽 라이트 간격)
- UX 네비게이션 개선 (선택 해제, 프로젝트 닫기 경로)
- Git IPC 채널 추가 (git:log, git:diff-stat)
- E2E 테스트 5개 파일 작성

---

## Epic 1. 프로젝트 설정

> 사용자 경로: 앱 실행 → 프로젝트 열기/생성 → 대시보드 진입

| ID | 스토리 | 상태 | 설명 |
|----|--------|:----:|------|
| US-101 | 새 프로젝트 생성 + 스택 자동 셋업 | ✅ | 3단계 위저드 (위치→프리셋→확인). 4개 빌트인 프리셋. CLAUDE.md + .claude/ 전체 자동 생성 |
| US-102 | 기존 폴더 열기 → 설정 감지/시각화 | ✅ | .claude/ 자동 감지, agent/command/skill 카운트, git branch 표시. chokidar 파일 워처로 외부 변경 실시간 반영 |
| US-103 | 커뮤니티 템플릿 검색/적용 | ⚠️ | JSON 기반 Export/Import 가능. **미구현:** 온라인 마켓플레이스 (Nice-to-Have) |

### UX 경로 (완성됨)

```
앱 실행 → Welcome 화면 → "Open Project" 또는 "New Project"
  ├── Open Project → 폴더 선택 → .claude/ 감지 → Dashboard
  ├── New Project → 위저드(3단계) → 프리셋 적용 → Dashboard
  └── Recent Projects → 클릭 → Dashboard
Dashboard → 작업 → "Close Project" (타이틀바 X / 사이드바 / ⌘K) → Welcome
```

### 구현 파일

```
src/renderer/src/routes/WelcomeView.tsx        — Welcome 화면 + 최근 프로젝트
src/renderer/src/components/wizard/NewProjectWizard.tsx — 3단계 프로젝트 생성 위저드
src/main/services/project-manager.ts           — 프로젝트 열기/통계/git log
src/main/services/preset-registry.ts           — 4개 빌트인 프리셋
src/main/services/preset-applier.ts            — 프리셋 → 파일 생성
src/main/services/preset-exporter.ts           — 프로젝트 → 프리셋 JSON 내보내기
src/main/services/file-watcher.ts              — chokidar 파일 변경 감지
```

---

## Epic 2. 워크플로우 엔진

> 사용자 경로: Workflow 뷰 → 스텝 편집 → 실행 → 게이트 승인 → 완료

| ID | 스토리 | 상태 | 설명 |
|----|--------|:----:|------|
| US-201 | 파이프라인 시각적 보기 | ✅ | 단계별 상태 카드 (pending/running/done/failed/waiting). 실시간 output 스트리밍 |
| US-202 | 드래그&드롭 커스터마이징 | ⚠️ | Edit Mode로 스텝 추가/삭제/재정렬/프롬프트 편집. **미구현:** 드래그&드롭, React Flow 노드 방식 |
| US-203 | Claude CLI 자동 순차 실행 | ✅ | 전용 PTY 세션에서 단계별 자동 실행. `{feature}` 플레이스홀더 치환 |
| US-204 | 사람 승인 게이트 | ✅ | `gate` 타입 스텝 → Approve / Skip 버튼 |
| US-205 | 실행 이력/타임라인 | ⚠️ | Timeline 뷰에서 git 커밋 이력 표시. **미구현:** 워크플로우 단위 실행 이력 저장/조회 |

### 구현 파일

```
src/renderer/src/routes/WorkflowView.tsx       — 워크플로우 UI (편집 + 실행 + 출력)
src/main/services/workflow-runner.ts           — PTY 기반 워크플로우 실행 엔진
```

---

## Epic 3. 에이전트 스튜디오

> 사용자 경로: Agents 뷰 → 빈 상태 가이드 → 에이전트 생성 → 편집 → 제목 클릭으로 해제 → 목록 복귀

| ID | 스토리 | 상태 | 설명 |
|----|--------|:----:|------|
| US-301 | GUI 폼으로 에이전트 CRUD | ✅ | 이름/마크다운 내용 편집, 생성/삭제/이름변경. .claude/agents/*.md 자동 관리. 빈 상태 가이드 포함 |
| US-302 | 노드 그래프 시각화 | ✅ | React Flow v11 — 그룹별(Planning/Dev/Review/Doc) 컬럼 배치, 애니메이션 엣지. 리스트/그래프 토글 |
| US-303 | 실시간 실행 모니터링 | ⚠️ | Agent Team 실행 시 실시간 output 스트리밍. **미구현:** 개별 에이전트 세션 단위 모니터링 |
| US-304 | 에이전트 프리셋 저장/로드 | ⚠️ | 프로젝트 전체 프리셋으로 포함. **미구현:** 에이전트 단독 프리셋 |

### UX 경로 (개선됨)

```
Agents 뷰 진입 → 빈 상태 가이드 (What are Agents?)
  ├── "Create First Agent" 클릭 → 폼 표시 → 편집 → 저장
  ├── 목록에서 에이전트 클릭 → 상세 편집
  ├── "Agents" 제목 클릭 → 선택 해제 → 가이드 화면 복귀
  └── 그래프 뷰 ↔ 리스트 뷰 토글
```

### 구현 파일

```
src/renderer/src/routes/AgentsView.tsx         — 에이전트 목록 + 편집 폼 + 빈 상태 가이드 + 선택 해제
src/renderer/src/components/agents/AgentGraph.tsx — React Flow 노드 그래프
src/main/services/config-manager.ts            — 에이전트 파일 CRUD
```

---

## Epic 4. 기획 허브

> 사용자 경로: Planning 뷰 → 문서 탐색 or AI Team → Feature 입력 → 자동 기획

| ID | 스토리 | 상태 | 설명 |
|----|--------|:----:|------|
| US-401 | 기획문서 import | ⚠️ | docs/ 하위 마크다운 자동 탐색/표시 (prd/specs/planningdocs/architecture). **미구현:** 드래그&드롭, PDF/Notion |
| US-402 | PRD → 스펙 → 태스크 자동 생성 | ✅ | Agent Team (PM→Architect→Task Decomposer) 순차 실행. docs/prd/, docs/specs/ 자동 생성 |
| US-403 | 아이디어 → 기획 자동 | ✅ | Feature Name 입력 → AI Team Start → 3 에이전트 순차 문서 생성 |
| US-404 | PRD-스펙-태스크 traceability | ❌ | **미구현:** 요구사항 추적 매트릭스 (Should-Have) |
| US-405 | 에이전트팀 서비스 기획 | ✅ | 3인 팀 자동 실행, 실시간 출력/상태 표시, 완료 시 문서 목록 자동 갱신 |

### 구현 파일

```
src/renderer/src/routes/PlanningView.tsx       — 문서 브라우저 + AI Team 패널
src/main/services/agent-team.ts                — PM→Architect→Decomposer 순차 실행
```

---

## Epic 5. MCP 스튜디오

> 사용자 경로: MCP 뷰 → 서버 목록 확인 → Quick-add / 수동 추가 → 제거

| ID | 스토리 | 상태 | 설명 |
|----|--------|:----:|------|
| US-501 | MCP 서버 시각적 관리 | ✅ | 서버 목록, 추가 폼 (name/command/args/env), 삭제. Quick-add 인기 서버 |
| US-502 | MCP 서버 위저드 (코드 생성) | ❌ | **미구현** (Should-Have) |
| US-503 | 도구 테스트 플레이그라운드 | ❌ | **미구현** (Nice-to-Have) |
| US-504 | 커뮤니티 MCP 검색/설치 | ⚠️ | Quick-add로 인기 서버 원클릭 추가. **미구현:** 온라인 검색 |

### 구현 파일

```
src/renderer/src/routes/McpView.tsx            — MCP 관리 UI
src/main/services/config-manager.ts            — ~/.claude.json 직접 수정
```

---

## Epic 6. CLAUDE.md 비주얼 에디터

> 사용자 경로: CLAUDE.md 뷰 → 섹션별 편집 → 저장 → 마크다운 자동 생성

| ID | 스토리 | 상태 | 설명 |
|----|--------|:----:|------|
| US-601 | 섹션별 편집 | ✅ | 프로젝트명/설명/기술스택/아키텍처/빌드/코딩규칙/금지패턴/자기개선/문서규칙 — 각각 개별 폼 필드 |
| US-602 | 스택 선택 시 규칙 자동 추천 | ⚠️ | 프리셋 적용 시 규칙 자동 생성. **미구현:** 실시간 드롭다운 추천 |
| US-603 | 규칙 토글/우선순위 관리 | ❌ | **미구현:** on/off 토글, 드래그 순서 변경 (Should-Have) |
| US-604 | lessons-learned 패턴 승인/거부 → CLAUDE.md 갱신 | ✅ | Escalation Check → 3회+ 반복 감지 → Apply to CLAUDE.md |

### 구현 파일

```
src/renderer/src/routes/ClaudeMdView.tsx       — 섹션별 비주얼 에디터
src/main/services/claude-md-parser.ts          — 마크다운 ↔ 구조체 파싱/직렬화
src/main/services/escalation.ts                — 반복 패턴 → CLAUDE.md 자동 추가
```

---

## Epic 7. 커맨드 & 스킬 빌더

> 사용자 경로: Commands/Skills 뷰 → 빈 상태 가이드 → 생성/편집 → 제목 클릭으로 해제 → 목록 복귀

| ID | 스토리 | 상태 | 설명 |
|----|--------|:----:|------|
| US-701 | 커맨드 GUI 생성 | ✅ | 이름/마크다운 편집, CRUD. .claude/commands/*.md 자동 관리. 빈 상태 가이드 포함 |
| US-702 | 스킬 GUI 생성 | ✅ | 이름/마크다운 편집, CRUD. .claude/skills/*/SKILL.md 자동 관리. 빈 상태 가이드 포함 |
| US-703 | 커맨드/스킬 라이브러리 | ❌ | **미구현** (Nice-to-Have) |

### UX 경로 (개선됨)

```
Commands/Skills 뷰 진입 → 빈 상태 가이드
  ├── "Create First" 클릭 → 폼 표시 → 편집 → 저장
  ├── 목록에서 항목 클릭 → 상세 편집
  └── 제목 클릭 → 선택 해제 → 가이드 화면 복귀
```

### 구현 파일

```
src/renderer/src/routes/CommandsView.tsx       — 커맨드 편집 UI + 빈 상태 가이드 + 선택 해제
src/renderer/src/routes/SkillsView.tsx         — 스킬 편집 UI + 빈 상태 가이드 + 선택 해제
src/main/services/config-manager.ts            — 파일 CRUD
```

---

## Epic 8. Hooks & 자동화

> 사용자 경로: Hooks 뷰 → Hook 타입 선택 → matcher/command 설정 → 저장

| ID | 스토리 | 상태 | 설명 |
|----|--------|:----:|------|
| US-801 | Hook GUI 설정 | ✅ | PreToolUse/PostToolUse/SessionStart별 hook 추가/편집/삭제. settings.json 자동 갱신 |
| US-802 | Hook 실행 결과 실시간 보기 | ❌ | **미구현** (Should-Have) |
| US-803 | 조건부 Hook 비주얼 설정 | ⚠️ | matcher 텍스트 입력 가능. **미구현:** 비주얼 조건 빌더 |

### 구현 파일

```
src/renderer/src/routes/HooksView.tsx          — Hook 설정 UI
src/main/services/config-manager.ts            — settings.json 읽기/쓰기
```

---

## Epic 9. 지식 관리 & 자기개선

> 사용자 경로: Knowledge 뷰 → 검색/필터 → 항목 추가 → Escalation 확인 → CLAUDE.md 적용

| ID | 스토리 | 상태 | 설명 |
|----|--------|:----:|------|
| US-901 | lessons-learned 대시보드 | ✅ | SQLite DB. 검색/필터 (4 카테고리). 통계 카드 (총 항목/반복3+/학습율/태그). 추가/삭제 |
| US-902 | 크로스 프로젝트 지식 전이 | ⚠️ | 글로벌 SQLite DB → 프로젝트 간 검색 가능. lessons-learned.md Import. **미구현:** 자동 적용 UI |
| US-903 | 품질 메트릭 대시보드 (시계열) | ❌ | **미구현** (Nice-to-Have) |

### 구현 파일

```
src/renderer/src/routes/KnowledgeView.tsx      — 지식 대시보드 UI
src/main/services/knowledge-db.ts              — SQLite CRUD + 검색 + 중복 감지
src/main/services/escalation.ts                — 3회+ 반복 → CLAUDE.md 적용
```

---

## Epic 10. 터미널 통합

> 사용자 경로: 앱 하단 터미널 패널 → Claude Code CLI 직접 사용

| ID | 스토리 | 상태 | 설명 |
|----|--------|:----:|------|
| US-1001 | 앱 내 터미널 내장 | ✅ | xterm.js + node-pty. 드래그 리사이즈. ⌘` 토글 |
| US-1002 | GUI 실행 → 터미널에서 보기 | ✅ | RunBar에서 npm 스크립트/Claude 커맨드 원클릭 실행. Workflow/Team은 전용 PTY 출력 패널 |
| US-1003 | 터미널 출력 파싱/구조화 | ❌ | **미구현** (Should-Have) |

### 구현 파일

```
src/renderer/src/components/terminal/TerminalPanel.tsx — xterm.js 터미널
src/renderer/src/components/terminal/RunBar.tsx        — 동적 스크립트/커맨드 실행 바
src/main/services/pty-manager.ts               — node-pty 세션 관리
```

---

## 추가 기능 (PRD 외)

### Timeline 뷰

> 프로젝트 진행 상황을 한눈에 파악

| 기능 | 상태 | 설명 |
|------|:----:|------|
| Git 커밋 이력 | ✅ | 날짜별 그룹핑, 최근 50개 커밋 표시, 새로고침 |
| 프로젝트 셋업 진행률 | ✅ | 8개 항목 체크리스트 + 프로그레스 바. 각 항목 클릭 시 해당 뷰로 이동 |
| Quick Stats | ✅ | 총 커밋 수, 마지막 커밋, 기여자 수 |

### 구현 파일

```
src/renderer/src/routes/TimelineView.tsx       — 타임라인 UI
src/main/services/project-manager.ts           — getGitLog(), getGitDiffStat()
```

---

## 비기능 요구사항

| 항목 | 상태 | 설명 |
|------|:----:|------|
| 다크/라이트 테마 | ✅ | CSS 변수 기반 (@theme 인디렉션). StatusBar 토글 + Command Palette. localStorage 저장 |
| 키보드 내비게이션 | ✅ | ⌘1~0 뷰 전환, ⌘K 커맨드 팔레트, ⌘\` 터미널, ⌘B 사이드바 |
| Command Palette | ✅ | ⌘K — 검색/필터, 키보드 탐색 (↑↓ Enter Esc), 13개 액션 (nav 11 + theme + open/close project) |
| 최근 프로젝트 | ✅ | localStorage 최대 10개. Welcome 화면에 5개 표시 |
| 오프라인 지원 | ✅ | 설정 편집/관리 오프라인 가능. CLI 실행만 온라인 필요 |
| 보안 (contextBridge) | ✅ | nodeIntegration 비활성. contextBridge로 API 최소 노출 |
| TypeScript strict | ✅ | tsc --noEmit 에러 0 (web + node 양쪽) |
| 국제화 (i18n) | ✅ | i18next 기반. EN/KO 2개 언어 완전 지원. 모든 UI 문자열 번역 키 사용 |
| macOS 타이틀바 | ✅ | hiddenInset + 38px drag-region + 트래픽 라이트 78px 간격 + 프로젝트명 표시 |
| UX 네비게이션 | ✅ | 선택 해제(제목 클릭), 프로젝트 닫기(타이틀바/사이드바/⌘K), Welcome 복귀 |
| 빈 상태 가이드 | ✅ | Agents/Commands/Skills 뷰에 설명 + 예시 + CTA 버튼 |
| RunBar | ✅ | package.json 스크립트 + Claude 커맨드 동적 감지/실행 |
| 패키징 (DMG/AppImage) | ❌ | electron-builder 미설정 |
| 단위 테스트 (Vitest) | ❌ | 미구현 |
| E2E 테스트 (Playwright) | ✅ | 5개 테스트 파일 (smoke, theme, timeline, UX nav, theme-diag) |

---

## 기술 아키텍처 현황

### 구현된 Main Process 서비스 (13개)

```
project-manager.ts     — 프로젝트 열기/통계 + git log/diff
claude-bridge.ts       — Claude CLI 설치 확인/버전
claude-md-parser.ts    — CLAUDE.md 파싱/직렬화
config-manager.ts      — 에이전트/커맨드/스킬/설정/MCP CRUD
file-watcher.ts        — chokidar 파일 변경 감지
pty-manager.ts         — node-pty 터미널 세션 관리
workflow-runner.ts     — 워크플로우 PTY 실행 엔진
agent-team.ts          — AI 에이전트팀 순차 실행
knowledge-db.ts        — SQLite 지식 DB (better-sqlite3)
escalation.ts          — 반복 패턴 → CLAUDE.md 자동 추가
preset-registry.ts     — 4개 빌트인 프리셋 관리
preset-applier.ts      — 프리셋 → 파일 생성
preset-exporter.ts     — 프로젝트 → 프리셋 JSON 내보내기
```

### 구현된 Renderer 뷰 (12개)

```
WelcomeView.tsx        — 시작 화면 + 최근 프로젝트
DashboardView.tsx      — 프로젝트 대시보드
WorkflowView.tsx       — 워크플로우 편집/실행
AgentsView.tsx         — 에이전트 CRUD + 그래프 뷰 + 빈 상태 가이드
PlanningView.tsx       — 기획 허브 + AI Team
ClaudeMdView.tsx       — CLAUDE.md 비주얼 에디터
CommandsView.tsx       — 커맨드 빌더 + 빈 상태 가이드
SkillsView.tsx         — 스킬 빌더 + 빈 상태 가이드
HooksView.tsx          — Hook 설정
McpView.tsx            — MCP 서버 관리
KnowledgeView.tsx      — 지식 대시보드
TimelineView.tsx       — 타임라인 (git 이력 + 셋업 진행률)
```

### 주요 UI 컴포넌트

```
components/layout/Sidebar.tsx          — 사이드바 (11개 nav + 닫기 + 축소)
components/layout/StatusBar.tsx        — 하단 상태바 (CLI 상태 + 테마 토글)
components/terminal/TerminalPanel.tsx  — xterm.js 터미널
components/terminal/RunBar.tsx         — 동적 스크립트/커맨드 실행 바
components/CommandPalette.tsx          — ⌘K 커맨드 팔레트
components/common/ToastContainer.tsx   — 토스트 알림
components/common/ConfirmDialog.tsx    — 확인 다이얼로그
components/agents/AgentGraph.tsx       — React Flow 노드 그래프
components/wizard/NewProjectWizard.tsx — 프로젝트 생성 위저드
```

### IPC 채널 (49개)

```
Terminal:    5채널  (create, data, resize, dispose, on-data, on-exit)
Project:     3채널  (open, read-dir, get-recent)
FileSystem:  4채널  (read, write, changed, start-watching)
CLAUDE.md:   2채널  (read, write)
Agents:      4채널  (list, save, delete, rename)
Commands:    3채널  (list, save, delete)
Skills:      3채널  (list, save, delete)
Settings:    2채널  (read, write)
MCP:         3채널  (list, add, remove)
Claude CLI:  2채널  (check-installed, get-version)
Presets:     4채널  (list, apply, export, import)
Workflow:    5채널  (start, approve, skip, stop, get-state, state, output)
Knowledge:   6채널  (add, search, delete, update, import-lessons, get-escalation, apply-escalation)
Team:        4채널  (start, stop, get-state, state, output)
Git:         2채널  (log, diff-stat)
App:         2채널  (get-path, open-directory)
```

### 프리셋 (4개)

```
templates/_base/              — 공통 베이스 (에이전트 6개 + 커맨드 4개)
templates/flutter-supabase/   — Flutter + Supabase
templates/nextjs-fullstack/   — Next.js 풀스택
templates/python-fastapi/     — Python + FastAPI
```

---

## 미구현 항목 우선순위 정리

### 구현하면 좋은 것 (Should-Have)

| 우선순위 | 항목 | 예상 난이도 |
|:--------:|------|:----------:|
| 1 | 워크플로우 실행 이력 저장/조회 (US-205) | 중 |
| 2 | MCP 서버 위저드 — 스캐폴딩 생성 (US-502) | 높 |
| 3 | 규칙 토글/우선순위 드래그 (US-603) | 낮 |
| 4 | Hook 실행 결과 실시간 보기 (US-802) | 중 |
| 5 | 터미널 출력 파싱/구조화 (US-1003) | 높 |
| 6 | PRD-스펙-태스크 traceability (US-404) | 높 |

### 배포 준비

| 우선순위 | 항목 | 예상 난이도 |
|:--------:|------|:----------:|
| 1 | electron-builder 패키징 (DMG/AppImage) | 중 |
| 2 | 단위 테스트 (Vitest) | 중 |
| 3 | ESLint 설정 정리 + lint 통과 | 낮 |
| 4 | 코드 서명 (Code Signing) | 중 |
| 5 | Auto-update (electron-updater) | 중 |
