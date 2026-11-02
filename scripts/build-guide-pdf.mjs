import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = path.resolve("public/guide");
const HTML_PATH = path.join(OUT_DIR, "guide.html");
const PDF_PATH_KO = path.join(
  OUT_DIR,
  "매경_PR사업팀_콘텐츠작성에이전트_사용가이드.pdf"
);
const PDF_PATH_EN = path.join(OUT_DIR, "guide.pdf");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>매경 PR사업팀 콘텐츠 작성 에이전트 실무 사용 가이드</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  <style>
    @page {
      size: 16in 9in;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #E5E7EB;
      color: #1A1D21;
    }
    .slide {
      width: 16in;
      height: 9in;
      background: #FFFFFF;
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 36px 48px 28px 48px;
      position: relative;
      overflow: hidden;
      border-bottom: 1px solid #D9DCE1;
    }
    @media screen {
      body {
        padding: 24px 0;
      }
      .slide {
        margin: 0 auto 28px auto;
        border: 1px solid #D9DCE1;
      }
      .top-download-bar {
        position: sticky;
        top: 0;
        z-index: 100;
        max-width: 16in;
        margin: 0 auto 20px auto;
        background: #1A1D21;
        color: #FFFFFF;
        padding: 12px 24px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .top-download-bar a {
        display: inline-block;
        background: #C94A1A;
        color: #FFFFFF;
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
        padding: 8px 16px;
        border-radius: 6px;
        margin-left: 8px;
      }
    }
    @media print {
      body {
        background: #FFFFFF;
      }
      .top-download-bar {
        display: none !important;
      }
      .slide {
        margin: 0;
        border: none;
      }
    }
    .slide-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #1A1D21;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .slide-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .chapter-badge {
      background: #C94A1A;
      color: #FFFFFF;
      font-size: 13px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 4px;
      letter-spacing: -0.01em;
    }
    .chapter-badge.blue {
      background: #2563EB;
    }
    .chapter-badge.purple {
      background: #7C3AED;
    }
    .chapter-badge.green {
      background: #0F7B4B;
    }
    .slide-title {
      font-size: 24px;
      font-weight: 700;
      color: #1A1D21;
      letter-spacing: -0.02em;
    }
    .slide-subtitle {
      font-size: 14px;
      color: #5A6069;
      font-weight: 500;
    }
    .slide-body {
      flex: 1;
      display: flex;
      gap: 24px;
      min-height: 0;
    }
    .slide-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #D9DCE1;
      padding-top: 8px;
      margin-top: 12px;
      font-size: 12px;
      color: #8B919A;
    }
    .col-img {
      flex: 1.25;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 0;
    }
    .col-desc {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 0;
    }
    .screenshot-frame {
      border: 1.5px solid #D9DCE1;
      border-radius: 8px;
      background: #F7F7F5;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .screenshot-caption {
      font-size: 12px;
      font-weight: 600;
      color: #2563EB;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .screenshot-frame img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: top center;
      border-radius: 4px;
      border: 1px solid #E5E7EB;
      background: #FFFFFF;
    }
    .info-card {
      border: 1px solid #D9DCE1;
      border-radius: 8px;
      background: #FFFFFF;
      padding: 12px 15px;
    }
    .info-card.highlight {
      border-color: #C94A1A;
      background: #FDF3EE;
    }
    .info-card.blue {
      border-color: #2563EB;
      background: #EFF5FF;
    }
    .info-card.green {
      border-color: #0F7B4B;
      background: #EAF6F0;
    }
    .info-card.purple {
      border-color: #7C3AED;
      background: #F3EEFF;
    }
    .info-card h3 {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #1A1D21;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .info-card p, .info-card li {
      font-size: 13px;
      line-height: 1.55;
      color: #2C3137;
    }
    .info-card ul {
      padding-left: 18px;
    }
    .info-card li + li {
      margin-top: 4px;
    }
    .num-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #C94A1A;
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .num-badge.blue {
      background: #2563EB;
    }
    .num-badge.purple {
      background: #7C3AED;
    }
    .num-badge.green {
      background: #0F7B4B;
    }
    table.guide-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }
    table.guide-table th,
    table.guide-table td {
      border: 1px solid #D9DCE1;
      padding: 7px 10px;
      text-align: left;
      vertical-align: top;
      line-height: 1.45;
    }
    table.guide-table th {
      background: #F7F7F5;
      font-weight: 700;
      color: #1A1D21;
      white-space: nowrap;
    }
    .ui-pill {
      display: inline-block;
      padding: 1px 7px;
      border-radius: 4px;
      font-size: 11.5px;
      font-weight: 600;
      border: 1px solid #D9DCE1;
      background: #F7F7F5;
      color: #1A1D21;
      white-space: nowrap;
    }
    .ui-pill.primary {
      background: #FDF3EE;
      border-color: #C94A1A;
      color: #C94A1A;
    }
    .ui-pill.pass {
      background: #EAF6F0;
      border-color: #0F7B4B;
      color: #0F7B4B;
    }
    .ui-pill.hold {
      background: #FEF6E7;
      border-color: #B86B00;
      color: #B86B00;
    }
    .ui-pill.reject {
      background: #FDECEC;
      border-color: #C72C2C;
      color: #C72C2C;
    }
    .ui-pill.info {
      background: #EFF5FF;
      border-color: #2563EB;
      color: #2563EB;
    }
    .ui-pill.purple {
      background: #F3EEFF;
      border-color: #7C3AED;
      color: #7C3AED;
    }
    .step-flow {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 14px;
      margin-top: 8px;
    }
    .step-box {
      border: 1.5px solid #D9DCE1;
      border-radius: 10px;
      padding: 16px;
      background: #F7F7F5;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .step-box .step-num {
      font-size: 13px;
      font-weight: 700;
      color: #C94A1A;
    }
    .step-box h4 {
      font-size: 16px;
      font-weight: 700;
      color: #1A1D21;
    }
    .step-box p {
      font-size: 12.5px;
      line-height: 1.5;
      color: #5A6069;
    }
  </style>
