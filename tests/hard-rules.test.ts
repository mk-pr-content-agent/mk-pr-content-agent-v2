import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import {
  loadBannedWords,
  loadHardRules,
  loadRejectMessages,
  loadRestrictedTopics,
} from "@/lib/rules/loader";
import {
  checkFmt01,
  checkFmt02,
  checkFmt03,
  checkFmt04,
  checkFmt05,
  checkFmt07,
  checkFmt08,
  checkFmt12,
  countBodyCharsWithSpaces,
  runHardRules,
  type ArticleInput,
} from "@/lib/rules/hard-rules";

function makeBaseArticle(overrides: Partial<ArticleInput> = {}): ArticleInput {
  const defaultBody = "가".repeat(1250);
  return {
    title: "매경테스트기업, 차세대 인공지능 물류 자동화 플랫폼 신규 출시",
    subtitle: "물류 처리 속도 30% 향상, 전국 주요 거점 센터 단계적 도입",
    body: defaultBody,
    captions: ["매경테스트기업 연구진이 플랫폼을 시연하고 있다. [제공=매경테스트기업]"],
    ...overrides,
  };
}

describe("Rulebook YAML Loader (M1)", () => {
  it("loads hard-rules.yaml, restricted-topics.yaml, reject-messages.yaml, and banned-words.yaml", () => {
    const hardRules = loadHardRules();
    expect(hardRules.has("FMT-01")).toBe(true);
    expect(hardRules.has("FMT-12")).toBe(true);
    expect(hardRules.get("FMT-01")?.severity).toBe("BLOCK");
    expect(hardRules.get("FMT-01")?.detector).toBe("code");

    const restricted = loadRestrictedTopics();
    expect(restricted.ad_article_restricted_materials.length).toBeGreaterThanOrEqual(10);
    expect(restricted.workflow_restricted_topics.length).toBe(15);

    const rejects = loadRejectMessages();
    expect(rejects.reject_messages.length).toBe(7);
    expect(rejects.reject_messages[0].message).toBe(
      "공식 홈페이지가 확인되지 않아 게재가 어렵습니다. 공식 홈페이지 확인 후 다시 요청해 주시기 바랍니다."
    );

    const banned = loadBannedWords();
    expect(banned.superlative_terms.length).toBeGreaterThan(5);
    expect(banned.promotional_tones.length).toBeGreaterThan(5);
  });
});

describe("FMT-01: 전화번호·홈페이지 주소·종목코드·QR코드 노출 금지", () => {
  const violations = [
    "문의는 고객센터(02-1234-5678)로 하면 된다.",
    "자세한 사항은 대표번호 1588-1234에서 안내한다.",
    "공식 홈페이지(https://www.example.co.kr)에서 신청할 수 있다.",
    "접수는 www.mk-event.com 및 mk-event.co.kr에서 진행한다.",
    "상장사 테스트기업(005930)은 신규 설비를 도입하고 포스터 하단 QR코드를 통해 안내했다.",
  ];

  it.each(violations)("detects violation (BLOCK): %s", (text) => {
    const findings = checkFmt01(makeBaseArticle({ body: text }));
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0].ruleId).toBe("FMT-01");
    expect(findings[0].severity).toBe("BLOCK");
  });

  const passes = [
    "공모 및 시상식에 대한 자세한 내용은 공식 홈페이지에서 확인할 수 있다.",
    "관련 문의는 위원회 사무국으로 하면 된다.",
    "지난 2026년 9월부터 2034년 2월까지 총 55억 원의 사업비를 지원받는다.",
    "이번 행사는 오는 9월 1일부터 10월 31일까지 진행된다.",
    "언리얼 엔진 5.1 기반의 4K UHD 그래픽을 적용해 몰입감을 높였다.",
  ];

  it.each(passes)("passes clean text: %s", (text) => {
    const findings = checkFmt01(makeBaseArticle({ body: text }));
    expect(findings).toHaveLength(0);
  });
});

