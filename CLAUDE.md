# Forge Studio

AI Development Cockpit — Claude Code CLI를 래핑하는 Electron 데스크톱앱.
개발자가 자신만의 AI 하네스를 시각적으로 설계하고 관리하는 도구.

## 기술 스택

- Electron 34+ / Node.js 22+
- React 19 + TypeScript 5.x
- Vite (electron-vite)
- Tailwind CSS 4 + Radix UI (접근성 내장 컴포넌트)
- Zustand (상태관리)
- React Flow (노드 그래프 에디터)
- xterm.js + node-pty (내장 터미널)
- Monaco Editor (코드/마크다운 편집)
- SQLite (better-sqlite3, 지식 DB)
- Handlebars (템플릿 엔진)
- chokidar (파일 감시)

## 아키텍처

Electron Main-Renderer 분리 구조.

```
src/main/       → Electron Main Process (Node.js)
src/renderer/   → React 프론트엔드
src/shared/     → 공유 타입/상수
src/preload/    → contextBridge
templates/      → 기술 스택 프리셋
```

Main: 파일 시스템, Claude CLI 브릿지, MCP 관리, 워크플로우 실행
Renderer: UI 렌더링, 상태 관리, 사용자 인터랙션
통신: 타입 안전한 IPC (contextBridge)

## 빌드 & 검증

```
npm install
npm run dev          # 개발 모드 (HMR)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
npm run typecheck    # TypeScript 검사
npm run test         # Vitest 단위 테스트
npm run test:e2e     # Playwright E2E
```

## 코딩 규칙

- 함수형 React 컴포넌트 + TypeScript strict mode
- Zustand store는 slice 패턴으로 분리
- IPC 채널은 src/shared/types/ipc.types.ts에 중앙 정의
- Main process에서만 파일 시스템/shell 접근 (Renderer 직접 접근 금지)
- 모든 IPC 입력에 Zod 유효성 검사
- 컴포넌트 파일명: PascalCase, 유틸/서비스: camelCase
- CSS는 Tailwind 유틸리티만 사용 (인라인 style 금지)

## 금지 패턴

- Renderer에서 Node.js API 직접 사용 금지 (fs, path, child_process 등)
- nodeIntegration: true 금지 (보안 위반)
- eval(), innerHTML 사용 금지 (XSS 위험)
- any 타입 사용 금지
- console.log 사용 금지 (프로덕션, 로거 사용)
- 하드코딩된 파일 경로 금지 (path.join 사용)
- 동기 IPC (ipcRenderer.sendSync) 사용 금지

## 워크플로우

1. 기획문서: docs/prd/, docs/design/
2. 코딩 규칙: 이 CLAUDE.md 참조
3. 구현 → 검수 → 문서화 → 커밋

## 근거 기반 원칙

- Electron/React/xterm.js API 사용 시 반드시 context7 MCP로 공식 문서 확인
- 확실하지 않으면 구현하지 말고 질문
- 추측 코드 금지. 검증 후 작성

## 자기개선

- 실수 발생 시 docs/lessons-learned.md에 패턴 기록
- 반복 실수 3회 이상 시 이 CLAUDE.md 금지 패턴에 추가 제안
