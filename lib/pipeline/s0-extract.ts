import type { ExtractedClaim, S0Output } from "./types";

function extractPrimaryCompanyName(normalizedText: string): string {
  const firstParagraph = normalizedText.split(/\n+/)[0] ?? normalizedText;

  // 1순위: 말미 또는 본문 내 "OO 관계자는", "OO 측은" 패턴 (가장 정확한 주체 기업명)
  const spokespersonMatch =
    /([가-힣A-Za-z0-9㈜]+)\s*(?:관계자는|측은|측에\s*따르면)/.exec(normalizedText);
  if (spokespersonMatch?.[1]) {
    const candidate = spokespersonMatch[1].trim();
    if (!/^(?:업계|시장|현장|행사|공연|주최|주관|이날|이번)$/.test(candidate)) {
      return candidate;
    }
  }

  // 2순위: 첫 문단에서 (주)OO / ㈜OO / 사단법인 OO 등 명시적 법인격 표기
  const firstParaCorp =
    /(?:주식회사\s*[가-힣A-Za-z0-9]+|㈜[가-힣A-Za-z0-9]+|[가-힣A-Za-z0-9]+㈜|사단법인\s*[가-힣A-Za-z0-9]+)/.exec(
      firstParagraph
    );
  if (firstParaCorp?.[0]) {
    return firstParaCorp[0].trim();
  }

  // 3순위: 첫 문장 맨 앞의 주어 추출 ("무신사가 ...", "유니세프 한국위원회(회장 정갑영)는 ...", "숭실대학교(총장 이윤재)는 ...")
  const subjectMatch =
    /^([가-힣A-Za-z0-9·&]+(?:\s+[가-힣A-Za-z0-9·&]+)?)(?:\([^)]+\))?(?:은|는|이|가)\s/.exec(
      firstParagraph.trim()
    );
  if (subjectMatch?.[1]) {
    const subj = subjectMatch[1].trim();
    if (subj.length >= 2 && subj.length <= 18) {
      return subj;
    }
  }

  // 4순위: 첫 문단 내 기관 접미사
  const firstParaOrg =
    /([가-힣A-Za-z0-9]{2,}(?:대학교|대학|협회|위원회|오케스트라|카드|은행|증권|그룹|전자|바이오|제약|병원|건설|유통|기업))/.exec(
      firstParagraph
    );
  if (firstParaOrg?.[1]) {
    return firstParaOrg[1].trim();
  }

  return "대상 기업";
}

export function runS0Extract(
  rawText: string,
  companyNameHint?: string
): S0Output {
  const normalizedText = rawText
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();

  // 기업명 추출: 힌트가 있으면 우선 사용, 없으면 첫 문단 주어 및 관계자 인용 기반 추출
  let companyName = companyNameHint?.trim() ?? "";
  if (!companyName) {
    companyName = extractPrimaryCompanyName(normalizedText);
  }

  // 대표자/총장/회장 직함+이름 추출
  const repMatch =
    /\(\s*(?:대표이사|대표|총장|회장|협회장|위원장|사장|단장)\s+([가-힣]{2,4})\s*\)|(?:대표이사|대표|총장|회장|사장)\s+([가-힣]{2,4})/.exec(
      normalizedText
    );
  const representativeName = repMatch?.[1] ?? repMatch?.[2];

  // 수치 추출
  const numberMatches = Array.from(
    new Set(
      normalizedText.match(
        /\d+(?:,\d{3})*(?:\.\d+)?\s*(?:억\s*원|만\s*원|조\s*원|원|%|명|개|건|배|년|개월|㎡|평|위|호점)/g
      ) ?? []
    )
  ).slice(0, 15);

  // 날짜 추출
  const dateMatches = Array.from(
    new Set(
      normalizedText.match(
        /(?:\d{4}년\s*\d{1,2}월(?:\s*\d{1,2}일)?|\d{1,2}월\s*\d{1,2}일(?:\([월화수목금토일]\))?|(?:오는|지난)\s*\d{1,2}일|\d{1,2}일부터\s*\d{1,2}일까지)/g
      ) ?? []
    )
  ).slice(0, 10);

  // 장소 추출
  const locationMatches = Array.from(
    new Set(
      normalizedText.match(
        /(?:서울숲|청량리점|서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)(?:\s+[가-힣0-9]+(?:구|시|군|동|읍|면|로|길|타워|홀|센터|점))?/g
      ) ?? []
    )
  ).slice(0, 10);

  // 문장 단위 클레임 추출
  const sentences = normalizedText
    .split(/(?<=[.?!다])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15);

  const claims: ExtractedClaim[] = sentences.slice(0, 14).map((sentence, idx) => {
    const id = `c${idx + 1}`;
    if (/(?:매출|실적|영업이익|성장률|점유율|감소|증가|\d+억|\d+만\s*원|\d+%)/.test(sentence)) {
      const isSelfRevenue = /(?:매출|점유율|대손|수익률|달성)/.test(sentence);
      return {
        id,
        text: sentence,
        type: "metric",
        status: isSelfRevenue ? "evidence_required" : "self_claim",
        evidenceRequest: isSelfRevenue
          ? "매출·수치 산출 근거 자료(회계자료/공식 통계 요약)"
          : undefined,
        usableInArticle: "attributed_only",
      };
    }

    if (/(?:특허|인증|수상|선정|공모|대상)/.test(sentence)) {
      const needsPatentProof = /특허/.test(sentence);
      return {
        id,
        text: sentence,
        type: "certification",
        status: needsPatentProof ? "evidence_required" : "verified",
        evidenceRequest: needsPatentProof ? "특허증 또는 등록원부 사본 확인" : undefined,
        usableInArticle: needsPatentProof ? "attributed_only" : "yes",
      };
    }

    if (/(?:협약|MOU|제휴|투자|수주)/.test(sentence)) {
      return {
        id,
        text: sentence,
        type: "partnership",
        status: "evidence_required",
        evidenceRequest: "협약/제휴 사실 확인 및 상대 기관 노출 합의 여부 확인",
        usableInArticle: "attributed_only",
      };
    }

    return {
      id,
      text: sentence,
      type: "general",
      status: "verified",
      usableInArticle: "yes",
    };
  });

  return {
    normalizedText,
    companyName,
    representativeName,
    numbers: numberMatches,
    dates: dateMatches,
    locations: locationMatches,
    claims,
  };
}
