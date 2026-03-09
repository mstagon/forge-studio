# Forge Studio - Demo Test Scenario

> 데모 프로젝트: **PetWalk** (반려동물 산책 매칭 앱)
> 기술 스택: Next.js Fullstack 프리셋
> 목적: 모든 주요 사용자 경로를 순서대로 검증

---

## 사전 준비

```
필수:
- Claude Code CLI 설치 및 로그인 완료
- Forge Studio 앱 실행 (npm run dev)

테스트용 폴더:
- ~/Desktop/petwalk (비어있는 폴더 또는 자동 생성)
```

---

## Phase A. 앱 시작 & 프로젝트 생성

### A-1. Welcome 화면 확인

```
경로: 앱 실행 직후

확인 항목:
[ ] Forge Studio 로고 + "AI Development Cockpit" 표시
[ ] "Open Project" 버튼 동작
[ ] "New Project" 버튼 동작
[ ] 하단 StatusBar에 Claude CLI 상태 표시 (● 초록/빨강)
[ ] ⌘K로 Command Palette 열림 (프로젝트 없이도)
[ ] 하단 테마 토글 버튼 (☀️/🌙) 동작
```

### A-2. 테마 전환 테스트

```
경로: StatusBar 테마 버튼 클릭 또는 ⌘K → "Switch to Light Theme"

확인 항목:
[ ] 다크 → 라이트 전환 시 배경/텍스트/보더 색상 변경
[ ] 라이트 → 다크 복귀 정상
[ ] 앱 재시작 후에도 선택한 테마 유지 (localStorage)
```

### A-3. 새 프로젝트 생성 (New Project Wizard)

```
경로: "New Project" 클릭

Step 1 - 위치 선택:
[ ] Browse 버튼 → ~/Desktop/petwalk 선택
[ ] 경로가 입력 필드에 표시됨

Step 2 - 프리셋 선택:
[ ] 4개 프리셋 카드 표시 (Flutter, Next.js, Python, Custom)
[ ] "Next.js Fullstack" 선택 → 선택 표시(하이라이트) 확인

Step 3 - 확인 & 적용:
[ ] 선택한 경로 + 프리셋 요약 표시
[ ] "Create" 클릭 → 생성 완료
[ ] 자동으로 Dashboard 뷰로 이동

파일 생성 확인 (터미널에서):
[ ] ~/Desktop/petwalk/CLAUDE.md 존재
[ ] ~/Desktop/petwalk/.claude/agents/ 에 에이전트 .md 파일들
[ ] ~/Desktop/petwalk/.claude/commands/ 에 커맨드 .md 파일들
[ ] ~/Desktop/petwalk/.claude/settings.json 존재
```

### A-4. 최근 프로젝트 확인

```
경로: 좌상단 프로젝트명 영역 or 앱 재시작

확인 항목:
[ ] Welcome 화면에 "petwalk" 가 최근 프로젝트로 표시
[ ] 클릭 시 프로젝트 바로 열림
[ ] X 버튼으로 목록에서 제거 가능
```

---

## Phase B. 대시보드 & 네비게이션

### B-1. Dashboard 뷰

```
경로: 프로젝트 열기 직후 (⌘1)

확인 항목:
[ ] 프로젝트 이름 "petwalk" 표시
[ ] Agent/Command/Skill 카운트 카드
[ ] Quick Actions 버튼들 표시
[ ] "Export Preset" / "Import Preset" 버튼 존재
```

### B-2. Sidebar 네비게이션

```
확인 항목:
[ ] 10개 메뉴 아이템 표시 (Dashboard ~ Knowledge)
[ ] 각 아이템 클릭 시 해당 뷰로 전환
[ ] 현재 뷰 하이라이트 (accent 색상)
[ ] ⌘B로 사이드바 접기/펴기
[ ] 접힌 상태에서 아이콘만 표시
[ ] 각 아이콘 hover 시 tooltip (라벨 + 단축키)
```

### B-3. 키보드 단축키 전체 테스트