describe("FMT-02: 면적 ㎡ 표기 (평 단독 표기 금지, 330㎡(100평) 허용)", () => {
  it("converts 100평 -> 330㎡ or 330㎡(100평) in suggestion", () => {
    const findings = checkFmt02(
      makeBaseArticle({ body: "이번에 개관한 전시관은 약 100평 규모로 조성됐다." })
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe("FMT-02");
    expect(findings[0].severity).toBe("WARN");
    expect(findings[0].suggestion).toContain("330㎡");
    expect(findings[0].suggestion).toContain("330㎡(100평)");
  });

  const violations = [
    "신규 매장은 100평 규모로 문을 열었다.",
    "전용면적 25평형 아파트 단지를 공급한다.",
    "총 1,500평 부지에 물류센터를 건립했다.",
    "실내 연습장은 45.5평 크기로 설계됐다.",
    "커뮤니티 시설로 300평 규모의 실내 체육관이 들어선다.",
  ];

  it.each(violations)("detects pyeong violation: %s", (text) => {
    const findings = checkFmt02(makeBaseArticle({ body: text }));
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0].ruleId).toBe("FMT-02");
  });

  const passes = [
    "신규 매장은 330㎡ 규모로 문을 열었다.",
    "신규 매장은 330㎡(100평) 규모로 문을 열었다.",
    "연면적 1,650제곱미터(500평) 규모의 연구동을 준공했다.",
    "전용면적 84㎡ 단일 평형으로 구성됐다.",
    "학생들의 평균 성적과 전문가 평가를 종합적으로 반영했다.",
  ];

  it.each(passes)("passes valid sqm or non-area text: %s", (text) => {
    const findings = checkFmt02(makeBaseArticle({ body: text }));
    expect(findings).toHaveLength(0);
  });
});

describe("FMT-03: 상세 주소(번지·도로명 건물번호) 표기 제한", () => {
  const violations = [
    "본사는 서울 강남구 역삼동 823-12에 위치해 있다.",
    "행사는 서울 서초구 양재동 24번지에서 열린다.",
    "신규 공장은 경기도 화성시 정남면 104-5에 준공됐다.",
    "팝업스토어는 서울 성동구 연무장길 45에서 운영된다.",
    "견본주택은 서울 강남구 테헤란로 152에 마련됐다.",
  ];

  it.each(violations)("detects detailed address violation: %s", (text) => {
    const findings = checkFmt03(makeBaseArticle({ body: text }));
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0].ruleId).toBe("FMT-03");
    expect(findings[0].severity).toBe("WARN");
  });

  const passes = [
    "견본주택은 서울 강남구 역삼동 일대에 마련됐다.",
    "행사는 서울 양재 엘타워에서 개최된다.",
    "서울 중구청과 친환경 포장재 지원 협약식을 가졌다.",
    "서울 10개 골목 상권 내 가맹점 방문 시 혜택을 제공한다.",
    "12월 17일 예술의전당 콘서트홀에서 공연을 선보인다.",
  ];

  it.each(passes)("passes general location text: %s", (text) => {
    const findings = checkFmt03(makeBaseArticle({ body: text }));
    expect(findings).toHaveLength(0);
  });
});

describe("FMT-04: 제목 글자 수 (28~45자 통과, 범위 밖 WARN)", () => {
  const violationTitles = [
    "짧은 제목 테스트", // 9자
    "낫소 스크린 파크골프 출시", // 14자
    "숭실대 연구생활장려금 선정 발표", // 17자
    "매우 짧은 기사 제목입니다", // 14자
    "매경테스트기업이 인공지능과 빅데이터 기술을 결합한 차세대 통합 물류 자동화 솔루션을 공식 출시하고 글로벌 시장 진출을 선언했다", // 70자
  ];

  it.each(violationTitles)("detects out-of-range title length: %s", (title) => {
    const findings = checkFmt04(makeBaseArticle({ title }));
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe("FMT-04");
    expect(findings[0].severity).toBe("WARN");
  });

  const passTitles = [
    "국민대 이도연 교수 ‘세계 최상위 2% 연구자’ 첫 선정", // 31자
    "한국인터넷전문가협회 ‘아이어워즈 2026’ 수상후보 공모 시작", // 34자
    "숭실대, 과기정통부 ‘2026년 이공계 연구생활장려금 지원 사업’ 선정", // 39자
    "낫소, 생활체육 접근성 높인다… 이동형 스크린 파크골프 부스 출사표", // 37자
    "BC카드, 취약계층 보호 나선다… 김영우 사장 ‘사람 살리는 금융’ 참여", // 40자
  ];

  it.each(passTitles)("passes valid title length (28~45 chars): %s", (title) => {
    const findings = checkFmt04(makeBaseArticle({ title }));
    expect(findings).toHaveLength(0);
  });
});

