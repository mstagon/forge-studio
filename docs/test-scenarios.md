# Forge Studio - Test Scenarios

## 1. Welcome View

### TC-1.1: 프로젝트 열기
- [ ] "Open Project" 클릭 → 폴더 선택 다이얼로그 표시
- [ ] 유효한 프로젝트 폴더 선택 → Dashboard로 이동
- [ ] 취소 → 아무 변화 없음
- [ ] 잘못된 경로 → toast.error 표시

### TC-1.2: 새 프로젝트 생성
- [ ] "New Project" 클릭 → Wizard 모달 표시
- [ ] 프리셋 선택 후 생성 완료 → Dashboard로 이동
- [ ] Wizard 닫기 → Welcome으로 복귀
- [ ] 생성 실패 시 → toast.error 표시

### TC-1.3: 최근 프로젝트
- [ ] 최근 프로젝트 목록 표시 (최대 5개)
- [ ] 클릭 → 해당 프로젝트 열기
- [ ] 삭제된 경로 클릭 → toast.warning + 목록에서 제거
- [ ] X 버튼으로 목록에서 수동 제거
- [ ] 프로젝트 없을 때 안내 문구 표시

### TC-1.4: 키보드 단축키
- [ ] Cmd+K → Command Palette 열기/닫기 (프로젝트 없어도 동작)

---

## 2. Dashboard View

### TC-2.1: 통계 표시
- [ ] Agents, Commands, MCP Servers 카운트 정확히 표시
- [ ] 진입 시 통계 자동 갱신 (refreshStats)
- [ ] Git 브랜치/커밋 정보 표시
- [ ] CLAUDE.md / .claude/ 존재 여부 표시
- [ ] Skills 카운트 표시

### TC-2.2: Quick Actions
- [ ] "Plan Feature" → PlanningView 이동
- [ ] "Manage Agents" → AgentsView 이동
- [ ] "Edit Commands" → CommandsView 이동
- [ ] "MCP Servers" → McpView 이동
- [ ] "Workflow" → WorkflowView 이동
- [ ] "Edit CLAUDE.md" → ClaudeMdView 이동

### TC-2.3: Preset Export/Import
- [ ] Export 클릭 → JSON 파일 다운로드 + toast.success
- [ ] Export 실패 → toast.error
- [ ] Import 클릭 → 파일 선택 다이얼로그
- [ ] 유효한 JSON 선택 → toast.success
- [ ] 잘못된 파일 → toast.error

---

## 3. Agents View

### TC-3.1: 목록 조회
- [ ] 에이전트 목록이 그룹별로 표시 (Planning/Development/Review/Documentation/Custom)
- [ ] 각 에이전트에 Bot 아이콘 + 이름 표시
- [ ] 빈 목록 → "Select an agent or create a new one" 표시

### TC-3.2: 에이전트 생성
- [ ] + 버튼 → 새 에이전트 편집기 표시
- [ ] agent-name 입력 (kebab-case)
- [ ] 마크다운 내용 입력
- [ ] Save → toast.success("Agent saved") + 목록 갱신
- [ ] 이름 미입력 시 Save 비활성화
- [ ] 저장 실패 → toast.error

### TC-3.3: 에이전트 수정
- [ ] 목록에서 에이전트 선택 → 내용 로드
- [ ] 내용 수정 → dirty 상태 (Save 활성화)
- [ ] Save → toast.success + 변경 내용 반영
- [ ] 저장 중 "Saving..." 표시

### TC-3.4: 에이전트 삭제
- [ ] 휴지통 아이콘 클릭 → ConfirmDialog 표시
- [ ] "Delete" 확인 → toast.success("Agent deleted") + 목록 갱신
- [ ] "Cancel" → 삭제 취소
- [ ] 삭제 실패 → toast.error