```
[ ] ⌘1 → Dashboard
[ ] ⌘2 → Workflow
[ ] ⌘3 → Agents
[ ] ⌘4 → Planning
[ ] ⌘5 → CLAUDE.md
[ ] ⌘6 → Commands
[ ] ⌘7 → Skills
[ ] ⌘8 → Hooks
[ ] ⌘9 → MCP
[ ] ⌘0 → Knowledge
[ ] ⌘` → 터미널 토글
[ ] ⌘B → 사이드바 토글
[ ] ⌘K → Command Palette 토글
```

### B-4. Command Palette 테스트

```
경로: ⌘K

확인 항목:
[ ] 오버레이 + 검색 입력 필드 표시
[ ] "dash" 입력 → "Dashboard" 필터링
[ ] ↑↓ 키로 항목 이동 (선택 하이라이트)
[ ] Enter로 실행 (해당 뷰로 이동)
[ ] Esc로 닫기
[ ] 배경 클릭으로 닫기
[ ] "theme" 입력 → 테마 전환 항목 표시
[ ] Navigation / UI / Appearance / Project 카테고리 그룹핑
```

---

## Phase C. 설정 관리 (CRUD)

### C-1. CLAUDE.md 편집

```
경로: ⌘5 (CLAUDE.md 뷰)

확인 항목:
[ ] 프리셋으로 생성된 내용이 각 필드에 로드됨
[ ] 프로젝트명 수정: "PetWalk - 반려동물 산책 매칭 앱"
[ ] 기술 스택 필드에 Next.js 관련 내용 표시
[ ] 코딩 규칙에 항목 추가: "컴포넌트는 Server Component 우선"
[ ] 금지 패턴에 항목 추가: "any 타입 사용 금지"
[ ] Save 클릭 → CLAUDE.md 파일 갱신 확인
[ ] 파일을 외부 에디터로 직접 수정 → GUI에 반영 (File Watcher)
```

### C-2. 에이전트 관리

```
경로: ⌘3 (Agents 뷰)

목록 확인:
[ ] 프리셋으로 생성된 에이전트들 목록 표시
[ ] 각 에이전트 클릭 시 마크다운 내용 표시

새 에이전트 생성:
[ ] "+ New Agent" 클릭
[ ] 이름: "ux-designer"
[ ] 내용: "당신은 UX 디자이너입니다. 사용자 경험을 최우선으로..."
[ ] Save → .claude/agents/ux-designer.md 생성 확인

에이전트 편집:
[ ] 기존 에이전트 선택 → 내용 수정 → Save
[ ] 파일에 변경 반영 확인

에이전트 삭제:
[ ] 삭제 버튼 → 목록에서 제거 + 파일 삭제 확인

그래프 뷰:
[ ] "Graph" 토글 버튼 클릭
[ ] React Flow 노드 그래프 표시
[ ] 그룹별 (Planning/Dev/Review/Doc) 컬럼 배치
[ ] 그룹 간 애니메이션 엣지 표시
[ ] "List" 토글로 다시 목록 뷰 복귀
```

### C-3. 커맨드 관리

```
경로: ⌘6 (Commands 뷰)

[ ] 프리셋 커맨드 목록 표시
[ ] 새 커맨드 생성: "plan-petwalk"
[ ] 내용 작성 → Save → .claude/commands/plan-petwalk.md 생성
[ ] 편집/삭제 동작 확인
```

### C-4. 스킬 관리

```
경로: ⌘7 (Skills 뷰)

[ ] 프리셋 스킬 목록 표시 (있으면)
[ ] 새 스킬 생성: "nextjs-patterns"
[ ] 내용 작성 → Save → .claude/skills/nextjs-patterns/SKILL.md 생성
[ ] 편집/삭제 동작 확인
```

### C-5. Hook 설정

```
경로: ⌘8 (Hooks 뷰)

[ ] PreToolUse / PostToolUse / SessionStart 탭 표시
[ ] SessionStart hook 추가:
    - Command: "echo 'PetWalk project loaded'"
[ ] PostToolUse hook 추가:
    - Matcher: "Write"
    - Command: "echo 'File written'"
[ ] Save → settings.json 갱신 확인
[ ] Hook 삭제 동작 확인
```

### C-6. MCP 서버 관리

```
경로: ⌘9 (MCP 뷰)