</head>
<body>
  <div class="top-download-bar">
    <div>
      <strong>📘 매경 PR사업팀 콘텐츠 작성 에이전트 실무 사용 가이드 (PPT 슬라이드형 매뉴얼)</strong>
      <span style="margin-left: 12px; font-size: 13px; color: #D9DCE1;">인쇄(Ctrl+P) 또는 우측 버튼으로 PDF 원본을 다운로드할 수 있습니다.</span>
    </div>
    <div>
      <a href="/guide/매경_PR사업팀_콘텐츠작성에이전트_사용가이드.pdf" download>📥 PDF 가이드 다운로드</a>
      <a href="/jobs" style="background: #374151;">← 서비스 화면으로 돌아가기</a>
    </div>
  </div>

  <!-- SLIDE 1: 표지 & 전체 5단계 프로세스 요약 -->
  <section class="slide">
    <div style="display: flex; flex-direction: column; gap: 22px; flex: 1; justify-content: center;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="chapter-badge">매경미디어그룹 PR사업팀 실무 매뉴얼</span>
        <span class="ui-pill info">버전 1.0 · 2026</span>
      </div>
      <h1 style="font-size: 42px; font-weight: 800; letter-spacing: -0.03em; color: #1A1D21; line-height: 1.25;">
        매경 PR사업팀 콘텐츠 작성 에이전트<br />
        <span style="color: #C94A1A;">화면별 기능 및 실무 완벽 사용 가이드</span>
      </h1>
      <p style="font-size: 17px; line-height: 1.65; color: #5A6069; max-width: 1180px;">
        본 문서는 기업·대행사로부터 접수한 보도자료 원문을 붙여넣어 <strong>① 포털 중복 게재 확인 → ② 기업 홈페이지·실체 검증 → ③ 제한 소재 스크리닝 → ④ 증빙 필요 팩트 분류 → ⑤ 과장·판촉 표현 교열 → ⑥ 매경 스타일 기사 초안 작성 및 규정 점검</strong>까지 자동으로 수행하고 CMS에 복사하기까지의 전 과정을 처음 사용하는 실무진도 질문 없이 즉시 따라 할 수 있도록 상세히 설명합니다.
      </p>

      <div style="margin-top: 12px;">
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 10px; color: #1A1D21;">
          🚀 처음 쓰는 실무자를 위한 전체 업무 흐름 5단계 요약
        </h3>
        <div class="step-flow">
          <div class="step-box">
            <span class="step-num">STEP 01 · 홈 화면</span>
            <h4>API 확인 및 새 작업 클릭</h4>
            <p>우측 상단 <strong>[새 보도자료 작업]</strong> 버튼을 클릭합니다. 실시간 웹 검색 및 비교·기획 기사가 필요하면 상단 <strong>[API 키 설정]</strong>에서 Perplexity API 키를 연결합니다.</p>
          </div>
          <div class="step-box">
            <span class="step-num">STEP 02 · 새 작업 등록</span>
            <h4>모드 선택 & 원문 붙여넣기</h4>
            <p><strong>기사식광고 기본 모드</strong> 또는 <strong>비교·기획 기사 모드</strong>를 고르고 보도자료 원문과 사진 캡션·기자 바이라인을 입력한 뒤 실행 버튼을 누릅니다.</p>
          </div>
          <div class="step-box">
            <span class="step-num">STEP 03 · 11단계 자동 검수</span>
            <h4>S0~S10 파이프라인 실행</h4>
            <p>약 2~15초 동안 중복 점검(S1), 홈페이지 검증(S2), 제한소재(S3), 증빙 분류(S4), 과장표현 완화(S5), 초안 작성(S6~S9)이 자동 완료됩니다.</p>
          </div>
          <div class="step-box">
            <span class="step-num">STEP 04 · 초안 편집 & 검수</span>
            <h4>교열 확인 · 문단 순서 조정</h4>
            <p>상단 <strong>[AI 편집·교열 내역]</strong>에서 본문 내 변경 위치를 확인하고, 추천 제목 선택 및 <strong>문단별 [위로/아래로]</strong> 버튼으로 문단 구성을 다듬습니다.</p>
          </div>
          <div class="step-box">
            <span class="step-num">STEP 05 · 승인 후 CMS 복사</span>
            <h4>체크리스트 승인 & 복사</h4>
            <p>하단 필수 확인 체크리스트를 모두 체크해 <strong>[검수 승인 완료]</strong>를 누르면 잠금이 해제되며, <strong>[CMS용 전체 복사]</strong>로 바로 붙여넣습니다.</p>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 8px;">
        <div class="info-card highlight">
          <h3>📌 목차 구성</h3>
          <p>
            <strong>Part 1. 홈 화면 (작업 목록 대시보드) & 새 작업 등록 페이지 (Slide 2 ~ 5)</strong><br />
            • 홈 화면 전체 구조, 상태 필터, 판정 배지 4종 해석, 삭제 기능<br />
            • Perplexity API 키 연결 및 실시간 토큰·비용(버닝) 대시보드 사용법<br />
            • 새 보도자료 등록 화면의 모드 선택(기사식광고 vs 비교·기획) 및 사진·매체 옵션
          </p>
        </div>
        <div class="info-card blue">
          <h3>📌 목차 구성</h3>
          <p>
            <strong>Part 2. 기사 초안 작성·검수 페이지 상세 매뉴얼 (Slide 6 ~ 12)</strong><br />
            • 3단 워크벤치 구조 & 좌측 S0~S10 단계 진행 타임라인 해석<br />
            • AI 편집·교열 내역 확인, 본문 내 교열 위치 인라인 표시, 영역 크기 조절<br />
            • 문단별 블록 에디터(순서 이동·추가·삭제), 비교·기획 경쟁사 카드, 우측 4개 점검 탭, S10 승인 및 CMS 복사
          </p>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <span>매경 PR사업팀 콘텐츠 작성 에이전트 실무 사용 가이드</span>
      <span>Slide 1 / 12</span>
    </div>
  </section>

  <!-- SLIDE 2: 1. 홈 화면의 기능 및 사용 설명 (작업 목록 대시보드) -->
  <section class="slide">
    <div class="slide-header">
      <div class="slide-header-left">
        <span class="chapter-badge">1. 홈 화면 가이드</span>
        <span class="slide-title">홈 화면 (작업 목록 대시보드)의 화면 구성 및 버튼 설명</span>
      </div>
      <span class="slide-subtitle">접속 경로: 상단 로고 클릭 또는 /jobs</span>
    </div>

    <div class="slide-body">
      <div class="col-img">
        <div class="screenshot-frame">
          <div class="screenshot-caption">
            <span>[화면 1] 홈 화면 — 보도자료 검수·작성 작업 목록 대시보드 (/jobs)</span>
            <span>실제 구동 화면 캡처</span>
          </div>
          <img src="images/01-home-dashboard.png" alt="홈 화면 대시보드" />
        </div>
      </div>

      <div class="col-desc">
        <div class="info-card">
          <h3><span class="num-badge">1</span> 상단 글로벌 내비게이션 바 (Header)</h3>
          <ul>
            <li><strong>작업 목록 / 새 작업 / 룰북·매체 설정 / 사용 가이드:</strong> 어느 화면에서든 원하는 메뉴로 즉시 이동합니다.</li>
            <li><strong>[API 키 설정 · 토큰 내역]:</strong> 현재 Perplexity API 연결 상태(초록색 점 = 실시간 연결됨 / 회색 점 = 오프라인 룰엔진 모드)와 누적 호출 횟수·토큰·추정 비용(USD)을 실시간 표시합니다.</li>
          </ul>
        </div>

        <div class="info-card">
          <h3><span class="num-badge">2</span> 상태별 필터 탭 & 실시간 검색창 & [새 보도자료 작업]</h3>
          <ul>
            <li><strong>상태별 필터 탭 (좌측):</strong> <span class="ui-pill">전체</span> <span class="ui-pill">작성/검수중</span> <span class="ui-pill hold">보류(HOLD)</span> <span class="ui-pill reject">반려(REJECT)</span> <span class="ui-pill pass">승인완료</span> 중 원하는 상태의 작업만 모아 볼 수 있습니다.</li>
            <li><strong>검색 입력창 (우측):</strong> 기업명(예: <code>무신사</code>, <code>낫소</code>)이나 기사 제목 키워드를 입력하면 목록이 즉시 필터링됩니다.</li>
            <li><strong><span class="ui-pill primary">+ 새 보도자료 작업</span> 버튼:</strong> 새로운 보도자료를 입력하고 AI 검수·작성을 시작하는 화면(<code>/jobs/new</code>)으로 이동합니다.</li>
          </ul>
        </div>

        <div class="info-card">
          <h3><span class="num-badge">3</span> 작업 목록 테이블 컬럼 및 판정 배지·버튼 설명</h3>
          <table class="guide-table" style="margin-top: 4px;">
            <thead>
              <tr>
                <th>항목 / 버튼</th>
                <th>실무 의미 및 동작 설명</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="ui-pill pass">통과 (PASS)</span></td>
                <td>하드룰·제한소재 위반 없이 모든 기준을 통과한 기사 초안입니다.</td>
              </tr>
              <tr>
                <td><span class="ui-pill info">조건부 통과</span></td>
                <td>과장 표현("세계 최고", "유일한" 등)이나 URL을 AI가 자동 완화·교열(<code>PASS_WITH_EDIT</code>)하여 작성한 초안입니다.</td>
              </tr>
              <tr>
                <td><span class="ui-pill hold">보류 (HOLD)</span></td>
                <td>특허·매출 수치·대기업 언급 등 <strong>대행사 증빙 확인이 필요한 문장</strong>이 있거나 주의 소재가 감지된 상태입니다.</td>
              </tr>
              <tr>
                <td><span class="ui-pill reject">반려 (REJECT)</span></td>
                <td>공식 홈페이지 미확인(SNS만 존재) 또는 코인·다단계·미검증 바이오 등 게재 불가 제한 소재에 해당합니다.</td>
              </tr>
              <tr>
                <td><strong>작업 관리 버튼</strong></td>
                <td><strong>[열기]</strong>(또는 제목 클릭)로 편집기에 진입하며, 우측 <strong>[🗑️ 휴지통 아이콘]</strong> 클릭 시 확인 창을 거쳐 해당 작업과 하위 데이터가 즉시 삭제됩니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>1. 홈 화면의 기능 및 사용 설명 — 작업 목록 대시보드</span>
      <span>Slide 2 / 12</span>
    </div>
  </section>

  <!-- SLIDE 3: 1-2. Perplexity API 키 설정 및 토큰·크레딧 사용량 모달 -->
  <section class="slide">
    <div class="slide-header">
      <div class="slide-header-left">
        <span class="chapter-badge">1. 홈 화면 가이드</span>
        <span class="slide-title">화면 내 Perplexity API 키 연결 및 토큰·비용(버닝) 대시보드</span>
      </div>
      <span class="slide-subtitle">우측 상단 [API 키 설정 · 토큰 내역] 버튼 클릭 시 표시</span>
    </div>

    <div class="slide-body">
      <div class="col-img">
        <div class="screenshot-frame">
          <div class="screenshot-caption">
            <span>[화면 2] Perplexity API 연결 및 토큰·크레딧 사용량 대시보드 모달</span>
            <span>실제 구동 화면 캡처</span>
          </div>
          <img src="images/02-api-modal.png" alt="API 설정 및 토큰 대시보드 모달" />
        </div>
      </div>

      <div class="col-desc">
        <div class="info-card highlight">
          <h3>💡 API 연결 여부에 따른 작동 차이 (중요)</h3>
          <ul>
            <li><strong>오프라인 기본 모드 (API 미연결 시):</strong> 내장된 한국어 규칙 엔진으로 S0~S10 전 단계와 기사 초안 작성, 하드룰 점검이 <strong>약 1~2초 내로 무료 작동</strong>합니다.</li>
            <li><strong>Perplexity API 실시간 연결 시:</strong>
              <br />① <strong>S1 중복 게재 검색:</strong> 최근 1개월간 포털에 동일 보도자료가 몇 건 게재되었는지 실시간 검색
              <br />② <strong>S2 기업 공식 홈페이지 검증:</strong> 실제 기업 공식 홈페이지 도메인과 사업 실체를 웹에서 교차 검증
              <br />③ <strong>S6 비교·기획 기사 경쟁사 조사:</strong> 동종업계 실제 경쟁 브랜드 3곳의 최신 동향을 실시간 조사하여 비교 분석 문단 작성
            </li>
          </ul>
        </div>

        <div class="info-card">
          <h3><span class="num-badge">1</span> API 키 연결 및 테스트·해제 방법</h3>
          <ul>
            <li>Perplexity API 키(<code>pplx-...</code>로 시작)를 입력란에 붙여넣고 <strong>[연결 테스트 후 저장]</strong>을 누르면 즉시 유효성을 검증한 뒤 서버에 적용합니다 (<code>.env.local</code>에도 자동 반영되어 재시작 후에도 유지됨).</li>
            <li>오프라인 모드로 전환하고 싶을 때는 우측 <strong>[키 연결 해제]</strong> 버튼을 누르면 즉시 해제됩니다.</li>
          </ul>
        </div>

        <div class="info-card blue">
          <h3><span class="num-badge blue">2</span> 실시간 토큰·비용(버닝) 지표 읽는 법</h3>
          <ul>
            <li><strong>누적 API 호출 수 / 총 토큰(Prompt + Completion) / 누적 추정 비용(USD 및 원화 환산):</strong> 기사 1건당 평균 약 <code>$0.015 ~ $0.025</code>(약 20~35원) 수준이 소모됩니다.</li>
            <li><strong>현재 작업(Job) 소모량 & 최근 호출 로그:</strong> S1 중복 검색, S2 홈페이지 검색, S6 경쟁사 비교 조사, S6 제목 생성 등 어느 단계에서 몇 토큰이 소모되었는지 투명하게 기록됩니다.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>1. 홈 화면의 기능 및 사용 설명 — API 키 설정 및 토큰·비용 대시보드</span>
      <span>Slide 3 / 12</span>
    </div>
  </section>

  <!-- SLIDE 4: 1-3. 새 보도자료 작업 등록 (상단: 샘플 불러오기, 모드 선택, 원문 입력) -->
  <section class="slide">
    <div class="slide-header">
      <div class="slide-header-left">
        <span class="chapter-badge">1. 새 작업 등록</span>
        <span class="slide-title">새 작업 등록 페이지 (1/2) — 작성 모드 선택 및 보도자료 원문 입력</span>
      </div>
      <span class="slide-subtitle">접속 경로: 홈 화면 우측 상단 [+ 새 보도자료 작업] 클릭 (/jobs/new)</span>
    </div>

    <div class="slide-body">
      <div class="col-img">
        <div class="screenshot-frame">
          <div class="screenshot-caption">
            <span>[화면 3] 새 작업 등록 상단 — 샘플 프리셋 · 작성 모드 선택 · 기업명 및 원문 입력</span>
            <span>실제 구동 화면 캡처</span>
          </div>
          <img src="images/03-new-job-top.png" alt="새 작업 등록 상단 화면" />
        </div>
      </div>

      <div class="col-desc">
        <div class="info-card">
          <h3><span class="num-badge">1</span> 빠른 테스트용 샘플 보도자료 불러오기 (예시 1·2·3)</h3>
          <ul>
            <li>처음 기능을 테스트할 때 <strong>[예시 1: 비보(송은이)]</strong>, <strong>[예시 2: 알라딘 '원트']</strong>, <strong>[예시 3: 낫소 스크린 파크골프]</strong> 버튼을 클릭하면 실제 PR사업팀에 접수된 보도자료 원문과 캡션이 자동 입력됩니다.</li>
          </ul>
        </div>

        <div class="info-card purple">
          <h3><span class="num-badge purple">2</span> 작업 모드 선택 (기사식광고 기본 vs 비교·기획 기사)</h3>
          <table class="guide-table" style="margin-top: 4px; background: #FFFFFF;">
            <thead>
              <tr>
                <th>모드 구분</th>
                <th>언제 선택하는가? (작동 방식)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>기사식광고 기본 모드 (P0)</strong></td>
                <td>일반적인 보도자료 기사화 작업 시 선택합니다. 원문 팩트를 누락 없이 보존하면서 과장·판촉 표현을 완화하고, 매경 스타일 40자 제목·부제와 1,200~1,500자 기사 초안을 작성합니다.</td>
              </tr>
              <tr>
                <td><strong>비교·기획 기사 모드 (실험 단계)</strong></td>
                <td>단순 홍보성 보도자료를 <strong>업종 트렌드 기획 기사</strong>로 격상시킬 때 선택합니다. 동종업계 경쟁사·유사 브랜드 2~3곳(예: 낫소 → 골프존·카카오VX 등)을 함께 조사하여 <strong>시장 동향 비교 문단 + 차별화 분석 문단</strong>을 본문에 자동 추가합니다.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="info-card">
          <h3><span class="num-badge">3</span> 기업/기관명(선택) 및 보도자료 원문 입력(필수)</h3>
          <ul>
            <li><strong>기업/기관명:</strong> 비워두어도 S0 단계에서 원문 첫 문장의 주어를 분석해 기업명을 자동 추출합니다. 다만 원문에 여러 기관명(협업사·입점 브랜드 등)이 섞여 있다면 주인공 기업명을 직접 입력해 두면 가장 정확합니다.</li>
            <li><strong>보도자료 원문:</strong> 대행사 한글(HWP)/워드/이메일에서 복사한 원문을 그대로 붙여넣습니다. 우측 상단에 실시간 글자 수가 표시됩니다.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>1. 새 작업 등록 페이지 가이드 — 모드 선택 및 원문 입력</span>
      <span>Slide 4 / 12</span>
    </div>
  </section>

  <!-- SLIDE 5: 1-4. 새 보도자료 작업 등록 (하단: 사진 캡션, 규격, 바이라인, 매체 옵션 및 실행) -->
  <section class="slide">
    <div class="slide-header">
      <div class="slide-header-left">
        <span class="chapter-badge">1. 새 작업 등록</span>
        <span class="slide-title">새 작업 등록 페이지 (2/2) — 사진·캡션·바이라인·매체 옵션 및 실행</span>
      </div>
      <span class="slide-subtitle">기사식광고 하드룰(FMT-06, 10, 11, 12) 및 네이버 운영평가 사전 설정</span>
    </div>

    <div class="slide-body">
      <div class="col-img">
        <div class="screenshot-frame">
          <div class="screenshot-caption">
            <span>[화면 4] 새 작업 등록 하단 — 사진 캡션 · 규격 점검 · 바이라인 · 실행 카운트다운</span>
            <span>실제 구동 화면 캡처</span>
          </div>
          <img src="images/04-new-job-options.png" alt="새 작업 등록 하단 옵션 화면" />
        </div>
      </div>

      <div class="col-desc">
        <div class="info-card">
          <h3><span class="num-badge">4</span> 사진 및 캡션 점검 정보 (FMT-06, FMT-10, FMT-12)</h3>
          <ul>
            <li><strong>사진 캡션 입력:</strong> 줄바꿈(Enter)으로 구분해 최대 2장까지 입력합니다. 만약 <code>&lt;사진제공=낫소&gt;</code>처럼 괄호 형식이 다르거나 제공자가 빠져 있어도 S8 단계에서 매경 CMS 표준인 <strong><code>설명. [제공=기관명]</code></strong> 형식으로 자동 정규화합니다.</li>
            <li><strong>첨부 사진 장수 & 최대 가로/세로 픽셀:</strong> 기준(최대 2장, 600~700px 이내)을 초과하면 우측 규정 리포트에 경고(WARN)를 띄워 알려줍니다.</li>
            <li><strong>체크박스 2종:</strong> ① 기업 제공 원본 확인, ② 인물 사진 초상권 동의 확인 여부를 체크합니다.</li>
          </ul>
        </div>

        <div class="info-card">
          <h3><span class="num-badge">5</span> 작성자 식별 정보(바이라인) · 송출 매체 · AI 고지 옵션</h3>
          <ul>
            <li><strong>작성자 식별 정보 (바이라인):</strong> 네이버 운영평가 C항목(벌점 1~4점) 및 FMT-11 대비 필수 항목입니다 (예: <code>이경섭 기자</code>). 비워두면 규정 리포트에서 바이라인 누락 경고를 표시합니다.</li>
            <li><strong>송출 예정 매체:</strong> 매일경제(신문/AX), MBN, 매경 ECONOMY 등 송출 매체를 선택합니다.</li>
            <li><strong>AI 활용 표시 옵션 (네이버 D항목):</strong> 체크 시 기사 최하단에 AI 활용 고지 문구를 자동 포함합니다.</li>
          </ul>
        </div>

        <div class="info-card highlight">
          <h3><span class="num-badge">6</span> [검수 파이프라인 시작 및 초안 생성] 버튼 & 실시간 카운트다운</h3>
          <ul>
            <li>버튼을 누르면 예상 소요 시간(API 연결 시 약 14초, 오프라인 시 약 3초)과 함께 <strong>실시간 남은 초 카운트다운 및 진행률 바(%)</strong>가 표시되며, 완료 즉시 기사 초안 편집기 화면으로 자동 이동합니다.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>1. 새 작업 등록 페이지 가이드 — 사진·캡션·바이라인 옵션 및 실행</span>
      <span>Slide 5 / 12</span>
    </div>
  </section>

  <!-- SLIDE 6: 2. 기사 초안 작성 페이지 — 3단 워크벤치 전체 구성 및 상단 바 -->
  <section class="slide">
    <div class="slide-header">
      <div class="slide-header-left">
        <span class="chapter-badge blue">2. 기사 초안 작성 페이지</span>
        <span class="slide-title">기사 초안 작성·검수 워크벤치 전체 구조 (상단 바 + 좌·중·우 3단 구성)</span>
      </div>
      <span class="slide-subtitle">접속 경로: 작업 생성 직후 자동 이동 또는 홈 화면에서 작업 클릭 (/jobs/[id])</span>
    </div>

    <div class="slide-body">
      <div class="col-img">
        <div class="screenshot-frame">
          <div class="screenshot-caption">
            <span>[화면 5] 기사 초안 작성·검수 페이지 3단 전체 구성 (/jobs/[id])</span>
            <span>실제 구동 화면 캡처</span>
          </div>
          <img src="images/05-workbench-overview.png" alt="기사 초안 작성 워크벤치 전체 화면" />
        </div>
      </div>

      <div class="col-desc">
        <div class="info-card blue">
          <h3>🖥️ 화면 전체 4대 영역 한눈에 이해하기</h3>
          <table class="guide-table" style="margin-top: 4px; background: #FFFFFF;">
            <thead>
              <tr>
                <th>영역 위치</th>
                <th>핵심 역할 및 주요 버튼</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>① 최상단 헤더 바</strong></td>
                <td>
                  • <strong>[← 목록]:</strong> 홈 화면(작업 목록)으로 복귀<br />
                  • <strong>기업명 + 최종 판정 배지:</strong> <code>통과</code> / <code>조건부 통과</code> / <code>보류</code> / <code>반려</code> 표시<br />
                  • <strong><span class="ui-pill hold">네이버 제외 송출 권장</span>:</strong> 유가·협찬 기사(네이버 Q항목) 송출 주의 안내<br />
                  • <strong>[파이프라인 재실행]:</strong> 원문 기준으로 S0~S10 전체 검수·작성을 처음부터 다시 실행
                </td>
              </tr>
              <tr>
                <td><strong>② 좌측 패널 (240px)</strong></td>
                <td>
                  • <strong>단계 진행 타임라인 (S0~S10):</strong> 11단계 각각의 완료 상태(✅)와 한 줄 요약을 실시간 표시하며, <strong>각 단계를 클릭하면 중앙 상단에 상세 실행 결과(JSON) 카드</strong>가 열립니다.
                </td>
              </tr>
              <tr>
                <td><strong>③ 중앙 패널 (편집기)</strong></td>
                <td>
                  • <strong>기사 초안 편집기:</strong> AI 편집·교열 내역, 비교·기획 경쟁사 내역, 추천 제목 후보 3종, 제목·부제·문단별 본문·사진 캡션 편집, S10 승인 체크리스트 및 CMS 복사 버튼이 위치한 메인 작업 공간입니다.
                </td>
              </tr>
              <tr>
                <td><strong>④ 우측 패널 (360px)</strong></td>
                <td>
                  • <strong>4개 검수 탭:</strong> <code>규정리포트</code> / <code>증빙·팩트</code> / <code>출처</code> / <code>보도자료원문</code>을 전환하며 하드룰 위반, 대행사 증빙 요청 문장, 검색 출처 URL을 대조합니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="info-card highlight">
          <h3>🔍 화면을 넓게 쓰고 싶을 때: [편집기 넓게 보기 (좌우 패널 접기)]</h3>
          <p>
            중앙 편집기 우측 상단의 <strong><span class="ui-pill">⤢ 편집기 넓게 보기 (좌우 패널 접기)</span></strong> 버튼을 누르면 좌측 타임라인과 우측 탭 패널이 접히면서 <strong>중앙 편집기가 화면 전체 폭(1600px)으로 시원하게 확장</strong>됩니다. 다시 <strong>[3단 기본 화면으로 복귀]</strong>를 누르면 원래대로 돌아옵니다.
          </p>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>2. 기사 초안 작성 페이지 가이드 — 3단 워크벤치 전체 구조</span>
      <span>Slide 6 / 12</span>
    </div>
  </section>

  <!-- SLIDE 7: 2-2. 좌측 패널 — S0~S10 단계 진행 타임라인 완벽 해설 -->
  <section class="slide">
    <div class="slide-header">
      <div class="slide-header-left">
        <span class="chapter-badge blue">2. 기사 초안 작성 페이지</span>
        <span class="slide-title">좌측 패널 — S0~S10 단계 진행 타임라인과 PR사업팀 실무 프로세스 매핑</span>
      </div>
      <span class="slide-subtitle">각 단계를 클릭하면 상세 분석 결과 카드를 열람·닫기 할 수 있습니다</span>
    </div>

    <div class="slide-body" style="flex-direction: column; gap: 14px;">
      <p style="font-size: 14px; color: #2C3137;">
        좌측 <strong>[단계 진행 타임라인]</strong>의 S0~S10은 PR사업팀의 실제 기사식광고 검수·작성 업무 프로세스(1단계 중복 확인 → 2단계 회사·제한소재·증빙·과장표현 점검 → 3단계 기사 작성·교열)를 그대로 자동화한 것입니다.
      </p>

      <table class="guide-table">
        <thead>
          <tr>
            <th style="width: 170px;">단계 코드 · 명칭</th>
            <th style="width: 220px;">PR사업팀 실무 프로세스 단계</th>
            <th>에이전트가 자동으로 수행하는 작업 및 판정 기준</th>
            <th style="width: 230px;">실무자 확인 포인트</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>S0 전처리·클레임 추출</strong></td>
            <td>원문 접수 및 핵심 요소 파악</td>
            <td>원문의 불필요한 기호·제로폭 공백을 정리하고, <strong>기업명·대표자명·수치·일정·장소·주요 주장(Claim)</strong>을 자동 추출합니다.</td>
            <td>상단 기업명이 정확히 추출되었는지 확인</td>
          </tr>
          <tr>
            <td><strong>S1 중복 게재 점검</strong></td>
            <td>프로세스 1단계: 포털 중복 확인</td>
            <td>동일 보도자료가 이미 타 매체에 다수 게재되었는지 검색합니다. <strong>3개 이상 매체 동일 게재 시 <span class="ui-pill hold">보류(HOLD)</span></strong> 및 제목·리드 차별화 권고를 생성합니다.</td>
            <td>중복 기사가 많을 경우 문단 재배치 및 제목 차별화</td>
          </tr>
          <tr>
            <td><strong>S2 기업·홈페이지 검증</strong></td>
            <td>프로세스 2단계 1): 회사 정보 조사</td>
            <td>기업 공식 홈페이지 존재 여부와 사업 실체를 확인합니다. <strong>공식 홈페이지 없이 인스타그램/SNS만 존재하면 즉시 <span class="ui-pill reject">반려(REJECT)</span></strong> 판정합니다.</td>
            <td>우측 <code>출처</code> 탭에서 공식 홈페이지·기사 URL 확인</td>
          </tr>
          <tr>
            <td><strong>S3 제한 소재 스크리닝</strong></td>
            <td>제한 소재 여부 판별</td>
            <td>룰북 기준으로 <strong>코인·다단계·투자유도·미검증 바이오·의료관광 등은 <span class="ui-pill reject">반려(REJECT)</span></strong>, <strong>부동산 분양·기부·인터뷰 형식 등은 <span class="ui-pill hold">보류(HOLD)</span></strong>로 분류합니다.</td>
            <td>반려 모달 또는 상단 노란색 보류 배너 사유 확인</td>
          </tr>
          <tr>
            <td><strong>S4 팩트체크·증빙 플래그</strong></td>
            <td>프로세스 2단계 2): 증빙 자료 확인</td>
            <td>보도자료 문장 중 <strong>특허·수상·인증, 매출·성장률 수치, 특정 대기업(삼성·카카오 등) 언급</strong>을 찾아 대행사 증빙 요청 항목으로 자동 분류합니다.</td>
            <td>우측 <code>증빙·팩트</code> 탭에서 대행사 증빙 확보 여부 점검</td>
          </tr>
          <tr>
            <td><strong>S5 과장·미확정 표현 필터</strong></td>
            <td>프로세스 2단계 3): 과장 표현 배제</td>
            <td><strong>"세계 최고→고도화된", "유일한→차별화된", "자랑합니다→갖췄다", 본문 내 URL·전화번호, 평→㎡ 환산</strong>을 자동 치환하고 교열 내역(diff)을 기록합니다.</td>
            <td>중앙 상단 <code>AI 편집·교열 내역</code>에서 변경 전·후 확인</td>
          </tr>
          <tr>
            <td><strong>S6 기사 초안 작성</strong></td>
            <td>프로세스 3단계: 기사 작성</td>
            <td>원문 팩트를 보존하며 매경 기사체(1,200~1,500자)로 초안을 작성합니다. <strong>비교·기획 모드일 경우 동종업계 경쟁사 3곳 동향 및 차별화 비교 문단을 추가</strong>합니다.</td>
            <td>추천 제목 후보 3종 및 본문 문단 구성 확인</td>
          </tr>
          <tr>
            <td><strong>S7 제목·문체·리드 정비</strong></td>
            <td>프로세스 3단계: 문체·어미 교열</td>
            <td>리드문 육하원칙을 점검하고, 기사 내 <strong>"~밝혔다"가 3회 이상 반복되면 중간 출현분을 "~설명했다", "~전했다"로 자동 치환</strong>합니다 (FMT-07).</td>
            <td>서술 어미가 자연스러운지 확인</td>
          </tr>
          <tr>
            <td><strong>S8 사진·캡션 점검</strong></td>
            <td>프로세스 3단계: 사진·캡션 점검</td>
            <td>사진 매수(최대 2장)·규격(600~700px)을 점검하고, 캡션 끝에 <strong><code>[제공=기관명]</code></strong> 표기가 누락되었거나 괄호가 다르면 표준 형식으로 자동 보완합니다.</td>
            <td>하단 사진 캡션 입력란 확인</td>
          </tr>
          <tr>
            <td><strong>S9 최종 교열·규정 체크</strong></td>
            <td>기사식광고 하드룰 & 네이버 A~R</td>
            <td>작성된 초안에 대해 하드룰(FMT-01~12)과 네이버 뉴스 운영평가(A~R) 체크리스트를 최종 실행하여 우측 <code>규정리포트</code> 탭에 결과를 생성합니다.</td>
            <td>우측 <code>규정리포트</code> 탭의 경고(WARN)/위반(BLOCK) 확인</td>
          </tr>
          <tr>
            <td><strong>S10 사람 검수·승인</strong></td>
            <td>담당자 최종 확인 후 CMS 복사</td>
            <td>모드별 필수 확인 체크리스트(일반 4항목 / 비교·기획 8항목)를 생성하고, <strong>담당자가 모두 체크해 승인해야만 CMS 복사 버튼을 활성화</strong>합니다.</td>
            <td>하단 체크리스트 체크 후 <code>[검수 승인 완료]</code> 클릭</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="slide-footer">
      <span>2. 기사 초안 작성 페이지 가이드 — 좌측 S0~S10 단계 진행 타임라인</span>
      <span>Slide 7 / 12</span>
    </div>
  </section>

  <!-- SLIDE 8: 2-3. 중앙 편집기 상단 — AI 편집·교열 내역, 본문 위치 이동, 비교·기획 경쟁사 카드 -->
  <section class="slide">
    <div class="slide-header">
      <div class="slide-header-left">
        <span class="chapter-badge blue">2. 기사 초안 작성 페이지</span>
        <span class="slide-title">중앙 편집기 (1/3) — AI 편집·교열 내역 확인 · 본문 위치 이동 · 크기 조절</span>
      </div>
      <span class="slide-subtitle">원문에서 무엇이 어떻게 바뀌었는지, 본문 몇 문단에 위치하는지 즉시 확인합니다</span>
    </div>

    <div class="slide-body">
      <div class="col-img">
        <div class="screenshot-frame">
          <div class="screenshot-caption">
            <span>[화면 5 확대] 보도자료 원문 대비 AI 편집·교열 내역 & 비교·기획 경쟁사 조사 내역</span>
            <span>실제 구동 화면 캡처</span>
          </div>
          <img src="images/05-workbench-overview.png" alt="교열 내역 및 비교 기획 내역" />
        </div>
      </div>

      <div class="col-desc">
        <div class="info-card blue">
          <h3><span class="num-badge blue">1</span> 보도자료 원문 대비 AI 편집·교열 내역 박스 (파란색 영역)</h3>
          <ul>
            <li><strong>변경 요약 및 [교열 N] 목록:</strong> 원문에서 과장·단정 표현이나 URL이 어떻게 완화되었는지 <code><span class="ui-pill reject" style="text-decoration:line-through;">유일한</span> → <span class="ui-pill pass">차별화된</span> (최상급·단정 표현 완화)</code> 형태로 전부 나열합니다.</li>
            <li><strong><span class="ui-pill info">📍 본문 N문단 위치 보기</span> / <span class="ui-pill">[N문단 이동]</span> 버튼:</strong> 각 교열 항목 옆에 해당 표현이 본문 몇 번째 문단에 들어 있는지 표시됩니다. <strong>클릭하면 해당 문단 위치로 화면이 즉시 스크롤되며 해당 문단이 강조</strong>됩니다!</li>
            <li><strong><span class="ui-pill">↺ 원문 복원</span> / <span class="ui-pill">교열어 재적용</span> 버튼:</strong> 만약 공인 인증서가 있어 원문 표현("유일한" 등)을 그대로 살리고 싶다면 <strong>[원문 복원]</strong>을 누르면 본문에서 즉시 원래 단어로 되돌아갑니다.</li>
          </ul>
        </div>

        <div class="info-card highlight">
          <h3><span class="num-badge">2</span> 영역 사이즈 자유 조절 및 크게 보기 기능</h3>
          <ul>
            <li><strong><span class="ui-pill">⤢ 교열 영역 크게 보기</span> 버튼:</strong> 교열 내역 박스의 높이와 글자 크기를 한 번에 키워서 넓게 볼 수 있습니다.</li>
            <li><strong>마우스 드래그 크기 조절 (<code>↕</code>):</strong> 파란색 교열 박스, 보라색 비교·기획 박스, 각 문단 입력창 모두 <strong>우측 하단 모서리를 마우스로 잡고 위아래로 드래그</strong>하여 원하는 만큼 길게 늘여서 볼 수 있습니다.</li>
            <li><strong><span class="ui-pill">원문과 나란히 비교 보기</span> 버튼:</strong> 보도자료 원문 전체와 AI 기사 초안을 좌우 2단으로 나란히 놓고 대조할 수 있습니다.</li>
          </ul>
        </div>

        <div class="info-card purple">
          <h3><span class="num-badge purple">3</span> [비교·기획 모드 전용] 동종업계 경쟁사·유사 브랜드 조사 내역 (보라색 영역)</h3>
          <ul>
            <li>비교·기획 기사 모드일 때 나타나며, 조사된 동종업계 경쟁 브랜드(예: <code>골프존</code>, <code>카카오VX</code> 등)의 한 줄 요약, <strong><span class="ui-pill purple">📍 본문 N문단 위치 보기</span></strong> 이동 버튼, <strong>[근거 출처 확인]</strong> 외부 링크를 제공합니다.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>2. 기사 초안 작성 페이지 가이드 — AI 편집·교열 내역 및 비교·기획 조사 카드</span>
      <span>Slide 8 / 12</span>
    </div>
  </section>

  <!-- SLIDE 9: 2-4. 중앙 편집기 중단 — 제목·부제목 및 문단별 블록 에디터 완벽 가이드 -->
  <section class="slide">
    <div class="slide-header">
      <div class="slide-header-left">
        <span class="chapter-badge blue">2. 기사 초안 작성 페이지</span>
        <span class="slide-title">중앙 편집기 (2/3) — 제목 후보 선택 · 문단별 블록 에디터 · 본문 내 교열 위치 표시</span>
      </div>
      <span class="slide-subtitle">포털 중복 회피를 위해 문단 순서를 바꾸고, 문장 속 교열 위치를 초록색 배지로 확인합니다</span>
    </div>

    <div class="slide-body">
      <div class="col-img">
        <div class="screenshot-frame">
          <div class="screenshot-caption">
            <span>[화면 6] 문단별 블록 에디터 — 본문 내 교열 위치 인라인 하이라이트 & 문단 이동 버튼</span>
            <span>실제 구동 화면 캡처</span>
          </div>
          <img src="images/06-body-paragraphs.png" alt="문단별 블록 에디터 화면" />
        </div>
      </div>

      <div class="col-desc">
        <div class="info-card">
          <h3><span class="num-badge">1</span> 추천 제목 후보 3종 & 제목·부제목 입력란</h3>
          <ul>
            <li><strong>추천 제목 후보 (후보 1·2·3):</strong> 한국어 어순(서술어 보존)에 맞춰 40자 내외로 생성된 매경 스타일 제목 후보 3개가 제시됩니다. <strong>원하는 후보를 클릭하면 아래 제목 입력란에 즉시 적용</strong>됩니다.</li>
            <li><strong>글자 수 실시간 판정:</strong> 제목(기준 28~45자)과 본문(목표 공백 포함 1,200~1,500자) 글자 수가 실시간 계산되며, 기준 범위 밖이면 주황색으로 알려줍니다.</li>
          </ul>
        </div>

        <div class="info-card green">
          <h3><span class="num-badge green">2</span> 본문 내 교열 위치 인라인 하이라이트 표시</h3>
          <ul>
            <li>교열이 반영된 문단(예: <code>1문단</code>, <code>3문단</code>)에는 상단에 <strong><span class="ui-pill pass">📍 [교열 1] 유일한 → 차별화된 위치</span></strong> 배지가 붙고, 입력창 바로 위에 <strong>전체 문장 속에서 어느 단어가 바뀌었는지 취소선+초록색 배지로 하이라이트된 미리보기 박스</strong>가 함께 표시됩니다.</li>
            <li>상단 <strong><span class="ui-pill primary">📍 본문 내 교열 위치 표시 중</span></strong> 버튼을 누르면 언제든 미리보기 박스를 켜거나 끌 수 있습니다.</li>
          </ul>
        </div>

        <div class="info-card">
          <h3><span class="num-badge">3</span> 문단별 블록 에디터의 모든 버튼 설명</h3>
          <table class="guide-table" style="margin-top: 4px;">
            <thead>
              <tr>
                <th>버튼 명칭</th>
                <th>기능 및 실무 활용법</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="ui-pill">🔀 중간 문단 순서 재배치</span></td>
                <td>보도자료 원문과 문단 구성을 다르게 하여 포털 중복 판정을 피하고 싶을 때 누릅니다. <strong>1문단(리드)과 마지막 문단(인용구)은 고정한 채 중간 문단들의 순서를 자동 순환 재배치</strong>합니다.</td>
              </tr>
              <tr>
                <td><span class="ui-pill">↑ 위로</span> / <span class="ui-pill">↓ 아래로</span></td>
                <td>개별 문단 블록을 위 문단 또는 아래 문단과 즉시 맞바꿉니다.</td>
              </tr>
              <tr>
                <td><span class="ui-pill">+ 문단 추가</span> / <span class="ui-pill reject">🗑 삭제</span></td>
                <td>해당 문단 바로 아래에 새 문단 블록을 삽입하거나 해당 문단을 삭제합니다.</td>
              </tr>
              <tr>
                <td><span class="ui-pill">⤢ 입력창 일괄 크게 보기</span></td>
                <td>모든 문단 입력창의 기본 높이를 한 번에 키워 긴 문단도 스크롤 없이 편집합니다.</td>
              </tr>
              <tr>
                <td><span class="ui-pill">통문장 편집으로 전환</span></td>
                <td>문단별 블록 대신 기사 전체를 하나의 큰 텍스트 창에서 편집할 때 전환합니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>2. 기사 초안 작성 페이지 가이드 — 문단별 블록 에디터 및 본문 내 교열 위치 표시</span>
      <span>Slide 9 / 12</span>
    </div>
  </section>

  <!-- SLIDE 10: 2-5. 원문과 나란히 비교 보기 & 우측 패널 탭 1·2 (규정리포트 / 증빙·팩트) -->
  <section class="slide">
    <div class="slide-header">
      <div class="slide-header-left">
        <span class="chapter-badge blue">2. 기사 초안 작성 페이지</span>
        <span class="slide-title">원문 나란히 비교 보기 & 우측 검수 패널 (규정리포트 탭 · 증빙·팩트 탭)</span>
      </div>
      <span class="slide-subtitle">PR사업팀 업무 프로세스 2단계(증빙 확인 및 하드룰 점검)를 우측 패널에서 처리합니다</span>
    </div>

    <div class="slide-body">
      <div class="col-img" style="flex-direction: row; gap: 12px;">
        <div class="screenshot-frame" style="flex: 1;">
          <div class="screenshot-caption">
            <span>[화면 7] [원문과 나란히 비교 보기] 모드</span>
          </div>
          <img src="images/07-side-by-side.png" alt="원문과 나란히 비교 보기" />
        </div>
        <div class="screenshot-frame" style="flex: 1;">
          <div class="screenshot-caption">
            <span>[화면 8] 우측 패널 — [증빙·팩트] 탭</span>
          </div>
          <img src="images/08-right-claims-tab.png" alt="우측 증빙 팩트 탭" />
        </div>
      </div>

      <div class="col-desc">
        <div class="info-card">
          <h3><span class="num-badge">1</span> [원문과 나란히 비교 보기] 화면 (좌측 이미지)</h3>
          <ul>
            <li>교열 내역 박스 우측의 <strong>[원문과 나란히 비교 보기]</strong>를 누르면 왼쪽에는 <strong>[붙여넣은 보도자료 원문]</strong>, 오른쪽에는 <strong>[AI 교열·작성 기사 초안(편집 가능)]</strong>이 나란히 열려 원문 누락 여부를 한눈에 대조할 수 있습니다.</li>
          </ul>
        </div>

        <div class="info-card">
          <h3><span class="num-badge">2</span> 우측 탭 ①: [규정리포트(N)] 탭</h3>
          <ul>
            <li><strong>1. 기사식광고 하드룰 점검 (FMT-01~12):</strong> 전화번호/URL 노출, 면적 평 표기, 제목·본문 글자 수, 바이라인 누락 등을 검사합니다. <strong>항목을 클릭하면 본문 내 해당 어구가 노란색으로 하이라이트</strong>됩니다.</li>
            <li><strong>2. 네이버 뉴스 운영평가 점검 (A~R):</strong> 허위사실 예방(A), 과장·오인(B), 바이라인(C), AI 표시(D), 중복(J), 저작권(O), 유가·홍보성(Q/R) 항목별 벌점과 통과/경고 상태를 표시합니다.</li>
          </ul>
        </div>

        <div class="info-card highlight">
          <h3><span class="num-badge">3</span> 우측 탭 ②: [증빙·팩트(N)] 탭 (우측 이미지 — 실무 핵심!)</h3>
          <ul>
            <li><strong>1. 대행사/업체 증빙 자료 요청 필요 항목 (주황색 카드):</strong> 보도자료 내 특허·인증·수상, 매출·점유율 수치, 특정 대기업 언급 등 <strong>대행사에 증빙(특허증, 회계근거, 협의 여부)을 확인해야 할 문장</strong>을 따로 모아 보여줍니다.</li>
            <li><strong><span class="ui-pill reject">증빙 미확보 시 본문에서 이 문장 제외</span> 버튼:</strong> 대행사에서 증빙 자료를 받지 못했다면 이 버튼만 누르면 <strong>기사 본문에서 해당 위험 문장이 즉시 삭제</strong>됩니다!</li>
            <li><strong>2. 보도자료 내 추출된 수치·일정·인용구:</strong> 기사에 안전하게 사용할 수 있는 팩트 목록을 분류해 보여줍니다.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>2. 기사 초안 작성 페이지 가이드 — 원문 비교 보기 및 우측 규정리포트·증빙팩트 탭</span>
      <span>Slide 10 / 12</span>
    </div>
  </section>

  <!-- SLIDE 11: 2-6. 우측 패널 탭 3·4 (출처 / 원문) & 중앙 하단 S10 승인 및 CMS 복사 -->
  <section class="slide">
    <div class="slide-header">
      <div class="slide-header-left">
        <span class="chapter-badge green">2. 승인 및 CMS 복사</span>
        <span class="slide-title">중앙 편집기 (3/3) — 수정 저장 · S10 검수 승인 체크리스트 · CMS 복사</span>
      </div>
      <span class="slide-subtitle">담당자가 체크리스트를 모두 확인하고 승인해야만 CMS 복사 잠금이 해제됩니다 (Human-in-the-loop)</span>
    </div>

    <div class="slide-body">
      <div class="col-img" style="flex-direction: row; gap: 12px;">
        <div class="screenshot-frame" style="flex: 0.9;">
          <div class="screenshot-caption">
            <span>[화면 9] 우측 패널 — [출처] 탭</span>
          </div>
          <img src="images/09-right-sources-tab.png" alt="우측 출처 탭" />
        </div>
        <div class="screenshot-frame" style="flex: 1.1;">
          <div class="screenshot-caption">
            <span>[화면 10] 하단 캡션 · S10 승인 체크리스트 · CMS 복사</span>
          </div>
          <img src="images/10-approval-cms-copy.png" alt="하단 승인 및 CMS 복사 영역" />
        </div>
      </div>

      <div class="col-desc">
        <div class="info-card">
          <h3><span class="num-badge">1</span> 우측 탭 ③·④: [출처] 탭 & [보도자료원문] 탭</h3>
          <ul>
            <li><strong>[출처(N)] 탭 (좌측 이미지):</strong> S1(중복 점검), S2(홈페이지 검증), S6(경쟁사 비교 조사) 단계에서 수집된 <strong>외부 뉴스·공식 홈페이지 근거 URL</strong>이 모두 저장되어 있으며 클릭 시 새 창으로 열립니다.</li>
            <li><strong>[보도자료원문] 탭:</strong> 처음에 붙여넣었던 보도자료 원본 텍스트를 언제든 다시 확인할 수 있습니다.</li>
          </ul>
        </div>

        <div class="info-card">
          <h3><span class="num-badge">2</span> [수정 저장 및 하드룰 재검사] 버튼 (편집기 우측 상단)</h3>
          <ul>
            <li>제목·부제목·본문·캡션을 수정한 뒤 <strong><span class="ui-pill">💾 수정 저장 및 하드룰 재검사</span></strong>를 누르면 수정된 내용이 DB에 저장됨과 동시에 하드룰(FMT-01~12)을 다시 검사하여 우측 <code>규정리포트</code>를 최신 상태로 갱신합니다.</li>
          </ul>
        </div>

        <div class="info-card green">
          <h3><span class="num-badge green">3</span> 하단 S10 승인 전 필수 확인 체크리스트 & CMS 복사 버튼 (우측 이미지)</h3>
          <ul>
            <li><strong>체크리스트 전체 체크:</strong> 일반 모드는 4개 항목, 비교·기획 모드는 8개 항목(경쟁사 출처 확인·비방 없음·문장 복사 없음 등 포함)을 모두 체크해야 승인 버튼이 활성화됩니다.</li>
            <li><strong><span class="ui-pill primary">검수 승인 완료 (CMS 복사 잠금 해제)</span> 클릭:</strong> 수정본이 자동 저장되고 승인 기록(승인자·시각)이 남으며, 복사 버튼 잠금이 해제됩니다.</li>
            <li><strong>CMS 붙여넣기용 복사 버튼 5종:</strong>
              <br />• <strong><span class="ui-pill primary">📋 CMS용 전체 복사</span>:</strong> <code>[제목] + [부제목] + [본문] + [사진 캡션] (+ AI 고지문구)</code>를 서식 없는 깔끔한 텍스트로 한 번에 복사합니다.
              <br />• <strong>[제목만 복사] [부제목만 복사] [본문만 복사] [캡션만 복사]:</strong> 매경 CMS 입력칸이 나뉘어 있을 때 각 칸에 개별 붙여넣기 할 수 있습니다.
              <br />※ <em>주의: 화면의 규정 리포트, 체크리스트, 경고 배너, 출처 목록은 화면 검수 전용이므로 복사 텍스트에는 절대 섞여 들어가지 않습니다.</em>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>2. 기사 초안 작성 페이지 가이드 — S10 승인 체크리스트 및 CMS 텍스트 복사</span>
      <span>Slide 11 / 12</span>
    </div>
  </section>

  <!-- SLIDE 12: 부록 — 반려(REJECT)·보류(HOLD) 대처법 및 실무자 FAQ -->
  <section class="slide">
    <div class="slide-header">
      <div class="slide-header-left">
        <span class="chapter-badge purple">부록 · 예외 상황 및 FAQ</span>
        <span class="slide-title">반려(REJECT)·보류(HOLD) 판정 시 실무 대처법 및 자주 묻는 질문 (FAQ)</span>
      </div>
      <span class="slide-subtitle">실무진이 작업 중 마주칠 수 있는 모든 예외 상황과 해결 방법</span>
    </div>

    <div class="slide-body" style="flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px;">
        <div class="info-card highlight">
          <h3>⛔ 반려(REJECT) 모달 알림이 떴을 때 어떻게 하나요?</h3>
          <ul>
            <li><strong>발생 원인:</strong> 공식 홈페이지 미확인(인스타그램·블로그 등 SNS만 운영) 또는 코인·다단계·비상장주 투자 유도·미검증 바이오 등 게재 불가 제한 소재가 감지되면 S3 단계 직후 작성을 멈추고 <strong>반려 알림 창(모달)</strong>을 띄웁니다.</li>
            <li><strong>대행사 반려 전달 시:</strong> 모달 하단의 <strong><span class="ui-pill">[반려 문구 복사]</span></strong> 버튼을 누르면 정중한 표준 반려 안내 문구가 클립보드에 복사되어 대행사 메신저/메일로 바로 전달할 수 있습니다.</li>
            <li><strong>예외적으로 기사를 작성해야 할 때 ([그래도 진행]):</strong> 팀장 사전 승인이나 별도 공식 도메인 확인 등으로 작성을 계속해야 한다면 모달 우측 하단 <strong><span class="ui-pill reject">[그래도 진행]</span></strong>을 클릭 → <strong>무시 진행 사유를 입력</strong> → <strong>[사유 기록 후 기사 초안 작성 강행]</strong>을 누르면 감사 로그에 기록된 후 S4~S10 초안 작성이 정상 완료됩니다.</li>
          </ul>
        </div>

        <div class="info-card blue">
          <h3>⚠️ 보류(HOLD) 상단 노란색 배너가 떴을 때 어떻게 하나요?</h3>
          <ul>
            <li><strong>발생 원인:</strong> 기사 초안은 정상적으로 작성되었으나, ① 포털 동일 기사 3건 이상 중복(S1), ② 부동산 분양·기부 등 주의 소재(S3), ③ 특허·매출 수치·대기업 언급 등 증빙 확인 필요 문장(S4)이 포함된 경우 상단에 노란색 보류 배너가 표시됩니다.</li>
            <li><strong>해결 방법:</strong>
              <br />1) 우측 패널 <strong><code>[증빙·팩트]</code> 탭</strong>을 열어 주황색 카드로 표시된 증빙 필요 문장을 확인합니다.
              <br />2) 대행사로부터 증빙을 확인했다면 그대로 하단 체크리스트를 체크해 승인하시면 됩니다.
              <br />3) 만약 증빙을 받기 어렵다면 해당 카드 하단의 <strong>[증빙 미확보 시 본문에서 이 문장 제외]</strong> 버튼을 누른 뒤 <strong>[수정 저장 및 하드룰 재검사]</strong>를 클릭하면 깔끔하게 해결됩니다.
            </li>
          </ul>
        </div>
      </div>

      <div class="info-card" style="flex: 1;">
        <h3>🙋 실무진이 가장 자주 묻는 질문 (FAQ 6선)</h3>
        <table class="guide-table" style="margin-top: 6px;">
          <thead>
            <tr>
              <th style="width: 340px;">질문 (Question)</th>
              <th>해결 방법 (Answer)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Q1. AI가 고친 단어(예: <code>유일한 → 차별화된</code>)가 본문 어디에 있는지 한눈에 보고 싶어요.</strong></td>
              <td>편집기 상단 파란색 교열 내역 박스에서 <strong><span class="ui-pill info">📍 본문 N문단 위치 보기</span></strong>를 클릭하세요. 해당 문단으로 화면이 바로 이동하며, 문단 입력창 위에 <strong><code>[교열 1] 유일한 → 차별화된</code></strong> 위치가 초록색 배지로 하이라이트되어 나타납니다.</td>
            </tr>
            <tr>
              <td><strong>Q2. 교열 내역 박스나 본문 입력창이 작아서 답답할 때는 어떻게 키우나요?</strong></td>
              <td>① 편집기 우측 상단 <strong>[편집기 넓게 보기 (좌우 패널 접기)]</strong>로 가로 폭을 최대로 넓히고, ② 교열 박스의 <strong>[교열 영역 크게 보기]</strong> 또는 본문 상단의 <strong>[입력창 일괄 크게 보기]</strong>를 누르세요. 각 박스 우측 하단 모서리를 마우스로 드래그해 높이를 직접 늘릴 수도 있습니다.</td>
            </tr>
            <tr>
              <td><strong>Q3. 타 매체에 이미 나간 보도자료와 문단 순서를 다르게 바꾸고 싶어요.</strong></td>
              <td>기본적으로 AI가 1문단(리드)과 마지막 문단(인용구)은 유지한 채 2문단과 3문단을 교차 배치합니다. 추가로 바꾸고 싶다면 본문 상단 <strong>[🔀 중간 문단 순서 재배치]</strong> 버튼을 누르거나 각 문단의 <strong>[↑ 위로] / [↓ 아래로]</strong> 버튼을 클릭하세요.</td>
            </tr>
            <tr>
              <td><strong>Q4. 비교·기획 기사 모드는 일반 모드와 무엇이 다른가요?</strong></td>
              <td>보도자료 기업 한 곳만 다루지 않고, <strong>동종업계 경쟁사·유사 브랜드 2~3곳의 시장 동향과 대상 기업의 차별화 포인트를 비교 분석하는 기획 문단 2개</strong>를 본문에 함께 작성해 주는 모드입니다. 편집기 상단 보라색 카드에서 조사된 타 브랜드와 출처를 확인할 수 있습니다.</td>
            </tr>
            <tr>
              <td><strong>Q5. 하단 [CMS용 전체 복사] 버튼이 비활성화(회색)되어 안 눌려요.</strong></td>
              <td>담당자 검수 없이 AI 초안이 바로 유출되는 것을 막기 위한 안전장치(PRD F14)입니다. 편집기 맨 아래 <strong>[승인 전 필수 확인 체크리스트]의 체크박스를 모두 체크</strong>한 뒤 <strong>[검수 승인 완료 (CMS 복사 잠금 해제)]</strong>를 누르면 모든 복사 버튼이 즉시 활성화됩니다.</td>
            </tr>
            <tr>
              <td><strong>Q6. 테스트로 만든 작업을 목록에서 지우고 싶어요.</strong></td>
              <td>홈 화면(<code>/jobs</code>) 작업 목록 표의 맨 오른쪽 열(작성 일시 옆)에 있는 <strong>[🗑️ 휴지통 버튼]</strong>을 누르면 확인 창을 거쳐 즉시 삭제됩니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="slide-footer">
      <span>부록 — 반려·보류 판정 대처법 및 실무자 FAQ</span>
      <span>Slide 12 / 12</span>
    </div>
  </section>