### TC-3.5: 네비게이션 가드
- [ ] 수정 중 다른 뷰로 이동 시도 → "Unsaved Changes" 다이얼로그 표시
- [ ] "Leave" → 변경사항 버리고 이동
- [ ] "Stay" → 현재 뷰 유지

### TC-3.6: Graph View
- [ ] 목록/그래프 토글 버튼 동작
- [ ] 그래프에서 에이전트 클릭 → 리스트 뷰로 전환 + 해당 에이전트 선택

---

## 4. Commands View

### TC-4.1: 목록 조회
- [ ] 커맨드 목록 표시 (/ 접두사)
- [ ] 빈 목록 → "Select a command or create a new one"

### TC-4.2: 커맨드 CRUD
- [ ] 생성: + → 이름 입력 → 내용 작성 → Save → toast.success
- [ ] 수정: 선택 → 편집 → Save → toast.success
- [ ] 삭제: 휴지통 → ConfirmDialog → 확인 → toast.success
- [ ] 저장 중 "Saving..." 표시
- [ ] 실패 시 toast.error

### TC-4.3: 네비게이션 가드
- [ ] 수정 중 이동 시도 → ConfirmDialog (TC-3.5와 동일 패턴)

---

## 5. Skills View

### TC-5.1: 스킬 CRUD
- [ ] 생성/수정/삭제 모두 TC-4.2와 동일 패턴
- [ ] toast, ConfirmDialog, saving 상태, dirty guard 모두 동작 확인

---

## 6. CLAUDE.md View

### TC-6.1: 로드
- [ ] CLAUDE.md 존재 → 섹션 파싱 후 Visual 모드 표시
- [ ] CLAUDE.md 없음 → "No CLAUDE.md found" 표시

### TC-6.2: Visual 편집
- [ ] 섹션 목록에서 선택 → 오른쪽에 편집기 표시
- [ ] 섹션 헤딩 수정 가능
- [ ] 섹션 내용 수정 → dirty 상태
- [ ] + 버튼 → 새 섹션 추가
- [ ] 휴지통 → 섹션 삭제 (즉시, ConfirmDialog 없음)

### TC-6.3: Raw 편집
- [ ] "Raw" 탭 → 전체 마크다운 텍스트 편집
- [ ] Save → 파일 기록 + 재파싱

### TC-6.4: 저장
- [ ] Save → toast.success("CLAUDE.md saved")
- [ ] 저장 실패 → toast.error
- [ ] 저장 중 "Saving..." 표시
- [ ] 네비게이션 가드 동작 (dirty 상태)

---

## 7. Hooks View

### TC-7.1: 로드
- [ ] settings.json에서 hooks 설정 로드
- [ ] 탭 3개 표시: SessionStart / PreToolUse / PostToolUse
- [ ] 각 탭에 hook 수 badge 표시

### TC-7.2: Hook 추가/수정/삭제
- [ ] "Add Hook" → 새 hook entry 추가
- [ ] matcher 입력 (e.g., "Edit|Write")
- [ ] command 입력
- [ ] + Add command → 같은 matcher에 command 추가
- [ ] 개별 command 삭제 (1개 이상일 때만)
- [ ] hook entry 전체 삭제

### TC-7.3: 저장
- [ ] Save → toast.success("Settings saved")
- [ ] 실패 → toast.error
- [ ] 저장 중 "Saving..." 표시
- [ ] 네비게이션 가드 동작

### TC-7.4: Permissions 표시
- [ ] allowedTools 목록 초록색 badge로 표시
- [ ] deny 목록 빨간색 badge로 표시

---

## 8. MCP View

### TC-8.1: 서버 목록
- [ ] ~/.claude.json에서 MCP 서버 로드
- [ ] 각 서버에 이름, command, args, env 표시
- [ ] 빈 상태 → "MCP 서버가 없습니다" + 안내