기존 서버 확인:
[ ] 현재 설치된 MCP 서버 목록 표시

Quick-add 테스트:
[ ] Popular Servers에서 "context7" 클릭
[ ] 서버 목록에 추가됨 확인

수동 추가 테스트:
[ ] 폼에 입력:
    - Name: "test-mcp"
    - Command: "echo"
    - Args: "hello"
[ ] Add 클릭 → 목록에 추가

삭제 테스트:
[ ] "test-mcp" 삭제 → 목록에서 제거
```

---

## Phase D. AI 기획 (Agent Team)

### D-1. AI Team 기획 실행

```
경로: ⌘4 (Planning 뷰) → Users 아이콘 클릭 (AI Team 패널)

확인 항목:
[ ] AI Agent Team 패널 표시
[ ] 3명 멤버 카드: Product Manager / Tech Architect / Task Decomposer
[ ] 초기 상태: 모두 "Waiting" (회색 원)

실행:
[ ] Feature Name 입력: "user-authentication"
[ ] "Start Team" 클릭

실행 중 확인:
[ ] Product Manager 카드 → "Running" (파란 spinner)
[ ] 실시간 output 텍스트 스트리밍 (터미널 스타일 박스)
[ ] PM 완료 → "Completed" (녹색 체크)
[ ] Tech Architect → "Running" 전환
[ ] 순차적으로 3명 모두 완료

완료 후 확인:
[ ] "Team planning complete" 성공 메시지
[ ] 좌측 문서 목록에 새 파일 등장:
    - docs/prd/user-authentication.md
    - docs/specs/user-authentication-spec.md
    - docs/specs/user-authentication-tasks.md
```

### D-2. 생성된 문서 확인

```
경로: Planning 뷰 좌측 문서 목록

[ ] PRD 카테고리에 user-authentication.md 표시
[ ] 클릭 시 우측에 마크다운 내용 표시
[ ] Specs 카테고리에 스펙/태스크 파일 표시
[ ] 각 파일 내용 확인 가능
```

### D-3. Team 중지 테스트

```
[ ] 새 Feature Name으로 Team Start
[ ] 실행 중 "Stop" 버튼 클릭
[ ] 실행 중단 + "Failed" 상태 표시
```

---

## Phase E. 워크플로우 실행

### E-1. 워크플로우 편집

```
경로: ⌘2 (Workflow 뷰)

Edit Mode 진입:
[ ] "Edit" 버튼 클릭 → 편집 모드 전환

스텝 구성 (예시):
1. [auto] "Read the PRD from docs/prd/user-authentication.md and summarize the key requirements"
2. [gate] "Review the summary before proceeding"
3. [auto] "Based on the PRD, create the authentication API routes in src/app/api/auth/"

[ ] Feature Name 입력: "user-authentication"
[ ] + Add Step으로 스텝 추가
[ ] 각 스텝 타입 전환 (auto ↔ gate)
[ ] 프롬프트 편집
[ ] 스텝 삭제 동작
[ ] {feature} 플레이스홀더 표시 확인
```

### E-2. 워크플로우 실행

```
[ ] "Run" 버튼 클릭
[ ] Step 1 (auto): "Running" 상태 + 실시간 output
[ ] Step 1 완료 → Step 2 (gate): "Waiting for approval" 상태

게이트 테스트:
[ ] "Approve" 클릭 → Step 3으로 진행
  또는
[ ] "Skip" 클릭 → Step 3으로 건너뛰기

[ ] Step 3 (auto) 실행 → 완료
[ ] 전체 워크플로우 "Done" 상태
```

### E-3. 워크플로우 중지

```
[ ] 새 워크플로우 실행 중 "Stop" 클릭
[ ] 즉시 중단 + "Failed" 상태
```

---

## Phase F. 지식 관리

### F-1. Knowledge 항목 추가

```
경로: ⌘0 (Knowledge 뷰)

[ ] "Add" 버튼 클릭 → 입력 폼 표시
[ ] 항목 입력:
    - Title: "Next.js App Router에서 use client 빠뜨림"
    - Category: Lesson
    - Content: "Server Component에서 useState 사용 시 에러. use client 선언 필수."
    - Tags: "nextjs, server-component, react"