</body>
</html>`;

fs.writeFileSync(HTML_PATH, htmlContent, "utf8");
console.log("Wrote HTML guide:", HTML_PATH);

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve);
      this.ws.addEventListener("error", reject);
    });
    this.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data.toString());
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function renderPdf() {
  const userDataDir = path.resolve(".tmp-chrome-pdf");
  fs.mkdirSync(userDataDir, { recursive: true });

  const chrome = spawn(
    CHROME_PATH,
    [
      "--headless=new",
      "--remote-debugging-port=9234",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${userDataDir}`,
    ],
    { stdio: "ignore" }
  );

  try {
    let pageTarget = null;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch("http://127.0.0.1:9234/json/list");
        const targets = await res.json();
        pageTarget = targets.find((t) => t.type === "page");
        if (pageTarget) break;
      } catch {
        // wait
      }
      await sleep(500);
    }

    if (!pageTarget) {
      throw new Error("Failed to connect to headless Chrome on 9234");
    }

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");

    const fileUrl =
      "file:///" + HTML_PATH.replace(/\\/g, "/");
    await cdp.send("Page.navigate", { url: fileUrl });
    await sleep(3000);

    const { data } = await cdp.send("Page.printToPDF", {
      landscape: false,
      printBackground: true,
      paperWidth: 16,
      paperHeight: 9,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      preferCSSPageSize: true,
    });

    const pdfBuffer = Buffer.from(data, "base64");
    fs.writeFileSync(PDF_PATH_KO, pdfBuffer);
    fs.writeFileSync(PDF_PATH_EN, pdfBuffer);
    console.log("Generated PDF:", PDF_PATH_KO, `(${pdfBuffer.length} bytes)`);

    cdp.close();
  } finally {
    chrome.kill();
  }
}

renderPdf().catch((err) => {
  console.error(err);
  process.exit(1);
});