describe("FMT-05: 본문 공백 포함 글자 수 (1,200~1,500자 목표)", () => {
  it("explicitly counts Korean, English, spaces, and punctuation (excluding line breaks)", () => {
    const sample = "한글 ABC 123, ‘따옴표’!\n둘째 줄입니다.";
    // "한글"(2) + " "(1) + "ABC"(3) + " "(1) + "123,"(4) + " "(1) + "‘따옴표’!"(6) + "둘째"(2) + " "(1) + "줄입니다."(5) = 26자
    expect(countBodyCharsWithSpaces(sample)).toBe(26);
  });

  const violationBodies = [
    "짧은 본문입니다.", // 9자
    "가나다라마바사 아자차카타파하 ".repeat(30), // 480자
    "ABC 123 가나다! ".repeat(50), // 650자 (1200자 미달)
    "글자수미달 ".repeat(190), // 1140자 (1200자 미달)
    "글자수초과 ".repeat(260), // 1560자 (1500자 초과)
  ];

  it.each(violationBodies)(
    "detects body length outside 1,200~1,500 chars (len=%i)",
    (body) => {
      const findings = checkFmt05(makeBaseArticle({ body }));
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe("FMT-05");
      expect(findings[0].severity).toBe("WARN");
    }
  );

  const passBodies = [
    "가".repeat(1200), // 정확히 1200자
    "한글과 영문 AI 2026, 공백 포함! ".repeat(55), // 23 * 55 = 1265자
    "단락1입니다.\n\n단락2입니다. ".repeat(85), // 15 * 85 = 1275자 (개행 제외)
    "나".repeat(1380), // 1380자
    "다".repeat(1500), // 정확히 1500자
  ];

  it.each(passBodies)("passes body length within 1,200~1,500 chars", (body) => {
    const findings = checkFmt05(makeBaseArticle({ body }));
    expect(findings).toHaveLength(0);
  });
});

describe("FMT-07: 홍보체 금지 및 '~밝혔다' 반복(3회 이상) 억제", () => {
  const violations = [
    "이번 신제품은 뛰어난 내구성을 자랑합니다.",
    "당사는 업계 최고 수준의 기술력을 자랑한다.",
    "고객 여러분의 많은 관심 부탁드립니다.",
    "새로운 솔루션을 선보입니다.",
    "관계자는 출시 배경을 밝혔다. 이어 향후 계획도 밝혔다. 마지막으로 포부를 밝혔다.",
  ];

  it.each(violations)("detects promotional tone or repeated 밝혔다: %s", (bodyText) => {
    const paddedBody = bodyText + " " + "가".repeat(1220);
    const findings = checkFmt07(makeBaseArticle({ body: paddedBody }));
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0].ruleId).toBe("FMT-07");
    expect(findings[0].severity).toBe("WARN");
  });

  const passes = [
    "관계자는 출시 배경을 밝혔다. 이어 향후 계획을 설명했다. 마지막으로 포부를 전했다.",
    "첫 문단에서 사업 선정을 밝혔다. 말미 인용에서 노력을 다하겠다고 밝혔다.",
    "이번 제품은 무용접 조립 구조를 적용해 설치 편의성을 높였다.",
    "지자체와 공공기관을 중심으로 생활체육 보급을 확대할 계획이다.",
    "참여 기업에 실질적인 비즈니스 인사이트를 제공한다.",
  ];

  it.each(passes)("passes objective journalistic tone: %s", (bodyText) => {
    const paddedBody = bodyText + " " + "가".repeat(1220);
    const findings = checkFmt07(makeBaseArticle({ body: paddedBody }));
    expect(findings).toHaveLength(0);
  });
});