### TC-8.2: 서버 추가
- [ ] "Add Server" → 폼 표시
- [ ] name, command, args 입력
- [ ] env 변수 추가/삭제
- [ ] "Add" → toast.success + 목록 갱신
- [ ] 필수 필드 미입력 → 버튼 비활성화
- [ ] 추가 중 "Adding..." 표시
- [ ] 실패 → toast.error

### TC-8.3: 빠른 추가
- [ ] 인기 서버 목록 표시 (context7, github, etc.)
- [ ] 클릭 → toast.success + 목록 갱신
- [ ] 이미 설치된 서버 → "installed" 표시 + 비활성화

### TC-8.4: 서버 제거
- [ ] 호버 시 삭제 버튼 표시
- [ ] 클릭 → ConfirmDialog 표시
- [ ] 확인 → toast.success + 목록 갱신
- [ ] 실패 → toast.error

---

## 9. Knowledge View

### TC-9.1: 통계/목록
- [ ] Total Entries, Repeats, Learning Rate, Unique Tags 표시
- [ ] 카테고리별 필터 (All/Lesson/Pattern/Decision/Tip)
- [ ] 검색 기능 동작
- [ ] 빈 상태 → "Knowledge Base가 비어있습니다" 표시

### TC-9.2: 추가
- [ ] "Add" → 폼 표시
- [ ] title, category, content, tags 입력
- [ ] Save → toast.success("Knowledge entry added")
- [ ] title 미입력 → 비활성화
- [ ] 실패 → toast.error

### TC-9.3: 삭제
- [ ] 호버 시 삭제 버튼 표시
- [ ] 클릭 → ConfirmDialog 표시
- [ ] 확인 → toast.success + 목록 갱신

### TC-9.4: Import/Escalation
- [ ] "Import Lessons" → docs/lessons-learned.md에서 가져오기
- [ ] 파일 없으면 → toast.error
- [ ] "Check Escalation" → 반복 패턴 감지 리포트
- [ ] "Apply to CLAUDE.md" → 규칙 추가 + toast.success

---

## 10. Planning View

### TC-10.1: 문서 목록
- [ ] docs/ 하위 디렉토리 스캔 (prd, specs, planningdocs, architecture, templates)
- [ ] 카테고리별 그룹핑
- [ ] 문서 클릭 → 내용 표시
- [ ] 빈 상태 → "No documents yet" + AI Team 안내

### TC-10.2: AI Team Planning
- [ ] Users 아이콘 → Team 패널 전환
- [ ] Feature name 입력
- [ ] Claude CLI 미설치 → toast.error("Claude CLI가 설치되어 있지 않습니다.")
- [ ] Start Team → PM → Architect → Task Decomposer 순차 실행
- [ ] 실행 중 Loader2 스피너 + "Working..." 표시
- [ ] 각 멤버 완료 시 CheckCircle2 + "Completed"
- [ ] 전체 완료 → "Team planning complete" 메시지 + docs 목록 갱신
- [ ] Stop 버튼 → 중단

### TC-10.3: 이어하기 (Resume)
- [ ] 중간에 앱 종료 후 재시작
- [ ] 같은 feature name으로 Start Team
- [ ] 이미 완료된 단계 → "Skipped (output exists)" 표시
- [ ] 남은 단계부터 실행

### TC-10.4: 시작 중 상태
- [ ] Start Team 클릭 시 버튼에 Loader2 스피너 표시
- [ ] 시작 완료까지 버튼 비활성화

---

## 11. Workflow View

### TC-11.1: Pipeline 편집
- [ ] "Edit Pipeline" → 편집 모드 전환
- [ ] 스텝 이름 변경 (클릭 → input)
- [ ] 스텝 타입 변경 (auto/gate)
- [ ] 스텝 순서 변경 (화살표 버튼)
- [ ] 스텝 추가 (Add Step / Add Gate)
- [ ] 스텝 삭제 (Trash2)
- [ ] auto 타입 → command textarea 표시
- [ ] "Done" → 편집 모드 종료