[ ] Save → 목록에 추가됨
[ ] 동일 Title로 한번 더 추가 → repeatCount 2 확인
[ ] 한번 더 추가 → repeatCount 3 + ⚠️ 아이콘
```

### F-2. 검색 & 필터

```
[ ] 검색창에 "nextjs" 입력 → 필터링
[ ] 카테고리 필터: "Lesson" 클릭 → 해당 카테고리만
[ ] "All" 클릭 → 전체 표시
[ ] 통계 카드 갱신 확인 (Total / Repeats / Learning Rate / Tags)
```

### F-3. Import Lessons

```
사전 준비: ~/Desktop/petwalk/docs/lessons-learned.md 생성
내용 예시:
---
## Lessons
- **캐시 무효화 실패**: API 응답 캐시 TTL을 적절히 설정
- **환경변수 누락**: .env.local 파일 체크리스트 필요
---

[ ] "Import Lessons" 버튼 클릭
[ ] 파싱 성공 → 항목 추가됨 알림
[ ] 목록에 새 항목 표시
```

### F-4. Escalation 테스트

```
사전: 동일 Title 항목을 3회 이상 추가하여 repeatCount ≥ 3 만들기

[ ] "Check Escalation" 버튼 클릭
[ ] Escalation Report 패널 표시
[ ] 3회+ 반복 패턴 목록 + "will add" / "already in rules" 표시
[ ] "Apply to CLAUDE.md" 클릭
[ ] CLAUDE.md 파일에 해당 패턴 추가됨 확인 (⌘5에서 확인)
```

---

## Phase G. 터미널 통합

### G-1. 터미널 기본 동작

```
[ ] ⌘` 로 터미널 표시
[ ] 셸 프롬프트 정상 표시
[ ] 명령어 입력/실행 (ls, pwd 등)
[ ] 터미널 리사이즈 바 드래그 → 높이 조절
[ ] ⌘` 로 터미널 숨기기
```

### G-2. Claude CLI 실행

```
[ ] 터미널에서 직접 claude 명령어 실행
[ ] 출력 정상 표시 (ANSI 컬러 포함)
```

---

## Phase H. 프리셋 Export/Import

### H-1. 현재 프로젝트를 프리셋으로 내보내기

```
경로: Dashboard → "Export Preset"

[ ] Export 다이얼로그/동작 실행
[ ] JSON 파일 생성 확인
[ ] JSON에 agents/commands/skills/hooks/CLAUDE.md 내용 포함
```

### H-2. 프리셋 가져오기

```
경로: Dashboard → "Import Preset"

[ ] JSON 파일 선택
[ ] 프리셋 목록에 추가됨
[ ] 새 프로젝트 생성 시 해당 프리셋 선택 가능
```

---

## Phase I. 외부 변경 감지

### I-1. File Watcher 동작

```
외부 에디터(VS Code 등)에서:
[ ] .claude/agents/에 새 파일 추가 → Agents 뷰 자동 갱신
[ ] CLAUDE.md 내용 수정 → CLAUDE.md 뷰에서 변경 반영
[ ] .claude/commands/ 파일 삭제 → Commands 뷰 목록 갱신
```

---

## Phase J. StatusBar 확인

```
[ ] Claude CLI 상태 아이콘 (●) + 버전 표시
[ ] 프로젝트명 표시
[ ] Git branch 표시 (git init 된 경우)
[ ] Agent/Command/Skill 카운트 표시
[ ] ⌘K 버튼 → Command Palette 열림
[ ] 테마 토글 버튼 동작
```

---

## 결과 기록 템플릿

```
테스트 일자:
테스터:
OS / 버전:

Phase A: __ / 18 통과
Phase B: __ / 22 통과
Phase C: __ / 26 통과
Phase D: __ / 14 통과
Phase E: __ / 13 통과
Phase F: __ / 14 통과
Phase G: __  / 4 통과
Phase H: __  / 5 통과
Phase I: __  / 3 통과
Phase J: __  / 6 통과

합계: __ / 125 통과

주요 이슈:
1.
2.
3.

스크린샷:
-
```
