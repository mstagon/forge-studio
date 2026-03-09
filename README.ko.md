# Forge Studio

<p align="center">
  <b>🌎 Language</b><br><br>
  🇺🇸 <a href="./README.md"><b>English</b></a> |
  🇰🇷 <b>한국어</b></a>
</p>

**AI 개발 콕핏(AI Development Cockpit)** — Claude Code 작업 환경을 시각적으로 설계하고 관리할 수 있는 데스크톱 애플리케이션

> 흩어져 있는 텍스트 파일을 직접 수정하지 마세요.  
> 시각적인 데스크톱 앱으로 AI 개발 워크플로우를 구축하세요.

<p align="center">
<img width="1512" height="1012" alt="dashboard" src="https://github.com/user-attachments/assets/dbbde606-c31b-4afc-bea3-18fc925c89b9" />
</p>

---

## Forge Studio가 필요한 이유

Claude Code는 매우 강력하지만 설정 과정이 번거롭습니다.

- **CLAUDE.md**, agents, commands, skills, hooks, MCP servers 등 여러 텍스트 파일을 직접 관리해야 합니다
- 워크플로우 전체를 한눈에 볼 수 있는 **시각적 인터페이스가 없습니다**
- 새로운 프로젝트를 시작할 때마다 **설정을 처음부터 다시 해야 합니다**
- 프로젝트에서 얻은 경험이나 규칙을 **다른 프로젝트로 쉽게 재사용할 수 없습니다**

**Forge Studio**는 Claude Code CLI를 감싸는 네이티브 데스크톱 애플리케이션으로 다음과 같은 기능을 제공합니다.

- **AI 개발 워크플로우를 시각적으로 설계**
- **Agents, Commands, Skills, Hooks, MCP 서버를 GUI로 관리**
- **기술 스택 프리셋을 몇 초 만에 적용**
- **타임라인과 지식 관리 기능으로 개발 진행 상황 추적**
- **설정 내보내기 / 가져오기(export/import)로 구성 공유**

---

## 주요 기능

### Core

| 기능 | 설명 |
|-----|-----|
| **Project Setup** | 3단계 프로젝트 생성 마법사. 기술 스택 프리셋을 선택하면 CLAUDE.md와 .claude/ 구조를 자동 생성 |
| **Workflow Engine** | 단계 실행, 승인 게이트, 출력 스트리밍을 지원하는 시각적 파이프라인 편집기 |
| **Agent Studio** | React Flow 노드 그래프로 Agents 생성 및 관리 |
| **CLAUDE.md Editor** | 섹션 기반 시각적 편집 + Raw Markdown 모드 |
| **Command & Skill Builder** | .claude/commands 및 .claude/skills를 GUI로 관리 |
| **Hook Configuration** | SessionStart, PreToolUse, PostToolUse Hook을 시각적으로 설정 |
| **MCP Server Manager** | MCP 서버 추가/삭제 및 인기 서버 빠른 설정 |
| **Planning Hub** | docs 탐색 + AI Team (PM → Architect → Task Decomposer) |
| **Knowledge Base** | SQLite 기반 학습 기록 저장 및 CLAUDE.md로 승격 |
| **Timeline** | Git 커밋 기록 + 프로젝트 진행 상태 추적 |
| **Integrated Terminal** | xterm.js + node-pty 기반 터미널 및 RunBar 실행 |
| **Command Palette** | `Cmd+K` 단축키로 명령 실행 |

---

### UX

- Dark / Light 테마 지원 (`Cmd+K`로 변경)
- 전체 키보드 네비게이션 지원
- 단축키
    - `Cmd+1~0` 화면 이동
    - `Cmd+B` 사이드바 토글
    - ``Cmd+` `` 터미널 토글
- 다국어 지원 (English / Korean)
- macOS 네이티브 타이틀바 지원
- 온보딩을 위한 Empty State 가이드

---

## 기술 스택

| 레이어 | 기술 |
|------|------|
| Framework | Electron 34+ |
| Frontend | React 19 + TypeScript |
| State | Zustand |
| Styling | Tailwind CSS 4 |
| Graph | React Flow |
| Terminal | xterm.js + node-pty |
| Database | SQLite (better-sqlite3) |
| Build | Vite (electron-vite) |
| i18n | i18next |
| Test | Playwright |

---

## 시작하기

### 필수 요구 사항

| 항목 | macOS | Windows |
|-----|------|------|
| Node.js | 22+ | 22+ |
| Claude Code CLI | `claude` 명령어 | `claude` 명령어 |
| Build Tools | Xcode CLI Tools | Visual Studio Build Tools |
| Python | 기본 포함 | 3.10+ |

Forge Studio는 `node-pty`, `better-sqlite3` 같은 **네이티브 Node.js 모듈**을 사용하기 때문에 빌드 도구가 필요합니다.

---

### macOS

```bash
# 1. 사전 설치
xcode-select --install
brew install node@22

# 2. 실행
git clone https://github.com/mstagon/forge-studio.git
cd forge-studio
npm install
npm run dev