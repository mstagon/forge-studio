# Visual E2E Test TODO

## Completed
- [x] Playwright + Electron 자동화 인프라 구축
- [x] `window.__appStore` 노출 (테스트용 store 접근)
- [x] 라이트 테마 CSS 수정 (`@theme` var() 간접 참조, `bg-bg` 루트 적용)
- [x] 기본 스모크 테스트 (Welcome, 프로젝트 열기, 전체 뷰 네비게이션)
- [x] 테마 전환 테스트 (다크/라이트 Welcome + Dashboard)

## TODO
- [ ] 각 뷰 콘텐츠 assertion 강화 (존재해야 할 요소 검증)
  - Dashboard: stats, git info, config, quick actions
  - Commands: 커맨드 목록 항목
  - Hooks: 탭, Save, Add Hook
  - CLAUDE.md: Visual/Raw 토글, 섹션 목록, 에디터 내용
  - Planning: 문서 목록, AI Team 버튼
  - Workflow: 파이프라인 5단계, Run 버튼
- [ ] i18n 한국어 전환 검증 (DOM 클릭 locator 수정 필요)
- [ ] StatusBar 요소 검증 (프로젝트명, 브랜치, 통계)
- [ ] 터미널 패널 존재 확인
- [ ] 라이트 테마 전체 뷰 스크린샷 캡처
- [ ] 에이전트/커맨드 CRUD 테스트 (생성, 수정, 삭제)
- [ ] Dirty guard (미저장 경고) 테스트
- [ ] Command Palette 검색/실행 테스트

## Files
- `e2e/smoke.test.ts` — 메인 스모크 테스트
- `e2e/theme.test.ts` — 테마 전환 테스트
- `e2e/theme-diag.test.ts` — 테마 진단 (삭제 가능)
- `e2e/screenshots/` — 스크린샷 출력
- `playwright.config.ts` — Playwright 설정
