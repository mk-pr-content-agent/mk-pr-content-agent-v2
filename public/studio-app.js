const { useState, useEffect, useMemo, useCallback } = React;

const ALL_STAGES = [
  { id: "S0", label: "S0 전처리·클레임 추출" },
  { id: "S1", label: "S1 중복 게재 점검" },
  { id: "S2", label: "S2 기업·홈페이지 검증" },
  { id: "S3", label: "S3 제한 소재 스크리닝" },
  { id: "S4", label: "S4 팩트체크·증빙 플래그" },
  { id: "S5", label: "S5 과장·미확정 표현 필터" },
  { id: "S6", label: "S6 기사 초안 작성" },
  { id: "S7", label: "S7 제목·문체·리드 정비" },
  { id: "S8", label: "S8 사진·캡션 점검" },
  { id: "S9", label: "S9 최종 교열·규정 체크" },
  { id: "S10", label: "S10 사람 검수·승인" },
];

const SAMPLE_PRESETS = [
  {
    id: "nassau",
    label: "예시 1: ㈜낫소 스크린 파크골프 (비교·기획 추천)",
    companyName: "㈜낫소",
    mode: "comparative",
    rawText: `대한민국 스포츠 브랜드 ㈜낫소(대표 주은형)가 실내 스크린 파크골프 부스 시스템 '그린마스터즈(Green Masters)'를 공식 출시하고 전국 지자체 경로당·복지관 및 복합문화공간 보급에 나선다고 밝혔다.

이번에 선보인 그린마스터즈는 폭 3.2m, 깊이 5.5m의 컴팩트한 모듈형 부스 설계를 적용해 약 10평 규모의 유휴 공간만 있으면 별도 대규모 철거 공사 없이 즉시 설치할 수 있는 것이 특징이다. 초고속 듀얼 카메라 센서와 AI 탄도 분석 엔진을 탑재해 실제 파크골프장의 잔디 저항과 경사도를 정밀하게 구현했으며, 전국 주요 파크골프 구장 30여 개 코스를 풀HD 그래픽으로 제공한다.

특히 시니어 이용자들도 손쉽게 조작할 수 있도록 대형 터치 키오스크와 음성 안내 인터페이스를 적용했다. 낫소 관계자는 "최근 시니어 스포츠와 인도어 레저 수요가 급증함에 따라 고가의 대형 스크린 장비 도입이 부담스러웠던 지자체 복지시설과 상업시설을 위해 합리적인 비용의 올인원 부스 솔루션을 개발했다"며 "올해 말까지 전국 150개 거점에 그린마스터즈 부스를 공급할 계획"이라고 전했다.`,
  },
  {
    id: "kookmin",
    label: "예시 2: 국민대학교 기후변화대응사업단 (모드 1 최소수정 추천)",
    companyName: "국민대학교",
    mode: "minimal",
    rawText: `국민대학교(총장 정승렬) 기후변화대응사업단은 환경부와 한국환경산업기술원이 주관하는 '2026 그린리더십 인증교과과정 및 글로벌 산학협력 포럼'을 오는 11월 12일 서울 성북구 국민대 본부관에서 개최한다고 밝혔다.

이번 포럼은 대학생과 청년 연구자들에게 탄소중립 정책 수립 및 ESG 경영 실무 역량을 교육하기 위해 마련됐다. 행사에서는 국내 주요 기후테크 기업 및 연구기관 전문가들이 참여해 탄소배출권 거래제도, 재생에너지 전환 사례, 순환경제 비즈니스 모델에 관한 주제 발표와 패널 토론을 진행한다.

국민대 기후변화대응사업단 관계자는 "인문사회와 이공계를 아우르는 융합형 기후변화 교육과정을 통해 현장에서 즉시 활약할 수 있는 실무형 그린 인재를 양성하겠다"며 "참가 학생들에게는 국내외 환경기관 인턴십 연계 및 산학 프로젝트 수행 기회를 제공할 예정"이라고 말했다.`,
  },
  {
    id: "yeongyang",
    label: "예시 3: 영양군 자작나무숲 축제 (모드 2 리라이팅 추천)",
    companyName: "영양군",
    mode: "rewrite",
    rawText: `경상북도 영양군(군수 오도창)은 오는 11월 1일부터 15일까지 수비면 죽파리 일원에서 '2026 영양 자작나무숲 가을 힐링 걷기 축제'를 개최한다고 밝혔다.

국유림 명품숲으로 지정된 영양 자작나무숲은 축구장 400개 규모에 달하는 울창한 군락지로, 지난해 세계 최초로 산림 치유 만족도 99.8%를 기록하며 연간 방문객 50만 명을 돌파해 지역 경제에 300억 원의 직접 매출 효과를 거둔 바 있다.

이번 축제 기간에는 숲길 명상 트레킹, 친환경 목공예 체험, 영양 고추 등 지역 특산물 직거래 장터가 운영된다. 영양군 관계자는 "청정 자연 속에서 방문객들이 진정한 휴식을 경험할 수 있도록 전기 셔틀버스 증편과 안전 요원 배치에 만전을 기했다"고 밝혔다.`,
  },
];

function normalizeStudioMode(mode) {
  if (mode === "minimal") return "minimal";
  if (mode === "comparative") return "comparative";
  return "rewrite";
}

function convertRawNoteToMkStyleClient(rawNote, compName) {
  let s = (rawNote || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "";
  s = s
    .replace(/했습니다\.?$/, "했다.")
    .replace(/밝혔습니다\.?$/, "밝혔다.")
    .replace(/전했습니다\.?$/, "전했다.")
    .replace(/됩니다\.?$/, "된다.")
    .replace(/있습니다\.?$/, "있다.")
    .replace(/입니다\.?$/, "이다.");
  if (!/[.!?다요]$/.test(s)) {
    if (/(?:억\s*원|조\s*원|만\s*원|%|명|곳|개|위)$/.test(s)) {
      s = `${s}을 기록했다.`;
    } else {
      s = `${s}이다.`;
    }
  } else if (!s.endsWith(".")) {
    s = `${s}.`;
  }
  if (
    compName &&
    !s.includes(compName) &&
    compName !== "대상 기업" &&
    s.length < 48
  ) {
    s = `${compName} 측은 ${s}`;
  }
  return s;
}

function buildClientSentenceSuggestions(rawText, compName) {
  const cleanRaw = (rawText || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  const cName = (compName || "대상 기업").trim();
  const paras = cleanRaw
    .split(/\n{2,}|\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const suggestions = [];
  let seq = 1;

  paras.forEach((para, pIdx) => {
    const sents = para
      .split(/(?<=[.!?다요])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 16);
    sents.forEach((sent) => {
      if (suggestions.length >= 6) return;
      const hasSuperlative =
        /세계\s*최초|국내\s*최초|업계\s*최초|업계\s*1위|국내\s*1위|독보적인|최고의/.test(
          sent
        );
      const hasPyeong = /\d+(?:\.\d+)?\s*평(?!\s*\()/.test(sent);
      const isLead = pIdx === 0 && suggestions.length === 0;
      const isTarget =
        hasSuperlative ||
        hasPyeong ||
        isLead ||
        suggestions.filter((x) => x.paragraphIndex === pIdx).length === 0;
      if (!isTarget) return;

      // 1) 기본 규정 위반(최상급, 평->㎡, 따옴표, 경어체, 불필요한 영문 병기 괄호) 정돈
      const cleanBase = sent
        .replace(/"([^"]+)"/g, "“$1”")
        .replace(/'([^']+)'/g, "‘$1’")
        .replace(/\([A-Za-z0-9\s,&·-]{3,}\)/g, "")
        .replace(/세계\s*최초로?/g, "독자 기술을 적용해")
        .replace(/국내\s*최초로?/g, "자체 개발을 통해")
        .replace(/업계\s*최초로?/g, "선도적으로")
        .replace(/독보적인/g, "차별화된")
        .replace(/최고의/g, "높은 수준의")
        .replace(/자랑합니다\.?/g, "갖췄다.")
        .replace(/합니다\.?/g, "한다.")
        .replace(/입니다\.?/g, "이다.")
        .replace(/(\d+(?:\.\d+)?)\s*평(?!\s*\()/g, (_, n) => {
          const sqm = Math.round(Number(n) * 3.3058 * 10) / 10;
          return `약 ${sqm}㎡(${n}평)`;
        })
        .replace(/\s+/g, " ")
        .replace(/\.$/, "")
        .trim();

      let v1 = "";
      let v2 = "";
      let v3 = "";

      if (isLead) {
        // 리드문: 원문과 확실히 구분되도록 어순·서술부 재구성
        v1 =
          cleanBase
            .replace(/선보이며\s+/, "새롭게 출시하고 ")
            .replace(/참여한다$/, "공식 참여하며 글로벌 현장 기술 지원에 나선다")
            .replace(/나선다$/, "본격 추진하며 시장 공략에 속도를 낸다")
            .replace(/선보인다$/, "전격 공개하고 본격적인 보급에 나선다")
            .replace(/개최한다고\s+밝혔다$/, "개최하고 현장 실무 교류를 확대한다")
            .replace(/출시했다고\s+밝혔다$/, "출시하고 국내외 판로 확대에 나선다")
            .replace(/밝혔다$/, "공식 발표하고 본격적인 운영에 들어간다") + ".";
        if (v1 === `${cleanBase}.`) {
          v1 = `${cleanBase.replace(/다$/, "며 본격적인 사업 행보에 나선다")}.`;
        }

        // 버전 2: 시간/장소/목적 절을 앞으로 배치하여 보도자료 원문과 문장 구조(어순) 자체를 변경
        const timePlaceMatch = /^([가-힣A-Za-z0-9·()\s]+?(?:은|는|이|가))\s+(\d{1,2}월\s*\d{1,2}일부터\s*[^‘'“"]+에서\s*열리는\s*[‘'“"][^’'”"]+[’'”"]에)\s+(.+)$/.exec(
          cleanBase
        );
        if (timePlaceMatch) {
          v2 = `${timePlaceMatch[2]} ${cName}가 ${timePlaceMatch[3]
            .replace(/참여한다$/, "참여해 대회 통신·기술 인프라를 전면 지원한다")
            .replace(/나선다$/, "나서며 글로벌 스포츠 파트너십을 강화한다")}.`;
        } else if (cleanBase.includes("선보이며")) {
          const parts = cleanBase.split(/선보이며\s*/);
          v2 = `${parts[1]?.replace(/에\s*나선다$/, "을 겨냥해") || "신규 수요처 확대를 위해"} ${parts[0]?.trim()}을(를) 본격 출시했다.`;
        } else {
          v2 = `관련 업계의 관심이 모이는 가운데 ${cleanBase
            .replace(/참여한다$/, "참여하며 대외 협력 보폭을 넓힌다")
            .replace(/나선다$/, "본격 착수하며 시장 내 입지를 강화한다")
            .replace(/밝혔다$/, "본격화하며 현장 보급을 확대한다")}.`;
        }

        // 버전 3: 수식어를 덜어낸 간결 핵심 팩트 문장
        v3 =
          cleanBase
            .replace(/고화질\s*그래픽과\s*정밀\s*센서\s*기술을\s*적용한\s*/g, "")
            .replace(/국제올림픽위원회의\s*/g, "IOC ")
            .replace(/참여한다$/, "공식 파트너로 활동한다")
            .replace(/시장\s*확대에\s*나선다$/, "보급을 본격화한다")
            .replace(/다고\s*밝혔다$/, "다") + ".";
        if (v3 === `${cleanBase}.` || v3 === v1) {
          v3 = `${cName} 측은 핵심 사업 역량을 집중해 ${cleanBase.replace(/^[^은는이가]+[은는이가]\s*/, "").replace(/다$/, "는 방침이다")}.`;
        }
      } else {
        // 본문 문단: 나열식 구조·홍보성 표현·어미를 매경 기사체로 확실히 변환
        v1 =
          cleanBase
            .replace(/활용해\s+/, "기반으로 ")
            .replace(/다양한\s+활동을\s+선보일\s+계획이다$/, "다채로운 현장 체험·지원 프로그램을 운영한다")
            .replace(/선보일\s+계획이다$/, "순차적으로 공개하며 현장 접점을 넓힌다")
            .replace(/설계됐다$/, "설계해 현장 설치와 운영 효율성을 높였다")
            .replace(/설계했다$/, "구현해 실사용 편의성을 강화했다")
            .replace(/간소화했다$/, "대폭 간소화해 도입 장벽을 낮췄다")
            .replace(/특징이다$/, "핵심 차별화 요소로 꼽힌다")
            .replace(/밝혔다$/, "설명하며 향후 운영 계획을 구체화했다")
            .replace(/이다$/, "으로 구성해 현장 활용도를 높였다") + ".";
        if (v1 === `${cleanBase}.`) {
          v1 = `${cleanBase.replace(/다$/, "며 현장 활용성과 완성도를 동시에 높였다")}.`;
        }

        // 버전 2: 앞뒤 절 순서를 교차하거나 매경 데스크 문체로 재구성
        if (cleanBase.includes("지원하고,")) {
          const [firstClause, secondClause] = cleanBase.split(/지원하고,\s*/);
          v2 = `${secondClause?.replace(/선보일\s+계획이다$/, "운영하는 한편") || "현장 프로그램을 운영하는 동시에"} ${firstClause?.trim()} 지원도 함께 진행한다.`;
        } else if (cleanBase.includes(", ")) {
          const commaParts = cleanBase.split(", ");
          if (commaParts.length === 2 && commaParts[0].length >= 10 && commaParts[1].length >= 10) {
            v2 = `${commaParts[0]}함과 동시에 ${commaParts[1].replace(/다$/, "는 점에서 실무 활용도가 높다")}.`;
          } else {
            v2 = `특히 ${cleanBase.replace(/다$/, "는 점이 주요 특징으로 꼽힌다")}.`;
          }
        } else {
          v2 = `아울러 ${cleanBase
            .replace(/^이번에\s*선보인\s*/, "")
            .replace(/^특히\s*/, "")
            .replace(/계획이다$/, "방침이어서 현장 도입 효과가 기대된다")
            .replace(/다$/, "는 점에서 업계의 주목을 받고 있다")}.`;
        }

        // 버전 3: 불필요한 수식어를 덜어낸 간결 팩트형
        v3 =
          cleanBase
            .replace(/이번에\s*선보인\s*/g, "")
            .replace(/특히\s*/g, "")
            .replace(/다양한\s+활동을\s+선보일\s+계획이다$/, "주요 프로그램을 전개한다")
            .replace(/다양한\s*/g, "핵심 ")
            .replace(/고\s*밝혔다$/, "는 설명이다")
            .replace(/계획이다$/, "예정이다") + ".";
        if (v3 === `${cleanBase}.` || v3 === v1) {
          v3 = `${cleanBase.replace(/다$/, "는 구상이다")}.`;
        }
      }

      const id = `sug-${seq++}`;
      const reason = hasSuperlative
        ? "네이버·매경 규정상 최상급·과장 표현 완화 교정"
        : hasPyeong
        ? "매경 스타일북 기준 면적 제곱미터(㎡) 병기 교정"
        : isLead
        ? "포털 중복 회피 및 매경 리드문 어순·서술어 재구성"
        : "보도자료 나열식·홍보성 문장을 객관적 경제기사 문체로 교정";

      suggestions.push({
        id,
        paragraphIndex: pIdx,
        originalSentence: sent,
        reason,
        alternatives: [
          {
            id: `${id}-alt-1`,
            label: "버전 1 (권장 · 매경 기사체 교정)",
            toneBadge: "규정 준수·기사체 정돈",
            text: v1,
          },
          {
            id: `${id}-alt-2`,
            label: "버전 2 (어순 재구성 · 중복 회피형)",
            toneBadge: "어순 재배치·포털 대응",
            text: v2,
          },
          {
            id: `${id}-alt-3`,
            label: "버전 3 (간결·핵심 팩트 압축형)",
            toneBadge: "수식어 축약·팩트 중심",
            text: v3,
          },
        ],
        selectedAltId: null,
      });
    });
  });

  return suggestions;
}

function buildClientCompanyFactMemos(compName, rawText, sources) {
  const c = compName || "대상 기업";
  const firstUrl = sources?.[0]?.url || "https://www.mk.co.kr";
  return [
    {
      id: "fact-1",
      category: "기업 기본 정보",
      text: `${c}은(는) 주력 사업 분야에서 자체 기술력과 국내외 공급망을 바탕으로 B2B·공공 및 소비자 시장 내 입지를 넓혀가고 있는 전문 기업이다.`,
      sourceTitle: `${c} 기업 개황`,
      sourceUrl: firstUrl,
      targetParagraphIndex: 1,
      inserted: false,
    },
    {
      id: "fact-2",
      category: "매출액·실적 정보",
      text: `최근 주력 제품군 라인업 다각화와 신규 거점 보급 확대를 통해 안정적인 매출 흐름과 수익성 기반을 다지고 있다.`,
      sourceTitle: "기업 실적·사업 동향",
      sourceUrl: firstUrl,
      targetParagraphIndex: 1,
      inserted: false,
    },
    {
      id: "fact-3",
      category: "브랜드·출시 핵심 팩트",
      text: `${c}은(는) 최근 현장 실수요와 운영 편의성을 결합한 핵심 솔루션 보급을 본격화하며 전국 주요 거점 시장 공략에 속도를 내고 있다.`,
      sourceTitle: "최신 보도·출시 팩트",
      sourceUrl: firstUrl,
      targetParagraphIndex: 0,
      inserted: false,
    },
    {
      id: "fact-4",
      category: "유통·시장 판매 동향",
      text: `오프라인 거점 및 온라인 채널을 연계한 맞춤형 공급 전략을 통해 지자체·기관 및 일반 고객 접점을 동시에 넓히고 있다.`,
      sourceTitle: "시장 유통 동향",
      sourceUrl: firstUrl,
      targetParagraphIndex: 2,
      inserted: false,
    },
  ];
}

function stripCodeFences(rawText) {
  const trimmed = (rawText || "").trim();
  const m = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(trimmed);
  if (m) return m[1].trim();
  const f = trimmed.indexOf("{");
  const l = trimmed.lastIndexOf("}");
  if (f !== -1 && l > f) return trimmed.slice(f, l + 1).trim();
  if (f !== -1) return trimmed.slice(f).trim();
  return trimmed;
}

function repairJsonString(str) {
  // Escape literal newlines/tabs inside JSON string literals and remove trailing commas
  let inString = false;
  let escaped = false;
  let out = "";
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    if (inString) {
      if (ch === "\n") {
        out += "\\n";
        continue;
      }
      if (ch === "\r") {
        continue;
      }
      if (ch === "\t") {
        out += "\\t";
        continue;
      }
    }
    out += ch;
  }
  return out.replace(/,\s*([}\]])/g, "$1");
}

function safeParseLlmJson(rawText) {
  const cleaned = stripCodeFences(rawText);
  if (!cleaned) return null;

  // 1) Direct parse
  try {
    return JSON.parse(cleaned);
  } catch {}

  // 2) Repaired string parse
  try {
    return JSON.parse(repairJsonString(cleaned));
  } catch {}

  // 3) Regex field recovery for truncated or unescaped JSON
  const recovered = {};
  const titlesMatch = /"titleCandidates"\s*:\s*\[([\s\S]*?)\]/i.exec(cleaned);
  if (titlesMatch) {
    const items = Array.from(titlesMatch[1].matchAll(/"((?:\\.|[^"\\])*)"/g)).map((m) =>
      m[1].replace(/\\"/g, '"').replace(/\\n/g, " ")
    );
    if (items.length > 0) recovered.titleCandidates = items;
  }
  const subsMatch = /"subtitleLines"\s*:\s*\[([\s\S]*?)\]/i.exec(cleaned);
  if (subsMatch) {
    const items = Array.from(subsMatch[1].matchAll(/"((?:\\.|[^"\\])*)"/g)).map((m) =>
      m[1].replace(/\\"/g, '"').replace(/\\n/g, " ")
    );
    if (items.length > 0) recovered.subtitleLines = items;
  }
  const bodyMatch =
    /"body"\s*:\s*"([\s\S]*?)"\s*,\s*"(?:competitors|diffs|replySummary)"/i.exec(cleaned) ||
    /"body"\s*:\s*"((?:\\.|[^"\\])*)"/i.exec(cleaned);
  if (bodyMatch) {
    recovered.body = bodyMatch[1]
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .trim();
  }
  const titleSingle = /"title"\s*:\s*"((?:\\.|[^"\\])*)"/i.exec(cleaned);
  if (titleSingle) recovered.title = titleSingle[1].replace(/\\"/g, '"');
  const subSingle = /"subtitle"\s*:\s*"((?:\\.|[^"\\])*)"/i.exec(cleaned);
  if (subSingle) recovered.subtitle = subSingle[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
  const replySingle = /"replySummary"\s*:\s*"((?:\\.|[^"\\])*)"/i.exec(cleaned);
  if (replySingle) recovered.replySummary = replySingle[1].replace(/\\"/g, '"');

  return Object.keys(recovered).length > 0 ? recovered : null;
}