describe("FMT-08: 최상급·단정 표현 (/data/banned-words.yaml 기반)", () => {
  const violations = [
    "당사는 세계 최고 수준의 반도체 패키징 기술을 보유하고 있다.",
    "이번 행사는 국내 최대 규모의 정보통신 시상식으로 열린다.",
    "참여 기업에 가치를 제공한다는 점에서 독보적인 차별성을 지닌다.",
    "명실상부한 국내 최고 권위의 시상식으로 자리매김했다.",
    "한 해 동안 혁신적인 성과를 거둔 서비스를 총망라하고 압도적인 스케일을 선사한다.",
  ];

  it.each(violations)("detects superlative/exaggerated terms from YAML: %s", (bodyText) => {
    const findings = checkFmt08(makeBaseArticle({ body: bodyText }));
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0].ruleId).toBe("FMT-08");
    expect(findings[0].severity).toBe("WARN");
  });

  const passes = [
    "이도연 교수는 물리치료와 재활과학을 기반으로 보건의료 연구를 수행해 왔다.",
    "숭실대는 2026년 9월부터 총 약 55억 원의 사업비를 지원받을 예정이다.",
    "언리얼 엔진 5.1 기반의 고화질 그래픽을 적용해 가상 필드를 구현했다.",
    "소상공인의 비용 절감 및 친환경 유통 환경 조성을 위해 협약식을 가졌다.",
    "차이코프스키의 바이올린 협주곡과 라흐마니노프의 피아노 협주곡이 연주된다.",
  ];

  it.each(passes)("passes neutral factual sentences: %s", (bodyText) => {
    const findings = checkFmt08(makeBaseArticle({ body: bodyText }));
    expect(findings).toHaveLength(0);
  });
});

describe("FMT-12: 사진 캡션 '설명 + 제공자' 구조 및 괄호 형식 통일", () => {
  const violationCaptions = [
    "<출처=(사)한국인터넷전문가협회>", // 설명 누락 + 꺾쇠 괄호
    "국민대학교 교양대학 이도연 교수. <제공=국민대학교>", // 꺾쇠 괄호 형식
    "숭실대가 사업에 선정됐다.<사진=숭실대 캠퍼스 전경>", // 꺾쇠 괄호 + 사진=
    "낭만주의 거장 말러&라흐마니노프&차이코프스키 [출처:밀레니엄심포니오케스트라]", // [출처:] 형식
    "제공자 표기가 전혀 없는 일반 사진 설명 문구입니다.", // 제공자 누락
  ];

  it.each(violationCaptions)("detects caption structure or format issue: %s", (caption) => {
    const findings = checkFmt12(makeBaseArticle({ captions: [caption] }));
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe("FMT-12");
    expect(findings[0].severity).toBe("WARN");
  });

  const passCaptions = [
    "스포츠용품 전문기업 ㈜낫소가 이동형 스크린 파크골프 부스를 선보인다. [제공=낫소]",
    "BC카드 ‘사람 살리는 금융’ 캠페인에 동참 [제공=BC카드]",
    "국민대학교 교양대학 이도연 교수. [제공=국민대학교]",
    "숭실대학교 캠퍼스 전경. [제공=숭실대학교]",
    "밀레니엄심포니오케스트라 공연 포스터. [제공=밀레니엄심포니오케스트라]",
  ];

  it.each(passCaptions)("passes canonical caption format: %s", (caption) => {
    const findings = checkFmt12(makeBaseArticle({ captions: [caption] }));
    expect(findings).toHaveLength(0);
  });
});

describe("Samples evaluation (/samples/*.md against runHardRules)", () => {
  it("parses all 6 published sample articles and produces zero false-positive BLOCK findings", () => {
    const samplesDir = path.join(process.cwd(), "samples");
    const files = fs
      .readdirSync(samplesDir)
      .filter((f) => f.endsWith(".md") && f !== "README.md")
      .sort();

    expect(files.length).toBe(6);

    for (const file of files) {
      const raw = fs.readFileSync(path.join(samplesDir, file), "utf-8");
      const titleMatch = /^제목:\s*(.+)$/m.exec(raw);
      const subtitleSection = /## 부제목\r?\n([\s\S]*?)\r?\n## 본문/.exec(raw);
      const bodySection = /## 본문\r?\n([\s\S]*?)\r?\n## 사진 캡션/.exec(raw);
      const captionSection = /## 사진 캡션\r?\n([\s\S]*)$/.exec(raw);

      const title = titleMatch?.[1]?.trim() ?? "";
      const subtitleRaw = subtitleSection?.[1]?.trim() ?? "";
      const subtitle = subtitleRaw === "없음" ? "" : subtitleRaw;
      const body = bodySection?.[1]?.trim() ?? "";
      const caption = captionSection?.[1]?.trim() ?? "";

      const findings = runHardRules({
        title,
        subtitle,
        body,
        captions: caption ? [caption] : [],
      });

      const blockFindings = findings.filter((f) => f.severity === "BLOCK");
      expect(blockFindings).toHaveLength(0);
    }
  });
});
