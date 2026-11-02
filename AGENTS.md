# AGENTS.md: 매경 PR사업팀 콘텐츠 작성 에이전트 규칙

이 파일은 Antigravity 및 코딩 에이전트가 이 프로젝트에서 반드시 준수해야 할 핵심 규칙을 정의합니다(PRD 10.5 및 CLAUDE.md 기준).

## 핵심 규칙
- 규정 문구·임계값을 코드에 하드코딩하지 말고 `/rules/*.yaml`에서 읽을 것
- Perplexity API 키는 `.env`의 `PERPLEXITY_API_KEY`로만 사용하고, 클라이언트 번들·로그·에러 메시지에 포함 금지
- 모든 LLM 응답은 Zod 스키마로 검증하고, 실패 시 1회 재시도 후 `needs_human_check: true`로 처리할 것
- 검색 결과(`citations`)는 반드시 DB `sources`에 저장하고 UI에 노출할 것
- CMS용 복사 텍스트는 `approvals` 레코드가 있을 때만 반환/활성화할 것
- 단계 함수(`/lib/pipeline/s0~s10`)는 순수 함수에 가깝게 작성하고 단위 테스트(Vitest)를 함께 만들 것
- UI는 `DESIGN.md`의 토큰과 규칙만 사용하며, 그라데이션·드롭섀도우(`shadow-*`, `box-shadow`)·네온 효과를 사용하지 말 것
- 구현 후 **브라우저 에이전트로 실제 화면 동작을 검증**하고 스크린샷을 남길 것