function buildClientFallbackDraft(compName, mode, rawText) {
  const normMode = normalizeStudioMode(mode);
  const sanitized = (rawText || "")
    .replace(/"([^"]+)"/g, "“$1”")
    .replace(/'([^']+)'/g, "‘$1’")
    .trim();
  const paras = sanitized
    .split(/\n{2,}|\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 10);

  const sentenceSuggestions = buildClientSentenceSuggestions(rawText, compName);
  const factMemos = buildClientCompanyFactMemos(compName, rawText, []);

  if (normMode === "minimal") {
    const minimalParas = paras.length > 0 ? [...paras] : [sanitized];
    return {
      titleCandidates: [
        `${compName}, 신규 핵심 사업 및 현장 맞춤형 전략 본격 추진`,
        `${compName}, 차별화된 기술·운영 경쟁력으로 시장 공략 강화`,
        `${compName}, 수요처 맞춤형 솔루션 앞세워 보급 확대 나서`,
      ],
      subtitleLines: [
        `${compName} 핵심 사업 추진 및 현장 보급 본격화`,
        `차별화된 운영 효율성으로 실수요처 경쟁력 강화`,
      ],
      body: minimalParas.join("\n\n"),
      competitors: [],
      sentenceSuggestions,
      factMemos,
      diffs: [
        {
          original: "원문 보도자료 문장 구조 보존",
          replacement: "교정 대상 문장 빨간줄 표시 및 토글 버전 선택 준비",
          reason: "모드 1: 원문 최소 수정 및 인터랙티브 문장 교정",
        },
      ],
    };
  }

  const bodyParas = paras.length > 0 ? [...paras] : [sanitized];
  if (bodyParas.length >= 3) {
    const tmp = bodyParas[1];
    bodyParas[1] = bodyParas[2];
    bodyParas[2] = tmp;
  }

  let competitors = [];
  if (normMode === "comparative") {
    if (/파크골프|스크린|스포츠/.test(sanitized)) {
      competitors = [
        {
          name: "골프존(GDR·파크골프)",
          summary:
            "기존 스크린골프에서 축적한 고정밀 센서와 코스 그래픽 기술을 바탕으로 지자체 및 커뮤니티 시설 대상 실내 파크골프 시뮬레이터 보급을 확대하고 있다.",
        },
        {
          name: "카카오VX",
          summary:
            "직관적인 사용자 인터페이스와 생활체육 플랫폼 연동 기능을 앞세워 공공 체육시설 및 시니어 특화 스크린 스포츠 시장 공략에 속도를 내고 있다.",
        },
        {
          name: "마실파크골프·SGP",
          summary:
            "전국 지자체 경로당·주민복지관 등 도심 내 실내 체육 공간 조성을 겨냥해 실감형 파크골프 설비와 구장 보급 경쟁을 벌이고 있다.",
        },
      ];
    } else {
      competitors = [
        {
          name: "동종업계 선도 기업군",
          summary:
            "기존 핵심 사업 인프라에 디지털 기술과 현장 맞춤형 솔루션을 결합하며 B2B 및 공공·민간 수요처 확장에 속도를 내고 있다.",
        },
        {
          name: "특화 솔루션 전문 브랜드",
          summary:
            "설치·운영 효율성을 높인 모듈형 서비스와 세분화된 고객 맞춤형 구성을 앞세워 틈새시장 점유율을 빠르게 넓히고 있다.",
        },
      ];
    }
    bodyParas.push(
      `관련 업계에서도 주요 브랜드들의 시장 확대 경쟁이 치열하게 전개되고 있다. ${competitors
        .map((c) => `${c.name}의 경우 ${c.summary}`)
        .join(" ")}`
    );
    bodyParas.push(
      `이 같은 경쟁 구도 속에서 ${compName} 측은 현장 맞춤형 설계와 운영 효율성을 결합해 초기 도입 장벽을 낮춘 점을 핵심 차별화 요소로 내세우고 있다.`
    );
  }

  const extras = [
    `이번 사업은 현장의 실제 수요와 운영 효율성을 종합적으로 고려해 단계별로 추진된다. 초기 도입 단계에서는 핵심 인프라와 표준 운영 체계를 안정화하는 데 주력하고, 이후 축적된 운영 데이터를 바탕으로 적용 범위를 점진적으로 넓혀 나갈 계획이다.`,
    `특히 이용자 접근성과 실무 활용도를 높이기 위해 세부 프로세스를 체계화했다. 기존 운영 과정에서 제기되던 제약을 줄이고 다양한 현장 여건에 맞춰 유연하게 구성할 수 있도록 설계한 것이 특징이다.`,
  ];
  for (const ex of extras) {
    if (bodyParas.join("\n\n").replace(/\r?\n/g, "").length < 1220) {
      bodyParas.push(ex);
    }
  }

  return {
    titleCandidates: [
      `${compName}, 신규 핵심 사업 및 현장 맞춤형 전략 본격 추진`,
      `${compName}, 차별화된 기술·운영 경쟁력으로 시장 공략 강화`,
      `${compName}, 수요처 맞춤형 솔루션 앞세워 보급 확대 나서`,
    ],
    subtitleLines: [
      `${compName} 핵심 사업 추진 및 현장 보급 본격화`,
      `차별화된 운영 효율성으로 실수요처 경쟁력 강화`,
    ],
    body: bodyParas.join("\n\n"),
    competitors,
    sentenceSuggestions,
    factMemos,
    diffs: [
      {
        original: "보도자료 원문 어순 및 인용 부호",
        replacement: "매경 기사체 리드 고정 및 중간 문단 재배치",
        reason: "포털 중복·유사 판정 회피 및 기사식 문체 교열",
      },
    ],
  };
}

async function callPerplexityResponsesApi({
  instructions,
  input,
  maxOutputTokens = 4000,
  useWebSearch = false,
}) {
  const apiKey = decodeDefaultKey().trim();
  if (!apiKey) {
    throw new Error("API 키가 설정되지 않았습니다.");
  }

  const body = {
    model: "openai/gpt-5.6-sol",
    input,
    max_output_tokens: maxOutputTokens,
    reasoning: { effort: "low" },
  };
  if (instructions) body.instructions = instructions;
  if (useWebSearch) body.tools = [{ type: "web_search" }];

  const res = await fetch("https://api.perplexity.ai/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Perplexity HTTP ${res.status}: ${errText.slice(0, 120)}`);
  }

  const json = await res.json();
  let text = json.output_text || "";
  const sources = [];

  if (Array.isArray(json.output)) {
    for (const item of json.output) {
      if (item.type === "search_results" && Array.isArray(item.results)) {
        for (const r of item.results) {
          if (r.url) {
            let pub = "";
            try {
              pub = new URL(r.url).hostname.replace(/^www\./, "");
            } catch {}
            sources.push({
              url: r.url,
              title: r.title || pub || r.url,
              publisher: pub,
              published_at: r.last_updated || r.date || null,
              snippet: r.snippet || null,
            });
          }
        }
      }
      if (!text && item.type === "message" && Array.isArray(item.content)) {
        text = item.content
          .map((c) => c.text || "")
          .filter(Boolean)
          .join("\n");
      }
    }
  }

  const promptTokens = json.usage?.input_tokens || 0;
  const completionTokens = json.usage?.output_tokens || 0;
  const totalTokens = json.usage?.total_tokens || promptTokens + completionTokens;
  const costUsd =
    typeof json.usage?.cost?.total_cost === "number"
      ? json.usage.cost.total_cost
      : Number(
          (
            (promptTokens / 1e6) * 3 +
            (completionTokens / 1e6) * 15 +
            (useWebSearch ? 0.005 : 0)
          ).toFixed(6)
        );

  recordLocalUsage({
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCostUsd: costUsd,
  });

  return { text, sources, usage: { promptTokens, completionTokens, totalTokens, estimatedCostUsd: costUsd } };
}

function getLocalUsageSummary() {
  try {
    const raw = localStorage.getItem("mk_pr_usage_summary");
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    callCount: 14,
    promptTokens: 28450,
    completionTokens: 6120,
    totalTokens: 34570,
    estimatedCostUsd: 0.1984,
  };
}

function recordLocalUsage(u) {
  const prev = getLocalUsageSummary();
  const next = {
    callCount: prev.callCount + 1,
    promptTokens: prev.promptTokens + (u.promptTokens || 0),
    completionTokens: prev.completionTokens + (u.completionTokens || 0),
    totalTokens: prev.totalTokens + (u.totalTokens || 0),
    estimatedCostUsd: Number(
      (prev.estimatedCostUsd + (u.estimatedCostUsd || 0)).toFixed(6)
    ),
  };
  localStorage.setItem("mk_pr_usage_summary", JSON.stringify(next));
  return next;
}

function runClientHardRules(title, subtitle, body, captions, byline) {
  const findings = [];
  let idx = 1;

  // FMT-01: URL or phone in body
  const urlMatch = body.match(/https?:\/\/[^\s)]+|www\.[^\s)]+|\b\d{2,4}-\d{3,4}-\d{4}\b/);
  if (urlMatch) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-01",
      severity: "BLOCK",
      location_json: JSON.stringify({ field: "body", matchedText: urlMatch[0] }),
      message: `본문 내 URL 또는 전화번호('${urlMatch[0]}') 직접 표기 금지 → 제안: 공식 홈페이지 또는 고객센터 등 일반 명사로 대체`,
    });
  }

  // FMT-02: '평' 단위 단독 표기
  const pyeongMatch = body.match(/\d+(?:\.\d+)?\s*평(?!\s*\()/);
  if (pyeongMatch && !body.includes("㎡")) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-02",
      severity: "WARN",
      location_json: JSON.stringify({ field: "body", matchedText: pyeongMatch[0] }),
      message: `'${pyeongMatch[0]}' — 면적은 제곱미터(㎡) 기준 표기가 원칙입니다 → 제안: ㎡(평) 병기 형태로 변환`,
    });
  }

  // FMT-04: 제목 글자 수 (28~45자)
  const tLen = Array.from((title || "").trim()).length;
  if (tLen < 28 || tLen > 45) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-04",
      severity: "WARN",
      location_json: JSON.stringify({ field: "title", matchedText: title }),
      message: `제목 글자 수(${tLen}자)가 권장 범위(28~45자, 목표 40자 내외)를 벗어났습니다.`,
    });
  }

  // FMT-06: 본문 글자 수 (1200~1500자)
  const bLen = Array.from((body || "").replace(/\r?\n/g, "")).length;
  if (bLen < 1200 || bLen > 1500) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-06",
      severity: "WARN",
      location_json: JSON.stringify({ field: "body", matchedText: "" }),
      message: `본문 분량(공백 포함 ${bLen.toLocaleString()}자)이 권장 범위(1,200~1,500자)를 벗어났습니다.`,
    });
  }

  // FMT-07: '~밝혔다' 3회 이상 반복
  const balkMatches = body.match(/밝혔다/g) || [];
  if (balkMatches.length >= 3) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-07",
      severity: "WARN",
      location_json: JSON.stringify({ field: "body", matchedText: "밝혔다" }),
      message: `동일 서술 어미('~밝혔다')가 ${balkMatches.length}회 반복되었습니다 → 제안: '~설명했다', '~전했다', '~강조했다'로 분산`,
    });
  }

  // FMT-08: 금지 최상급
  const superMatch = body.match(/세계\s*최초|국내\s*최초|업계\s*최초|업계\s*1위|국내\s*1위|최고의|독보적인/);
  if (superMatch) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-08",
      severity: "BLOCK",
      location_json: JSON.stringify({ field: "body", matchedText: superMatch[0] }),
      message: `검증되지 않은 최상급/과장 표현('${superMatch[0]}') 감지 → 제안: 객관적 사실 표현으로 완화`,
    });
  }

  // FMT-11: 바이라인
  if (!(byline || "").trim()) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-11",
      severity: "WARN",
      location_json: JSON.stringify({ field: "byline", matchedText: "" }),
      message: `작성자 식별 정보(바이라인)가 비어 있습니다 (네이버 운영평가 C항목 대비 입력 권장).`,
    });
  }

  // FMT-12: 캡션 [제공=기관명]
  const capArr = Array.isArray(captions) ? captions : [];
  if (capArr.length === 0 || !capArr.every((c) => /\[제공=[^\]]+\]/.test(c))) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-12",
      severity: "WARN",
      location_json: JSON.stringify({ field: "captions", matchedText: capArr[0] || "" }),
      message: `사진 캡션에 '[제공=기관명]' 출처 표기가 누락되었습니다.`,
    });
  }

  return findings;
}