### TC-11.2: Workflow 실행
- [ ] Feature name 미입력 → toast.warning("Feature name을 입력해주세요.")
- [ ] Claude CLI 미설치 → toast.error
- [ ] Run → 순차적 스텝 실행
- [ ] 각 스텝 상태 아이콘 변경 (pending → running → done/failed)
- [ ] 실행 중 스텝 클릭 → 오른쪽에 output 표시
- [ ] 완료 → toast.success("Workflow completed successfully") (재마운트 시 반복 안 됨)
- [ ] 실패 → toast.error("Workflow failed") (재마운트 시 반복 안 됨)

### TC-11.3: Gate (수동 승인)
- [ ] Gate 스텝 도달 → "Waiting for approval" 배너 표시
- [ ] Approve → 다음 스텝 진행
- [ ] Skip → 해당 스텝 건너뛰기

### TC-11.4: Stop
- [ ] Stop 버튼 → 워크플로우 중단

---

## 12. 공통 UX

### TC-12.1: Toast 알림
- [ ] success → 초록색 아이콘 + 메시지
- [ ] error → 빨간색 아이콘 + 메시지
- [ ] warning → 노란색 아이콘 + 메시지
- [ ] info → 파란색 아이콘 + 메시지
- [ ] 4초 후 자동 소멸
- [ ] X 클릭 → 즉시 제거
- [ ] 여러 개 동시 표시 (스택)

### TC-12.2: ConfirmDialog
- [ ] 제목 + 메시지 표시
- [ ] 확인/취소 버튼
- [ ] danger 변형 → 빨간색 확인 버튼
- [ ] warning 변형 → 노란색 확인 버튼
- [ ] 배경 오버레이 표시

### TC-12.3: DirtyNavGuard
- [ ] 편집 중 사이드바 클릭 → "Unsaved Changes" 다이얼로그
- [ ] "Leave" → 변경사항 버리고 이동
- [ ] "Stay" → 현재 뷰 유지
- [ ] 적용 뷰: Agents, Commands, Skills, Hooks, ClaudeMd

### TC-12.4: 사이드바
- [ ] 10개 뷰 네비게이션 표시
- [ ] Cmd+1~0 단축키 동작
- [ ] Cmd+B → 사이드바 접기/펼치기
- [ ] 접힌 상태 → 아이콘만 표시

### TC-12.5: 터미널
- [ ] Cmd+` → 터미널 표시/숨기기
- [ ] 드래그로 높이 조절 (120px ~ 600px)
- [ ] 프로젝트 미열림 → 터미널 숨김

### TC-12.6: Command Palette
- [ ] Cmd+K → 열기/닫기
- [ ] 프로젝트 없어도 동작

### TC-12.7: 테마
- [ ] 다크/라이트 테마 전환
- [ ] 설정 localStorage 저장
- [ ] 앱 재시작 시 유지

---

## 13. Edge Cases

### TC-13.1: Claude CLI 미설치
- [ ] Planning Team 시작 시도 → toast.error
- [ ] Workflow 실행 시도 → toast.error

### TC-13.2: 파일 시스템 에러
- [ ] 존재하지 않는 디렉토리 읽기 → 빈 배열 반환 (crash 없음)
- [ ] 파일 쓰기 권한 없음 → toast.error

### TC-13.3: PTY 관련
- [ ] Claude 명령 완료 후 셸 자동 종료
- [ ] 5분 이상 출력 없으면 자동 타임아웃
- [ ] CLAUDECODE 환경변수 제거 → 중첩 세션 오류 없음

### TC-13.4: 프리셋 적용
- [ ] 에이전트 파일 .md 확장자로 생성
- [ ] 커맨드 파일 .md 확장자로 생성
- [ ] permissions의 allowedTools 키 올바르게 설정
- [ ] recommendedMcp 자동 설치 (~/.claude.json에 추가)
- [ ] 기존 .md 없는 파일 → 자동 마이그레이션 (rename)
