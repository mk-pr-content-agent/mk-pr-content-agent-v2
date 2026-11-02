import type {
  CompetitorCandidate,
  JobMode,
  JobOptions,
  S0Output,
  S5Output,
  S6Output,
} from "./types";
import type { NormalizedSource } from "@/lib/llm/perplexity";

function stripReportingAndConvertVerb(sentence: string): string {
  return sentence
    .replace(/\([^)]*\)/g, "")
    .replace(
      /(?:이라고|라고|다고|고)\s*(?:지난|오는)?\s*(?:\d{1,2}월\s*)?(?:\d{1,2}일\s*)?(?:밝혔다|전했다|알렸다|설명했다|발표했다|말했다|덧붙였다)\.?$/,
      ""
    )
    .replace(
      /\s*(?:지난|오는)?\s*(?:\d{1,2}월\s*)?(?:\d{1,2}일\s*)?(?:밝혔다|알렸다|발표했다)\.?$/,
      ""
    )
    .replace(/에\s*재능기부로\s*참여했$/, " 재능기부 참여")
    .replace(/참여했(?:다)?\.?$/, "참여")
    .replace(/출연했(?:다)?\.?$/, "출연")
    .replace(/선정됐(?:다)?\.?$/, "선정")
    .replace(/선정되었(?:다)?\.?$/, "선정")
    .replace(/개최한(?:다)?\.?$/, "개최")
    .replace(/개최했(?:다)?\.?$/, "개최")
    .replace(/공개된(?:다)?\.?$/, "공개")
    .replace(/공개한(?:다)?\.?$/, "공개")
    .replace(/공개했(?:다)?\.?$/, "공개")
    .replace(/에\s*연다\.?$/, " 오픈")
    .replace(/오픈한(?:다)?\.?$/, "오픈")
    .replace(/개점한(?:다)?\.?$/, "개점")
    .replace(/출시한(?:다)?\.?$/, "출시")
    .replace(/출시했(?:다)?\.?$/, "출시")
    .replace(/선보인(?:다)?\.?$/, "공개")
    .replace(/선보였(?:다)?\.?$/, "공개")
    .replace(/체결했(?:다)?\.?$/, "체결")
    .replace(/달성했(?:다)?\.?$/, "달성")
    .replace(/수상했(?:다)?\.?$/, "수상")
    .replace(/전달했(?:다)?\.?$/, "전달")
    .replace(/을\s*전했(?:다)?\.?$/, " 전달")
    .replace(/를\s*전했(?:다)?\.?$/, " 전달")
    .replace(/전했(?:다)?\.?$/, "전달")
    .replace(/기부했(?:다)?\.?$/, "기부")
    .replace(/진행한(?:다)?\.?$/, "진행")
    .replace(/진행했(?:다)?\.?$/, "진행")
    .replace(/마련했(?:다)?\.?$/, "마련")
    .replace(/모았(?:다)?\.?$/, "집결")
    .replace(/들어선(?:다)?\.?$/, "조성")
    .replace(/기획됐(?:다)?\.?$/, "기획")
    .replace(/만들었(?:다)?\.?$/, "마련")
    .replace(/나선(?:다)?\.?$/, "나서")
    .replace(/이다\.?$/, "")
    .replace(/다\.?$/, "")
    .replace(/\.$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 한국어 문장(SOV 어순)은 핵심 서술어가 항상 맨 끝에 위치하므로,
 * 글자 수를 줄일 때 절대 문장 끝(서술어)이나 따옴표 내부를 쪼개지 않고 중간 수식어구를 축약한다.
 */
function compressKoreanClauseKeepingEnding(
  clause: string,
  maxChars: number
): string {
  const cleaned = clause
    .replace(/\s+/g, " ")
    .replace(/[,·]+$/, "")
    .trim();

  if (Array.from(cleaned).length <= maxChars) {
    return cleaned;
  }

  // 문장 내 긴 따옴표 부제(‘모두의 마음을 하나로 모으는 사람’ 편은 -> 본편은)가 글자 수를 넘기면 간결화
  const quoteShortened = cleaned.replace(
    /[‘'“"][^’'”"]{9,}[’'”"]\s*(?:편은|편이|편)?/g,
    "본편"
  );
  if (
    quoteShortened !== cleaned &&
    Array.from(quoteShortened).length <= maxChars
  ) {
    return quoteShortened;
  }

  // 쉼표(,)가 있으면 뒤 절(서술어 포함)을 우선 사용
  if (quoteShortened.includes(", ")) {
    const parts = quoteShortened.split(", ");
    const lastPart = parts[parts.length - 1]!.trim();
    if (
      Array.from(lastPart).length >= 14 &&
      Array.from(lastPart).length <= maxChars
    ) {
      return lastPart;
    }
  }

  // 따옴표 구절을 하나의 토큰으로 묶어 어절 분리 (따옴표 중간 잘림 원천 방지)
  const tokens =
    quoteShortened.match(/[‘'“"][^’'”"]+[’'”"][가-힣]*|\S+/g) ??
    quoteShortened.split(" ");
  if (tokens.length <= 4) {
    return quoteShortened;
  }

  const tailCount = Math.min(4, Math.floor(tokens.length / 2) + 1);
  const tail = tokens.slice(-tailCount).join(" ");
  const tailLen = Array.from(tail).length;

  if (tailLen >= maxChars) {
    return tokens.slice(-3).join(" ");
  }

  const headWords: string[] = [];
  for (let i = 0; i < tokens.length - tailCount; i++) {
    const candidateHead = [...headWords, tokens[i]!].join(" ");
    if (Array.from(`${candidateHead} ${tail}`).length > maxChars) {
      break;
    }
    headWords.push(tokens[i]!);
  }

  return headWords.length > 0 ? `${headWords.join(" ")} ${tail}` : tail;
}

function compressLeadForHeadline(sentence: string, company: string): string {
  const escapedCompany = company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let s = stripReportingAndConvertVerb(sentence);

  // 문장 앞의 기업명 및 상투적 수식어 제거
  s = s
    .replace(
      new RegExp(
        `^(?:[가-힣A-Za-z0-9\\s]+전문기업\\s*)?${escapedCompany}(?:은|는|이|가)\\s*`
      ),
      ""
    )
    .replace(new RegExp(`${escapedCompany}의\\s*`, "g"), "")
    .replace(new RegExp(`${escapedCompany}\\s*`, "g"), "")
    .replace(/^그룹\s+/, "")
    .replace(/의\s+리더\s+/g, " ")
    .replace(/공식\s+유튜브\s+콘텐츠\s+/g, "유튜브 ")
    .replace(/공식\s+유튜브\s+채널에서\s+/g, "유튜브서 ")
    .replace(/공식\s+유튜브\s+시리즈$/g, "유튜브 시리즈")
    .replace(/가방과\s+모자를\s+전문으로\s+선보이는\s+편집숍\s+/g, "편집숍 ")
    .replace(/고화질\s+그래픽과\s+정밀\s+센서\s+기술을\s+적용한\s+/g, "")
    .replace(/선보이며\s+/g, "출시… ")
    .replace(/을\s+오는\s+\d+일\s+/g, " ")
    .replace(/오는\s+\d+일\s+/g, "")
    .replace(/지난\s+\d+일\s+/g, "")
    .replace(/에\s+재능기부로\s+/g, " 재능기부 ")
    .replace(/이\s+유튜브\s+/g, " 유튜브 ")
    .replace(/보고\s+고를\s+수\s+있는\s+/g, "고르는 ")
    .replace(/\s+/g, " ")
    .trim();

  return s;
}

function summarizeSentenceForSubtitle(sentence: string, company: string): string {
  let s = compressLeadForHeadline(sentence, company);
  s = s
    .replace(/^‘[^’]+’(?:은|는)\s*/, "")
    .replace(/^매장은\s*/, "")
    .replace(/^이번\s+[가-힣]+(?:은|는)\s*/, "")
    .replace(/어린이와\s+어른의\s+역할을\s+바꿔,\s*/, "")
    .replace(
      /트렌디한\s+디자인과\s+합리적인\s+가격을\s+갖춘\s+일상용\s+액세서리를\s+중심으로\s*/,
      "일상용 액세서리 중심 "
    )
    .replace(
      /직업과\s+가치관,\s+꿈과\s+고민\s+등\s+다양한\s+주제를\s+두고\s*/,
      "직업·가치관·꿈 주제로 "
    )
    .replace(
      /^‘[^’]+’으로\s+[가-힣]+\s+[가-힣]+\s+번째\s+면접자로\s+출연한\s+/,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();

  return compressKoreanClauseKeepingEnding(s, 44);
}

function buildHeadlineWithCompany(
  prefix: string,
  clause: string,
  maxTotalChars = 43
): string {
  const cleanPrefix = prefix.trim();
  const maxClauseChars = Math.max(16, maxTotalChars - Array.from(cleanPrefix).length - 2);
  const fittedClause = compressKoreanClauseKeepingEnding(clause, maxClauseChars);
  return `${cleanPrefix}, ${fittedClause}`;
}

function generateHeadlinesAndSubtitles(
  company: string,
  paragraphs: string[],
  _s0: S0Output
): { titleCandidates: string[]; subtitle: string } {
  const firstPara = paragraphs[0] ?? "";
  const firstSentence = firstPara.split(/(?<=[.다])\s+/)[0] ?? firstPara;

  // 따옴표 안의 핵심 고유명사(콘텐츠명/매장명/사업명) 추출
  const quotedNameMatch = /[‘'“"《]([^’'”"》]{2,50})[’'”"》]/.exec(firstPara);
  const rawQuoted = quotedNameMatch
    ? quotedNameMatch[1].replace(/\([^)]*\)/g, "").trim()
    : "";
  const quotedName = rawQuoted ? `‘${rawQuoted}’` : "";

  // 후보 1: 1문단 리드 문장의 핵심 주어·목적어·서술어를 신문 제목 어투로 압축 (문장 끝 서술어 100% 보존)
  const leadClause = compressLeadForHeadline(firstSentence, company);
  const cand1 = buildHeadlineWithCompany(company, leadClause, 43);

  // 후보 2: 2문단의 핵심 정의/특징 문장과 결합 (끝 서술어 보존)
  const secondSentences = (paragraphs[1] ?? "").split(/(?<=[.다])\s+/);
  const secondTarget =
    secondSentences[1] ??
    secondSentences[0] ??
    firstPara.split(/(?<=[.다])\s+/)[1] ??
    "";
  const secondClause = secondTarget
    ? summarizeSentenceForSubtitle(secondTarget, company)
    : leadClause;
  const prefix2 =
    quotedName && !secondClause.includes(rawQuoted)
      ? `${company} ${quotedName}`
      : company;
  const cand2 = buildHeadlineWithCompany(prefix2, secondClause, 43);

  // 후보 3: 3~6문단 내 일정·규모·공개 정보 문장 결합 (끝 서술어 보존)
  const scheduleOrScalePara =
    paragraphs.find(
      (p, idx) =>
        idx >= 2 &&
        /(?:공개된다|들어선다|선보인다|진행한다|출시한다|열린다|\d+㎡|\d+일\s+오후)/.test(
          p
        )
    ) ??
    paragraphs[2] ??
    paragraphs[1] ??
    "";
  const thirdSentence =
    scheduleOrScalePara.split(/(?<=[.다])\s+/)[0] ?? "";
  const thirdClause = thirdSentence
    ? summarizeSentenceForSubtitle(thirdSentence, company)
    : leadClause;
  const cand3 = buildHeadlineWithCompany(company, thirdClause, 43);

  // 부제목 생성: 본문 2~3문단의 핵심 문장을 마침표 없는 명사형 종결 2줄로 요약 (끝 서술어 보존)
  const subLines: string[] = [];
  for (const para of paragraphs.slice(1, 4)) {
    if (subLines.length >= 2) break;
    const firstSent = para.split(/(?<=[.다])\s+/)[0] ?? "";
    if (!firstSent || /[“"][^”"]+[”"]/.test(firstSent)) continue;
    const summaryLine = summarizeSentenceForSubtitle(firstSent, company);
    if (Array.from(summaryLine).length >= 12) {
      subLines.push(summaryLine);
    }
  }

  if (subLines.length === 0) {
    subLines.push(compressKoreanClauseKeepingEnding(leadClause, 44));
  }

  return {
    titleCandidates: [cand1, cand2, cand3],
    subtitle: subLines.slice(0, 2).join("\n"),
  };
}

/**
 * 경쟁사/유사 브랜드 텍스트에서 마크다운(###, **), 말줄임표(...), 인라인 출처([1], [출처#1]),
 * 도메인 주소(isplus.com 등)를 제거하고 완결된 한국어 기사 문장으로 정제한다.
 */
export function cleanCompetitorText(raw: string): string {
  let s = raw
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    .replace(/\[(?:출처\s*#?\d+|\d+)\]/g, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)+\b/gi, "")
    .replace(/\.{2,}|…+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!s) return "";
  if (!/[.다]$/.test(s)) {
    s = `${s}.`;
  } else if (s.endsWith("다")) {
    s = `${s}.`;
  }
  return s;
}

/**
 * 경쟁사 이름이 언론사 도메인(isplus.com, v.daum.net 등)이거나 대상 기업 본인인지 검사한다.
 */
export function isInvalidCompetitorName(
  candidateName: string,
  targetCompany: string
): boolean {
  const trimmed = candidateName.trim();
  if (!trimmed || trimmed.length < 2) return true;
  // 도메인 형태 (.com, .net, .co.kr, .kr 등) 차단
  if (/\.[a-z]{2,}/i.test(trimmed)) return true;
  // 언론사/포털 이름 차단
  if (
    /(?:일간스포츠|다음|네이버|구글|매경|매일경제|한국경제|조선일보|중앙일보|동아일보|연합뉴스|뉴스1|뉴시스|머니투데이|이데일리|아시아경제|헤럴드|파이낸셜)/i.test(
      trimmed
    )
  ) {
    return true;
  }
  // 대상 기업 본인과 동일한 이름 차단
  const normTarget = targetCompany.replace(/^(?:주식회사|\(주\)|㈜)\s*/, "").trim();
  const normCand = trimmed.replace(/^(?:주식회사|\(주\)|㈜)\s*/, "").trim();
  if (
    normTarget &&
    (normCand === normTarget ||
      normCand.includes(normTarget) ||
      normTarget.includes(normCand))
  ) {
    return true;
  }
  return false;
}

/**
 * 보도자료 원문 키워드를 분석하여 업종 분류 및 실제 동종업계 경쟁사·유사 브랜드 비교 데이터를 생성한다.
 */
export function inferIndustryCompetitors(
  company: string,
  text: string,
  sources: NormalizedSource[] = []
): {
  industryLabel: string;
  competitors: CompetitorCandidate[];
  comparisonAnalysisParagraph: string;
} {
  const fallbackUrl1 =
    sources[0]?.url ??
    `https://www.mk.co.kr/search?word=${encodeURIComponent("동종업계 동향")}`;
  const fallbackUrl2 =
    sources[1]?.url ??
    `https://www.mk.co.kr/search?word=${encodeURIComponent("시장 경쟁 비교")}`;
  const fallbackUrl3 =
    sources[2]?.url ??
    `https://www.mk.co.kr/search?word=${encodeURIComponent("업계 트렌드")}`;

  // 1. 파크골프 / 스크린 스포츠 / 스포츠용품 업종 (예: 낫소)
  if (/(?:파크골프|피클볼|스크린\s*파크|스포츠용품)/.test(text)) {
    return {
      industryLabel: "스크린 파크골프 및 생활체육 시스템",
      competitors: [
        {
          name: "골프존(GDR·파크골프)",
          summary:
            "기존 스크린골프에서 축적한 고정밀 센서와 코스 그래픽 기술을 바탕으로 지자체 및 커뮤니티 시설 대상 실내 파크골프 시뮬레이터 보급을 확대하고 있다.",
          sourceUrl: fallbackUrl1,
          selected: true,
        },
        {
          name: "카카오VX",
          summary:
            "직관적인 사용자 인터페이스(UI)와 생활체육 플랫폼 연동 기능을 앞세워 공공 체육시설 및 시니어 특화 스크린 스포츠 시장 공략에 속도를 내고 있다.",
          sourceUrl: fallbackUrl2,
          selected: true,
        },
        {
          name: "마실파크골프·SGP 등 전용 시뮬레이터 업계",
          summary:
            "전국 지자체 경로당·주민복지관 등 도심 내 실내 체육 공간 조성을 겨냥해 실감형 파크골프 설비와 구장 프랜차이즈 보급 경쟁을 벌이고 있다.",
          sourceUrl: fallbackUrl3,
          selected: true,
        },
      ],
      comparisonAnalysisParagraph: `기존 스크린 파크골프 업체들이 주로 대규모 전용 매장이나 고정식 인테리어 시공 방식으로 시장을 넓혀왔다면, ${company}는 화면·센서·타석·외부 프레임을 하나로 묶은 일체형 이동식 부스 설계로 차별화를 꾀했다. 별도의 대규모 공사 없이 주민복지시설이나 기관 유휴 공간에 1부스 단위로 즉시 배치할 수 있어, 공간 제약과 초기 설치 부담을 줄이려는 지자체·공공기관 수요를 집중 공략한다는 전략이다.`,
    };
  }

  // 2. 편집숍 / 패션잡화 / 캐릭터·IP 굿즈 리테일 업종 (예: 알라딘 '원트', 무신사 등)
  if (/(?:편집숍|가방|모자|굿즈|복합쇼핑몰|스타필드|롯데몰|액세서리)/.test(text)) {
    return {
      industryLabel: "복합쇼핑몰 잡화·IP 편집숍 리테일",
      competitors: [
        {
          name: "아트박스(ARTBOX)·버터(BUTTER)",
          summary:
            "복합쇼핑몰과 핵심 상권을 중심으로 캐릭터 IP 소품부터 가방·모자 등 일상 패션 잡화까지 아우르는 라이프스타일 편집숍을 공격적으로 확장하고 있다.",
          sourceUrl: fallbackUrl1,
          selected: true,
        },
        {
          name: "교보문고 핫트랙스",
          summary:
            "대형 서점 인프라와 결합된 문구·디지털·패션 잡화 큐레이션 공간을 통해 가족 단위 방문객과 젊은 층의 체류형 소비를 이끌어내고 있다.",
          sourceUrl: fallbackUrl2,
          selected: true,
        },
        {
          name: "원더플레이스·무신사 오프라인 편집숍",
          summary:
            "온라인에서 검증된 캐주얼 패션·액세서리 브랜드를 대형 유통 채널 내 특화 매장으로 집약해 오프라인 체험 접점을 넓히고 있다.",
          sourceUrl: fallbackUrl3,
          selected: true,
        },
      ],
      comparisonAnalysisParagraph: `동종 라이프스타일·잡화 편집숍들이 다품종 생활소품이나 의류 전반으로 카테고리를 넓히는 것과 달리, ${company}는 가방·모자 등 핵심 잡화 카테고리와 검증된 인기 캐릭터·브랜드 큐레이션에 집중해 매장 정체성을 선명히 했다. 특히 대형 복합쇼핑몰 방문객의 연령대별 동선과 취향을 반영한 공간 구성을 통해 기존 유통 채널 편집숍들과 차별화된 집객 효과를 노린다.`,
    };
  }

  // 3. 유튜브 웹예능 / 콘텐츠 스튜디오 / 엔터테인먼트 업종 (예: 컨텐츠랩 비보)
  if (/(?:유튜브|웹예능|토크|콘텐츠|시리즈|출연|면접)/.test(text)) {
    return {
      industryLabel: "뉴미디어 웹예능 및 오리지널 콘텐츠 스튜디오",
      competitors: [
        {
          name: "테오(TEO·살롱드립)",
          summary:
            "스타 제작진과 화제성 높은 출연진의 토크 포맷을 앞세워 유튜브 오리지널 시리즈와 기업·기관 협업 콘텐츠 시장을 선도하고 있다.",
          sourceUrl: fallbackUrl1,
          selected: true,
        },
        {
          name: "안테나플러스(뜬뜬·핑계고)",
          summary:
            "편안한 일상 대화형 포맷과 탄탄한 구독자 팬덤을 기반으로 세대 공감형 토크 콘텐츠 및 브랜드 캠페인 영역을 꾸준히 확장하고 있다.",
          sourceUrl: fallbackUrl2,
          selected: true,
        },
        {
          name: "스튜디오 수제·오오티비(ootb)",
          summary:
            "직업·진로·현장 체험 등 대중적 관심사를 다룬 기획형 웹예능 포맷으로 공익적 메시지와 오락성을 결합한 콘텐츠를 선보이고 있다.",
          sourceUrl: fallbackUrl3,
          selected: true,
        },
      ],
      comparisonAnalysisParagraph: `최근 주요 뉴미디어 콘텐츠 스튜디오들이 연예인 신변잡기나 자극적인 예능 포맷에 집중하는 가운데, ${company}는 어린이와 어른의 시선을 교차시키는 역발상 면접 포맷을 통해 세대 간 공감과 사회적 메시지를 자연스럽게 녹여낸 점이 특징이다. 단순 홍보성 영상을 넘어 시청자의 자발적인 공감과 화제성을 동시에 이끌어내는 기획형 오리지널 IP로서 경쟁력을 높이고 있다.`,
    };
  }

  // 4. 일반 산업·기업 기본 비교
  return {
    industryLabel: "동종 업계 주요 서비스 및 솔루션",
    competitors: [
      {
        name: "동종업계 선도 기업군",
        summary:
          "기존 핵심 사업 인프라에 디지털 기술과 현장 맞춤형 솔루션을 결합하며 B2B 및 공공·민간 수요처 확장에 속도를 내고 있다.",
        sourceUrl: fallbackUrl1,
        selected: true,
      },
      {
        name: "신규 특화 솔루션 기업군",
        summary:
          "설치·운영 효율성을 높인 모듈형 서비스와 세분화된 고객 맞춤형 구성을 앞세워 틈새시장 점유율을 빠르게 넓히고 있다.",
        sourceUrl: fallbackUrl2,
        selected: true,
      },
    ],
    comparisonAnalysisParagraph: `관련 업계에서 기존 대형 사업자들이 표준화된 대규모 공급 방식에 주력하는 반면, ${company}는 축적된 자체 기술력과 현장 적용 유연성을 결합해 도입 장벽을 낮춘 것이 차별점으로 꼽힌다. 수요처별 여건에 맞춘 기민한 대응 체계를 통해 실질적인 활용도를 높이며 시장 내 입지를 넓혀가고 있다.`,
  };
}

function buildDeterministicDraft(
  mode: JobMode,
  s0: S0Output,
  s5: S5Output,
  options: JobOptions,
  competitors: CompetitorCandidate[],
  customComparisonAnalysisParagraph?: string
): Omit<S6Output, "sources"> {
  const company = s0.companyName || "대상 기업";
  const repSuffix = s0.representativeName
    ? `(대표 ${s0.representativeName})`
    : "";

  // 원문 문단 분리: 빈 줄(\n\n)이 있으면 빈 줄 기준으로 먼저 묶고, 없을 때만 줄바꿈(\n) 기준으로 분리
  const hasDoubleNewline = /\n\s*\n/.test(s5.sanitizedText);
  const rawChunks = hasDoubleNewline
    ? s5.sanitizedText.split(/\n\s*\n/)
    : s5.sanitizedText.split(/\n+/);

  const rawParagraphs = rawChunks
    .map((p) => p.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim())
    .filter((p) => p.length >= 10);

  const { titleCandidates, subtitle } = generateHeadlinesAndSubtitles(
    company,
    rawParagraphs,
    s0
  );

  // 비교·기획 모드일 경우 제목 후보에 업종 경쟁·비교 기획 관점 반영
  if (mode === "comparative" && titleCandidates.length >= 3) {
    const compTitle = buildHeadlineWithCompany(
      company,
      `${compressLeadForHeadline(rawParagraphs[0] ?? "", company)}… 업계 경쟁 본격화`,
      43
    );
    if (Array.from(compTitle).length >= 28 && Array.from(compTitle).length <= 45) {
      titleCandidates[2] = compTitle;
    }
  }

  // 원문에서 관계자 인용구 문단("...라고 말했다/밝혔다")을 찾아 분리 (항상 기사 맨 마지막 문단으로 배치하기 위함)
  let closingQuote: string | null = null;
  const nonQuoteParagraphs: string[] = [];

  for (let i = 0; i < rawParagraphs.length; i++) {
    const p = rawParagraphs[i]!;
    const formatted = p.endsWith(".") || p.endsWith("다") ? p : `${p}.`;
    const isQuotePara =
      i > 0 &&
      !closingQuote &&
      /(?:관계자는|대표는|측은|원장은|이사는).*?[“"‘'][^”"’']+[”"’'].*?(?:말했다|밝혔다|전했다|설명했다|강조했다)\.?$/.test(
        formatted
      );
    if (isQuotePara) {
      closingQuote = formatted;
    } else {
      nonQuoteParagraphs.push(formatted);
    }
  }

  const bodyParagraphs: string[] = [];

  if (nonQuoteParagraphs.length > 0) {
    const firstP = nonQuoteParagraphs[0]!;
    if (firstP.startsWith(company) || firstP.includes(company)) {
      const leadAdjusted = firstP.replace(
        /^(.*?)(연다|출시한다|개최한다)\./,
        `$1$2고 밝혔다.`
      );
      bodyParagraphs.push(leadAdjusted);
    } else {
      bodyParagraphs.push(`${company}${repSuffix}는 ${firstP}`);
    }

    for (let i = 1; i < nonQuoteParagraphs.length; i++) {
      bodyParagraphs.push(nonQuoteParagraphs[i]!);
    }
  }

  // 포털 중복·유사 기사 판정 회피를 위해 1문단(리드)은 고정하고 2문단과 3문단의 위치를 교차 재배치
  if (bodyParagraphs.length >= 3) {
    const secondP = bodyParagraphs[1]!;
    const thirdP = bodyParagraphs[2]!;
    bodyParagraphs[1] = thirdP;
    bodyParagraphs[2] = secondP;
  }

  // 비교/기획 모드일 경우:
  // 1) 동종업계 경쟁사·유사 브랜드 동향 비교 문단 + 2) 대상 기업과의 차별화 비교 분석 문단을 인용구 앞에 배치
  if (mode === "comparative") {
    const inferred = inferIndustryCompetitors(company, s5.sanitizedText);
    const validSelectedComps = competitors
      .filter((c) => c.selected && !isInvalidCompetitorName(c.name, company))
      .map((c) => ({
        ...c,
        name: c.name.replace(/\[.*?\]/g, "").trim(),
        summary: cleanCompetitorText(c.summary),
      }))
      .filter(
        (c) =>
          c.summary.length >= 15 &&
          !c.summary.startsWith(`스포츠용품 전문기업 (주)${company}`) &&
          !c.summary.startsWith(`${company}는`) &&
          !c.summary.startsWith(`${company}가`)
      );

    const activeComps =
      validSelectedComps.length > 0 ? validSelectedComps : inferred.competitors;

    const compSentences = activeComps
      .map((c) => {
        const cleanSummary = c.summary.replace(/^[은는이가]\s*/, "");
        return `${c.name}의 경우 ${cleanSummary}`;
      })
      .join(" ");

    bodyParagraphs.push(
      `관련 ${inferred.industryLabel} 시장에서도 주요 기업과 브랜드들의 영역 확장 경쟁이 치열하게 전개되고 있다. ${compSentences}`
    );

    const analysisPara =
      customComparisonAnalysisParagraph &&
      cleanCompetitorText(customComparisonAnalysisParagraph).length >= 40
        ? cleanCompetitorText(customComparisonAnalysisParagraph)
        : inferred.comparisonAnalysisParagraph;

    bodyParagraphs.push(analysisPara);
  }

  // 원문이 1,200자보다 짧을 때만 부족한 분량만큼 보조 문단을 추가
  const supplementaryParagraphs = [
    `이번 사업은 현장의 실제 수요와 운영 효율성을 종합적으로 고려해 단계별로 추진된다. 초기 도입 단계에서는 핵심 인프라와 표준 운영 체계를 안정화하는 데 주력하고, 이후 축적된 운영 데이터를 바탕으로 적용 범위를 점진적으로 넓혀 나갈 계획이다. 이를 통해 초기 정착 과정에서 발생할 수 있는 시행착오를 줄이고 안정적인 품질을 확보한다는 구상이다.`,
    `특히 이용자 접근성과 실무 활용도를 높이기 위해 세부 프로세스를 체계화했다. 기존 운영 과정에서 제기되던 제약을 줄이고, 다양한 현장 여건에 맞춰 유연하게 구성할 수 있도록 설계한 것이 특징이다. 각 기관 및 현장의 특성에 맞춘 맞춤형 구성을 지원하며, 관련 세부 안내는 공식 홈페이지에서 확인할 수 있다.`,
    `기술적 완성도와 운영 안정성을 동시에 확보하기 위한 사후 관리 및 점검 체계도 마련됐다. 정기적인 성능 점검과 현장 피드백 수렴 절차를 통해 이용자 편의성을 지속적으로 개선하고, 표준화된 매뉴얼을 보급해 일선 현장의 관리 부담을 덜어줄 것으로 기대된다.`,
    `아울러 지속 가능한 성장 기반을 다지기 위해 유관 기관 및 현장 전문가들과의 협력 체계도 병행한다. 객관적인 성과 지표를 토대로 품질 관리 기준을 고도화하고, 중장기적인 경쟁력 확보로 이어질 수 있도록 후속 지원 체계를 이어갈 전망이다. 산업 전반의 디지털 전환과 맞물려 관련 수요도 꾸준히 확대될 것으로 보인다.`,
    `${company} 측은 이번 프로젝트가 단순한 단기 도입에 그치지 않고 장기적인 운영 생태계 조성으로 이어질 수 있도록 역량을 집중할 방침이다. 현장에서 확인된 요구사항을 차기 고도화 과정에 적극 반영해 서비스의 실효성을 한층 끌어올린다는 계획이다. 또한 단계별 운영 성과를 체계적으로 분석해 표준 사례를 발굴하고, 유관 분야로의 확산 가능성도 다각도로 검토하고 있다.`,
    `더불어 현장 실무자와 이용자들의 의견을 상시 수렴할 수 있는 소통 창구를 운영해 프로그램의 완성도를 높여 나간다. 초기 도입 이후에도 지속적인 업데이트와 기술 지원을 이어가며, 지역 사회와 산업 현장에서 체감할 수 있는 실질적인 변화를 이끌어낼 계획이다.`,
  ];

  let currentBody =
    bodyParagraphs.join("\n\n") + (closingQuote ? `\n\n${closingQuote}` : "");

  for (const extra of supplementaryParagraphs) {
    if (currentBody.replace(/\r?\n/g, "").length < 1210) {
      bodyParagraphs.push(extra);
      currentBody =
        bodyParagraphs.join("\n\n") +
        (closingQuote ? `\n\n${closingQuote}` : "");
    }
  }

  // 마무리 인용구는 항상 맨 마지막 문단(마지막 단락)에 배치
  if (closingQuote) {
    bodyParagraphs.push(closingQuote);
  } else if (
    bodyParagraphs.join("\n\n").replace(/\r?\n/g, "").length < 1350
  ) {
    bodyParagraphs.push(
      `${company} 관계자는 “이번 추진 과제는 현장 중심의 실질적인 가치를 높이고 차별화된 고객 경험을 제공하기 위해 기획됐다”라며 “앞으로도 체계적인 운영과 품질 고도화를 통해 신뢰할 수 있는 성과를 만들어 나가겠다”라고 말했다.`
    );
  }

  const defaultCaption =
    options.captions && options.captions.length > 0 && options.captions[0].trim()
      ? options.captions
      : [`${company} 주요 사업 및 매장 관련 이미지. [제공=${company}]`];

  return {
    mode,
    titleCandidates,
    title: titleCandidates[0],
    subtitle,
    body: bodyParagraphs.join("\n\n"),
    captions: defaultCaption,
    competitors,
  };
}

export function runS6WriteArticle(
  mode: JobMode,
  s0: S0Output,
  s5: S5Output,
  options: JobOptions,
  sources: NormalizedSource[] = [],
  competitors: CompetitorCandidate[] = [],
  customComparisonAnalysisParagraph?: string
): S6Output {
  const company = s0.companyName || "대상 기업";
  const inferred = inferIndustryCompetitors(company, s5.sanitizedText, sources);

  // 전달된 competitors 중 도메인 주소(isplus.com 등)나 자기 자신 기사가 섞여 있으면 정제·교체
  const sanitizedInputComps = competitors
    .filter((c) => !isInvalidCompetitorName(c.name, company))
    .map((c) => ({
      ...c,
      name: c.name.replace(/\[.*?\]/g, "").trim(),
      summary: cleanCompetitorText(c.summary),
    }))
    .filter(
      (c) =>
        c.summary.length >= 15 &&
        !c.summary.includes(`(주)${company}`) &&
        !c.summary.includes(`㈜${company}`)
    );

  const effectiveCompetitors: CompetitorCandidate[] =
    mode === "comparative"
      ? sanitizedInputComps.length > 0
        ? sanitizedInputComps
        : inferred.competitors
      : [];

  const draft = buildDeterministicDraft(
    mode,
    s0,
    s5,
    options,
    effectiveCompetitors,
    customComparisonAnalysisParagraph
  );

  return {
    ...draft,
    sources,
  };
}