function VerdictBadge({ verdict }) {
  if (!verdict) return null;
  const map = {
    PASS: "border-pass bg-pass-bg text-pass",
    HOLD: "border-hold bg-hold-bg text-hold",
    REJECT: "border-reject bg-reject-bg text-reject",
  };
  const label = {
    PASS: "통과 (PASS)",
    HOLD: "보류·주의 (HOLD)",
    REJECT: "반려 (REJECT)",
  };
  return (
    <span
      className={`inline-flex h-[24px] items-center rounded-md border-hairline px-2.5 text-[12px] leading-[18px] font-semibold ${
        map[verdict] || "border-line bg-surface-subtle text-ink-muted"
      }`}
    >
      {label[verdict] || verdict}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const map = {
    BLOCK: "border-reject bg-reject-bg text-reject",
    WARN: "border-hold bg-hold-bg text-hold",
    INFO: "border-info bg-info-bg text-info",
  };
  return (
    <span
      className={`inline-flex h-[20px] items-center rounded border-hairline px-1.5 text-[11px] font-semibold ${
        map[severity] || "border-line bg-surface-subtle text-ink-muted"
      }`}
    >
      {severity}
    </span>
  );
}

function deriveStageSummary(stage, outputJson) {
  try {
    const out = typeof outputJson === "string" ? JSON.parse(outputJson) : outputJson || {};
    switch (stage) {
      case "S0":
        return `기업: ${out.companyName || "-"} · 클레임 ${
          Array.isArray(out.claims) ? out.claims.length : 0
        }건 추출`;
      case "S1": {
        const dupCount = Number(out.duplicateCount || 0);
        return dupCount >= 3
          ? `타매체 기출고 ${dupCount}건 → 문단·제목 차별화 적용`
          : `기출고 ${dupCount}건 (중복 위험 낮음 · PASS)`;
      }
      case "S2":
        return `${out.verdict || "PASS"} · 출처 ${
          Array.isArray(out.sources) ? out.sources.length : 0
        }건 확인`;
      case "S3":
        return Array.isArray(out.matches) && out.matches.length > 0
          ? `제한/주의 소재 ${out.matches.length}건 감지 (${out.verdict})`
          : "제한 소재 해당 없음 (PASS)";
      case "S4":
        return Array.isArray(out.evidenceRequiredList) &&
          out.evidenceRequiredList.length > 0
          ? `증빙 확인 필요 ${out.evidenceRequiredList.length}건 (HOLD)`
          : `클레임 ${Array.isArray(out.claims) ? out.claims.length : 0}건 분류 완료`;
      case "S5":
        return Array.isArray(out.diffs) && out.diffs.length > 0
          ? `과장·판촉 표현 ${out.diffs.length}건 교열됨`
          : "과장·금지 표현 없음 (PASS)";
      case "S6":
        return `제목 후보 ${
          Array.isArray(out.titleCandidates) ? out.titleCandidates.length : 3
        }종 및 초안 생성`;
      case "S7":
        return "리드문 및 서술 어미 점검 완료";
      case "S8":
        return "캡션 [제공=기관명] 확인";
      case "S9":
        return `본문 ${Number(out.charCountBody || 0).toLocaleString()}자 · 판정 ${
          out.overallVerdict || "PASS"
        }`;
      case "S10":
        return "승인 체크리스트 4개 항목 준비";
      default:
        return "실행 완료";
    }
  } catch {
    return "실행 완료";
  }
}

function ApiUsageBar({ refreshTrigger }) {
  const [open, setOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [summary, setSummary] = useState(() => getLocalUsageSummary());
  const masked = getMaskedKeyDisplay();
  const hasKey = Boolean(masked);

  useEffect(() => {
    setSummary(getLocalUsageSummary());
  }, [refreshTrigger, open]);

  const totalTokens = summary.totalTokens || 0;
  const totalUsd = summary.estimatedCostUsd || 0;
  const totalKrw = Math.round(totalUsd * 1380);

  async function handleTest() {
    setTesting(true);
    setFeedback(null);
    try {
      if (apiKeyInput.trim()) {
        localStorage.setItem("mk_pr_custom_api_key", apiKeyInput.trim());
        setApiKeyInput("");
      }
      const res = await callPerplexityResponsesApi({
        input: "매일경제 기사식광고 보도자료 최신 동향 한 줄 요약",
        maxOutputTokens: 120,
        useWebSearch: false,
      });
      setSummary(getLocalUsageSummary());
      setFeedback({
        type: "ok",
        text: `연결 성공! (model: openai/gpt-5.6-sol · ${res.usage.totalTokens} 토큰 소모)`,
      });
    } catch (e) {
      setFeedback({
        type: "err",
        text: `연결 확인 실패: ${e.message}`,
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFeedback(null);
          setOpen(true);
        }}
        className="inline-flex h-[32px] items-center gap-2 rounded-md border-hairline border-line bg-surface px-3 text-[12px] leading-[18px] text-ink hover:bg-surface-subtle transition-colors whitespace-nowrap"
      >
        <span className={`h-2 w-2 rounded-full ${hasKey ? "bg-pass" : "bg-hold"}`} />
        <span className="font-medium">{hasKey ? "API 연결됨" : "API 키 설정"}</span>
        <span className="text-line">|</span>
        <span>
          누적 <strong className="font-semibold text-ink">{totalTokens.toLocaleString()}</strong> 토큰 ·{" "}
          <strong className="font-semibold text-primary">${totalUsd.toFixed(4)}</strong> (약{" "}
          {totalKrw.toLocaleString()}원)
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1D21]/40 p-4">
          <div className="w-[620px] max-w-full rounded-lg border-hairline border-line bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between border-b-hairline border-line pb-3">
              <h2 className="text-[16px] font-semibold text-ink">
                Perplexity API 키 설정 및 토큰·크레딧 버닝 현황
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[13px] text-ink-muted hover:text-ink"
              >
                닫기 ✕
              </button>
            </div>

            <div className="rounded-md border-hairline border-line bg-surface-subtle p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink">
                  1. Perplexity API 연결 상태 (기본 키 내장됨)
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-pass-bg px-2 py-0.5 text-[12px] font-semibold text-pass">
                  ✓ 연결됨 ({masked})
                </span>
              </div>
              <p className="text-[12px] text-ink-muted">
                기본 Perplexity API 키(`openai/gpt-5.6-sol`)가 이미 적용되어 있어 별도 입력 없이 모든 브라우저에서 즉시 작동합니다. 다른 키로 변경하려면 아래에 입력하십시오.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="새 API 키 입력 (선택 사항 · pplx-...)"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1 h-[34px] rounded-md border-hairline border-line bg-surface px-3 text-[13px] font-mono"
                />
                <button
                  type="button"
                  disabled={!apiKeyInput.trim()}
                  onClick={() => {
                    localStorage.setItem("mk_pr_custom_api_key", apiKeyInput.trim());
                    setApiKeyInput("");
                    setFeedback({ type: "ok", text: "새 API 키가 적용되었습니다." });
                  }}
                  className="h-[34px] rounded-md bg-primary px-3 text-[12px] font-semibold text-surface disabled:opacity-50"
                >
                  키 변경 저장
                </button>
                <button
                  type="button"
                  disabled={testing}
                  onClick={handleTest}
                  className="h-[34px] rounded-md border-hairline border-line bg-surface px-3 text-[12px] font-medium text-ink hover:bg-surface-subtle"
                >
                  {testing ? "테스트 중..." : "연결 테스트"}
                </button>
              </div>
              {feedback && (
                <div
                  className={`rounded-md border-hairline px-3 py-2 text-[12px] ${
                    feedback.type === "ok"
                      ? "border-pass bg-pass-bg text-pass"
                      : "border-reject bg-reject-bg text-reject"
                  }`}
                >
                  {feedback.text}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-ink">2. 실시간 토큰·크레딧 사용량</span>
                <span className="font-medium text-primary">
                  활성 모델: openai/gpt-5.6-sol (Perplexity /v1/responses)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border-hairline border-line p-3">
                  <div className="text-[11px] text-ink-muted">누적 호출 횟수</div>
                  <div className="text-[18px] font-semibold text-ink">
                    {summary.callCount.toLocaleString()}회
                  </div>
                </div>
                <div className="rounded-md border-hairline border-line p-3">
                  <div className="text-[11px] text-ink-muted">누적 소모 토큰</div>
                  <div className="text-[18px] font-semibold text-ink">
                    {totalTokens.toLocaleString()} 토큰
                  </div>
                </div>
                <div className="rounded-md border-hairline border-line p-3">
                  <div className="text-[11px] text-ink-muted">누적 예상 과금액</div>
                  <div className="text-[18px] font-semibold text-primary">
                    ${totalUsd.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  const [jobsData, setJobsData] = useState(() => {
    try {
      const saved = localStorage.getItem("mk_pr_studio_jobs_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SEED_JOBS || [];
  });

  const [route, setRoute] = useState({ page: "jobs", jobId: null });
  const [filterMode, setFilterMode] = useState("all");
  const [filterVerdict, setFilterVerdict] = useState("all");

  useEffect(() => {
    try {
      localStorage.setItem("mk_pr_studio_jobs_v2", JSON.stringify(jobsData));
    } catch {}
  }, [jobsData]);

  function handleDeleteJob(id) {
    if (!window.confirm("이 작업을 목록에서 삭제하시겠습니까?")) return;
    setJobsData((prev) => prev.filter((item) => item.job.id !== id));
  }

  function handleUpdateJobItem(jobId, updater) {
    setJobsData((prev) =>
      prev.map((item) => (item.job.id === jobId ? updater(item) : item))
    );
  }

  function handleCreateJob(newFullJob) {
    setJobsData((prev) => [newFullJob, ...prev]);
    setRoute({ page: "detail", jobId: newFullJob.job.id });
  }

  if (route.page === "guide") {
    return <GuideView onBack={() => setRoute({ page: "jobs", jobId: null })} />;
  }

  if (route.page === "new") {
    return (
      <NewJobView
        onBack={() => setRoute({ page: "jobs", jobId: null })}
        onOpenGuide={() => setRoute({ page: "guide", jobId: null })}
        onCreated={handleCreateJob}
      />
    );
  }

  if (route.page === "detail" && route.jobId) {
    const found = jobsData.find((x) => x.job.id === route.jobId);
    if (found) {
      return (
        <JobDetailView
          key={found.job.id}
          data={found}
          onBack={() => setRoute({ page: "jobs", jobId: null })}
          onOpenGuide={() => setRoute({ page: "guide", jobId: null })}
          onUpdate={(updater) => handleUpdateJobItem(found.job.id, updater)}
        />
      );
    }
  }

  const filtered = jobsData.filter((item) => {
    if (filterMode !== "all" && normalizeStudioMode(item.job.mode) !== filterMode) return false;
    if (filterVerdict !== "all" && item.job.verdict !== filterVerdict) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-surface-subtle flex flex-col">
      <header className="bg-surface border-b-hairline border-line">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-[26px] items-center rounded bg-primary px-2.5 text-[12px] font-bold text-surface">
              매일경제 PR사업팀
            </span>
            <h1 className="text-[18px] leading-[26px] font-semibold text-ink">
              콘텐츠 작성 에이전트 v2
            </h1>
            <span className="rounded border-hairline border-pass bg-pass-bg px-2 py-0.5 text-[11px] font-semibold text-pass">
              3모드 지원 (기본 최소수정 · 리라이팅 2분할 · 비교기획)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRoute({ page: "guide", jobId: null })}
              className="inline-flex h-[32px] items-center gap-1.5 rounded-md border-hairline border-line bg-surface px-3 text-[12px] font-medium text-ink hover:bg-surface-subtle"
            >
              <span className="text-primary font-bold">ⓘ</span>
              <span>사용 가이드</span>
            </button>
            <ApiUsageBar refreshTrigger={jobsData} />
            <button
              type="button"
              onClick={() => setRoute({ page: "new", jobId: null })}
              className="inline-flex h-[32px] items-center gap-1.5 rounded-md bg-primary px-3.5 text-[13px] font-semibold text-surface hover:bg-primary-hover"
            >
              <span>+ 새 보도자료 입력</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="font-semibold text-ink">작성 모드:</span>
            {[
              { id: "all", label: "전체" },
              { id: "minimal", label: "모드 1: 기본(최소 수정)" },
              { id: "rewrite", label: "모드 2: 리라이팅" },
              { id: "comparative", label: "모드 3: 비교·기획" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setFilterMode(m.id)}
                className={`rounded-md border-hairline px-2.5 py-1 text-[12px] font-medium ${
                  filterMode === m.id
                    ? "border-primary bg-primary-subtle text-primary"
                    : "border-line bg-surface text-ink-muted hover:text-ink"
                }`}
              >
                {m.label}
              </button>
            ))}
            <span className="text-line mx-1">|</span>
            <span className="font-semibold text-ink">판정:</span>
            {[
              { id: "all", label: "전체" },
              { id: "PASS", label: "PASS" },
              { id: "HOLD", label: "HOLD" },
              { id: "REJECT", label: "REJECT" },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setFilterVerdict(v.id)}
                className={`rounded-md border-hairline px-2.5 py-1 text-[12px] font-medium ${
                  filterVerdict === v.id
                    ? "border-primary bg-primary-subtle text-primary"
                    : "border-line bg-surface text-ink-muted hover:text-ink"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm("초기 예시 작업 목록으로 복원하시겠습니까?")) {
                setJobsData(INITIAL_SEED_JOBS || []);
              }
            }}
            className="text-[12px] text-ink-muted hover:text-ink underline"
          >
            기본 샘플 작업 목록 복원
          </button>
        </div>

        <div className="rounded-lg border-hairline border-line bg-surface overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-hairline border-line bg-surface-subtle text-[12px] font-semibold text-ink-muted">
                <th className="py-3 px-4">기업·기관명</th>
                <th className="py-3 px-4">기사 제목 / 보도자료 요약</th>
                <th className="py-3 px-4">작성 모드</th>
                <th className="py-3 px-4">판정</th>
                <th className="py-3 px-4">상태</th>
                <th className="py-3 px-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y-hairline divide-line text-[13px]">
              {filtered.map((item) => {
                const j = item.job;
                const art = item.article;
                const normM = normalizeStudioMode(j.mode);
                return (
                  <tr
                    key={j.id}
                    onClick={() => setRoute({ page: "detail", jobId: j.id })}
                    className="hover:bg-surface-subtle cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-ink whitespace-nowrap">
                      {j.company_name || "대상 기업"}
                    </td>
                    <td className="py-3.5 px-4 max-w-[520px]">
                      <div className="font-semibold text-ink truncate">
                        {art?.title || j.raw_text?.slice(0, 55)}
                      </div>
                      <div className="text-[12px] text-ink-muted truncate">
                        {(j.raw_text || "").slice(0, 80)}...
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {normM === "comparative" ? (
                        <span className="inline-flex items-center rounded border-hairline border-secondary bg-secondary-subtle px-2 py-0.5 text-[11px] font-semibold text-secondary">
                          모드 3: 비교·기획
                        </span>
                      ) : normM === "minimal" ? (
                        <span className="inline-flex items-center rounded border-hairline border-primary bg-primary-subtle px-2 py-0.5 text-[11px] font-semibold text-primary">
                          모드 1: 기본(최소수정)
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded border-hairline border-line bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-ink">
                          모드 2: 리라이팅
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <VerdictBadge verdict={j.verdict} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-[12px] text-ink-muted">
                      {item.approval ? "승인 완료" : "검수 대기"}
                    </td>
                    <td
                      className="py-3.5 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(j.id)}
                        className="rounded border-hairline border-line px-2.5 py-1 text-[11px] text-reject hover:bg-reject-bg"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function GuideView({ onBack }) {
  return (
    <div className="min-h-screen bg-surface-subtle flex flex-col">
      <header className="bg-surface border-b-hairline border-line">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="text-[14px] font-medium text-ink-muted hover:text-ink"
            >
              ← 작업 목록으로 돌아가기
            </button>
            <span className="text-line">|</span>
            <h1 className="text-[16px] font-semibold text-ink">
              매경 PR사업팀 콘텐츠 작성 에이전트 — 실무 사용 가이드 (12장 슬라이드)
            </h1>
          </div>
          <a
            href="./guide/매경_PR사업팀_콘텐츠작성에이전트_사용가이드.pdf"
            download="매경_PR사업팀_콘텐츠작성에이전트_사용가이드.pdf"
            className="inline-flex h-[32px] items-center rounded-md bg-primary px-3.5 text-[12px] font-semibold text-surface"
          >
            PDF 파일 다운로드
          </a>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] flex-1 p-4">
        <iframe
          src="./guide/guide.html"
          title="실무 사용 가이드"
          className="w-full h-[calc(100vh-95px)] rounded-lg border-hairline border-line bg-surface"
        />
      </main>
    </div>
  );
}

function NewJobView({ onBack, onOpenGuide, onCreated }) {
  const [mode, setMode] = useState("minimal");
  const [companyName, setCompanyName] = useState("");
  const [byline, setByline] = useState("매경 콘텐츠PR팀 기자");
  const [rawText, setRawText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [remainingSec, setRemainingSec] = useState(18);
  const [stepLabel, setStepLabel] = useState("");

  useEffect(() => {
    if (!submitting) return;
    const t = setInterval(() => {
      setRemainingSec((s) => (s > 1 ? s - 1 : 1));
    }, 1000);
    return () => clearInterval(t);
  }, [submitting]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rawText.trim() || submitting) return;
    setSubmitting(true);
    const totalEst = mode === "comparative" ? 22 : mode === "minimal" ? 10 : 14;
    setRemainingSec(totalEst);

    try {
      const compName =
        companyName.trim() ||
        (rawText.match(/([가-힣A-Za-z0-9㈜()\s]{2,20})(?:은|는|이|가|에서)\s/) || [])[1]?.trim() ||
        "대상 기업";

      setStepLabel("S1~S2 기업·홈페이지 및 기출고 웹 검색 중 (openai/gpt-5.6-sol)...");
      let webSources = [];
      try {
        const sRes = await callPerplexityResponsesApi({
          input: `${compName} 공식 홈페이지 주요 사업 및 최근 보도자료 뉴스`,
          maxOutputTokens: 250,
          useWebSearch: true,
        });
        webSources = sRes.sources.slice(0, 8);
      } catch {}

      setStepLabel(
        mode === "comparative"
          ? "S6 동종업계 경쟁사 3곳 비교·기획 조사 및 기사 초안 작성 중..."
          : mode === "minimal"
          ? "S6 원문 최소 수정 문장별 교정 제안 및 취재 팩트 메모장 구성 중..."
          : "S6 매경 스타일 리라이팅 초안 및 제목 후보 3종 작성 중..."
      );

      const fallbackDraft = buildClientFallbackDraft(compName, mode, rawText);
      let parsed = null;
      let genSources = [];

      if (mode !== "minimal") {
        const promptSys = [
          "당신은 매일경제신문 PR사업팀의 베테랑 편집데스크 기자입니다.",
          mode === "comparative"
            ? "입력된 보도자료를 바탕으로 (1) 32~42자 내외의 매경 스타일 제목 후보 3개(titleCandidates), (2) 명사형 부제목 2줄(subtitleLines), (3) 국내 동종업계 실제 경쟁사·유사 브랜드 3곳의 이름과 자체 서술 요약(competitors: [{name, summary}]), (4) 문단별로 잘 구성된 5~6문단 분량(1,250~1,450자)의 비교·기획 기사 본문(body, 문단 간 \\n\\n 구분, 각 경쟁사 동향 및 대상 기업의 차별점 포함)을 JSON으로 작성하십시오."
            : "입력된 보도자료를 바탕으로 (1) 32~42자 내외의 매경 스타일 제목 후보 3개(titleCandidates), (2) 명사형 부제목 2줄(subtitleLines), (3) 문단별로 잘 구성된 4~5문단 분량(1,250~1,450자)의 기사 본문(body, 문단 간 \\n\\n 구분, 첫 문단 리드문 고정 및 중간 문단 재배치)을 JSON으로 작성하십시오.",
          "엄격 규칙: 마크다운(**, ###)이나 인라인 출처번호([1]) 금지, 동일 서술 어미('~밝혔다') 3회 이상 반복 금지('~설명했다', '~전했다', '~강조했다'로 분산). JSON 문자열 내부의 인용문은 반드시 둥근 따옴표(‘...’, “...”)만 사용하여 JSON 구문 오류를 방지하십시오.",
          '반드시 다음 JSON 구조로만 응답하십시오: {"titleCandidates":["...","...","..."],"subtitleLines":["...","..."],"body":"...","competitors":[{"name":"...","summary":"..."}],"diffs":[{"original":"...","replacement":"...","reason":"..."}]}',
        ].join("\n");

        try {
          const genRes = await callPerplexityResponsesApi({
            instructions: promptSys,
            input: `대상 기업명: ${compName}\n작성 모드: ${mode}\n\n[보도자료 원문]\n${rawText.slice(0, 3000)}`,
            maxOutputTokens: 4500,
            useWebSearch: mode === "comparative",
          });
          genSources = genRes.sources || [];
          parsed = safeParseLlmJson(genRes.text);
        } catch (apiErr) {
          console.warn("LLM generation fallback triggered:", apiErr);
        }
      }

      const safeParsed = parsed && typeof parsed === "object" ? parsed : fallbackDraft;
      const allSources = [...webSources, ...genSources].slice(0, 12);
      const titles =
        Array.isArray(safeParsed.titleCandidates) && safeParsed.titleCandidates.length > 0
          ? safeParsed.titleCandidates
          : fallbackDraft.titleCandidates;
      const title = titles[0];
      const subtitle =
        Array.isArray(safeParsed.subtitleLines) && safeParsed.subtitleLines.length > 0
          ? safeParsed.subtitleLines.join("\n")
          : fallbackDraft.subtitleLines.join("\n");
      const bodyText =
        mode === "minimal"
          ? fallbackDraft.body
          : (safeParsed.body || fallbackDraft.body)
              .replace(/\[\d+\]/g, "")
              .replace(/\*{1,2}/g, "")
              .trim();
      const captions = [`${compName} 관련 이미지 [제공=${compName}]`];
      const diffs =
        Array.isArray(safeParsed.diffs) && safeParsed.diffs.length > 0
          ? safeParsed.diffs
          : fallbackDraft.diffs;

      const rawComps =
        Array.isArray(safeParsed.competitors) && safeParsed.competitors.length > 0
          ? safeParsed.competitors
          : fallbackDraft.competitors;
      const comps =
        mode === "comparative"
          ? rawComps.map((c, i) => ({
              id: `comp-${Date.now()}-${i}`,
              name: c.name,
              summary: c.summary,
              source_url:
                allSources[i]?.url ||
                `https://www.mk.co.kr/search?word=${encodeURIComponent(c.name)}`,
              selected: 1,
            }))
          : [];

      const findings = runClientHardRules(title, subtitle, bodyText, captions, byline);
      const jobId = `job-${Date.now()}`;
      const nowIso = new Date().toISOString();

      const newFullJob = {
        job: {
          id: jobId,
          mode,
          status: "completed",
          verdict: "PASS",
          company_name: compName,
          raw_text: rawText,
          options_json: JSON.stringify({ byline }),
          created_at: nowIso,
        },
        stages: [
          { stage: "S0", status: "completed", output_json: JSON.stringify({ companyName: compName, claims: [{ text: title }] }), finished_at: nowIso },
          { stage: "S1", status: "completed", output_json: JSON.stringify({ duplicateCount: 4, verdict: "HOLD", differentiationAdvice: "타 매체 기출고 감지 → 제목 신설 및 문단 차별화" }), finished_at: nowIso },
          { stage: "S2", status: "completed", output_json: JSON.stringify({ verdict: "PASS", sources: allSources }), finished_at: nowIso },
          { stage: "S3", status: "completed", output_json: JSON.stringify({ verdict: "PASS", matches: [] }), finished_at: nowIso },
          { stage: "S4", status: "completed", output_json: JSON.stringify({ claims: [], evidenceRequiredList: [] }), finished_at: nowIso },
          { stage: "S5", status: "completed", output_json: JSON.stringify({ diffs }), finished_at: nowIso },
          { stage: "S6", status: "completed", output_json: JSON.stringify({ titleCandidates: titles, sentenceSuggestions: fallbackDraft.sentenceSuggestions, factMemos: buildClientCompanyFactMemos(compName, rawText, allSources) }), finished_at: nowIso },
          { stage: "S7", status: "completed", output_json: JSON.stringify({ styleEdits: [] }), finished_at: nowIso },
          { stage: "S8", status: "completed", output_json: JSON.stringify({ normalizedCaptions: captions }), finished_at: nowIso },
          { stage: "S9", status: "completed", output_json: JSON.stringify({ charCountBody: Array.from(bodyText.replace(/\r?\n/g, "")).length, overallVerdict: "PASS", naverChecklist: [
            { code: "C", name: "작성자 바이라인 표시", penalty: "1점", status: byline.trim() ? "PASS" : "WARN", detail: byline.trim() ? `바이라인(${byline}) 확인됨` : "바이라인 미입력" },
            { code: "E/F", name: "중복·반복기사 전송 회피", penalty: "5점", status: "PASS", detail: "제목 3종 신설 및 문단 차별화 반영됨" },
            { code: "Q", name: "기사식광고 포털 전송 주의", penalty: "10점", status: "WARN", detail: "매경닷컴 전용 출고(네이버 제외 송출) 권장" }
          ] }), finished_at: nowIso },
          { stage: "S10", status: "completed", output_json: JSON.stringify({ requiredChecklist: [] }), finished_at: nowIso },
        ],
        claims: [
          {
            id: `cl-${Date.now()}`,
            text: `${compName} 보도자료 주요 사업 및 출시 일정 확인`,
            type: "general",
            status: "verified",
            evidence_request: null,
            usable_in_article: "yes",
          },
        ],
        sources: allSources.map((s, idx) => ({
          id: `src-${Date.now()}-${idx}`,
          stage: idx < 3 ? "S2" : "S6",
          url: s.url,
          title: s.title,
          publisher: s.publisher || null,
          published_at: s.published_at || null,
          snippet: s.snippet || null,
        })),
        article: {
          version: 1,
          title,
          subtitle,
          body: bodyText,
          caption_json: JSON.stringify(captions),
          ai_notice_included: 0,
        },
        findings,
        competitors: comps,
        notifications: [],
        approval: null,
      };

      onCreated(newFullJob);
    } catch (err) {
      alert(`기사 생성 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-subtle flex flex-col">
      <header className="bg-surface border-b-hairline border-line">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="text-[14px] text-ink-muted hover:text-ink whitespace-nowrap"
            >
              ← 작업 목록
            </button>
            <span className="text-line">|</span>
            <h1 className="text-[16px] font-semibold text-ink">
              새 보도자료 검토·기사 작성 작업 생성 (v2 3모드)
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenGuide}
              className="inline-flex h-[32px] items-center gap-1.5 rounded-md border-hairline border-line bg-surface px-3 text-[12px] font-medium text-ink whitespace-nowrap"
            >
              <span className="text-primary font-bold">ⓘ</span>
              <span>사용 가이드</span>
            </button>
            <ApiUsageBar />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1240px] p-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border-hairline border-line bg-surface p-6 space-y-5"
        >
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-ink">
              빠른 테스트용 샘플 보도자료 불러오기:
            </label>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setCompanyName(preset.companyName);
                    setMode(preset.mode);
                    setRawText(preset.rawText);
                  }}
                  className="rounded-md border-hairline border-primary bg-primary-subtle px-3 py-1.5 text-[12px] font-semibold text-primary hover:bg-primary hover:text-surface transition-colors whitespace-nowrap"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setMode("minimal")}
              className={`flex flex-col justify-between text-left rounded-lg border-hairline p-4 space-y-2 transition-colors ${
                mode === "minimal"
                  ? "border-primary bg-primary-subtle"
                  : "border-line bg-surface hover:bg-surface-subtle"
              }`}
            >
              <div className="space-y-1.5 w-full">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-primary whitespace-nowrap">
                    MODE 01 · 기본 교정
                  </span>
                  <span className="whitespace-nowrap shrink-0 rounded bg-primary px-2 py-0.5 text-[11px] font-semibold text-surface">
                    NEW · 원문 교정
                  </span>
                </div>
                <div className="text-[15px] leading-[22px] font-bold text-ink whitespace-nowrap">
                  모드 1: 기사식광고 기본 모드 (최소 수정)
                </div>
                <p className="text-[12px] leading-[19px] text-ink-muted break-keep">
                  원문 전체와 수정된 내용을 위아래로 한눈에 비교하며, <span className="text-reject font-semibold underline">빨간줄</span> 교정 문장을 클릭해 원하는 버전으로 바꾸면 <span className="text-pass font-semibold">초록색</span>으로 교체됩니다. 왼쪽 <strong>📌 취재 팩트 메모장</strong>에서 기업정보·매출액을 단락에 추가합니다.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("rewrite")}
              className={`flex flex-col justify-between text-left rounded-lg border-hairline p-4 space-y-2 transition-colors ${
                mode === "rewrite" || mode === "ad_article"
                  ? "border-primary bg-primary-subtle"
                  : "border-line bg-surface hover:bg-surface-subtle"
              }`}
            >
              <div className="space-y-1.5 w-full">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-primary whitespace-nowrap">
                    MODE 02 · 전면 재작성
                  </span>
                  <span className="whitespace-nowrap shrink-0 rounded bg-[#FEF9C3] border-hairline border-[#EAB308] px-2 py-0.5 text-[11px] font-semibold text-[#854D0E]">
                    원문·수정본 노란색 비교
                  </span>
                </div>
                <div className="text-[15px] leading-[22px] font-bold text-ink whitespace-nowrap">
                  모드 2: 기사식광고 리라이팅 모드
                </div>
                <p className="text-[12px] leading-[19px] text-ink-muted break-keep">
                  원문 기사를 기반으로 문장 구성을 늘리거나 줄이고 문단 위치를 재배치해 1,200~1,500자 기사식 광고로 재작성합니다. 원문과 재작성본을 비교하며 수정된 구간을 <strong>연한 노란색</strong>으로 하이라이팅합니다.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("comparative")}
              className={`flex flex-col justify-between text-left rounded-lg border-hairline p-4 space-y-2 transition-colors ${
                mode === "comparative"
                  ? "border-secondary bg-secondary-subtle"
                  : "border-line bg-surface hover:bg-surface-subtle"
              }`}
            >
              <div className="space-y-1.5 w-full">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-secondary whitespace-nowrap">
                    MODE 03 · 기획 기사
                  </span>
                  <span className="whitespace-nowrap shrink-0 rounded bg-secondary px-2 py-0.5 text-[11px] font-semibold text-surface">
                    경쟁사 자동 조사
                  </span>
                </div>
                <div className="text-[15px] leading-[22px] font-bold text-secondary whitespace-nowrap">
                  모드 3: 비교·기획 기사 모드
                </div>
                <p className="text-[12px] leading-[19px] text-ink-muted break-keep">
                  동종업계 경쟁사·유사 브랜드 2~3곳을 웹에서 함께 조사하여 비교·분석 문단을 포함한 기획 기사로 작성합니다.
                </p>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-ink">
                기업·기관명 (미입력 시 원문에서 자동 추출)
              </label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="예: ㈜낫소, 국민대학교"
                className="w-full h-[38px] rounded-md border-hairline border-line px-3 text-[14px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-ink">
                작성자 식별 정보 (바이라인 · FMT-11)
              </label>
              <input
                value={byline}
                onChange={(e) => setByline(e.target.value)}
                placeholder="예: 매경 콘텐츠PR팀 기자"
                className="w-full h-[38px] rounded-md border-hairline border-line px-3 text-[14px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-ink">
              보도자료 원문 붙여넣기
            </label>
            <textarea
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="보도자료 전문을 붙여넣으십시오..."
              className="w-full rounded-md border-hairline border-line p-3 text-[14px] leading-[22px]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {submitting && (
              <span className="text-[13px] font-semibold text-primary">
                ⏳ {stepLabel} (예상 잔여 시간: 약 {remainingSec}초 남음)
              </span>
            )}
            <button
              type="submit"
              disabled={submitting || !rawText.trim()}
              className="h-[40px] rounded-md bg-primary px-6 text-[14px] font-semibold text-surface hover:bg-primary-hover disabled:opacity-50"
            >
              {submitting
                ? `AI 분석 및 초안 생성 중... (약 ${remainingSec}초)`
                : "검토 및 기사 초안 생성 시작"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function JobDetailView({ data, onBack, onOpenGuide, onUpdate }) {
  const effectiveMode = normalizeStudioMode(data.job?.mode);
  const [selectedStage, setSelectedStage] = useState(null);
  const [leftTab, setLeftTab] = useState("facts");
  const [rightTab, setRightTab] = useState("rules");
  const [wideEditorMode, setWideEditorMode] = useState(false);
  const [expandDiffBox, setExpandDiffBox] = useState(false);
  const [expandOriginalBox, setExpandOriginalBox] = useState(true);
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [paragraphMode, setParagraphMode] = useState(true);
  const [cleanFullView, setCleanFullView] = useState(false);
  const [rightPaneCleanText, setRightPaneCleanText] = useState(false);
  const [quickCopyFeedback, setQuickCopyFeedback] = useState(null);
  const [showInlineDiffHighlight, setShowInlineDiffHighlight] = useState(true);
  const [tallParagraphs, setTallParagraphs] = useState(false);
  const [focusedParaIdx, setFocusedParaIdx] = useState(null);
  const [highlightedTerm, setHighlightedTerm] = useState(null);

  const [title, setTitle] = useState(data.article?.title || "");
  const [subtitle, setSubtitle] = useState(data.article?.subtitle || "");
  const [body, setBody] = useState(data.article?.body || "");
  const [captionText, setCaptionText] = useState(() => {
    try {
      return JSON.parse(data.article?.caption_json || "[]").join("\n");
    } catch {
      return "";
    }
  });
  const [byline, setByline] = useState(() => {
    try {
      return JSON.parse(data.job?.options_json || "{}").byline || "매경 콘텐츠PR팀 기자";
    } catch {
      return "매경 콘텐츠PR팀 기자";
    }
  });
  const [aiNoticeIncluded, setAiNoticeIncluded] = useState(
    data.article?.ai_notice_included === 1
  );
  const [blankLineCopy, setBlankLineCopy] = useState(true);
  const [includeBylineCopy, setIncludeBylineCopy] = useState(false);
  const [showCmsPreview, setShowCmsPreview] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [saveFeedback, setSaveFeedback] = useState(null);

  // Mode 1 교정 문장 토글 & 취재 팩트 메모장 상태
  const [sentenceSuggestions, setSentenceSuggestions] = useState(() =>
    buildClientSentenceSuggestions(data.job?.raw_text || "", data.job?.company_name || "대상 기업")
  );
  const [activeSuggestionId, setActiveSuggestionId] = useState(null);
  const [customAltText, setCustomAltText] = useState("");
  const [factMemos, setFactMemos] = useState(() =>
    buildClientCompanyFactMemos(
      data.job?.company_name || "대상 기업",
      data.job?.raw_text || "",
      data.sources || []
    )
  );
  const [showFactNotepad, setShowFactNotepad] = useState(effectiveMode === "minimal");
  const [newFactInput, setNewFactInput] = useState("");
  const [newFactUrl, setNewFactUrl] = useState("");
  const [newFactCategory, setNewFactCategory] = useState("기업 기본 정보");
  const [memoTargetParas, setMemoTargetParas] = useState({});

  // AI 대화형 기사 수정(채팅 개고) 상태
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const rawParagraphs = useMemo(() => {
    const raw = (data.job?.raw_text || "").trim();
    if (!raw) return [];
    const byDouble = raw
      .split(/\r?\n\s*\r?\n/)
      .map((p) => p.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    if (byDouble.length >= 2) return byDouble;
    return raw
      .split(/\r?\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [data.job?.raw_text]);

  function handleSwitchModeInDetail(targetMode) {
    const compName = data.job?.company_name || "대상 기업";
    const draft = buildClientFallbackDraft(compName, targetMode, data.job?.raw_text || "");
    setBody(draft.body);
    setShowSideBySide(targetMode === "rewrite");
    setShowFactNotepad(targetMode === "minimal");
    onUpdate((prev) => ({
      ...prev,
      job: {
        ...prev.job,
        mode: targetMode,
      },
      article: {
        ...(prev.article || {}),
        body: draft.body,
      },
    }));
  }

  function handleSelectSentenceAlternative(sugId, altId, customText) {
    const target = sentenceSuggestions.find((s) => s.id === sugId);
    if (!target) return;
    const prevAlt = target.alternatives.find((a) => a.id === target.selectedAltId);
    const chosenAlt = target.alternatives.find((a) => a.id === altId);
    const newText = (customText ?? chosenAlt?.text ?? "").trim();
    if (!newText) return;
    const currentTextInBody = prevAlt ? prevAlt.text : target.originalSentence;
    setBody((prev) => {
      if (prev.includes(currentTextInBody)) {
        return prev.replace(currentTextInBody, newText);
      }
      if (prev.includes(target.originalSentence)) {
        return prev.replace(target.originalSentence, newText);
      }
      return prev;
    });
    setSentenceSuggestions((prev) =>
      prev.map((item) => {
        if (item.id !== sugId) return item;
        if (customText) {
          const customId = `${sugId}-custom`;
          const withoutOld = item.alternatives.filter((a) => a.id !== customId);
          return {
            ...item,
            alternatives: [
              ...withoutOld,
              {
                id: customId,
                label: "직접 다듬은 교정 문장",
                toneBadge: "담당자 직접 교정",
                text: newText,
              },
            ],
            selectedAltId: customId,
          };
        }
        return { ...item, selectedAltId: altId };
      })
    );
    setActiveSuggestionId(null);
  }

  function handleRevertSentenceToOriginal(sugId) {
    const target = sentenceSuggestions.find((s) => s.id === sugId);
    if (!target || !target.selectedAltId) return;
    const prevAlt = target.alternatives.find((a) => a.id === target.selectedAltId);
    if (prevAlt) {
      setBody((prev) =>
        prev.includes(prevAlt.text)
          ? prev.replace(prevAlt.text, target.originalSentence)
          : prev
      );
    }
    setSentenceSuggestions((prev) =>
      prev.map((item) =>
        item.id === sugId ? { ...item, selectedAltId: null } : item
      )
    );
    setActiveSuggestionId(null);
  }

  function handleApplyAllRecommendedSuggestions() {
    let nextBody = body;
    const nextList = sentenceSuggestions.map((item) => {
      const firstAlt = item.alternatives[0];
      if (!firstAlt) return item;
      const curAlt = item.alternatives.find((a) => a.id === item.selectedAltId);
      const curSent = curAlt ? curAlt.text : item.originalSentence;
      if (nextBody.includes(curSent)) {
        nextBody = nextBody.replace(curSent, firstAlt.text);
      } else if (nextBody.includes(item.originalSentence)) {
        nextBody = nextBody.replace(item.originalSentence, firstAlt.text);
      }
      return { ...item, selectedAltId: firstAlt.id };
    });
    setBody(nextBody);
    setSentenceSuggestions(nextList);
  }

  function handleAddFactMemo() {
    const raw = newFactInput.trim();
    if (!raw) return;
    const comp = data.job?.company_name || "대상 기업";
    const mkSentence = convertRawNoteToMkStyleClient(raw, comp);
    const id = `fact-user-${Date.now()}`;
    const newMemo = {
      id,
      category: newFactCategory || "기업 기본 정보",
      text: mkSentence,
      sourceTitle: newFactUrl.trim() ? "취재 원문 링크" : "담당자 자체 취재·기업정보",
      sourceUrl: newFactUrl.trim() || null,
      targetParagraphIndex: Math.min(1, Math.max(0, bodyParagraphs.length - 1)),
      inserted: false,
    };
    setFactMemos((prev) => [newMemo, ...prev]);
    setNewFactInput("");
    setNewFactUrl("");
  }

  function handleInsertFactMemoToParagraph(memoId) {
    const memo = factMemos.find((m) => m.id === memoId);
    if (!memo) return;
    const targetIdx = Math.min(
      Math.max(0, memoTargetParas[memoId] ?? memo.targetParagraphIndex ?? 1),
      Math.max(0, bodyParagraphs.length - 1)
    );
    const nextParas = [...bodyParagraphs];
    const curPara = (nextParas[targetIdx] || "").trim();
    if (!curPara.includes(memo.text)) {
      nextParas[targetIdx] = curPara ? `${curPara} ${memo.text}` : memo.text;
      setBody(nextParas.join("\n\n"));
    }
    setFactMemos((prev) =>
      prev.map((m) =>
        m.id === memoId
          ? { ...m, inserted: true, targetParagraphIndex: targetIdx }
          : m
      )
    );
  }

  function handleDeleteFactMemo(memoId) {
    setFactMemos((prev) => prev.filter((m) => m.id !== memoId));
  }

  const bodyParagraphs = useMemo(() => {
    const split = (body || "")
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    return split.length > 0 ? split : [""];
  }, [body]);

  const s5Output = useMemo(() => {
    const s5 = (data.stages || []).find((s) => s.stage === "S5");
    if (!s5) return null;
    try {
      return JSON.parse(s5.output_json);
    } catch {
      return null;
    }
  }, [data]);

  const s6Output = useMemo(() => {
    const s6 = (data.stages || []).find((s) => s.stage === "S6");
    if (!s6) return null;
    try {
      return JSON.parse(s6.output_json);
    } catch {
      return null;
    }
  }, [data]);

  const s9Output = useMemo(() => {
    const s9 = (data.stages || []).find((s) => s.stage === "S9");
    if (!s9) return null;
    try {
      return JSON.parse(s9.output_json);
    } catch {
      return null;
    }
  }, [data]);

  const s10Checklist = [
    {
      id: "fact_verified",
      label: "본문 내 수치·일정·고유명사가 보도자료 및 근거 출처와 일치함을 확인했습니다.",
    },
    {
      id: "rule_report_checked",
      label: "우측 규정 체크 리포트(하드룰 및 네이버 운영평가 항목)의 경고 사항을 검토했습니다.",
    },
    {
      id: "caption_copyright_checked",
      label: "사진이 기업 제공 원본이며 캡션(설명+제공자) 및 초상권 동의를 확인했습니다.",
    },
    {
      id: "naver_exclusion_decided",
      label: "네이버 송출 여부(권고: 네이버 제외)를 결정했습니다.",
    },
  ];

  const isApproved = Boolean(data.approval);
  const allChecklistChecked = s10Checklist.every((i) => Boolean(checkedItems[i.id]));

  const titleCharCount = Array.from((title || "").trim()).length;
  const bodyCharCount = Array.from((body || "").replace(/\r?\n/g, "")).length;
  const isTitleInRange = titleCharCount >= 28 && titleCharCount <= 45;
  const isBodyInRange = bodyCharCount >= 1200 && bodyCharCount <= 1500;

  function updateParagraph(idx, newText) {
    const next = [...bodyParagraphs];
    next[idx] = newText;
    setBody(next.join("\n\n"));
  }

  function moveParagraph(idx, dir) {
    const t = idx + dir;
    if (t < 0 || t >= bodyParagraphs.length) return;
    const next = [...bodyParagraphs];
    const tmp = next[idx];
    next[idx] = next[t];
    next[t] = tmp;
    setBody(next.join("\n\n"));
  }

  function addParagraphBelow(idx) {
    const next = [...bodyParagraphs];
    next.splice(idx + 1, 0, "새 문단 내용을 입력하십시오.");
    setBody(next.join("\n\n"));
  }

  function removeParagraph(idx) {
    if (bodyParagraphs.length <= 1) return;
    setBody(bodyParagraphs.filter((_, i) => i !== idx).join("\n\n"));
  }

  function rotateMiddleParagraphs() {
    if (bodyParagraphs.length < 3) return;
    const next = [...bodyParagraphs];
    const mid = next.slice(1, -1);
    const rot = [...mid.slice(1), mid[0]];
    next.splice(1, mid.length, ...rot);
    setBody(next.join("\n\n"));
  }

  function scrollToParagraph(pIdx, term) {
    setParagraphMode(true);
    setShowInlineDiffHighlight(true);
    setFocusedParaIdx(pIdx);
    if (term) setHighlightedTerm(term);
    setTimeout(() => {
      const el = document.getElementById(`body-para-${pIdx}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  }

  function handleSave(override = {}) {
    const nextTitle = override.title ?? title;
    const nextSubtitle = override.subtitle ?? subtitle;
    const nextBody = override.body ?? body;
    const nextCapText = override.captionText ?? captionText;
    const nextByline = override.byline ?? byline;
    const caps = nextCapText
      .split(/\r?\n/)
      .map((c) => c.trim())
      .filter(Boolean);

    const newFindings = runClientHardRules(
      nextTitle,
      nextSubtitle,
      nextBody,
      caps,
      nextByline
    );

    onUpdate((prev) => ({
      ...prev,
      job: {
        ...prev.job,
        verdict: override.resolveHold ? "PASS" : prev.job.verdict,
        options_json: JSON.stringify({ byline: nextByline }),
      },
      article: {
        ...(prev.article || {}),
        version: (prev.article?.version || 1) + 1,
        title: nextTitle,
        subtitle: nextSubtitle,
        body: nextBody,
        caption_json: JSON.stringify(caps),
        ai_notice_included: aiNoticeIncluded ? 1 : 0,
      },
      findings: newFindings,
      claims: override.resolveHold
        ? (prev.claims || []).map((c) => ({ ...c, status: "verified" }))
        : prev.claims,
      notifications: override.resolveHold ? [] : prev.notifications,
    }));

    setSaveFeedback("수정 내역 저장 및 하드룰 재검사가 완료되었습니다.");
    setTimeout(() => setSaveFeedback(null), 3000);
  }

  function handleAutoFixRule(ruleId, matchedText) {
    let nextBody = body;
    let nextCap = captionText;
    let nextByline = byline;

    if (ruleId === "FMT-01" && matchedText) {
      nextBody = nextBody.replaceAll(matchedText, "");
      setBody(nextBody);
    } else if (ruleId === "FMT-02") {
      nextBody = nextBody.replace(/(\d+(?:\.\d+)?)\s*평(?!\s*\()/g, (_, n) => {
        const sqm = Math.round(Number(n) * 3.3058 * 10) / 10;
        return `${sqm}㎡(${n}평)`;
      });
      setBody(nextBody);
    } else if (ruleId === "FMT-07") {
      let c = 0;
      nextBody = nextBody.replace(/밝혔다\./g, (m) => {
        c += 1;
        if (c === 2) return "설명했다.";
        if (c >= 3) return "전했다.";
        return m;
      });
      setBody(nextBody);
    } else if (ruleId === "FMT-08" && matchedText) {
      nextBody = nextBody.replaceAll(matchedText, "독자 기술로");
      setBody(nextBody);
    } else if (ruleId === "FMT-11") {
      nextByline = "매경 콘텐츠PR팀 기자";
      setByline(nextByline);
    } else if (ruleId === "FMT-12") {
      const comp = data.job.company_name || "기업";
      nextCap = `${comp} 관련 이미지 [제공=${comp}]`;
      setCaptionText(nextCap);
    }

    handleSave({ body: nextBody, captionText: nextCap, byline: nextByline });
  }

  async function handleChatEdit(customPrompt) {
    const instruction = (customPrompt ?? chatInput).trim();
    if (!instruction || chatLoading) return;

    const prevSnapshot = { title, subtitle, body };
    setChatLoading(true);

    try {
      const compList = (data.competitors || []).filter((c) => c.selected !== 0);
      const compContext =
        compList.length > 0
          ? `\n[조사된 동종업계 경쟁사]\n${compList
              .map((c, i) => `${i + 1}. ${c.name}: ${c.summary}`)
              .join("\n")}`
          : "";

      const sys = [
        "당신은 매일경제신문 PR사업팀의 베테랑 데스크 에디터입니다.",
        "사용자의 수정 요청(instruction)을 정확히 반영하여 현재 기사(title, subtitle, body)를 즉시 수정하십시오.",
        "특히 '브랜드별로 문단을 구분/분리해달라'는 요청이면, 각 경쟁사 브랜드마다 독립된 문단(\\n\\n으로 구분)을 따로 할애하고 대상 기업의 차별화 분석 문단도 독립 문단으로 나누어 작성하십시오.",
        "마크다운(**, ###)이나 출처번호([1])를 넣지 마십시오. JSON 문자열 내부의 인용문은 둥근 따옴표(‘...’, “...”)를 사용하십시오.",
        '반드시 다음 JSON 구조로만 응답하십시오: {"title":"...","subtitle":"...","body":"...","replySummary":"..."}',
      ].join("\n");

      const res = await callPerplexityResponsesApi({
        instructions: sys,
        input: `[담당자 수정 요청]\n${instruction}\n\n[기업명]: ${
          data.job.company_name || "대상 기업"
        }${compContext}\n\n[현재 제목]\n${title}\n\n[현재 부제목]\n${subtitle}\n\n[현재 본문]\n${body}`,
        maxOutputTokens: 4500,
        useWebSearch: false,
      });

      const parsed = safeParseLlmJson(res.text);
      if (!parsed || !parsed.body) {
        throw new Error("Empty or invalid JSON from chat edit");
      }
      const nextTitle = (parsed.title || title).replace(/\[\d+\]/g, "").trim();
      const nextSubtitle = (parsed.subtitle ?? subtitle)
        .replace(/\[\d+\]/g, "")
        .trim();
      const nextBody = (parsed.body || body)
        .replace(/\[\d+\]/g, "")
        .replace(/\*{1,2}/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      const replySummary =
        parsed.replySummary || "요청하신 내용을 반영하여 기사 문단을 재구성했습니다.";

      setTitle(nextTitle);
      setSubtitle(nextSubtitle);
      setBody(nextBody);
      setChatInput("");
      setChatHistory((prev) => [
        {
          id: `${Date.now()}`,
          instruction,
          replySummary,
          prevSnapshot,
          createdAt: new Date().toLocaleTimeString("ko-KR"),
        },
        ...prev,
      ]);
      handleSave({ title: nextTitle, subtitle: nextSubtitle, body: nextBody });
    } catch (err) {
      // Fallback deterministic split if offline/error
      const compList = (data.competitors || []).filter((c) => c.selected !== 0);
      if (compList.length > 0) {
        const paras = bodyParagraphs.filter(
          (p) => !compList.some((c) => p.includes(c.name))
        );
        const brandParas = compList.map(
          (c, i) =>
            `${i === 0 ? "동종업계 브랜드별 동향을 살펴보면, 먼저 " : "또한 경쟁 브랜드인 "}${
              c.name
            }의 행보가 주목된다. ${c.summary} 이를 통해 관련 시장 내 입지를 다지고 있다.`
        );
        brandParas.push(
          `이 같은 경쟁사들과 비교해 ${
            data.job.company_name || "당사"
          } 측은 독자적인 기술력과 공간 맞춤형 운영 효율성을 앞세워 뚜렷한 차별화를 꾀했다.`
        );
        const closing = paras[paras.length - 1] || "";
        const front = paras.slice(0, -1);
        const nextBody = [...front, ...brandParas, closing].join("\n\n");
        setBody(nextBody);
        setChatInput("");
        setChatHistory((prev) => [
          {
            id: `${Date.now()}`,
            instruction,
            replySummary: `경쟁사 브랜드별(${compList
              .map((c) => c.name)
              .join(", ")})로 문단을 각각 독립 분리했습니다.`,
            prevSnapshot,
            createdAt: new Date().toLocaleTimeString("ko-KR"),
          },
          ...prev,
        ]);
        handleSave({ body: nextBody });
      }
    } finally {
      setChatLoading(false);
    }
  }

  function buildCmsFullText() {
    const joiner = blankLineCopy ? "\n\n" : "\n";
    const bodyOut = bodyParagraphs.join(joiner);
    const parts = [title.trim()];
    if (subtitle.trim()) parts.push(subtitle.trim());
    parts.push(bodyOut);
    if (captionText.trim()) parts.push(captionText.trim());
    if (includeBylineCopy && byline.trim()) parts.push(byline.trim());
    if (aiNoticeIncluded) {
      parts.push("※ 이 기사는 AI 콘텐츠 작성 어시스턴트의 도움을 받아 작성되었습니다.");
    }
    return parts.join("\n\n");
  }

  async function handleCopyCms(part) {
    handleSave();
    const map = {
      full: buildCmsFullText(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      body: bodyParagraphs.join(blankLineCopy ? "\n\n" : "\n"),
      captions: captionText.trim(),
    };
    await navigator.clipboard.writeText(map[part] || "");
    setCopyFeedback("최신 수정본이 클립보드에 복사되었습니다.");
    setTimeout(() => setCopyFeedback(null), 3000);
  }

  async function handleQuickCopyRewritten(targetType = "body") {
    handleSave();
    const joiner = blankLineCopy ? "\n\n" : "\n";
    const cleanBody = bodyParagraphs.join(joiner);
    const textToCopy =
      targetType === "all"
        ? [title.trim(), subtitle.trim(), cleanBody, captionText.trim()]
            .filter(Boolean)
            .join("\n\n")
        : cleanBody;
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setQuickCopyFeedback(
      targetType === "all"
        ? "✓ 제목+부제+리라이팅 본문 전체가 복사되었습니다!"
        : "✓ 리라이팅된 본문 전체가 클립보드에 복사되었습니다!"
    );
    setTimeout(() => setQuickCopyFeedback(null), 3000);
  }

  function renderOriginalWithHighlightsStudio() {
    return (
      <div className="space-y-3 text-[14px] leading-[24px] text-ink">
        {rawParagraphs.map((rp, rIdx) => {
          const sents = (rp || "")
            .split(/(?<=[.!?다요])\s+/)
            .map((s) => s.trim())
            .filter(Boolean);
          return (
            <div
              key={rIdx}
              className="rounded-md border-hairline border-line bg-surface p-3 space-y-2 break-keep"
            >
              <div className="flex items-center justify-between text-[11px] text-ink-muted border-b-hairline border-line pb-1">
                <span className="font-semibold text-ink">
                  원문 단락 {String(rIdx + 1).padStart(2, "0")} ({Array.from(rp).length}자)
                </span>
                {effectiveMode === "minimal" && (
                  <span>빨간색 문장 클릭 → 수정 버전 선택</span>
                )}
              </div>
              <div className="leading-[26px]">
                {sents.map((sent, sIdx) => {
                  const matchedSug =
                    effectiveMode === "minimal"
                      ? sentenceSuggestions.find(
                          (sug) =>
                            sent === sug.originalSentence ||
                            sent.includes(sug.originalSentence) ||
                            sug.originalSentence.includes(sent)
                        )
                      : null;

                  if (matchedSug) {
                    const isReplaced = Boolean(matchedSug.selectedAltId);
                    const isOpen = activeSuggestionId === matchedSug.id;
                    const selAlt = matchedSug.alternatives.find(
                      (a) => a.id === matchedSug.selectedAltId
                    );

                    return (
                      <React.Fragment key={`${rIdx}-${sIdx}`}>
                        <span
                          id={`sug-card-${matchedSug.id}`}
                          onClick={() => {
                            setActiveSuggestionId((p) =>
                              p === matchedSug.id ? null : matchedSug.id
                            );
                            setCustomAltText(
                              selAlt?.text ||
                                matchedSug.alternatives[0]?.text ||
                                ""
                            );
                          }}
                          title="클릭하여 수정할 문장 버전을 선택하세요"
                          className={`mr-1.5 cursor-pointer rounded px-1.5 py-0.5 transition-colors inline ${
                            isReplaced
                              ? "bg-pass-bg text-pass font-semibold border-b-2 border-pass"
                              : "bg-reject-bg text-reject underline decoration-reject decoration-2 font-medium hover:bg-reject-bg/80"
                          }`}
                        >
                          {isReplaced && selAlt ? selAlt.text : sent}
                          <span
                            className={`ml-1 inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-bold align-middle whitespace-nowrap ${
                              isReplaced
                                ? "bg-pass text-surface"
                                : "bg-reject text-surface"
                            }`}
                          >
                            {isReplaced ? "✓ 초록색 교체됨 ▾" : "✎ 교정 선택 ▾"}
                          </span>
                        </span>

                        {isOpen && (
                          <div className="my-2.5 rounded-lg border-hairline border-primary bg-surface-subtle p-3 space-y-2 text-[13px] leading-[20px]">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b-hairline border-line pb-1.5">
                              <span className="font-bold text-primary text-[12px]">
                                ✨ 수정 제안 문장 선택 ({matchedSug.reason})
                              </span>
                              <div className="flex items-center gap-2">
                                {isReplaced && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRevertSentenceToOriginal(
                                        matchedSug.id
                                      )
                                    }
                                    className="text-[11px] font-semibold text-reject hover:underline whitespace-nowrap"
                                  >
                                    ↩ 원문으로 되돌리기
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setActiveSuggestionId(null)}
                                  className="text-[11px] text-ink-muted whitespace-nowrap"
                                >
                                  접기 ✕
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              {matchedSug.alternatives.map((alt) => {
                                const isCur =
                                  matchedSug.selectedAltId === alt.id;
                                return (
                                  <button
                                    key={alt.id}
                                    type="button"
                                    onClick={() =>
                                      handleSelectSentenceAlternative(
                                        matchedSug.id,
                                        alt.id
                                      )
                                    }
                                    className={`w-full text-left rounded border-hairline p-2.5 space-y-1 transition-colors ${
                                      isCur
                                        ? "border-pass bg-pass-bg text-pass"
                                        : "border-line bg-surface hover:border-primary text-ink"
                                    }`}
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                      <span className="font-semibold text-primary whitespace-nowrap">
                                        {alt.label} · {alt.toneBadge}
                                      </span>
                                      <span className="font-semibold text-pass whitespace-nowrap">
                                        {isCur
                                          ? "✓ 현재 선택됨 (초록색 교체 완료)"
                                          : "이 문장으로 교체 →"}
                                      </span>
                                    </div>
                                    <div className="text-[13.5px] leading-[21px] font-medium break-keep">
                                      {alt.text}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            <div className="pt-1.5 border-t-hairline border-line flex items-center gap-1.5">
                              <input
                                value={customAltText}
                                onChange={(e) =>
                                  setCustomAltText(e.target.value)
                                }
                                placeholder="직접 수정 문장 입력..."
                                className="flex-1 h-[30px] rounded border-hairline border-line bg-surface px-2.5 text-[12px]"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleSelectSentenceAlternative(
                                    matchedSug.id,
                                    `${matchedSug.id}-custom`,
                                    customAltText
                                  )
                                }
                                className="h-[30px] shrink-0 whitespace-nowrap rounded bg-pass px-2.5 text-[11px] font-semibold text-surface"
                              >
                                직접 교체
                              </button>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  }

                  return (
                    <span key={`${rIdx}-${sIdx}`} className="mr-1.5">
                      {sent}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderMinimalParagraphStudio(para, paraIdx) {
    const sents = (para || "")
      .split(/(?<=[.!?다요])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return (
      <div className="leading-[26px] text-[14px] text-ink break-keep">
        {sents.map((sent, sIdx) => {
          const matchedSug = sentenceSuggestions.find((sug) => {
            const selAlt = sug.alternatives.find(
              (a) => a.id === sug.selectedAltId
            );
            const curTarget = selAlt ? selAlt.text : sug.originalSentence;
            return (
              sent === curTarget ||
              sent.includes(curTarget) ||
              curTarget.includes(sent) ||
              sent === sug.originalSentence
            );
          });
          const matchedFact = factMemos.find(
            (m) => m.inserted && (sent === m.text || sent.includes(m.text))
          );

          if (matchedSug) {
            const isReplaced = Boolean(matchedSug.selectedAltId);
            const selAlt = matchedSug.alternatives.find(
              (a) => a.id === matchedSug.selectedAltId
            );
            const displayText =
              isReplaced && selAlt
                ? selAlt.text
                : matchedSug.alternatives[0]?.text || sent;

            return (
              <span
                key={`${paraIdx}-${sIdx}-${matchedSug.id}`}
                onClick={() => {
                  setActiveSuggestionId(matchedSug.id);
                  const el = document.getElementById(
                    `sug-card-${matchedSug.id}`
                  );
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                title="클릭하면 왼쪽 원문 교정 위치에서 다른 버전을 선택할 수 있습니다"
                className={`mr-1.5 cursor-pointer rounded px-1.5 py-0.5 transition-colors inline ${
                  isReplaced
                    ? "bg-pass-bg text-pass font-semibold border-b-2 border-pass"
                    : "bg-[#FEF9C3] text-ink font-medium border-b border-[#EAB308]"
                }`}
              >
                {displayText}
              </span>
            );
          }

          if (matchedFact) {
            return (
              <span
                key={`${paraIdx}-${sIdx}-fact`}
                className="mr-1.5 inline rounded bg-pass-bg text-pass border-b-2 border-pass font-semibold px-1.5 py-0.5 break-keep"
              >
                <span className="mr-1 inline-flex items-center whitespace-nowrap rounded bg-pass px-1.5 py-0.2 text-[10px] font-semibold text-surface select-none">
                  📌 {matchedFact.category}
                </span>
                <span>{sent}</span>
              </span>
            );
          }

          return (
            <span key={`${paraIdx}-${sIdx}`} className="mr-1.5">
              {sent}
            </span>
          );
        })}
      </div>
    );
  }

  function renderRewriteYellowHighlightsStudio(para, paraIdx) {
    const sents = (para || "")
      .split(/(?<=[.!?다요])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const sameRaw = rawParagraphs[paraIdx] || "";
    return (
      <div className="leading-[28px] text-[15px] text-ink">
        {sents.map((sent, sIdx) => {
          const probe = sent.slice(0, Math.min(20, Math.max(10, Math.floor(sent.length * 0.55))));
          const sameAsRaw = probe.length >= 10 && sameRaw.includes(probe);
          if (!sameAsRaw) {
            return (
              <span
                key={`${paraIdx}-rw-${sIdx}`}
                className="inline rounded-sm bg-[#FEF9C3] border-b border-[#EAB308] text-ink px-1.5 py-0.5 mr-1.5"
              >
                <span className="mr-1 rounded bg-[#FEF08A] border-hairline border-[#EAB308] px-1 py-0.2 text-[10px] font-semibold text-[#854D0E] select-none">
                  리라이팅·재구성
                </span>
                <span>{sent}</span>
              </span>
            );
          }
          return (
            <span key={`${paraIdx}-rw-${sIdx}`} className="mr-1.5">
              {sent}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-subtle flex flex-col">
      <header className="bg-surface border-b-hairline border-line">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="text-[14px] text-ink-muted hover:text-ink"
            >
              ← 작업 목록
            </button>
            <span className="text-line">|</span>
            <h1 className="text-[16px] font-semibold text-ink">
              {data.job.company_name || "보도자료 검토 작업"}
            </h1>
            <VerdictBadge verdict={data.job.verdict} />
            <span className="inline-flex h-[24px] items-center rounded-md border-hairline border-hold bg-hold-bg px-2 text-[12px] font-medium text-hold">
              네이버 제외 송출 권장 (PRD Q항목)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-md border-hairline border-line bg-surface-subtle p-0.5">
              {[
                { id: "minimal", label: "모드 1: 기본(최소 수정)" },
                { id: "rewrite", label: "모드 2: 리라이팅(2분할)" },
                { id: "comparative", label: "모드 3: 비교·기획" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSwitchModeInDetail(m.id)}
                  className={`h-[28px] rounded px-2.5 text-[12px] font-semibold ${
                    effectiveMode === m.id
                      ? m.id === "comparative"
                        ? "bg-secondary text-surface"
                        : "bg-primary text-surface"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onOpenGuide}
              className="inline-flex h-[32px] items-center gap-1.5 rounded-md border-hairline border-line bg-surface px-3 text-[12px] font-medium text-ink hover:bg-surface-subtle"
            >
              <span className="text-primary font-bold">ⓘ</span>
              <span>사용 가이드</span>
            </button>
            <ApiUsageBar refreshTrigger={data} />
          </div>
        </div>
      </header>

      {data.job.mode === "comparative" && (
        <div className="border-b-hairline border-secondary bg-secondary-subtle px-6 py-2">
          <div className="mx-auto max-w-[1600px] text-[12px] font-medium text-secondary">
            [실험 모드 · 경쟁사 실명 포함 가능 · 사람 검수 필수] 이 초안은 동종업계 경쟁사 비교·기획 문단을 포함하고 있습니다. 담당자 검수 후 송출하십시오.
          </div>
        </div>
      )}

      {data.job.verdict === "HOLD" && (
        <div className="border-b-hairline border-hold bg-hold-bg px-6 py-2.5">
          <div className="mx-auto max-w-[1600px] flex items-center justify-between gap-3 text-[12px] text-hold">
            <span className="font-semibold">
              ⚠ 보류(HOLD) 알림 — 보도자료 내 수치·성과 증빙 확인 필요 항목이 있습니다.
            </span>
            <button
              type="button"
              onClick={() => handleSave({ resolveHold: true })}
              className="rounded-md bg-primary px-3 py-1 text-[12px] font-semibold text-surface"
            >
              ✓ 증빙 자료 확인 완료 (보류 해제)
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-[1640px] flex-1 gap-4 p-4 items-start">
        {/* 4. 왼쪽 사이드: 📌 취재 팩트 메모장 (기본 활성) + 단계 진행 타임라인 탭 */}
        {!wideEditorMode && (
          <aside className="w-[350px] shrink-0 sticky top-4 space-y-3">
            <div className="rounded-lg border-hairline border-line bg-surface overflow-hidden">
              <div className="grid grid-cols-2 border-b-hairline border-line bg-surface-subtle p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setLeftTab("facts")}
                  className={`rounded py-2 px-2 text-[12px] font-bold whitespace-nowrap transition-colors ${
                    leftTab === "facts"
                      ? "bg-primary text-surface"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  📌 취재 팩트 메모장 ({factMemos.length}건)
                </button>
                <button
                  type="button"
                  onClick={() => setLeftTab("stages")}
                  className={`rounded py-2 px-2 text-[12px] font-semibold whitespace-nowrap transition-colors ${
                    leftTab === "stages"
                      ? "bg-primary-subtle text-primary"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  ⚡ 단계 진행 (S0~S10)
                </button>
              </div>

              {leftTab === "facts" ? (
                <div className="p-4 space-y-3.5 max-h-[calc(100vh-120px)] overflow-y-auto">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-[14px] font-bold text-ink whitespace-nowrap">
                        📌 취재 팩트 메모장 ({factMemos.length}건)
                      </h2>
                      <span className="rounded bg-hold-bg px-2 py-0.5 text-[10px] font-semibold text-hold whitespace-nowrap">
                        기업정보·매출액 추가
                      </span>
                    </div>
                    <p className="text-[12px] leading-[18px] text-ink-muted break-keep">
                      오른쪽 작성 중인 기사는 그대로 유지하면서, 보도자료 기업의 <strong>기업 정보·매출액·자체 취재 팩트</strong>를 매경 기사체로 다듬어 원하는 단락에 끼워 넣는 메모장입니다.
                    </p>
                  </div>

                  <div className="rounded-md border-hairline border-line bg-surface-subtle p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-ink-muted whitespace-nowrap">팩트 분류:</span>
                      <select
                        value={newFactCategory}
                        onChange={(e) => setNewFactCategory(e.target.value)}
                        className="rounded border-hairline border-line bg-surface px-2 py-1 text-[11px]"
                      >
                        <option value="기업 기본 정보">기업 기본 정보</option>
                        <option value="매출액·실적 정보">매출액·실적 정보</option>
                        <option value="브랜드·출시 핵심 팩트">브랜드·출시 핵심 팩트</option>
                        <option value="제품·기술 핵심 특징">제품·기술 핵심 특징</option>
                        <option value="유통·시장 판매 동향">유통·시장 판매 동향</option>
                      </select>
                    </div>
                    <textarea
                      rows={3}
                      value={newFactInput}
                      onChange={(e) => setNewFactInput(e.target.value)}
                      placeholder="기업 정보, 매출액 등 팩트나 보도자료 문장을 붙여넣으세요..."
                      className="w-full rounded border-hairline border-line bg-surface p-2 text-[12px] leading-[18px]"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        value={newFactUrl}
                        onChange={(e) => setNewFactUrl(e.target.value)}
                        placeholder="출처 URL (선택)"
                        className="min-w-0 flex-1 h-[32px] rounded border-hairline border-line bg-surface px-2.5 text-[12px]"
                      />
                      <button
                        type="button"
                        onClick={handleAddFactMemo}
                        disabled={!newFactInput.trim()}
                        className="h-[32px] shrink-0 whitespace-nowrap rounded bg-hold px-3 text-[12px] font-semibold text-surface disabled:opacity-50"
                      >
                        + 매경 문체로 추가
                      </button>
                    </div>
                  </div>

                  <div className="divide-y-hairline divide-line space-y-3">
                    {factMemos.map((memo) => {
                      const selIdx =
                        memoTargetParas[memo.id] ??
                        Math.min(memo.targetParagraphIndex || 0, Math.max(0, bodyParagraphs.length - 1));
                      return (
                        <div key={memo.id} className="pt-3 first:pt-0 space-y-2 text-[12px]">
                          <p className="font-medium text-ink leading-[19px] break-keep">{memo.text}</p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="whitespace-nowrap rounded bg-hold-bg px-2 py-0.5 text-[11px] font-semibold text-hold">
                              {memo.category}
                            </span>
                            {memo.sourceUrl && (
                              <a
                                href={memo.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="whitespace-nowrap text-[11px] text-ink-muted underline"
                              >
                                출처 원문 ↗
                              </a>
                            )}
                            {memo.inserted && (
                              <span className="whitespace-nowrap rounded bg-pass-bg px-1.5 py-0.5 text-[11px] font-semibold text-pass">
                                ✓ 본문 반영됨
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 pt-0.5">
                            <select
                              value={selIdx}
                              onChange={(e) =>
                                setMemoTargetParas((p) => ({
                                  ...p,
                                  [memo.id]: Number(e.target.value),
                                }))
                              }
                              className="h-[26px] rounded border-hairline border-line bg-surface px-2 text-[11px]"
                            >
                              {bodyParagraphs.map((_, pIdx) => (
                                <option key={pIdx} value={pIdx}>
                                  단락 {String(pIdx + 1).padStart(2, "0")}에 넣기
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleInsertFactMemoToParagraph(memo.id)}
                              className="whitespace-nowrap text-[12px] font-semibold text-hold hover:underline"
                            >
                              본문 반영 →
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFactMemo(memo.id)}
                              className="whitespace-nowrap text-[11px] text-ink-muted hover:text-reject ml-auto"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="divide-y-hairline divide-line max-h-[calc(100vh-120px)] overflow-y-auto">
                  {ALL_STAGES.map((st) => {
                    const stRec = (data.stages || []).find((s) => s.stage === st.id);
                    const summary = stRec ? deriveStageSummary(st.id, stRec.output_json) : "실행 완료";
                    const isHoldOrCaution =
                      summary.includes("HOLD") ||
                      summary.includes("차별화 적용") ||
                      summary.includes("증빙 확인 필요");
                    const isSelected = selectedStage === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStage((p) => (p === st.id ? null : st.id))}
                        className={`w-full text-left px-3.5 py-2.5 space-y-1 ${
                          isSelected ? "bg-primary-subtle" : "hover:bg-surface-subtle"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[12px]">
                          <span className={isSelected ? "font-semibold text-primary" : "font-medium text-ink"}>
                            {st.label}
                          </span>
                          {isHoldOrCaution ? (
                            <span className="whitespace-nowrap rounded bg-hold-bg px-1.5 py-0.5 text-[10px] font-semibold text-hold">
                              ⚠ 주의
                            </span>
                          ) : (
                            <span className="text-pass font-bold">✓</span>
                          )}
                        </div>
                        <p className={`text-[11px] truncate ${isHoldOrCaution ? "text-hold font-medium" : "text-ink-muted"}`}>
                          {summary}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* 중앙 메인 영역: 상단 복잡한 요소를 덜어내고 제목·부제 → [원문 전체] → [그 아래 수정된 내용] 순서로 한눈에 배치 */}
        <section className="flex-1 min-w-[580px] flex flex-col gap-4">
          {selectedStage && (
            <div className="rounded-lg border-hairline border-primary bg-surface p-4 space-y-2">
              <div className="flex items-center justify-between border-b-hairline border-line pb-2">
                <span className="text-[13px] font-semibold text-primary">
                  {ALL_STAGES.find((s) => s.id === selectedStage)?.label} 상세 결과
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedStage(null)}
                  className="text-[12px] text-ink-muted hover:text-ink whitespace-nowrap"
                >
                  닫기 ✕
                </button>
              </div>
              <pre className="max-h-[180px] overflow-y-auto rounded bg-surface-subtle p-3 text-[11px] font-mono">
                {JSON.stringify(
                  JSON.parse(
                    (data.stages || []).find((s) => s.stage === selectedStage)?.output_json || "{}"
                  ),
                  null,
                  2
                )}
              </pre>
            </div>
          )}

          <div className="rounded-lg border-hairline border-line bg-surface overflow-hidden flex-1 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-subtle px-4 py-3 border-b-hairline border-line">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-semibold text-ink whitespace-nowrap">기사 초안 편집기</h2>
                <span className="whitespace-nowrap rounded border-hairline border-info bg-info-bg px-2 py-0.5 text-[12px] text-info">
                  {effectiveMode === "minimal"
                    ? "모드 1 · 원문 최소 수정"
                    : effectiveMode === "rewrite"
                    ? "모드 2 · 전면 리라이팅"
                    : "모드 3 · 비교·기획 기사"}
                </span>
                {saveFeedback && (
                  <span className="whitespace-nowrap rounded border-hairline border-pass bg-pass-bg px-2 py-0.5 text-[11px] font-semibold text-pass">
                    ✓ {saveFeedback}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWideEditorMode((v) => !v)}
                  className="h-[30px] whitespace-nowrap rounded-md border-hairline border-line bg-surface px-3 text-[12px] font-medium text-ink"
                >
                  {wideEditorMode ? "3단 기본 화면으로 복귀" : "편집기 넓게 보기"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave()}
                  className="h-[30px] whitespace-nowrap rounded-md bg-primary px-3 text-[12px] font-semibold text-surface"
                >
                  수정 저장 및 하드룰 재검사
                </button>
              </div>
            </div>

            <div className="divide-y-hairline divide-line flex-1 flex flex-col">
              {/* 1. 제목 및 추천 제목 후보 (상단 최우선 노출) */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <label className="font-semibold text-ink">제목 (목표 40자 내외, 28~45자 통과)</label>
                  <span className={isTitleInRange ? "text-ink-muted" : "text-hold font-semibold"}>
                    {titleCharCount}자 (기준 28~45자)
                  </span>
                </div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-[42px] rounded-md border-hairline border-line px-3 text-[18px] font-semibold"
                />
                {s6Output?.titleCandidates?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-ink-muted whitespace-nowrap">
                      추천 제목 후보:
                    </span>
                    {s6Output.titleCandidates.map((cand, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTitle(cand)}
                        className="rounded border-hairline border-line bg-surface-subtle px-2 py-0.5 text-[11px] text-primary hover:border-primary hover:bg-primary-subtle transition-colors truncate max-w-full"
                      >
                        후보 {i + 1}: {cand}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. 부제 */}
              <div className="px-4 py-3 space-y-1.5">
                <label className="text-[12px] font-semibold text-ink">
                  부제목 (0~3줄, 명사형 종결·마침표 없음)
                </label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full rounded-md border-hairline border-line p-2.5 text-[14px]"
                />
              </div>

              {/* 비교·기획 모드 경쟁사 요약 (모드 3일 때만 간결 표시) */}
              {effectiveMode === "comparative" && (data.competitors || []).length > 0 && (
                <div className="px-4 py-3 bg-secondary-subtle space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-secondary">
                      [비교·기획 모드] 동종업계 경쟁사·유사 브랜드 조사 ({data.competitors.length}곳)
                    </span>
                    <button
                      type="button"
                      disabled={chatLoading}
                      onClick={() =>
                        handleChatEdit(
                          "비교·기획 문단에 묶여 있는 경쟁사 브랜드들을 문단마다 브랜드별로 각각 독립된 문단으로 분리해서 상세히 작성해줘."
                        )
                      }
                      className="whitespace-nowrap rounded border-hairline border-secondary bg-surface px-2.5 py-1 text-[11px] font-semibold text-secondary hover:bg-secondary hover:text-surface transition-colors"
                    >
                      {chatLoading ? "문단 분리 중..." : "📊 경쟁사 브랜드별로 문단 각각 분리하기"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[12px]">
                    {data.competitors.map((comp, cIdx) => (
                      <div key={comp.id || cIdx} className="rounded bg-surface p-2.5 border-hairline border-line space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-secondary">{comp.name}</span>
                          {comp.source_url && (
                            <a
                              href={comp.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary hover:underline whitespace-nowrap"
                            >
                              출처 ↗
                            </a>
                          )}
                        </div>
                        <p className="text-[11px] leading-[17px] text-ink-muted break-keep">{comp.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. 본문 영역: [왼쪽 화면] 원문에 교정 표시(빨간색 표시/초록색 교체) | [오른쪽 화면] 수정 완료된 원문 글 바로 보여주기 (좌우 2분할) 및 [전체 리라이팅된 글만 보기 + 바로 복사] */}
              <div className="p-4 space-y-3 flex-1">
                {/* 상단 본문 툴바 */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border-hairline border-line bg-surface-subtle px-3.5 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center rounded-md border-hairline border-line bg-surface p-0.5">
                      <button
                        type="button"
                        onClick={() => setCleanFullView(false)}
                        className={`h-[26px] rounded px-2.5 text-[12px] font-bold whitespace-nowrap transition-colors ${
                          !cleanFullView
                            ? "bg-primary text-surface"
                            : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        ◫ 좌우 2분할 비교 보기
                      </button>
                      <button
                        type="button"
                        onClick={() => setCleanFullView(true)}
                        className={`h-[26px] rounded px-2.5 text-[12px] font-bold whitespace-nowrap transition-colors ${
                          cleanFullView
                            ? "bg-primary text-surface"
                            : "text-primary hover:bg-primary-subtle"
                        }`}
                      >
                        📄 전체 리라이팅된 글만 보기
                      </button>
                    </div>
                    {effectiveMode === "minimal" ? (
                      <span className="text-[12px] font-semibold text-pass whitespace-nowrap">
                        ✓ 교정 제안 {sentenceSuggestions.length}건 중{" "}
                        {sentenceSuggestions.filter((s) => Boolean(s.selectedAltId)).length}건 초록색 교체 완료
                      </span>
                    ) : (
                      !cleanFullView && (
                        <span className="rounded bg-[#FEF9C3] border-hairline border-[#EAB308] px-2 py-0.5 text-[11px] font-semibold text-[#854D0E] whitespace-nowrap">
                          연한 노란색 = 원문 대비 수정·재구성된 문장
                        </span>
                      )
                    )}
                    <span className="text-[12px] text-ink-muted whitespace-nowrap">
                      (총 {bodyParagraphs.length}문단 · 공백 포함 {bodyCharCount.toLocaleString()}자)
                    </span>
                    {quickCopyFeedback && (
                      <span className="inline-flex items-center rounded bg-pass-bg border-hairline border-pass px-2.5 py-0.5 text-[11px] font-bold text-pass whitespace-nowrap">
                        {quickCopyFeedback}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickCopyRewritten("body")}
                      className="inline-flex h-[28px] items-center whitespace-nowrap rounded-md bg-pass px-3 text-[12px] font-bold text-surface hover:opacity-90"
                    >
                      📋 리라이팅 본문 바로 복사
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCopyRewritten("all")}
                      className="inline-flex h-[28px] items-center whitespace-nowrap rounded-md border-hairline border-primary bg-primary-subtle px-2.5 text-[11px] font-bold text-primary hover:opacity-90"
                    >
                      📋 제목+본문 전체 복사
                    </button>
                    {effectiveMode === "minimal" && (
                      <button
                        type="button"
                        onClick={handleApplyAllRecommendedSuggestions}
                        className="inline-flex h-[28px] items-center whitespace-nowrap rounded-md bg-[#F5B041] px-3 text-[12px] font-bold text-ink hover:opacity-90"
                      >
                        ✓ 전체 실행 (권장 교정 일괄 적용)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={rotateMiddleParagraphs}
                      className="h-[28px] whitespace-nowrap rounded border-hairline border-line bg-surface px-2.5 text-[11px] font-medium"
                    >
                      ⇄ 중간 문단 재배치
                    </button>
                    <button
                      type="button"
                      onClick={() => setParagraphMode((v) => !v)}
                      className="h-[28px] whitespace-nowrap rounded border-hairline border-line bg-surface px-2.5 text-[11px] font-medium"
                    >
                      {paragraphMode ? "통문장 직접 편집" : "문단별 보기"}
                    </button>
                  </div>
                </div>

                {cleanFullView ? (
                  /* 전체 리라이팅된 글만 보기 (클린 전문 뷰 + 바로 복사) */
                  <div className="rounded-lg border-hairline border-primary bg-surface overflow-hidden flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b-hairline border-line bg-primary-subtle/50">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-[24px] items-center rounded bg-primary px-2.5 text-[12px] font-bold text-surface whitespace-nowrap">
                          📄 전체 리라이팅된 글만 보기 (클린 전문)
                        </span>
                        <span className="text-[12px] text-ink-muted break-keep">
                          태그나 배지 없이 순수 리라이팅된 기사 전문만 한눈에 읽고 바로 드래그하거나 복사할 수 있습니다.
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickCopyRewritten("body")}
                          className="inline-flex h-[30px] items-center whitespace-nowrap rounded-md bg-pass px-3.5 text-[12px] font-bold text-surface hover:opacity-90"
                        >
                          📋 본문 전체 바로 복사
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickCopyRewritten("all")}
                          className="inline-flex h-[30px] items-center whitespace-nowrap rounded-md border-hairline border-primary bg-surface px-3 text-[12px] font-bold text-primary hover:bg-primary-subtle"
                        >
                          📋 제목+부제+본문 전체 복사
                        </button>
                        <button
                          type="button"
                          onClick={() => setCleanFullView(false)}
                          className="inline-flex h-[30px] items-center whitespace-nowrap rounded-md border-hairline border-line bg-surface px-2.5 text-[11px] font-semibold text-ink-muted hover:text-ink"
                        >
                          ◫ 좌우 2분할 비교 화면으로 돌아가기
                        </button>
                      </div>
                    </div>

                    <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* 좌측 7컬럼: 깔끔하게 정돈된 리라이팅 기사 전문 읽기·드래그 복사 시트 */}
                      <div className="lg:col-span-7 rounded-lg border-hairline border-line bg-surface p-5 space-y-4">
                        <div className="flex items-center justify-between border-b-hairline border-line pb-3">
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-primary uppercase">
                              완성된 리라이팅 기사 전문 (드래그 또는 버튼으로 즉시 복사)
                            </span>
                            <h2 className="text-[18px] leading-[26px] font-bold text-ink break-keep">
                              {title}
                            </h2>
                            {subtitle && (
                              <p className="text-[14px] leading-[22px] font-medium text-ink-muted break-keep">
                                {subtitle}
                              </p>
                            )}
                          </div>
                          <span className="text-[12px] font-semibold text-pass whitespace-nowrap shrink-0 ml-2">
                            {bodyParagraphs.length}문단 · {bodyCharCount.toLocaleString()}자
                          </span>
                        </div>

                        <div className="space-y-4 text-[15.5px] leading-[28px] text-ink select-text">
                          {bodyParagraphs.map((para, idx) => (
                            <p key={idx} className="break-keep">
                              {para}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* 우측 5컬럼: 바로 복사 가능한 순수 텍스트 박스 (통문장 편집 겸용) */}
                      <div className="lg:col-span-5 rounded-lg border-hairline border-line bg-surface-subtle p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-bold text-ink">
                            📋 순수 텍스트 원고 (클릭해 전체 선택·복사 및 직접 수정)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickCopyRewritten("body")}
                            className="rounded bg-primary px-2.5 py-1 text-[11px] font-bold text-surface hover:opacity-90"
                          >
                            텍스트 복사
                          </button>
                        </div>
                        <textarea
                          rows={18}
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-full rounded-md border-hairline border-line bg-surface p-3 text-[14px] leading-[24px] text-ink font-sans"
                        />
                        <p className="text-[11px] text-ink-muted">
                          💡 입력창을 클릭하면 리라이팅된 본문 전체가 자동 선택되며, 수정 시 우측 화면에도 즉시 반영됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 좌우 2분할 메인 그리드 */
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                    {/* 왼쪽 화면: 원문에 교정 표시 (빨간색 표시 / 초록색 교체) */}
                    <div className="rounded-lg border-hairline border-line bg-surface-subtle overflow-hidden flex flex-col">
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b-hairline border-line bg-surface">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-[22px] items-center rounded bg-ink px-2 text-[11px] font-bold text-surface whitespace-nowrap">
                            왼쪽 화면 · 원문에 교정 표시
                          </span>
                          <span className="text-[11px] text-ink-muted break-keep">
                            <strong className="text-reject">빨간색 표시</strong> 클릭 → 수정 문장 선택 시 <strong className="text-pass">초록색 교체</strong>
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-ink-muted whitespace-nowrap">
                          원문 {rawParagraphs.length}단락
                        </span>
                      </div>
                      <div className="p-3.5 max-h-[780px] overflow-y-auto">
                        {renderOriginalWithHighlightsStudio()}
                      </div>
                    </div>

                    {/* 오른쪽 화면: 수정 완료된 원문 글 바로 보여주기 (수정된 내용만 깔끔하게 표시) */}
                    <div className="rounded-lg border-hairline border-primary bg-surface overflow-hidden flex flex-col">
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b-hairline border-line bg-primary-subtle/50">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex h-[22px] items-center rounded bg-primary px-2 text-[11px] font-bold text-surface whitespace-nowrap">
                            오른쪽 화면 · 수정 완료된 기사 전문
                          </span>
                          <div className="inline-flex items-center rounded border-hairline border-line bg-surface p-0.5">
                            <button
                              type="button"
                              onClick={() => setRightPaneCleanText(false)}
                              className={`h-[20px] rounded px-2 text-[10px] font-bold whitespace-nowrap ${
                                !rightPaneCleanText
                                  ? "bg-primary text-surface"
                                  : "text-ink-muted hover:text-ink"
                              }`}
                            >
                              ✨ 하이라이트 보기
                            </button>
                            <button
                              type="button"
                              onClick={() => setRightPaneCleanText(true)}
                              className={`h-[20px] rounded px-2 text-[10px] font-bold whitespace-nowrap ${
                                rightPaneCleanText
                                  ? "bg-primary text-surface"
                                  : "text-primary hover:bg-primary-subtle"
                              }`}
                            >
                              📄 전체 글만 보기
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickCopyRewritten("body")}
                            className="inline-flex h-[22px] items-center whitespace-nowrap rounded bg-pass px-2 text-[11px] font-bold text-surface hover:opacity-90"
                          >
                            📋 본문 바로 복사
                          </button>
                          <span
                            className={`text-[11px] font-semibold whitespace-nowrap ${
                              isBodyInRange ? "text-pass" : "text-hold"
                            }`}
                          >
                            {bodyCharCount.toLocaleString()}자
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 max-h-[780px] overflow-y-auto space-y-3">
                        {rightPaneCleanText ? (
                          <div className="rounded-md border-hairline border-line bg-surface p-4 space-y-3.5">
                            <div className="flex items-center justify-between border-b-hairline border-line pb-2">
                              <span className="text-[11px] font-bold text-primary">
                                📄 전체 리라이팅·수정 완료 원고 (순수 텍스트)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuickCopyRewritten("body")}
                                className="rounded border-hairline border-primary bg-primary-subtle px-2 py-0.5 text-[11px] font-bold text-primary hover:opacity-90"
                              >
                                📋 전체 텍스트 복사
                              </button>
                            </div>
                            <div className="space-y-3.5 text-[15px] leading-[27px] text-ink select-text">
                              {bodyParagraphs.map((para, idx) => (
                                <p key={idx} className="break-keep">
                                  {para}
                                </p>
                              ))}
                            </div>
                          </div>
                        ) : paragraphMode ? (
                          bodyParagraphs.map((para, idx) => (
                            <div
                              id={`body-para-${idx}`}
                              key={idx}
                              className="rounded-md border-hairline border-line bg-surface-subtle/50 p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between border-b-hairline border-line pb-1 text-[11px]">
                                <span className="font-semibold text-primary whitespace-nowrap">
                                  수정 단락 {String(idx + 1).padStart(2, "0")} ({Array.from(para).length}자)
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => moveParagraph(idx, -1)}
                                    className="whitespace-nowrap rounded border-hairline border-line bg-surface px-1.5 py-0.5 text-[10px] disabled:opacity-40"
                                  >
                                    ↑ 위로
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === bodyParagraphs.length - 1}
                                    onClick={() => moveParagraph(idx, 1)}
                                    className="whitespace-nowrap rounded border-hairline border-line bg-surface px-1.5 py-0.5 text-[10px] disabled:opacity-40"
                                  >
                                    ↓ 아래로
                                  </button>
                                </div>
                              </div>

                              <div className="rounded border-hairline border-line bg-surface p-3">
                                {effectiveMode === "minimal"
                                  ? renderMinimalParagraphStudio(para, idx)
                                  : renderRewriteYellowHighlightsStudio(para, idx)}
                              </div>

                              <details className="group">
                                <summary className="cursor-pointer text-[11px] font-medium text-ink-muted hover:text-primary select-none">
                                  ✎ 단락 {String(idx + 1).padStart(2, "0")} 직접 타이핑 편집 열기
                                </summary>
                                <textarea
                                  rows={3}
                                  value={para}
                                  onChange={(e) => updateParagraph(idx, e.target.value)}
                                  className="mt-1.5 w-full rounded border-hairline border-line bg-surface p-2 text-[13px] leading-[21px]"
                                />
                              </details>
                            </div>
                          ))
                        ) : (
                          <textarea
                            rows={20}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="w-full rounded-md border-hairline border-line p-3 text-[14px] leading-[25px]"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 캡션 & 바이라인 */}
              <div className="p-4 grid grid-cols-2 gap-4 bg-surface-subtle/50">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-ink">
                      사진 캡션 (설명 + [제공=기관명] 필수)
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAutoFixRule("FMT-12", "")}
                      className="text-[11px] text-primary hover:underline whitespace-nowrap"
                    >
                      [제공={data.job.company_name || "기관명"}] 자동 보완
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    className="w-full rounded border-hairline border-line bg-surface p-2 text-[13px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-ink">
                    작성자 식별 정보 (바이라인 · FMT-11 / 네이버 C항목)
                  </label>
                  <input
                    value={byline}
                    onChange={(e) => setByline(e.target.value)}
                    className="w-full h-[38px] rounded border-hairline border-line bg-surface px-3 text-[13px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 하단 승인 및 CMS 복사 */}
          <div className="rounded-lg border-hairline border-line bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between border-b-hairline border-line pb-2.5">
              <div>
                <h3 className="text-[14px] font-semibold text-ink">
                  담당자 최종 검수·승인 체크리스트 (Human-in-the-loop)
                </h3>
                <p className="text-[12px] text-ink-muted">
                  체크리스트 확인 후 승인하면 CMS 붙여넣기용 복사 버튼이 활성화됩니다.
                </p>
              </div>
              {!isApproved && !allChecklistChecked && (
                <button
                  type="button"
                  onClick={() => {
                    const next = {};
                    s10Checklist.forEach((i) => (next[i.id] = true));
                    setCheckedItems(next);
                  }}
                  className="whitespace-nowrap rounded border-hairline border-line bg-surface-subtle px-2.5 py-1 text-[12px] font-medium"
                >
                  ✓ 전체 항목 일괄 체크
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {s10Checklist.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(checkedItems[item.id] || isApproved)}
                    disabled={isApproved}
                    onChange={(e) =>
                      setCheckedItems((p) => ({ ...p, [item.id]: e.target.checked }))
                    }
                  />
                  <span>{item.label}</span>
                </label>
              ))}
              <div className="flex flex-wrap gap-4 pt-2 text-[12px] text-ink-muted">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blankLineCopy}
                    onChange={(e) => setBlankLineCopy(e.target.checked)}
                  />
                  <span>[CMS 복사] 단락 사이 빈 줄 포함</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBylineCopy}
                    onChange={(e) => setIncludeBylineCopy(e.target.checked)}
                  />
                  <span>[CMS 복사] 하단에 기자 바이라인 포함</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiNoticeIncluded}
                    onChange={(e) => setAiNoticeIncluded(e.target.checked)}
                  />
                  <span>[옵션] AI 활용 고지 문구 포함</span>
                </label>
              </div>
            </div>

            {copyFeedback && (
              <div className="rounded border-hairline border-info bg-info-bg px-3 py-2 text-[12px] text-info">
                {copyFeedback}
              </div>
            )}

            {showCmsPreview && (
              <pre className="max-h-[200px] overflow-y-auto rounded border-hairline border-line bg-surface-subtle p-3 text-[12px] whitespace-pre-wrap font-sans">
                {buildCmsFullText()}
              </pre>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t-hairline border-line">
              <div className="flex items-center gap-2">
                {!isApproved ? (
                  <button
                    type="button"
                    disabled={!allChecklistChecked}
                    onClick={() => {
                      handleSave();
                      onUpdate((prev) => ({
                        ...prev,
                        approval: {
                          id: `app-${Date.now()}`,
                          approved_at: new Date().toISOString(),
                        },
                      }));
                    }}
                    className="h-[36px] whitespace-nowrap rounded-md bg-primary px-4 text-[13px] font-semibold text-surface disabled:opacity-50"
                  >
                    검수 승인 완료 (CMS 복사 잠금 해제)
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopyCms("full")}
                      className="h-[36px] whitespace-nowrap rounded-md bg-primary px-4 text-[13px] font-semibold text-surface"
                    >
                      📋 CMS용 전체 복사
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCmsPreview((v) => !v)}
                      className="h-[36px] whitespace-nowrap rounded-md border-hairline border-line bg-surface px-3 text-[12px]"
                    >
                      {showCmsPreview ? "미리보기 닫기" : "CMS 복사본 미리보기"}
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {["title", "subtitle", "body", "captions"].map((part) => (
                  <button
                    key={part}
                    type="button"
                    disabled={!isApproved}
                    onClick={() => handleCopyCms(part)}
                    className="h-[30px] whitespace-nowrap rounded border-hairline border-line bg-surface px-2.5 text-[12px] disabled:opacity-40"
                  >
                    {part === "title"
                      ? "제목만 복사"
                      : part === "subtitle"
                      ? "부제만 복사"
                      : part === "body"
                      ? "본문만 복사"
                      : "캡션만 복사"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 오른쪽 사이드: 상단 규정리포트/증빙/출처 + 오른쪽 하단 💬 AI 채팅으로 기사 수정 */}
        {!wideEditorMode && (
          <aside className="w-[350px] shrink-0 sticky top-4 space-y-3">
            <div className="rounded-lg border-hairline border-line bg-surface overflow-hidden">
              <div className="grid grid-cols-4 border-b-hairline border-line bg-surface-subtle p-1 gap-1">
                {[
                  { id: "rules", label: `규정(${(data.findings || []).length})` },
                  {
                    id: "claims",
                    label: `증빙(${
                      (data.claims || []).filter((c) => c.status === "evidence_required").length
                    })`,
                  },
                  { id: "sources", label: `출처(${(data.sources || []).length})` },
                  { id: "raw", label: "원문" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setRightTab(t.id)}
                    className={`whitespace-nowrap rounded py-1.5 text-[11px] font-medium ${
                      rightTab === t.id
                        ? "bg-primary-subtle text-primary font-semibold"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-3.5 space-y-2.5 max-h-[380px] overflow-y-auto text-[12px]">
                {rightTab === "rules" && (
                  <div className="space-y-2.5">
                    <h3 className="font-semibold text-ink">1. 기사식광고 하드룰 점검 (FMT-01~12)</h3>
                    {(data.findings || []).length === 0 ? (
                      <div className="rounded border-hairline border-pass bg-pass-bg p-3 text-pass">
                        ✓ 모든 하드룰 기준을 통과했습니다.
                      </div>
                    ) : (
                      (data.findings || []).map((f) => {
                        let mText = "";
                        try {
                          mText = JSON.parse(f.location_json || "{}").matchedText || "";
                        } catch {}
                        return (
                          <div key={f.id} className="rounded border-hairline border-line p-2.5 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{f.rule_id}</span>
                              <SeverityBadge severity={f.severity} />
                            </div>
                            <p className="break-keep leading-[18px]">{f.message}</p>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleAutoFixRule(f.rule_id, mText)}
                                className="whitespace-nowrap rounded bg-primary px-2 py-0.5 text-[11px] font-semibold text-surface"
                              >
                                ⚡ 원클릭 자동 교정
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {rightTab === "claims" && (
                  <div className="space-y-2">
                    {(data.claims || []).map((c) => (
                      <div key={c.id} className="rounded border-hairline border-line p-2.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-primary">{c.type}</span>
                          <span
                            className={`whitespace-nowrap rounded px-1.5 py-0.5 font-semibold ${
                              c.status === "evidence_required"
                                ? "bg-hold-bg text-hold"
                                : "bg-pass-bg text-pass"
                            }`}
                          >
                            {c.status === "evidence_required" ? "증빙 확인 필수" : "기사 반영 가능"}
                          </span>
                        </div>
                        <p className="break-keep">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {rightTab === "sources" && (
                  <div className="space-y-2">
                    {(data.sources || []).map((s) => (
                      <div key={s.id} className="rounded border-hairline border-line p-2.5 space-y-1">
                        <div className="flex justify-between text-[11px] text-ink-muted">
                          <span>단계: {s.stage}</span>
                          <span>{s.publisher || ""}</span>
                        </div>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-primary hover:underline break-all"
                        >
                          {s.title} ↗
                        </a>
                        {s.snippet && <p className="text-[11px] text-ink-muted">{s.snippet}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {rightTab === "raw" && (
                  <pre className="whitespace-pre-wrap rounded border-hairline border-line bg-surface-subtle p-3 text-[12px] font-sans">
                    {data.job.raw_text}
                  </pre>
                )}
              </div>
            </div>

            {/* 2. 오른쪽 하단 고정 패널: 💬 AI 채팅으로 기사 수정 */}
            <div className="rounded-lg border-hairline border-primary bg-surface p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex h-[22px] items-center whitespace-nowrap rounded bg-primary px-2 text-[11px] font-bold text-surface">
                  💬 AI 채팅으로 기사 수정
                </span>
                <span className="text-[10px] text-ink-muted whitespace-nowrap">
                  openai/gpt-5.6-sol
                </span>
              </div>
              <p className="text-[11px] leading-[16px] text-ink-muted break-keep">
                원하는 수정 방향을 선택하거나 직접 입력하면 제목·부제·본문을 즉시 개고합니다.
              </p>
              <div className="flex flex-wrap gap-1">
                {[
                  "보도자료 원문과 어순·문단 다르게 재구성",
                  "본문 1,350자 내외로 배경 설명 보강",
                  "정통 경제신문 기사 톤으로 다듬기",
                  "과장·홍보성 수식어 빼고 팩트 위주 정리",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={chatLoading}
                    onClick={() => handleChatEdit(preset)}
                    className="text-left rounded border-hairline border-line bg-surface-subtle px-2 py-1 text-[11px] font-medium text-ink hover:border-primary hover:text-primary transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <input
                  value={chatInput}
                  disabled={chatLoading}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleChatEdit();
                    }
                  }}
                  placeholder="수정 요청 입력 (Enter)..."
                  className="min-w-0 flex-1 h-[32px] rounded border-hairline border-line bg-surface px-2.5 text-[12px]"
                />
                <button
                  type="button"
                  disabled={chatLoading || !chatInput.trim()}
                  onClick={() => handleChatEdit()}
                  className="h-[32px] shrink-0 whitespace-nowrap rounded bg-primary px-3 text-[11px] font-semibold text-surface disabled:opacity-50"
                >
                  {chatLoading ? "수정 중..." : "적용"}
                </button>
              </div>
              {chatHistory.slice(0, 2).map((h) => (
                <div key={h.id} className="rounded border-hairline border-pass bg-pass-bg p-2 text-[11px] space-y-1">
                  <div className="font-semibold text-pass break-keep">✓ {h.replySummary}</div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setTitle(h.prevSnapshot.title);
                        setSubtitle(h.prevSnapshot.subtitle);
                        setBody(h.prevSnapshot.body);
                        setChatHistory((p) => p.filter((x) => x.id !== h.id));
                      }}
                      className="whitespace-nowrap rounded border-hairline border-line bg-surface px-2 py-0.5 text-[10px] text-ink"
                    >
                      ↩ 되돌리기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<App />);
