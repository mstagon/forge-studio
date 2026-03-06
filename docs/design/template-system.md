# Forge Studio - 템플릿 시스템 설계

## 메타데이터
- 작성일: 2026-03-06
- 버전: 1.0

---

## 1. 핵심 개념

Forge Studio의 가장 중요한 차별점은 **기술 스택에 독립적**이라는 것.
이를 위해 3-layer 템플릿 시스템을 사용한다.

```
Layer 3: Stack-Specific    (Flutter, Next.js, Python 등 전용)
Layer 2: Domain-Specific   (모바일, 웹, API 등 도메인)
Layer 1: Universal Base    (모든 프로젝트 공통)
```

### Layer 1: Universal Base (기술 스택 무관)

모든 프로젝트에 공통으로 적용되는 에이전트, 커맨드, 원칙.

| 구성요소 | 설명 |
|---------|------|
| product-planner | PRD 작성 (기술 스택 언급 없이 순수 기획) |
| tech-architect | 기술 스펙 작성 (스택 변수를 주입받아 사용) |
| task-decomposer | 태스크 분해 (스택 무관한 분해 로직) |
| code-reviewer | 코드 리뷰 (공통 품질 기준 + 스택별 규칙 플러그인) |
| security-auditor | 보안 감사 (OWASP 기반 공통 + 스택별 확장) |
| doc-writer | 문서 관리 (공통 문서 체계) |
| /plan-feature | 기획 워크플로우 |
| /review | 검수 워크플로우 |
| /full-cycle | 전체 사이클 |
| /retrospective | 세션 회고 |

### Layer 2: Domain-Specific (도메인별 확장)

| 도메인 | 추가 에이전트 | 추가 규칙 |
|--------|-------------|---------|
| Mobile | ui-designer, platform-specialist | 앱 스토어 가이드라인, 접근성 |
| Web Frontend | ui-designer, a11y-checker | SEO, 웹 접근성, 반응형 |
| Backend API | api-designer, db-architect | REST/GraphQL 규칙, DB 최적화 |
| Fullstack | 위 전체 조합 | 프론트-백엔드 계약 |

### Layer 3: Stack-Specific (기술 스택 전용)

각 기술 스택마다 구체적인 에이전트 프롬프트, 코딩 규칙, 금지 패턴.

---

## 2. 프리셋 정의 형식

```yaml
# templates/flutter-supabase/preset.yaml
id: flutter-supabase
name: "Flutter + Supabase"
description: "Flutter 모바일 앱 + Supabase BaaS"
version: "1.0.0"

# 기반 레이어
extends:
  - _base           # Layer 1: 유니버설
  - _mobile         # Layer 2: 모바일 도메인

# 기술 스택 정보 (CLAUDE.md 생성에 사용)
stack:
  language: "Dart 3.10+"
  framework: "Flutter 3.38+"
  stateManagement: "Riverpod 2.x (codegen)"
  backend: "Supabase (Auth, Storage, Edge Functions, Realtime)"
  router: "go_router"
  database: "drift (local), Supabase (remote)"
  packages:
    required:
      - "freezed + json_serializable"
      - "dio + retrofit"
    optional:
      - "drift (로컬 DB)"
      - "hive_flutter (키-값 저장)"

# 아키텍처
architecture:
  pattern: "feature-first + layered"
  structure: "lib/features/{name}/{data,domain,presentation}/"
  reference: "lib/features/auth/"

# 빌드 & 검증 명령어
build:
  setup: "flutter pub get"
  codegen: "dart run build_runner build --delete-conflicting-outputs"
  analyze: "flutter analyze"
  test: "flutter test"
  format: "dart format ."

# 추가 에이전트 (Layer 3)
agents:
  - name: "flutter-ui"
    template: "agents/flutter-ui.md.hbs"
  - name: "riverpod-logic"
    template: "agents/riverpod-logic.md.hbs"
  - name: "supabase-backend"
    template: "agents/supabase-backend.md.hbs"
  - name: "test-writer"
    template: "agents/test-writer.md.hbs"

# 추가 스킬 (Layer 3)
skills:
  - name: "freezed-models"
    template: "skills/freezed-models/SKILL.md.hbs"
  - name: "riverpod-patterns"
    template: "skills/riverpod-patterns/SKILL.md.hbs"

# 코딩 규칙 (CLAUDE.md에 삽입)
codingRules:
  - "const 생성자 최대한 활용"
  - "BuildContext를 async gap 넘기지 마라"
  - "setState 금지 (Riverpod 사용)"
  - "Navigator.push 금지 (go_router 사용)"
  - "모든 public API에 /// dartdoc 주석 필수"
  - "에러 핸들링: Result 패턴"

# 금지 패턴 (CLAUDE.md에 삽입)
forbiddenPatterns:
  - "any, dynamic 타입 사용 금지"
  - "print() 사용 금지 (logger 사용)"
  - "강제 ! (null assertion) 사용 금지"
  - ".env 파일을 코드에 하드코딩 금지"

# Hooks
hooks:
  PostToolUse:
    - matcher: "Edit|Write"
      condition: "*.dart"
      command: "dart format $FILE && flutter analyze $FILE"
    - matcher: "Write(pubspec.yaml)"
      command: "flutter pub get && cd ios && pod install"
  PreToolUse:
    - matcher: "Bash"
      block: ["rm -rf", "sudo", "flutter build release"]

# MCP 추천
recommendedMcp:
  - name: "context7"
    command: "npx -y @upstash/context7-mcp@latest"
    required: true
  - name: "supabase"
    command: "npx -y @supabase/mcp-server"
    required: false
    env: ["SUPABASE_URL", "SUPABASE_KEY"]
```

---

## 3. 현재 지원 예정 프리셋

### 3.1 Flutter + Supabase

flutter-forge를 기반으로 마이그레이션. 가장 완성도 높은 프리셋.

### 3.2 Next.js Fullstack

```yaml
id: nextjs-fullstack
extends: [_base, _web-fullstack]
stack:
  language: "TypeScript 5.x"
  framework: "Next.js 15 (App Router)"
  stateManagement: "Zustand + TanStack Query"
  backend: "Next.js API Routes + Prisma"
  orm: "Prisma"
  database: "PostgreSQL"
  auth: "NextAuth.js v5"
  styling: "Tailwind CSS 4 + Radix UI"

agents:
  - nextjs-pages (페이지/레이아웃 구현)
  - api-routes (API 엔드포인트)
  - prisma-data (데이터 모델, 마이그레이션)
  - react-components (UI 컴포넌트)

codingRules:
  - "Server Components 기본, Client는 'use client' 명시"
  - "서버 액션으로 form 처리"
  - "Zod로 입력 검증"
  - "Prisma 마이그레이션 필수"
```

### 3.3 Python + FastAPI

```yaml
id: python-fastapi
extends: [_base, _backend-api]
stack:
  language: "Python 3.12+"
  framework: "FastAPI"
  orm: "SQLAlchemy 2.x"
  database: "PostgreSQL"
  auth: "JWT (python-jose)"
  validation: "Pydantic v2"

agents:
  - fastapi-routes (엔드포인트 구현)
  - sqlalchemy-models (데이터 모델)
  - pytest-writer (테스트)

codingRules:
  - "타입 힌트 필수 (strict mypy)"
  - "Pydantic 모델로 요청/응답 정의"
  - "async def 기본"
  - "Alembic 마이그레이션 필수"
```

### 3.4 React Native + Expo

```yaml
id: react-native-expo
extends: [_base, _mobile]
stack:
  language: "TypeScript 5.x"
  framework: "React Native + Expo SDK 52"
  stateManagement: "Zustand + TanStack Query"
  navigation: "Expo Router"
  styling: "NativeWind (Tailwind)"
```

### 3.5 Custom (빈 프리셋)

```yaml
id: custom
extends: [_base]
# 사용자가 GUI에서 직접 모든 것을 설정
```

---

## 4. 템플릿 렌더링

Handlebars 기반으로 프리셋 YAML의 변수를 주입.

```handlebars
{{! templates/_base/agents/tech-architect.md.hbs }}

# tech-architect

당신은 시니어 소프트웨어 아키텍트입니다.

## 기술 환경
- 언어: {{stack.language}}
- 프레임워크: {{stack.framework}}
- 상태관리: {{stack.stateManagement}}
- 백엔드: {{stack.backend}}

## 아키텍처 패턴
{{architecture.pattern}}
디렉토리 구조: `{{architecture.structure}}`
{{#if architecture.reference}}
레퍼런스: {{architecture.reference}} (이 패턴을 따를 것)
{{/if}}

## 작성 규칙
1. 반드시 context7 MCP로 공식 문서 확인 후 API 사용
2. 기존 코드베이스의 패턴 분석 후 일관성 유지
3. 추측 금지. 확실하지 않으면 질문
4. docs/templates/spec-template.md 형식 준수

## 출력
- docs/specs/{feature-name}-spec.md
```

---

## 5. 프리셋 생성 플로우

```
1. 사용자가 프리셋 선택 (or Custom)

2. TemplateEngine이 처리:
   a. _base 레이어 로드 (에이전트 6, 커맨드 4)
   b. 도메인 레이어 로드 (에이전트 + 규칙 추가)
   c. 스택 레이어 로드 (에이전트 + 스킬 + 규칙 추가)
   d. 변수 주입 (Handlebars 렌더링)
   e. 충돌 해결 (같은 이름의 에이전트 → 스택 레이어 우선)

3. 결과물 생성:
   - CLAUDE.md (모든 레이어의 규칙 통합)
   - .claude/agents/ (레이어별 에이전트 병합)
   - .claude/commands/ (레이어별 커맨드 병합)
   - .claude/skills/ (레이어별 스킬 병합)
   - .claude/settings.json (hooks, permissions 병합)
```

---

## 6. 커뮤니티 템플릿 (향후)

```
forge-community/
├── presets/
│   ├── flutter-supabase/      (공식)
│   ├── nextjs-fullstack/      (공식)
│   ├── django-rest/           (커뮤니티)
│   ├── go-microservice/       (커뮤니티)
│   └── ...
├── agents/                    (개별 에이전트)
│   ├── accessibility-checker/ (커뮤니티)
│   ├── performance-auditor/   (커뮤니티)
│   └── ...
├── commands/                  (개별 커맨드)
├── skills/                    (개별 스킬)
└── mcp-servers/               (MCP 서버)
```

검색, 설치, 평가(별점) 시스템을 GUI에서 제공.
