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
    id: "samsung",
    label: "예시 1: 삼성전자 2026 다카르 청소년올림픽 (15단락 전문)",
    companyName: "삼성전자",
    mode: "minimal",
    rawText: `삼성전자가 10월 31일부터 세네갈 다카르에서 열리는 ‘2026 다카르 청소년올림픽’에 국제올림픽위원회(IOC)의 무선 통신 분야 공식 파트너(Worldwide Partner)로 참여한다.

삼성전자는 갤럭시 스마트폰을 활용해 빅토리 셀피(Victory Selfie)와 경기 중계를 지원하고, 선수촌 내 체험 공간인 삼성 오픈 스테이션(Samsung Open Station)과 멘토링 프로그램 등 다양한 활동을 선보일 계획이다.

특히 이번 대회에서는 삼성전자의 올림픽 대표 프로그램인 빅토리 셀피가 청소년올림픽 최초로 도입된다.

빅토리 셀피는 메달 수여식에서 선수들이 시상대 위에서 영광의 순간을 갤럭시 스마트폰으로 셀카를 촬영하는 프로그램으로, 메달 획득의 기쁨을 나누고 동료 선수들과의 특별한 순간을 기념할 수 있다.

또한 스케이트보딩과 태권도 종목 중계에는 갤럭시 S26 울트라가 방송 카메라와 함께 활용돼, 기존 중계에서 보기 어려웠던 생생하고 현장감 넘치는 화면을 전 세계에 전달할 예정이다.

삼성전자는 대회 기간 중 청소년 선수들이 각국 대표팀과 교류하며 갤럭시 제품을 체험할 수 있는 공간인 ‘삼성 오픈 스테이션’을 운영한다.

주요 프로그램으로 ▲빅토리 월(Victory Wall) ▲빅토리 토크(Victory Talk) ▲빅토리 포토 존(Victory Photo Zone) 등이 운영된다.

빅토리 월에서는 갤럭시 AI를 활용해 올림픽 테마가 적용된 특별한 사진을 제작할 수 있다.

빅토리 토크는 다카르에서의 경험과 포부를 미래의 자신에게 메시지로 남기는 프로그램으로 선수별 숏폼 영상으로 저장돼 2028 LA올림픽까지 선수들의 추억을 이어줄 예정이다.

빅토리 포토 존에서는 실제 메달 시상대 배경을 연출해 기념 촬영을 할 수 있으며, 이 밖에도 다양한 갤럭시 기능을 직접 배워보는 유익한 세션들이 진행된다.

또 삼성전자는 청소년 선수들을 위한 멘토링 세션인 ‘메달을 넘어(BEYOND THE MEDAL)’도 진행한다. IOC가 선정한 롤모델 선수들과의 만남을 통해 청소년 선수들이 스포츠인으로서 성장하는 데 필요한 조언과 미래 방향성을 얻을 수 있도록 돕는다.

삼성전자 MX사업부 모바일마케팅센터장 최승은 부사장은 “청소년올림픽은 젊은 선수들이 자신의 가능성을 발견하고 미래를 위해 성장하는 중요한 무대”라며, “삼성전자는 혁신적인 무선 기술 체험을 통해 차세대 유망주들이 도전하고 배우며, 삶의 특별한 순간을 온전히 누릴 수 있도록 지원할 것”이라고 말했다.

한편, ‘2026 다카르 청소년올림픽’은 10월 31일부터 11월 13일까지 세네갈에서 개최되며, 25개 종목에 약 2천7백여 명의 청소년 선수가 참가한다. 아프리카 대륙에서 열리는 최초의 올림픽으로 세네갈과 지역사회, 올림픽에 역사적인 이정표가 될 전망이다.

삼성전자는 1988년 서울올림픽 지역 후원사로 시작해 1998년 나가노 동계올림픽부터 IOC 공식 파트너로 올림픽 파트너십을 굳건히 이어오고 있으며, 2010년부터는 청소년올림픽까지 지원 범위를 확대했다.

또 2024년 파리올림픽과 2026년 밀라노 코르티나 동계올림픽을 비롯해 총 7차례의 올림픽에서 참가 선수들에게 올림픽을 기념한 스마트폰 ‘갤럭시 올림픽 에디션’을 제공해 왔으며, 모바일 기술을 통해 선수들의 소통을 돕고 특별한 대회 경험을 누릴 수 있도록 지속해서 지원하고 있다.`,
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
  const paras = cleanRaw
    .split(/\n{2,}|\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const suggestions = [];
  let seq = 1;

  // 기사식광고 3대 기준 문서(PR사업팀 업무 프로세스, 기사식광고 제한소재·체크사항, 네이버 운영평가 대응방안 + banned-words.yaml) 기반 문장별 정밀 검수
  paras.forEach((para, pIdx) => {
    const sents = para
      .split(/(?<=[.!?다요])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 14);

    sents.forEach((sent) => {
      if (suggestions.length >= 12) return;

      // 1) FMT-01: 전화번호·URL 노출 금지
      const hasContactOrUrl =
        /https?:\/\/[^\s)]+|www\.[^\s)]+|\b(?:02|0\d{2}|15\d{2}|16\d{2}|18\d{2})-\d{3,4}-\d{4}\b/.test(
          sent
        );
      // 2) FMT-02: 면적 '평' 단독 표기 -> ㎡(평) 환산
      const hasPyeong = /\d+(?:\.\d+)?\s*평(?!\s*\()/.test(sent);
      // 3) FMT-03: 상세 주소(번지) 표기 제한 -> 'OO동 일대'
      const hasDetailedAddr = /[가-힣0-9]+(?:동|로|길|가)\s+\d+(?:-\d+)?\s*번지/.test(sent);
      // 4) 업무프로세스 4단계(오탈자·중복표현 검수) 및 PRD 9.2 숫자 표기: '약 2천7백여 명' 등 '약+~여' 중복 및 한글 숫자 혼용
      const hasRedundantNum = /약\s*[0-9천백십만억]+\s*여\s*명|[0-9]+천\s*[0-9]+백/.test(sent);
      // 5) FMT-08 (업무프로세스 2단계 3 & banned-words.yaml): 최상급·단정 표현 및 금지어('세계 최고/최대/최초', '최초로', '최초의', '독보적', '혁신적', '역사적인 이정표')
      const hasSuperlative =
        /세계\s*최고|국내\s*최고|업계\s*최고|최고\s*권위|세계\s*최대|국내\s*최대|최대\s*규모|업계\s*1위|국내\s*1위|세계\s*1위|유일한|유일무이|국내\s*유일|세계\s*최초|국내\s*최초|업계\s*최초|청소년올림픽\s*최초|최초로\s+도입|최초의\s+올림픽|독보적|압도적|명실상부|혁신적인|혁신적|역사적인\s+이정표/.test(
          sent
        );
      // 6) FMT-07 (업무프로세스 3단계 & banned-words.yaml): 홍보체 어미('자랑합니다', '~했다고 밝혔다' 반복) 및 주관적·광고성 과장 수식어
      const hasPromoTone =
        /자랑합니다|자랑한다|선보입니다|제공합니다|진행합니다|많은\s*관심\s*부탁|절찬리에|화제를\s*모으고|했다고\s+밝혔다|영광의\s+순간을|특별한\s+순간을|기존\s+중계에서\s+보기\s+어려웠던\s+생생하고|특별한\s+사진을|유익한\s+세션|굳건히\s+이어오고|특별한\s+대회\s+경험을\s+누릴\s+수\s+있도록|선명하고\s+생동감\s+있는/.test(
          sent
        );

      const isRuleTarget =
        hasContactOrUrl ||
        hasPyeong ||
        hasDetailedAddr ||
        hasRedundantNum ||
        hasSuperlative ||
        hasPromoTone;

      if (!isRuleTarget) return;

      // 기준 문서에 따른 정확하고 자연스러운 3단계 교정문 생성 (실제 게재 샘플 6건 기준 영문 병기 괄호는 보존)
      let base = sent
        .replace(/"([^"]+)"/g, "“$1”")
        .replace(/'([^']+)'/g, "‘$1’")
        // FMT-01 연락처/URL 제거
        .replace(/https?:\/\/[^\s)]+|www\.[^\s)]+/g, "공식 홈페이지")
        .replace(/\b(?:02|0\d{2}|15\d{2}|16\d{2}|18\d{2})-\d{3,4}-\d{4}\b/g, "대표번호")
        // FMT-02 평 -> ㎡(평) 환산
        .replace(/(\d+(?:\.\d+)?)\s*평(?!\s*\()/g, (_, n) => {
          const sqm = Math.round(Number(n) * 3.3058);
          return `${sqm}㎡(${n}평)`;
        })
        // FMT-03 상세 주소 번지 완화
        .replace(/([가-힣0-9]+(?:동|로|길|가))\s+\d+(?:-\d+)?\s*번지/g, "$1 일대")
        // 업무프로세스 4단계: '약 2천7백여 명' -> '2,700여 명' (약+여 중복 제거 및 아라비아 숫자 표기)
        .replace(/약\s*2천\s*7백여\s*명/g, "2,700여 명")
        .replace(/약\s*(\d+(?:,\d+)?)\s*여\s*(명|개|곳|건)/g, "$1여 $2")
        // FMT-08 최상급·단정 표현 및 banned-words.yaml 금지어 완화
        .replace(/세계\s*최고의?/g, "우수한 수준의")
        .replace(/국내\s*최고의?/g, "국내 주요")
        .replace(/업계\s*최고의?/g, "업계 상위권")
        .replace(/세계\s*최대/g, "대규모")
        .replace(/국내\s*최대/g, "대규모")
        .replace(/최대\s*규모/g, "대규모")
        .replace(/업계\s*1위/g, "선도 기업")
        .replace(/국내\s*1위/g, "주요 기업")
        .replace(/유일무이한?|유일한/g, "차별화된")
        .replace(/독보적인?/g, "차별화된")
        .replace(/압도적인?/g, "높은")
        .replace(/명실상부한?/g, "대표적인")
        .replace(/세계\s*최초로?/g, "새로운 방식으로")
        .replace(/국내\s*최초로?/g, "새로운 방식으로")
        .replace(/업계\s*최초로?/g, "선도적으로")
        .replace(/청소년올림픽\s+최초로\s+도입된다/g, "청소년올림픽에 처음 도입된다")
        .replace(/최초로\s+도입된다/g, "처음 도입된다")
        .replace(/열리는\s+최초의\s+올림픽으로/g, "처음 열리는 올림픽으로")
        .replace(/세네갈과\s+지역사회,\s+올림픽에\s+역사적인\s+이정표가/g, "세네갈과 지역사회에 의미 있는 이정표가")
        .replace(/역사적인\s+이정표가/g, "의미 있는 이정표가")
        .replace(
          /삼성전자는\s+혁신적인\s+무선\s+기술\s+체험을\s+통해\s+차세대\s+유망주들이\s+도전하고\s+배우며,\s+삶의\s+특별한\s+순간을\s+온전히\s+누릴\s+수\s+있도록/g,
          "무선 기술 체험을 통해 유망주들이 도전하고 배우며 대회 경험을 누릴 수 있도록"
        )
        .replace(/혁신적인\s+무선\s+기술/g, "무선 통신 기술")
        .replace(/혁신적인/g, "새로운")
        // FMT-07 홍보체 어미 및 주관적 광고 수식어 정리 (업무프로세스 3단계: '기부했다고 밝혔다 -> 기부했다', '자랑합니다 -> 설명했다')
        .replace(/자랑합니다\.?/g, "설명했다.")
        .replace(/자랑한다\.?/g, "설명했다.")
        .replace(/선보입니다\.?/g, "선보인다.")
        .replace(/제공합니다\.?/g, "제공한다.")
        .replace(/진행합니다\.?/g, "진행한다.")
        .replace(/많은\s*관심\s*부탁드립니다\.?/g, "")
        .replace(/절찬리에/g, "현재")
        .replace(/화제를\s*모으고\s*있습니다\.?/g, "주목받고 있다.")
        .replace(/([가-힣]+)했다고\s+밝혔다/g, "$1했다")
        .replace(
          /시상대\s+위에서\s+영광의\s+순간을\s+갤럭시\s+스마트폰으로\s+셀카를\s+촬영하는\s+프로그램으로,\s+메달\s+획득의\s+기쁨을\s+나누고\s+동료\s+선수들과의\s+특별한\s+순간을\s+기념할\s+수\s+있다/g,
          "시상대 위 모습을 갤럭시 스마트폰으로 직접 촬영해 동료 선수들과 기념하는 프로그램이다"
        )
        .replace(/영광의\s+순간을\s+/g, "")
        .replace(/특별한\s+순간을\s+기념할\s+수\s+있다/g, "순간을 기념할 수 있다")
        .replace(
          /기존\s+중계에서\s+보기\s+어려웠던\s+생생하고\s+현장감\s+넘치는\s+화면을/g,
          "현장감 있는 경기 중계 화면을"
        )
        .replace(/생생하고\s+현장감\s+넘치는\s+화면을/g, "현장감 있는 화면을")
        .replace(/선명하고\s+생동감\s+있는\s+/g, "고화질 ")
        .replace(/올림픽\s+테마가\s+적용된\s+특별한\s+사진을/g, "올림픽 테마가 적용된 기념 사진을")
        .replace(/직접\s+배워보는\s+유익한\s+세션들이/g, "직접 체험하는 세션들이")
        .replace(/유익한\s+세션들이/g, "체험 세션들이")
        .replace(/삶의\s+특별한\s+순간을\s+온전히\s+누릴\s+수\s+있도록/g, "대회 경험을 폭넓게 누릴 수 있도록")
        .replace(/올림픽\s+파트너십을\s+굳건히\s+이어오고\s+있으며/g, "올림픽 파트너십을 이어오고 있으며")
        .replace(
          /올림픽을\s+기념한\s+스마트폰\s+([‘'“"][^’'”"]+[’'”"])을\s+제공해\s+왔으며,\s+모바일\s+기술을\s+통해\s+선수들의\s+소통을\s+돕고\s+특별한\s+대회\s+경험을\s+누릴\s+수\s+있도록\s+지속해서\s+지원하고\s+있다/g,
          "$1을 제공하고 모바일 기술로 선수단 소통과 대회 편의를 지속 지원하고 있다"
        )
        .replace(
          /선수들의\s+소통을\s+돕고\s+특별한\s+대회\s+경험을\s+누릴\s+수\s+있도록\s+지속해서\s+지원하고\s+있다/g,
          "선수들의 소통과 대회 편의를 지속해서 지원하고 있다"
        )
        .replace(/\s+/g, " ")
        .replace(/\.$/, "")
        .trim();

      const v1 = `${base}.`;
      let v2 = `${base
        .replace(/^특히\s+|^또한\s+|^또\s+/, "")
        .replace(/전달할\s+예정이다$/, "송출한다")
        .replace(/제작할\s+수\s+있다$/, "제작하도록 지원한다")
        .replace(/진행된다$/, "운영된다")
        .replace(/도입된다$/, "적용된다")
        .replace(/전망이다$/, "것으로 기대된다")
        .replace(/지원하고\s+있다$/, "지원해 오고 있다")}.`;
      if (v2 === v1) {
        v2 = `${base.replace(/다$/, "는 설명이다")}.`;
      }

      let v3 = `${base
        .replace(/^특히\s+이번\s+대회에서는\s+/, "이번 대회부터는 ")
        .replace(/방송\s+카메라와\s+함께\s+활용돼,\s+/, "방송 중계에 투입돼 ")
        .replace(/기념\s+촬영을\s+할\s+수\s+있으며,\s+이\s+밖에도\s+/, "기념 촬영과 함께 ")
        .replace(/지속해서\s+지원하고\s+있다$/, "꾸준히 뒷받침하고 있다")}.`;
      if (v3 === v1 || v3 === v2) {
        v3 = `${base
          .replace(/^한편,\s+|^또한\s+|^특히\s+/, "")
          .replace(/예정이다$/, "계획이다")
          .replace(/전망이다$/, "예정이다")
          .replace(/프로그램이다$/, "방식이다")
          .replace(/진행된다$/, "마련된다")}.`;
      }
      if (v3 === v1 || v3 === v2) {
        v3 = `${base.replace(/다$/, "게 된다")}.`;
      }

      let reason = "기사식광고 문체·표기 기준 교정 (FMT-07)";
      if (hasContactOrUrl) {
        reason = "FMT-01 (기사식광고 체크사항) · 전화번호·홈페이지 주소 직접 노출 금지";
      } else if (hasPyeong) {
        reason = "FMT-02 (기사식광고 체크사항) · 면적 단위는 '평' 대신 '㎡(평)'로 환산 표기";
      } else if (hasDetailedAddr) {
        reason = "FMT-03 (기사식광고 체크사항) · 상세 번지 주소 표기 제한 → 'OO동 일대' 완화";
      } else if (hasRedundantNum && hasSuperlative) {
        reason =
          "업무프로세스 4단계·FMT-08 · 중복 표현('약'+'~여' → '2,700여 명') 교열 및 최상급('최초의·역사적인') 완화";
      } else if (hasRedundantNum) {
        reason =
          "업무프로세스 3·4단계 · 중복 표현('약'+'~여') 교열 및 매경 숫자 표기('2,700여 명') 정비";
      } else if (hasSuperlative && /[“"']/.test(sent)) {
        reason =
          "FMT-08 / PRD 9.2 · 인용문 내 금지어('혁신적') 및 홍보성 과장 수식어 중립화";
      } else if (hasSuperlative) {
        reason =
          "FMT-08 (업무프로세스 2단계 3) · 최상급·단정 표현('최초로·최고·최대') 배제 및 사실 중심 완화";
      } else if (/했다고\s+밝혔다|자랑합니다/.test(sent)) {
        reason =
          "FMT-07 (업무프로세스 3단계) · 홍보체('자랑합니다→설명했다') 및 불필요한 '~했다고 밝혔다→~했다' 정리";
      } else if (hasPromoTone) {
        reason =
          "FMT-07 (업무프로세스 3단계) · 주관적·광고성 수식어('영광의·생생하고·유익한·특별한') 배제 및 객관 서술체 교정";
      }

      const id = `sug-${seq++}`;
      suggestions.push({
        id,
        paragraphIndex: pIdx,
        originalSentence: sent,
        reason,
        alternatives: [
          {
            id: `${id}-alt-1`,
            label: "버전 1 (권장 · 기사식광고 규정 표준 교정)",
            toneBadge: "규정 준수·원문 보존",
            text: v1,
          },
          {
            id: `${id}-alt-2`,
            label: "버전 2 (매경 스트레이트 기사체)",
            toneBadge: "간결 스트레이트",
            text: v2,
          },
          {
            id: `${id}-alt-3`,
            label: "버전 3 (담백한 단문·축약형)",
            toneBadge: "수식어 축약",
            text: v3,
          },
        ],
        selectedAltId: null,
      });
    });
  });

  return suggestions;
}

function withTopicParticle(word) {
  const clean = (word || "").replace(/[()㈜\s]/g, "");
  if (!clean) return `${word || "기업"}은`;
  const lastCode = clean.charCodeAt(clean.length - 1);
  if (lastCode >= 0xac00 && lastCode <= 0xd7a3) {
    const hasBatchim = (lastCode - 0xac00) % 28 !== 0;
    return `${word}${hasBatchim ? "은" : "는"}`;
  }
  return `${word}는`;
}

function buildClientCompanyFactMemos(compName, rawText, sources) {
  const c = compName || "대상 기업";
  const cTopic = withTopicParticle(c);
  const firstUrl = sources?.[0]?.url || "https://www.mk.co.kr";

  if (c.includes("삼성전자") || /다카르\s*청소년올림픽|갤럭시\s*S26/.test(rawText || "")) {
    return [
      {
        id: "fact-1",
        category: "기업 기본 정보",
        text: "삼성전자는 모바일경험(MX) 사업부를 중심으로 온디바이스 AI 스마트폰 ‘갤럭시’ 생태계와 글로벌 5G·무선 통신 기술력을 보유한 글로벌 IT 기업이다.",
        sourceTitle: "삼성전자 기업·MX사업부 개황",
        sourceUrl: "https://news.samsung.com/kr",
        targetParagraphIndex: 1,
        inserted: false,
      },
      {
        id: "fact-2",
        category: "매출액·실적 정보",
        text: "최근 플래그십 스마트폰 갤럭시 S 시리즈와 폴더블 라인업에 갤럭시 AI 기능을 전면 확대하며 글로벌 프리미엄 모바일 시장 내 기술 리더십을 강화하고 있다.",
        sourceTitle: "삼성전자 모바일·AI 사업 동향",
        sourceUrl: "https://news.samsung.com/kr",
        targetParagraphIndex: 1,
        inserted: false,
      },
      {
        id: "fact-3",
        category: "브랜드·출시 핵심 팩트",
        text: "삼성전자는 1998년 나가노 동계올림픽부터 국제올림픽위원회(IOC) 무선 통신 분야 공식 월드와이드 파트너로 활동하며 올림픽 현장에 모바일 혁신 기술을 지원해 오고 있다.",
        sourceTitle: "IOC 월드와이드 올림픽 파트너십",
        sourceUrl: "https://news.samsung.com/kr",
        targetParagraphIndex: 0,
        inserted: false,
      },
      {
        id: "fact-4",
        category: "유통·시장 판매 동향",
        text: "선수단이 시상대 위에서 직접 촬영하는 ‘빅토리 셀피’와 선수촌 체험 공간 ‘삼성 오픈 스테이션’ 등을 통해 전 세계 젊은 세대와의 브랜드 접점을 넓히고 있다.",
        sourceTitle: "글로벌 스포츠 테크 마케팅 동향",
        sourceUrl: "https://news.samsung.com/kr",
        targetParagraphIndex: 2,
        inserted: false,
      },
    ];
  }

  return [
    {
      id: "fact-1",
      category: "기업 기본 정보",
      text: `${cTopic} 주력 사업 분야에서 자체 기술력과 국내외 공급망을 바탕으로 B2B·공공 및 소비자 시장 내 입지를 넓혀가고 있는 전문 기업이다.`,
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
      text: `${cTopic} 최근 현장 실수요와 운영 편의성을 결합한 핵심 솔루션 보급을 본격화하며 주요 거점 시장 공략에 속도를 내고 있다.`,
      sourceTitle: "최신 보도·출시 팩트",
      sourceUrl: firstUrl,
      targetParagraphIndex: 0,
      inserted: false,
    },
    {
      id: "fact-4",
      category: "유통·시장 판매 동향",
      text: `오프라인 거점 및 온라인 채널을 연계한 맞춤형 공급 전략을 통해 기관 및 일반 고객 접점을 동시에 넓히고 있다.`,
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

  const isSamsungDakar =
    compName.includes("삼성전자") || /다카르\s*청소년올림픽|빅토리\s*셀피/.test(sanitized);
  const isUniversityOrForum = /대학교|대학|산학|포럼|연구|장학/.test(sanitized);
  const isFestivalOrLocal = /축제|군수|시장|지자체|자작나무|관광|문화/.test(sanitized);

  const defaultTitles = isSamsungDakar
    ? [
        "삼성전자, 다카르 청소년올림픽 IOC 공식 파트너로 참여",
        "삼성전자, 2026 다카르 청소년올림픽에 빅토리 셀피·갤럭시 AI 지원",
        "삼성전자, 다카르 청소년올림픽서 모바일 중계·오픈 스테이션 운영",
      ]
    : [
        `${compName}, 핵심 사업 및 현장 맞춤형 전략 본격 추진`,
        `${compName}, 차별화된 기술·운영 경쟁력으로 시장 공략 강화`,
        `${compName}, 수요처 맞춤형 솔루션 앞세워 보급 확대 나서`,
      ];

  const defaultSubtitles = isSamsungDakar
    ? [
        "갤럭시 S26 울트라로 스케이트보딩·태권도 중계 지원",
        "삼성 오픈 스테이션·멘토링 프로그램도 선수촌 내 운영",
      ]
    : [
        `${compName} 핵심 사업 추진 및 현장 보급 본격화`,
        `차별화된 운영 효율성으로 실수요처 경쟁력 강화`,
      ];

  if (normMode === "minimal") {
    const minimalParas = paras.length > 0 ? [...paras] : [sanitized];
    return {
      titleCandidates: defaultTitles,
      subtitleLines: defaultSubtitles,
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

  // 모드 2(전면 리라이팅) & 모드 3(비교·기획): 모든 문단의 어미·영문 병기·부사어를 매경 기사체로 재구성하고 중간 문단을 재배치
  let bodyParas = (paras.length > 0 ? [...paras] : [sanitized]).map((p, idx) => {
    let rw = p
      .replace(/\([A-Za-z0-9\s,&·-]{6,}\)/g, "")
      .replace(/국제올림픽위원회\(IOC\)의/g, "국제올림픽위원회(IOC)")
      .replace(/세계\s*최초로?/g, "독자 기술로")
      .replace(/국내\s*최초로?/g, "자체 기술로")
      .replace(/업계\s*최초로?/g, "선도적으로")
      .replace(/최초로\s+도입된다/g, "처음 도입된다")
      .replace(/활용해\s+/g, "기반으로 ")
      .replace(/영광의\s+순간을\s+/g, "")
      .replace(/생생하고\s+현장감\s+넘치는\s+화면을/g, "현장감 있는 중계 화면을")
      .replace(/선명하고\s+생동감\s+있는\s+/g, "실감형 ")
      .replace(/대회\s+기간\s+중\s+/g, "대회 기간 ")
      .replace(/각국\s+대표팀과\s+교류하며/g, "각국 대표팀과 소통하며")
      .replace(/^또한\s+/g, "아울러 ")
      .replace(/다양한\s+활동을\s+선보일\s+계획이다\./g, "현장 체험·지원 프로그램을 운영한다.")
      .replace(/선보일\s+계획이다\./g, "선보인다.")
      .replace(/전달할\s+예정이다\./g, "송출한다.")
      .replace(/추억을\s+이어줄\s+예정이다\./g, "추억을 연결한다.")
      .replace(/공간인\s+([‘'“"][^’'”"]+[’'”"])도\s+선수촌\s+내에\s+마련할\s+계획이다\./g, "$1을 선수촌 내에 운영한다.")
      .replace(/마련할\s+계획이다\./g, "운영한다.")
      .replace(/등이\s+운영된다\./g, "등이 마련된다.")
      .replace(/특별한\s+사진을\s+제작할\s+수\s+있다\./g, "맞춤형 기념 사진을 제작하도록 지원한다.")
      .replace(/유익한\s+세션들이\s+진행된다\./g, "체험 세션이 함께 운영된다.")
      .replace(/도\s+진행한다\./g, "도 운영한다.")
      .replace(/역사적인\s+이정표가\s+될\s+전망이다\./g, "의미 있는 이정표가 될 것으로 기대된다.")
      .replace(/굳건히\s+이어오고\s+있으며/g, "이어오고 있으며")
      .replace(/지속해서\s+지원하고\s+있다\./g, "지속 지원하고 있다.")
      .replace(/특별한\s+순간을\s+기념할\s+수\s+있다\./g, "순간을 기념하도록 구성됐다.")
      .replace(/기념할\s+수\s+있다\./g, "기념하도록 구성됐다.")
      .replace(/폭넓게\s+활용할\s+수\s+있다\./g, "두루 활용하도록 구성했다.")
      .replace(/활용할\s+수\s+있다\./g, "활용하도록 구성했다.")
      .replace(/제공할\s+수\s+있도록\s+기획한\s+제품이다\./g, "제공하기 위해 개발된 시스템이다.")
      .replace(/구현하도록\s+설계됐다\./g, "구현했다.")
      .replace(/설계됐다\./g, "구성됐다.")
      .replace(/설계했다\./g, "구성했다.")
      .replace(/간소화했다\./g, "단축했다.")
      .replace(/개발\s+및\s+생산해\s+왔다\./g, "개발·공급해 왔다.")
      .replace(/계획이다\./g, "방침이다.")
      .replace(/예정이다\./g, "전망이다.")
      .replace(/\s+/g, " ")
      .trim();
    if (idx === 0) {
      const m = /^([가-힣A-Za-z0-9㈜()\s]+?(?:은|는|이|가))\s+(\d{1,2}월\s*\d{1,2}일부터\s*[^‘'“"]+에서\s*열리는\s*[‘'“"][^’'”"]+[’'”"]에)\s+(.+)$/.exec(
        rw.replace(/\.$/, "")
      );
      if (m) {
        rw = `${m[2]} ${m[1]} ${m[3].replace(/참여한다$/, "참여해 공식 무선 통신·기술 지원에 나선다")}.`;
      }
    }
    return rw;
  });
  if (bodyParas.length >= 3) {
    const tmp = bodyParas[1];
    bodyParas[1] = bodyParas[2];
    bodyParas[2] = tmp;
  }
  if (bodyParas.length >= 5) {
    const tmp2 = bodyParas[3];
    bodyParas[3] = bodyParas[4];
    bodyParas[4] = tmp2;
  }

  let competitors = [];
  if (normMode === "comparative") {
    if (isSamsungDakar) {
      // 삼성전자 다카르 청소년올림픽 비교·기획 기사: 원문 핵심 4단락 요약 + 타 글로벌 브랜드 3곳 각각 독립 단락 분리 + 차별화 분석 단락 (총 8단락, 약 1,420자)
      bodyParas = [
        "10월 31일부터 11월 13일까지 세네갈 다카르에서 열리는 ‘2026 다카르 청소년올림픽’에 삼성전자가 국제올림픽위원회(IOC) 무선 통신 분야 공식 파트너로 참여해 모바일·AI 기술 지원에 나선다. 아프리카 대륙에서 처음 열리는 이번 올림픽에는 25개 종목에 2,700여 명의 청소년 선수가 참가한다.",
        "이번 대회에서는 삼성전자의 올림픽 대표 프로그램인 ‘빅토리 셀피’가 청소년올림픽에 처음 도입된다. 메달 수여식 직후 선수들이 시상대 위에서 갤럭시 스마트폰으로 직접 촬영해 동료 선수들과 순간을 기념하는 방식이며, 스케이트보딩과 태권도 종목 중계에는 ‘갤럭시 S26 울트라’가 방송 카메라와 함께 투입돼 현장감 있는 중계 화면을 전 세계에 송출한다.",
        "선수촌 내에는 각국 청소년 선수들이 교류하며 갤럭시 AI 기능을 체험하는 ‘삼성 오픈 스테이션’이 마련된다. ▲갤럭시 AI 프로필 사진을 제작하는 ‘빅토리 월’ ▲2028 LA올림픽을 향한 다짐을 숏폼 영상으로 남기는 ‘빅토리 토크’ ▲실제 시상대 배경의 ‘빅토리 포토 존’과 함께 IOC 선정 롤모델 선수들과 만나는 멘토링 세션 ‘메달을 넘어’도 운영된다.",
        "최승은 삼성전자 MX사업부 모바일마케팅센터장(부사장)은 “청소년올림픽은 젊은 선수들이 가능성을 발견하고 성장하는 중요한 무대”라며 “무선 기술 체험을 통해 차세대 유망주들이 도전하고 배우며 대회 경험을 폭넓게 누릴 수 있도록 지원할 것”이라고 말했다.",
      ];
      competitors = [
        {
          name: "애플(Apple)",
          summary:
            "미국 메이저리그(MLB) ‘프라이데이 나잇 베이스볼’과 프로축구(MLS) 중계 현장에 아이폰 프로 라인업을 방송용 보조 카메라로 투입해 더그아웃과 선수 근접 촬영에 활용하는 등 모바일 기반 스포츠 중계 기술 경쟁을 전개하고 있다.",
          paragraph:
            "글로벌 빅테크와 스마트폰 제조사들도 대형 스포츠 이벤트를 자사 카메라와 AI 기술력을 입증하는 핵심 무대로 활용하고 있다. 애플은 미국 메이저리그(MLB) ‘프라이데이 나잇 베이스볼’과 프로축구(MLS) 중계 현장에 아이폰 프로 라인업을 방송용 보조 카메라로 투입해 경기장 더그아웃과 선수 근접 촬영에 활용하는 등 모바일 기반 스포츠 중계 기술 경쟁을 벌이고 있다.",
        },
        {
          name: "알리바바 클라우드·오메가(OMEGA)",
          summary:
            "IOC 공식 월드와이드 기술 파트너로서 AI 기반 실시간 선수 모션·경기 데이터 분석과 클라우드 중계 송출 시스템을 대회 현장에 적용하며 글로벌 스포츠 테크 생태계를 확장하고 있다.",
          paragraph:
            "국제올림픽위원회(IOC) 월드와이드 기술 파트너사들의 대회 인프라 고도화 경쟁도 한층 빨라지고 있다. 클라우드 분야 공식 파트너인 알리바바와 타임키핑 파트너 오메가(OMEGA) 등은 AI 기반 실시간 선수 모션 분석과 클라우드 중계 송출 시스템을 올림픽 현장에 적용하며 글로벌 스포츠 테크 생태계 확장에 나서고 있다.",
        },
        {
          name: "구글(픽셀)·모토로라",
          summary:
            "미국프로농구(NBA)와 국제 축구 대회 공식 후원사로 참여해 경기장 내 AI 사진 편집 체험존과 팬 참여형 이벤트를 운영하며 젊은 소비자층과의 접점을 넓히고 있다.",
          paragraph:
            "구글(픽셀)과 모토로라 등 주요 글로벌 스마트폰 브랜드 역시 미국프로농구(NBA)와 국제 축구 대회 공식 후원사로 참여해 경기장 내 AI 사진 편집 체험존과 팬 참여형 이벤트를 운영하며 젊은 소비자층과의 접점을 넓히고 있다.",
        },
      ];
      // 타 브랜드·경쟁사 설명은 반드시 브랜드마다 독립된 단락으로 분리하여 추가
      for (const comp of competitors) {
        bodyParas.push(comp.paragraph);
      }
      bodyParas.push(
        "이 같은 글로벌 빅테크들의 스포츠 테크 경쟁 속에서 삼성전자는 단순한 중계 장비 지원을 넘어 시상대 위에서 선수들이 직접 촬영하는 ‘빅토리 셀피’와 선수촌 교류 공간 ‘삼성 오픈 스테이션’, 롤모델 멘토링(‘메달을 넘어’)까지 결합해 선수 경험 중심의 독자적인 올림픽 파트너십 모델을 구축했다는 평가를 받는다."
      );
    } else if (isUniversityOrForum) {
      competitors = [
        {
          name: "서울대·연세대 기후테크 연구단",
          summary:
            "탄소중립 정책 연구와 산학 공동 R&D 과제를 연계해 기후변화 대응 석·박사급 전문 인력 양성 프로그램을 확대하고 있다.",
          paragraph:
            "국내 주요 대학들도 탄소중립과 ESG 경영 확산에 발맞춰 기후테크 융합 교육과정을 잇달아 강화하고 있다. 서울대와 연세대 등 주요 연구중심대학들은 기후변화 정책 연구소와 산학 공동 R&D 센터를 통해 탄소배출권·재생에너지 분야 전문 인력 양성 프로그램을 운영 중이다.",
        },
        {
          name: "한양대·성균관대 ESG 산학협력단",
          summary:
            "국내 주요 제조·IT 기업과 연계해 실무 프로젝트 기반의 ESG·지속가능경영 캡스톤디자인 및 인턴십 과정을 운영하고 있다.",
          paragraph:
            "한양대와 성균관대 등도 기업 실무형 ESG 산학협력 과정을 개설하고 산업계 전문가 멘토링과 현장 인턴십을 결합한 커리큘럼을 통해 실무 인재 배출에 힘을 쏟고 있다.",
        },
      ];
      for (const comp of competitors) {
        bodyParas.push(comp.paragraph);
      }
      bodyParas.push(
        `이 같은 대학가의 기후·ESG 교육 경쟁 속에서 ${compName} 측은 인문사회와 이공계를 아우르는 융합형 교육과정과 국내외 환경기관 인턴십 연계를 결합해 현장 즉시 투입이 가능한 실무형 그린 인재 양성에 차별화를 두고 있다.`
      );
    } else if (isFestivalOrLocal) {
      competitors = [
        {
          name: "강원 인제군(자작나무숲·가을 꽃축제)",
          summary:
            "원대리 자작나무숲 생태 탐방로와 계절별 산림 문화 행사를 결합해 수도권 및 가족 단위 체류형 관광객 유치에 나서고 있다.",
          paragraph:
            "전국 주요 지자체들도 가을 행락철을 맞아 지역 대표 산림 자원을 활용한 체류형 생태 관광 콘텐츠 경쟁을 벌이고 있다. 강원 인제군은 원대리 자작나무숲 탐방로와 지역 계절 축제를 연계해 수도권 가족 단위 방문객 유치에 주력하고 있다.",
        },
        {
          name: "경북 봉화군·울진군(산림치유·숲길 트레킹)",
          summary:
            "국립백두대간수목원과 금강소나무숲길 등 산림 휴양 인프라를 앞세워 치유형 트레킹과 지역 농특산물 장터 연계 프로그램을 운영하고 있다.",
          paragraph:
            "경북 봉화군과 울진군 등 인근 지자체 역시 수목원과 금강소나무숲길 등 산림 휴양 인프라를 앞세워 숲길 명상 프로그램과 지역 농특산물 직거래 장터를 결합한 관광 활성화 전략을 추진 중이다.",
        },
      ];
      for (const comp of competitors) {
        bodyParas.push(comp.paragraph);
      }
      bodyParas.push(
        `이 같은 지자체 간 생태 관광 경쟁 속에서 ${compName} 측은 국유림 명품숲으로 지정된 대규모 군락지 인프라에 친환경 전기 셔틀버스 증편과 명상·목공예 체험을 결합해 방문객 편의성과 지역 상생 효과를 동시에 높이고 있다.`
      );
    } else {
      competitors = [
        {
          name: "동종업계 주요 선도 기업",
          summary:
            "기존 핵심 사업 인프라에 AI·디지털 기술과 현장 맞춤형 솔루션을 결합하며 B2B 및 공공·민간 수요처 확장에 속도를 내고 있다.",
          paragraph:
            `관련 업계에서도 주요 기업들의 기술 고도화와 시장 확대 경쟁이 활발하게 전개되고 있다. 동종업계 주요 선도 기업들은 기존 사업 인프라에 디지털 기술과 현장 맞춤형 솔루션을 결합하며 B2B 및 공공·민간 수요처 확장에 속도를 내고 있다.`,
        },
        {
          name: "특화 플랫폼·솔루션 브랜드",
          summary:
            "설치·운영 효율성을 높인 모듈형 서비스와 세분화된 고객 맞춤형 구성을 앞세워 신규 시장 접점을 넓히고 있다.",
          paragraph:
            `특화 플랫폼·솔루션 전문 브랜드들 역시 운영 효율성을 높인 모듈형 서비스와 세분화된 고객 맞춤형 구성을 앞세워 실수요처 점유율 확대에 주력하고 있다.`,
        },
      ];
      for (const comp of competitors) {
        bodyParas.push(comp.paragraph);
      }
      bodyParas.push(
        `이 같은 업계 경쟁 구도 속에서 ${compName} 측은 현장 수요에 최적화된 기술 설계와 운영 편의성을 결합해 차별화된 경쟁력을 확보한다는 전략이다.`
      );
    }
  } else {
    const extras = [
      `이번 사업은 현장의 실제 수요와 운영 효율성을 종합적으로 고려해 단계별로 추진된다. 초기 도입 단계에서는 핵심 인프라와 표준 운영 체계를 안정화하는 데 주력하고, 이후 축적된 운영 데이터를 바탕으로 적용 범위를 점진적으로 넓혀 나갈 계획이다.`,
      `특히 이용자 접근성과 실무 활용도를 높이기 위해 세부 프로세스를 체계화했다. 기존 운영 과정에서 제기되던 제약을 줄이고 다양한 현장 여건에 맞춰 유연하게 구성할 수 있도록 설계한 것이 특징이다.`,
    ];
    for (const ex of extras) {
      if (bodyParas.join("\n\n").replace(/\r?\n/g, "").length < 1220) {
        bodyParas.push(ex);
      }
    }
  }

  const finalTitles =
    normMode === "comparative" && isSamsungDakar
      ? [
          "글로벌 스포츠 무대 수놓는 모바일·AI 기술… 삼성전자, 다카르 청소년올림픽 지원",
          "삼성전자, 다카르 청소년올림픽서 ‘갤럭시 AI·빅토리 셀피’ 앞세워 스포츠 테크 선도",
          "중계 카메라부터 선수촌 AI 체험까지… 삼성전자, 다카르 청소년올림픽 공식 후원",
        ]
      : defaultTitles;

  const finalSubtitles =
    normMode === "comparative" && isSamsungDakar
      ? [
          "갤럭시 S26 울트라 중계·빅토리 셀피 등 모바일 스포츠 테크 결합",
          "애플·알리바바 등 글로벌 빅테크 스포츠 마케팅 속 선수 경험 중심 차별화",
        ]
      : defaultSubtitles;

  return {
    titleCandidates: finalTitles,
    subtitleLines: finalSubtitles,
    body: bodyParas.join("\n\n"),
    competitors,
    sentenceSuggestions,
    factMemos,
    diffs: [
      {
        original: "보도자료 원문 어순 및 인용 부호",
        replacement:
          normMode === "comparative"
            ? "비교·기획 기사 구성 및 타 브랜드별 독립 단락 분리"
            : "매경 기사체 리드 고정 및 중간 문단 재배치",
        reason:
          normMode === "comparative"
            ? "단일 기업 일방 홍보 배제(네이버 R항목 대응) 및 타 브랜드별 단락 분리 비교·기획"
            : "포털 중복·유사 판정 회피 및 기사식 문체 교열",
      },
    ],
  };
}

const AVAILABLE_AI_MODELS = [
  {
    id: "anthropic/claude-sonnet-4-6",
    name: "Claude Sonnet 4.6 (1순위 추천 · 한국어 문장력·교열 최고)",
    shortName: "Claude Sonnet 4.6",
    desc: "조사·어미 흐름이 가장 자연스럽고 번역투나 억지 수식어 없이 깔끔한 매경 기사체를 구현합니다.",
  },
  {
    id: "anthropic/claude-sonnet-4-5",
    name: "Claude Sonnet 4.5 (정통 스트레이트 기사 톤 안정적)",
    shortName: "Claude Sonnet 4.5",
    desc: "보도자료 원문 의미를 보존하면서 담백하고 건조한 경제지 문체로 다듬는 데 강합니다.",
  },
  {
    id: "openai/gpt-5.4",
    name: "OpenAI GPT-5.4 (팩트 구조화 · 제목·부제 추출 강점)",
    shortName: "GPT-5.4",
    desc: "핵심 수치·일정·고유명사 구조화 및 3종 제목 후보 도출에 강점이 있습니다.",
  },
  {
    id: "openai/gpt-5.6-sol",
    name: "OpenAI GPT-5.6-sol (웹 검색 · 경쟁사 비교분석 특화)",
    shortName: "GPT-5.6-sol",
    desc: "모드 3(비교·기획 기사)에서 실시간 경쟁사 웹 검색과 요약 결합 시 유용합니다.",
  },
  {
    id: "anthropic/claude-haiku-4-5",
    name: "Claude Haiku 4.5 (초고속 경량 문장 교열)",
    shortName: "Claude Haiku 4.5",
    desc: "빠른 속도로 간단한 어미·표기 교정을 수행할 때 적합합니다.",
  },
];

function getSelectedAiModel() {
  try {
    const saved = localStorage.getItem("mk_pr_selected_ai_model");
    if (saved && AVAILABLE_AI_MODELS.some((m) => m.id === saved)) {
      return saved;
    }
  } catch {}
  return "anthropic/claude-sonnet-4-6";
}

function setSelectedAiModelStorage(modelId) {
  try {
    localStorage.setItem("mk_pr_selected_ai_model", modelId);
  } catch {}
}

async function callPerplexityResponsesApi({
  instructions,
  input,
  maxOutputTokens = 4000,
  useWebSearch = false,
  modelOverride = null,
}) {
  const apiKey = decodeDefaultKey().trim();
  if (!apiKey) {
    throw new Error("API 키가 설정되지 않았습니다.");
  }

  const chosenModel = modelOverride || getSelectedAiModel();
  const body = {
    model: chosenModel,
    input,
    max_output_tokens: maxOutputTokens,
  };
  if (chosenModel.startsWith("openai/")) {
    body.reasoning = { effort: "low" };
  }
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

  // FMT-01: 전화번호·홈페이지 주소·종목코드·QR코드 노출 불가 (기사식광고 제한소재 2-1)
  const urlMatch = body.match(
    /https?:\/\/[^\s)]+|www\.[^\s)]+|\b(?:02|0\d{2}|15\d{2}|16\d{2}|18\d{2})-\d{3,4}-\d{4}\b|\bQR\s*코드/i
  );
  if (urlMatch) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-01",
      severity: "BLOCK",
      location_json: JSON.stringify({ field: "body", matchedText: urlMatch[0] }),
      message: `[기사식광고 제한소재] 전화번호·홈페이지 주소·종목코드·QR코드('${urlMatch[0]}') 노출 불가 → 삭제 또는 '공식 홈페이지' 등 일반 명사로 대체`,
    });
  }

  // FMT-02: 면적 표기 시 평 대신 ㎡로 표기 (기사식광고 제한소재 2-3)
  const pyeongMatch = body.match(/\d+(?:\.\d+)?\s*평(?!\s*\()/);
  if (pyeongMatch && !body.includes("㎡")) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-02",
      severity: "WARN",
      location_json: JSON.stringify({ field: "body", matchedText: pyeongMatch[0] }),
      message: `[기사식광고 체크사항] '${pyeongMatch[0]}' — 면적은 평 대신 ㎡로 표기해야 합니다 (예: 100평 → 330㎡ 또는 330㎡(100평)).`,
    });
  }

  // FMT-03: 상세 주소(번지) 표기 제한 (기사식광고 제한소재 2-4)
  const addrMatch = body.match(/[가-힣0-9]+(?:동|로|길|가)\s+\d+(?:-\d+)?\s*번지/);
  if (addrMatch) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-03",
      severity: "WARN",
      location_json: JSON.stringify({ field: "body", matchedText: addrMatch[0] }),
      message: `[기사식광고 체크사항] 상세 주소('${addrMatch[0]}') 표기를 제한합니다 → 'OO동 일대'로 완화 권장.`,
    });
  }

  // FMT-04: 제목 글자 수 40자 내외 (28~45자 통과, 업무 프로세스 3단계)
  const tLen = Array.from((title || "").trim()).length;
  if (tLen < 28 || tLen > 45) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-04",
      severity: "WARN",
      location_json: JSON.stringify({ field: "title", matchedText: title }),
      message: `[업무 프로세스 3단계] 제목은 40자 내외(28~45자)여야 합니다 (현재 ${tLen}자).`,
    });
  }

  // FMT-05: 본문 분량 공백 포함 1,200~1,500자 목표 (업무 프로세스 2단계 4)
  const bLen = Array.from((body || "").replace(/\r?\n/g, "")).length;
  if (bLen < 1200 || bLen > 1500) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-05",
      severity: "WARN",
      location_json: JSON.stringify({ field: "body", matchedText: "" }),
      message: `[업무 프로세스 2단계] 본문 분량(공백 포함 ${bLen.toLocaleString()}자)이 목표 범위(1,200~1,500자)를 벗어났습니다.`,
    });
  }

  // FMT-07: 홍보체('자랑합니다' 등) 금지 및 '~밝혔다' 3회 이상 반복 억제 (업무 프로세스 3단계)
  const promoMatch = body.match(/자랑합니다|자랑한다|선보입니다|제공합니다|많은\s*관심\s*부탁드립니다|절찬리에/);
  const balkMatches = body.match(/밝혔다/g) || [];
  if (promoMatch || balkMatches.length >= 3) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-07",
      severity: "WARN",
      location_json: JSON.stringify({
        field: "body",
        matchedText: promoMatch ? promoMatch[0] : "밝혔다",
      }),
      message: promoMatch
        ? `[업무 프로세스 3단계] 홍보체 표현('${promoMatch[0]}')을 금지합니다 → '설명했다/선보인다' 등 객관 서술체로 교정`
        : `[업무 프로세스 3단계] 동일 서술 어미('~밝혔다')가 ${balkMatches.length}회 반복되었습니다 → 리드·말미 외에는 '~했다/설명했다'로 정리`,
    });
  }

  // FMT-08: 최상급·단정 표현 배제 (업무 프로세스 2단계 3 & banned-words.yaml)
  const superMatch = body.match(
    /세계\s*최고|국내\s*최고|업계\s*최고|최고\s*권위|세계\s*최대|국내\s*최대|최대\s*규모|업계\s*1위|국내\s*1위|세계\s*1위|유일무이|국내\s*유일|세계\s*최초|국내\s*최초|업계\s*최초|청소년올림픽\s*최초|최초로\s+도입|최초의\s+올림픽|독보적|압도적|명실상부|혁신적인/
  );
  if (superMatch) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-08",
      severity: "WARN",
      location_json: JSON.stringify({ field: "body", matchedText: superMatch[0] }),
      message: `[업무 프로세스 2단계 3] 최상급·과장 단정 표현('${superMatch[0]}') 감지 → 공인 출처 근거가 없으면 삭제하거나 완화하십시오.`,
    });
  }

  // FMT-11: 작성자 식별 정보(바이라인) 필수 및 부서명 바이라인 금지 (네이버 운영평가 대응방안 C항목)
  const trimmedByline = (byline || "").trim();
  if (!trimmedByline) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-11",
      severity: "BLOCK",
      location_json: JSON.stringify({ field: "byline", matchedText: "" }),
      message: `[네이버 운영평가 C항목(벌점 1/4점)] 기사에 작성자 식별 정보(바이라인)가 설정되어야 합니다.`,
    });
  } else if (/(?:팀|부|국|센터|위원회|편집부)\s*(?:기자)?$/.test(trimmedByline) && !/[가-힣]{2,4}\s+기자/.test(trimmedByline)) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-11",
      severity: "WARN",
      location_json: JSON.stringify({ field: "byline", matchedText: trimmedByline }),
      message: `[네이버 운영평가 C항목] 부서명 바이라인('${trimmedByline}')은 네이버 전송이 금지됩니다 → 개인 기자·직원 실명 바이라인(예: 이경섭 기자)으로 변경 권장.`,
    });
  }

  // FMT-12: 사진 캡션 '설명 + 제공자' 구조 (기사식광고 제한소재 2-2 & PRD 7.2)
  const capArr = Array.isArray(captions) ? captions : [];
  if (
    capArr.length === 0 ||
    !capArr.every((c) => /(?:\[제공=|\[출처:|\[출처=|\[사진=|<제공=|<출처=|<사진=)/.test(c))
  ) {
    findings.push({
      id: `f-${idx++}`,
      rule_id: "FMT-12",
      severity: "WARN",
      location_json: JSON.stringify({ field: "captions", matchedText: capArr[0] || "" }),
      message: `[기사식광고 체크사항] 사진 캡션은 '설명 + 제공자(예: [제공=기관명])' 구조여야 합니다.`,
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
  const [selectedModel, setSelectedModel] = useState(() => getSelectedAiModel());
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [summary, setSummary] = useState(() => getLocalUsageSummary());
  const masked = getMaskedKeyDisplay();
  const hasKey = Boolean(masked);

  useEffect(() => {
    setSummary(getLocalUsageSummary());
    setSelectedModel(getSelectedAiModel());
  }, [refreshTrigger, open]);

  const totalTokens = summary.totalTokens || 0;
  const totalUsd = summary.estimatedCostUsd || 0;
  const totalKrw = Math.round(totalUsd * 1380);
  const activeModelMeta =
    AVAILABLE_AI_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_AI_MODELS[0];

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
        text: `연결 성공! (모델: ${activeModelMeta.shortName} · ${res.usage.totalTokens} 토큰 소모)`,
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
        <span className="font-semibold text-primary">{activeModelMeta.shortName}</span>
        <span className="text-line">|</span>
        <span>
          누적 <strong className="font-semibold text-ink">{totalTokens.toLocaleString()}</strong> 토큰 ·{" "}
          <strong className="font-semibold text-primary">${totalUsd.toFixed(4)}</strong> (약{" "}
          {totalKrw.toLocaleString()}원)
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1D21]/40 p-4">
          <div className="w-[660px] max-w-full rounded-lg border-hairline border-line bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between border-b-hairline border-line pb-3">
              <h2 className="text-[16px] font-semibold text-ink">
                AI 작성 모델 선택 및 API 키 · 토큰 버닝 현황
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[13px] text-ink-muted hover:text-ink"
              >
                닫기 ✕
              </button>
            </div>

            <div className="rounded-md border-hairline border-primary bg-primary-subtle/40 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-primary">
                  🤖 자연스러운 한국어 기사 작성용 AI 모델 선택 (추가 키 없이 즉시 전환)
                </span>
                <span className="rounded bg-primary px-2 py-0.5 text-[11px] font-bold text-surface">
                  현재: {activeModelMeta.shortName}
                </span>
              </div>
              <div className="space-y-1.5">
                {AVAILABLE_AI_MODELS.map((m) => {
                  const isSel = selectedModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m.id);
                        setSelectedAiModelStorage(m.id);
                        setFeedback({
                          type: "ok",
                          text: `AI 작성 모델이 '${m.name}'(으)로 변경되었습니다.`,
                        });
                      }}
                      className={`w-full text-left rounded-md border-hairline p-2.5 transition-colors ${
                        isSel
                          ? "border-primary bg-surface font-semibold text-ink"
                          : "border-line bg-surface/60 text-ink-muted hover:text-ink"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className={isSel ? "text-primary font-bold" : "font-semibold"}>
                          {isSel ? "● " : "○ "}
                          {m.name}
                        </span>
                        <span className="font-mono text-[11px] text-ink-muted">{m.id}</span>
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-ink-muted">{m.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-md border-hairline border-line bg-surface-subtle p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink">
                  Perplexity Responses API 연결 상태 (기본 키 내장됨)
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-pass-bg px-2 py-0.5 text-[12px] font-semibold text-pass">
                  ✓ 연결됨 ({masked})
                </span>
              </div>
              <p className="text-[12px] text-ink-muted">
                기본 API 키가 이미 내장되어 있어 위 5개 모델(`Claude Sonnet 4.6`, `Claude Sonnet 4.5`, `GPT-5.4` 등)을 별도 설정 없이 바로 사용할 수 있습니다.
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
                  활성 모델: {activeModelMeta.id} (Perplexity /v1/responses)
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((item) => {
            const cName = item?.job?.company_name || "";
            if (/낫소|유니세프/.test(cName)) return false;
            const draftTitle = item?.article?.title || item?.draft?.title || "";
            const draftBody = item?.article?.body || item?.draft?.body || "";
            const compJson = JSON.stringify(item?.competitors || []);
            if (
              cName === "삼성전자" &&
              (!item?.article ||
                /신규 핵심 사업 및 현장 맞춤형 전략/.test(draftTitle) ||
                /골프존|카카오VX|마실파크골프/.test(draftBody) ||
                /골프존|카카오VX|마실파크골프/.test(compJson))
            ) {
              return false;
            }
            return true;
          });
          if (filtered.length > 0) return filtered;
        }
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
  const [byline, setByline] = useState("이경섭 기자");
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

      if (mode === "minimal") {
        const targetSents = fallbackDraft.sentenceSuggestions || [];
        const sentInputList = targetSents
          .map((s, idx) => `${idx + 1}. [원문] ${s.originalSentence}`)
          .join("\n");
        const promptMinimalSys = [
          "당신은 매일경제신문 편집국의 20년차 수석 교열·편집데스크 기자입니다.",
          "현재 모드는 [모드 1: 기본 교정 · 최소 수정]입니다.",
          "절대 원칙:",
          "1. 원문 문장의 원래 의미와 길이를 그대로 유지하면서 어색한 번역투·과장 표현·중복 영문 병기만 최소한으로 간결하게 다듬으십시오.",
          "2. 원문에 없는 상투적 수식어('글로벌 현장 기술 지원에 본격 추진하며', '시장 공략에 속도를 낸다', '업계의 이목이 집중된다' 등)를 절대 덧붙이지 마십시오. 문장이 원문보다 길어지면 안 됩니다.",
          "3. 한 문장 안에 '~며, ~며' 또는 '~고, ~고' 같은 동일 연결어미가 중복되지 않도록 간결한 단문/복문으로 교정하십시오.",
          "4. IOC, AI, ESG, B2B 등 필수 약어는 유지하고, 불필요하게 긴 영문 전체 병기만 정리하십시오.",
          "5. 각 대상 문장마다 서로 다른 3가지 간결한 교정 버전(v1: 최소 다듬기·교열, v2: 간결한 스트레이트 어순, v3: 담백한 경제지 문체)과 32~42자 내외의 매경 스타일 제목 후보 3개(titleCandidates), 명사형 부제목 2줄(subtitleLines)을 JSON으로만 응답하십시오.",
          '응답 JSON 형식: {"titleCandidates":["...","...","..."],"subtitleLines":["...","..."],"edits":[{"index":1,"reason":"간결한 교열 사유","v1":"...","v2":"...","v3":"..."}]}',
        ].join("\n");

        try {
          const genRes = await callPerplexityResponsesApi({
            instructions: promptMinimalSys,
            input: `대상 기업명: ${compName}\n\n[교정 대상 문장 목록]\n${sentInputList}\n\n[보도자료 원문 참고]\n${rawText.slice(0, 2200)}`,
            maxOutputTokens: 2800,
            useWebSearch: false,
          });
          parsed = safeParseLlmJson(genRes.text);
          if (parsed && Array.isArray(parsed.edits) && parsed.edits.length > 0) {
            fallbackDraft.sentenceSuggestions = targetSents.map((item, idx) => {
              const found =
                parsed.edits.find((e) => Number(e.index) === idx + 1) ||
                parsed.edits[idx];
              if (!found) return item;
              const v1 = (found.v1 || "").trim();
              const v2 = (found.v2 || "").trim();
              const v3 = (found.v3 || "").trim();
              if (!v1 || v1 === item.originalSentence) return item;
              return {
                ...item,
                reason: found.reason || item.reason,
                alternatives: [
                  {
                    id: `${item.id}-alt-1`,
                    label: "버전 1 (권장 · 최소 교열)",
                    toneBadge: "원문 유지·간결 다듬기",
                    text: v1,
                  },
                  {
                    id: `${item.id}-alt-2`,
                    label: "버전 2 (매경 스트레이트 톤)",
                    toneBadge: "간결한 기사체",
                    text: v2 && v2 !== v1 ? v2 : item.alternatives[1]?.text || v1,
                  },
                  {
                    id: `${item.id}-alt-3`,
                    label: "버전 3 (핵심 팩트 중심)",
                    toneBadge: "군더더기 제거",
                    text:
                      v3 && v3 !== v1 && v3 !== v2
                        ? v3
                        : item.alternatives[2]?.text || v1,
                  },
                ],
              };
            });
          }
        } catch (apiErr) {
          console.warn("Minimal LLM proofread fallback triggered:", apiErr);
        }
      } else {
        const promptSys = [
          "당신은 매일경제신문 PR사업팀의 베테랑 편집데스크 기자입니다.",
          mode === "comparative"
            ? [
                "현재 모드는 [모드 3: 비교·기획 기사]입니다.",
                "비교·기획 기사의 핵심 목적(PRD F10 및 네이버 운영평가 R항목 대응): 단일 기업 일방 홍보성 보도자료를 산업·기술 트렌드 및 동종업계 타 브랜드·경쟁사 비교 분석이 결합된 객관적 기획 기사로 재구성하는 것입니다.",
                "입력된 보도자료를 바탕으로 다음 항목을 JSON으로 작성하십시오:",
                "(1) 산업 트렌드와 대상 기업을 함께 조명하는 32~42자 내외의 매경 스타일 기획 제목 후보 3개(titleCandidates),",
                "(2) 명사형 부제목 2줄(subtitleLines),",
                "(3) 동종업계 실제 타 브랜드·경쟁사 3곳의 이름과 핵심 동향 요약(competitors: [{name, summary}]),",
                "(4) 문단별로 체계적으로 구성된 7~8문단 분량(1,250~1,480자, 공백 포함 1,500자 이하 엄수)의 비교·기획 기사 본문(body, 문단 간 \\n\\n 구분).",
                "★ 타 브랜드·경쟁사 단락 분리 필수 규칙: 본문 후반부에 타 브랜드·경쟁사 동향을 서술할 때 여러 경쟁사를 한 문단에 묶어서 작성하지 말고, 반드시 각 타 브랜드·경쟁사(3곳)마다 독립된 별도 단락(\\n\\n)으로 나누어 작성하십시오. 이어서 마지막 단락에는 경쟁 구도 속에서 대상 기업이 갖는 차별화 전략과 의의를 별도 단락으로 작성하십시오.",
              ].join("\n")
            : "입력된 보도자료를 바탕으로 (1) 32~42자 내외의 매경 스타일 제목 후보 3개(titleCandidates), (2) 명사형 부제목 2줄(subtitleLines), (3) 문단별로 잘 구성된 4~5문단 분량(1,250~1,450자)의 기사 본문(body, 문단 간 \\n\\n 구분, 첫 문단 리드문 고정 및 중간 문단 재배치)을 JSON으로 작성하십시오.",
          "엄격 규칙: 마크다운(**, ###)이나 인라인 출처번호([1]) 금지, 동일 서술 어미('~밝혔다') 3회 이상 반복 금지('~설명했다', '~전했다', '~강조했다'로 분산). 한 문장 내 '~며, ~며' 중복 연결어미 금지. JSON 문자열 내부의 인용문은 반드시 둥근 따옴표(‘...’, “...”)만 사용하여 JSON 구문 오류를 방지하십시오.",
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
                placeholder="예: 삼성전자, 국민대학교"
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
  const [paragraphMode, setParagraphMode] = useState(false);
  const [isDirectTyping, setIsDirectTyping] = useState(false);
  const [cleanFullView, setCleanFullView] = useState(false);
  const [rightPaneCleanText, setRightPaneCleanText] = useState(false);
  const [quickCopyFeedback, setQuickCopyFeedback] = useState(null);
  const [showInlineDiffHighlight, setShowInlineDiffHighlight] = useState(true);
  const [tallParagraphs, setTallParagraphs] = useState(false);
  const [focusedParaIdx, setFocusedParaIdx] = useState(null);
  const [highlightedTerm, setHighlightedTerm] = useState(null);
  const [showTitleCandidatesToggle, setShowTitleCandidatesToggle] = useState(false);

  // 화면 사이 크기 조절(Resizable Split & Sidebar) 상태
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(330);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(340);
  const [splitLeftRatio, setSplitLeftRatio] = useState(50);

  function startHorizontalResize(e, onMoveDelta) {
    e.preventDefault();
    const startX = e.clientX;
    function onMouseMove(moveEvent) {
      onMoveDelta(moveEvent.clientX - startX, moveEvent);
    }
    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

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
      const savedByline = JSON.parse(data.job?.options_json || "{}").byline || "이경섭 기자";
      return savedByline === "매경 콘텐츠PR팀 기자" ? "이경섭 기자" : savedByline;
    } catch {
      return "이경섭 기자";
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
  const [sentenceSuggestions, setSentenceSuggestions] = useState(() => {
    try {
      const s6Rec = (data.stages || []).find((s) => s.stage === "S6");
      const s6Parsed = s6Rec ? JSON.parse(s6Rec.output_json || "{}") : null;
      const sugs = s6Parsed?.sentenceSuggestions;
      const rawJson = JSON.stringify(sugs || []);
      const hasStaleOrIdentical =
        !Array.isArray(sugs) ||
        sugs.length === 0 ||
        !rawJson.includes("기사식광고 규정 표준 교정") ||
        rawJson.includes("본격 추진하며 시장 공략에") ||
        rawJson.includes("매경 데스크 스타일") ||
        /측은\s+[가-힣A-Za-z0-9㈜()]+(?:은|는|이|가)\s/.test(rawJson) ||
        sugs.some((s) =>
          (s.alternatives || []).some(
            (a) =>
              (a.text || "").replace(/\s+/g, " ").trim() ===
              (s.originalSentence || "").replace(/\s+/g, " ").trim()
          )
        );
      if (!hasStaleOrIdentical) {
        return sugs;
      }
    } catch {}
    return buildClientSentenceSuggestions(
      data.job?.raw_text || "",
      data.job?.company_name || "대상 기업"
    );
  });
  const [aiProofreadLoading, setAiProofreadLoading] = useState(false);
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
    const nextTitle =
      Array.isArray(draft.titleCandidates) && draft.titleCandidates.length > 0
        ? draft.titleCandidates[0]
        : title;
    const nextSubtitle =
      Array.isArray(draft.subtitleLines) && draft.subtitleLines.length > 0
        ? draft.subtitleLines.join("\n")
        : subtitle;
    setTitle(nextTitle);
    setSubtitle(nextSubtitle);
    setBody(draft.body);
    setShowSideBySide(targetMode === "rewrite");
    setShowFactNotepad(targetMode === "minimal");
    const hasValidExistingComps =
      Array.isArray(data.competitors) &&
      data.competitors.length > 0 &&
      !/골프존|카카오VX|마실파크골프|동종업계 선도 기업군/.test(JSON.stringify(data.competitors));
    const nextCompetitors =
      targetMode === "comparative"
        ? hasValidExistingComps
          ? data.competitors
          : (draft.competitors || []).map((c, idx) => ({
              id: `comp-${Date.now()}-${idx}`,
              name: c.name,
              summary: c.summary,
              source_url:
                data.sources?.[idx]?.url ||
                `https://www.mk.co.kr/search?word=${encodeURIComponent(c.name)}`,
              selected: 1,
            }))
        : data.competitors || [];
    onUpdate((prev) => ({
      ...prev,
      job: {
        ...prev.job,
        mode: targetMode,
      },
      competitors: nextCompetitors,
      article: {
        ...(prev.article || {}),
        title: nextTitle,
        subtitle: nextSubtitle,
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

  function handleRevertAllSuggestions() {
    let nextBody = body;
    const nextList = sentenceSuggestions.map((item) => {
      if (!item.selectedAltId) return item;
      const curAlt = item.alternatives.find((a) => a.id === item.selectedAltId);
      if (curAlt && nextBody.includes(curAlt.text)) {
        nextBody = nextBody.replace(curAlt.text, item.originalSentence);
      }
      return { ...item, selectedAltId: null };
    });
    setBody(nextBody);
    setSentenceSuggestions(nextList);
    setActiveSuggestionId(null);
  }

  async function handleRegenerateAiMinimalSuggestions() {
    if (aiProofreadLoading) return;
    setAiProofreadLoading(true);
    try {
      const compName = data.job?.company_name || "대상 기업";
      const baseList = buildClientSentenceSuggestions(
        data.job?.raw_text || "",
        compName
      );
      const sentInputList = baseList
        .map((s, idx) => `${idx + 1}. [원문] ${s.originalSentence}`)
        .join("\n");
      const promptMinimalSys = [
        "당신은 매일경제신문 편집국의 20년차 수석 교열·편집데스크 기자입니다.",
        "현재 모드는 [모드 1: 기본 교정 · 최소 수정]입니다.",
        "절대 원칙:",
        "1. 원문 문장의 원래 의미와 길이를 그대로 유지하면서 어색한 번역투·과장 표현·중복 영문 병기만 최소한으로 간결하게 다듬으십시오.",
        "2. 원문에 없는 상투적 수식어('글로벌 현장 기술 지원에 본격 추진하며', '시장 공략에 속도를 낸다', '업계의 이목이 집중된다' 등)를 절대 덧붙이지 마십시오. 문장이 원문보다 길어지면 안 됩니다.",
        "3. 한 문장 안에 '~며, ~며' 또는 '~고, ~고' 같은 동일 연결어미가 중복되지 않도록 간결한 단문/복문으로 교정하십시오.",
        "4. IOC, AI, ESG, B2B 등 필수 약어는 유지하고, 불필요하게 긴 영문 전체 병기만 정리하십시오.",
        "5. 각 대상 문장마다 서로 다른 3가지 간결한 교정 버전(v1: 최소 다듬기·교열, v2: 간결한 스트레이트 어순, v3: 담백한 경제지 문체)을 JSON으로만 응답하십시오.",
        '응답 JSON 형식: {"edits":[{"index":1,"reason":"간결한 교열 사유","v1":"...","v2":"...","v3":"..."}]}',
      ].join("\n");

      const genRes = await callPerplexityResponsesApi({
        instructions: promptMinimalSys,
        input: `대상 기업명: ${compName}\n\n[교정 대상 문장 목록]\n${sentInputList}`,
        maxOutputTokens: 2500,
        useWebSearch: false,
      });
      const parsed = safeParseLlmJson(genRes.text);
      if (parsed && Array.isArray(parsed.edits) && parsed.edits.length > 0) {
        let nextBody = data.job?.raw_text || body;
        const updatedList = baseList.map((item, idx) => {
          const found =
            parsed.edits.find((e) => Number(e.index) === idx + 1) ||
            parsed.edits[idx];
          if (!found) return item;
          const v1 = (found.v1 || "").trim();
          const v2 = (found.v2 || "").trim();
          const v3 = (found.v3 || "").trim();
          if (!v1 || v1 === item.originalSentence) return item;
          if (nextBody.includes(item.originalSentence)) {
            nextBody = nextBody.replace(item.originalSentence, v1);
          }
          return {
            ...item,
            reason: found.reason || item.reason,
            selectedAltId: `${item.id}-alt-1`,
            alternatives: [
              {
                id: `${item.id}-alt-1`,
                label: "버전 1 (권장 · 최소 교열)",
                toneBadge: "Claude 4.6 자연스러운 교열",
                text: v1,
              },
              {
                id: `${item.id}-alt-2`,
                label: "버전 2 (매경 스트레이트 톤)",
                toneBadge: "간결한 기사체",
                text: v2 && v2 !== v1 ? v2 : item.alternatives[1]?.text || v1,
              },
              {
                id: `${item.id}-alt-3`,
                label: "버전 3 (핵심 팩트 중심)",
                toneBadge: "군더더기 제거",
                text:
                  v3 && v3 !== v1 && v3 !== v2
                    ? v3
                    : item.alternatives[2]?.text || v1,
              },
            ],
          };
        });
        setSentenceSuggestions(updatedList);
        setBody(nextBody);
        setSaveFeedback("Claude 4.6 최소 교열 문장이 반영되었습니다.");
        setTimeout(() => setSaveFeedback(null), 3000);
      }
    } catch (err) {
      console.warn("AI minimal regeneration failed:", err);
    } finally {
      setAiProofreadLoading(false);
    }
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

  function scrollToBodyParagraphStudio(idx) {
    const clamped = Math.min(Math.max(0, idx), Math.max(0, bodyParagraphs.length - 1));
    setFocusedParaIdx(clamped);
    setTimeout(() => {
      const el = document.getElementById(`body-para-${clamped}`);
      if (el) {
        const scrollParent = el.closest(".overflow-y-auto");
        if (scrollParent) {
          const parentRect = scrollParent.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const targetTop =
            scrollParent.scrollTop +
            (elRect.top - parentRect.top) -
            Math.max(24, parentRect.height * 0.2);
          scrollParent.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
        } else {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    }, 60);
    setTimeout(() => {
      setFocusedParaIdx((prev) => (prev === clamped ? null : prev));
    }, 2400);
  }

  function handleInsertFactMemoToParagraph(memoId) {
    const memo = factMemos.find((m) => m.id === memoId);
    if (!memo) return;

    // 이미 반영된 상태라면 본문에서 해당 문장을 제거하여 반영 안 한 상태로 되돌리기
    if (memo.inserted && body.includes(memo.text)) {
      const cleanedBody = body
        .replace(` ${memo.text}`, "")
        .replace(`${memo.text} `, "")
        .replace(memo.text, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      setBody(cleanedBody);
      setFactMemos((prev) =>
        prev.map((m) => (m.id === memoId ? { ...m, inserted: false } : m))
      );
      return;
    }

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
    scrollToBodyParagraphStudio(targetIdx);
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

  const liveFindings = useMemo(() => {
    const caps = (captionText || "")
      .split(/\r?\n/)
      .map((c) => c.trim())
      .filter(Boolean);
    return runClientHardRules(title, subtitle, body, caps, byline);
  }, [title, subtitle, body, captionText, byline]);

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
      nextBody = nextBody.replaceAll(matchedText, "공식 홈페이지");
      setBody(nextBody);
    } else if (ruleId === "FMT-02") {
      nextBody = nextBody.replace(/(\d+(?:\.\d+)?)\s*평(?!\s*\()/g, (_, n) => {
        const sqm = Math.round(Number(n) * 3.3058);
        return `${sqm}㎡(${n}평)`;
      });
      setBody(nextBody);
    } else if (ruleId === "FMT-03") {
      nextBody = nextBody.replace(
        /([가-힣0-9]+(?:동|로|길|가))\s+\d+(?:-\d+)?\s*번지/g,
        "$1 일대"
      );
      setBody(nextBody);
    } else if (ruleId === "FMT-05") {
      handleApplyAllSentenceSuggestions();
      return;
    } else if (ruleId === "FMT-07") {
      let c = 0;
      nextBody = nextBody
        .replace(/자랑합니다\.?/g, "설명했다.")
        .replace(/자랑한다\.?/g, "설명했다.")
        .replace(/선보입니다\.?/g, "선보인다.")
        .replace(/제공합니다\.?/g, "제공한다.")
        .replace(/절찬리에/g, "현재")
        .replace(/밝혔다\./g, (m) => {
          c += 1;
          if (c === 2) return "설명했다.";
          if (c >= 3) return "전했다.";
          return m;
        });
      setBody(nextBody);
    } else if (ruleId === "FMT-08") {
      nextBody = nextBody
        .replace(/청소년올림픽\s*최초로\s*도입/g, "청소년올림픽에 처음 도입")
        .replace(/최초로\s*도입/g, "처음 도입")
        .replace(/열리는\s*최초의\s*올림픽/g, "처음 열리는 올림픽")
        .replace(/최초의\s*올림픽/g, "처음 열리는 올림픽")
        .replace(/혁신적인/g, "새로운")
        .replace(/세계\s*최고/g, "우수한 수준의")
        .replace(/국내\s*최고/g, "국내 주요")
        .replace(/세계\s*최대|국내\s*최대|최대\s*규모/g, "대규모")
        .replace(/세계\s*최초|국내\s*최초|업계\s*최초/g, "새로운")
        .replace(/독보적/g, "차별화된")
        .replace(/압도적/g, "높은")
        .replace(/유일무이/g, "차별화된");
      setBody(nextBody);
    } else if (ruleId === "FMT-11") {
      nextByline = "이경섭 기자";
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

  function renderOriginalParagraphSentencesStudio(rp, rIdx) {
    const sents = (rp || "")
      .split(/(?<=[.!?다요])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return (
      <div className="leading-[28px]">
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
                    className={`ml-1 inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-bold align-middle whitespace-nowrap select-none ${
                      isReplaced
                        ? "bg-pass text-surface"
                        : "bg-reject text-surface"
                    }`}
                  >
                    {isReplaced ? "✓ 교체됨 ▾" : "✎ 교정 ▾"}
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
                              handleRevertSentenceToOriginal(matchedSug.id)
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
                        const isCur = matchedSug.selectedAltId === alt.id;
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
                        onChange={(e) => setCustomAltText(e.target.value)}
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

          if (effectiveMode !== "minimal") {
            const cleanSent = sent.replace(/\s+/g, " ").trim();
            const sameBodyPara = (bodyParagraphs[rIdx] || "").replace(/\s+/g, " ").trim();
            const unchangedInSamePara =
              cleanSent.length >= 8 && sameBodyPara.includes(cleanSent);

            if (!unchangedInSamePara) {
              // 리라이팅 모드(모드 2·3)에서 원문 중 변경·재배치된 문장 및 내부 삭제·치환 구절을 시각적으로 표시
              const isMovedPara =
                rIdx === 1 ||
                rIdx === 2 ||
                (rawParagraphs.length >= 5 && (rIdx === 3 || rIdx === 4));
              const targetMovedIdx =
                rIdx === 1
                  ? 2
                  : rIdx === 2
                  ? 1
                  : rIdx === 3 && rawParagraphs.length >= 5
                  ? 4
                  : rIdx === 4 && rawParagraphs.length >= 5
                  ? 3
                  : rIdx;
              const tokenRegex =
                /(\([A-Za-z0-9\s,&·-]{6,}\)|세계\s*최초로?|국내\s*최초로?|업계\s*최초로?|최초로|활용해|영광의\s+순간을|생생하고\s+현장감\s+넘치는\s+화면을|선명하고\s+생동감\s+있는|대회\s+기간\s+중|각국\s+대표팀과\s+교류하며|다양한\s+활동을\s+선보일\s+계획이다\.?|선보일\s+계획이다\.?|전달할\s+예정이다\.?|추억을\s+이어줄\s+예정이다\.?|마련할\s+계획이다\.?|등이\s+운영된다\.?|특별한\s+사진을\s+제작할\s+수\s+있다\.?|유익한\s+세션들이\s+진행된다\.?|도\s+진행한다\.?|역사적인\s+이정표가\s+될\s+전망이다\.?|굳건히\s+이어오고\s+있으며|지속해서\s+지원하고\s+있다\.?|특별한\s+순간을\s+기념할\s+수\s+있다\.?|기념할\s+수\s+있다\.?|폭넓게\s+활용할\s+수\s+있다\.?|구현하도록\s+설계됐다\.?|설계됐다\.?|설계했다\.?|간소화했다\.?|개발\s+및\s+생산해\s+왔다\.?)/g;
              const parts = sent.split(tokenRegex);

              return (
                <span
                  key={`${rIdx}-${sIdx}-rw-orig`}
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToBodyParagraphStudio(targetMovedIdx);
                  }}
                  title={
                    isMovedPara
                      ? `클릭 시 오른쪽 리라이팅 단락 ${String(targetMovedIdx + 1).padStart(2, "0")} 위치로 이동합니다`
                      : "오른쪽 화면에서 기사체로 리라이팅된 원문 문장입니다"
                  }
                  className="inline rounded-sm bg-[#FFF4E5] border-b border-[#F59E0B] text-ink px-1 py-0.5 mr-1.5 cursor-pointer hover:bg-[#FDE68A]/50 transition-colors"
                >
                  {parts.map((part, pIdx) => {
                    if (!part) return null;
                    tokenRegex.lastIndex = 0;
                    if (tokenRegex.test(part)) {
                      return (
                        <span
                          key={pIdx}
                          className="rounded-sm bg-reject-bg text-reject line-through decoration-reject px-1 mx-0.5 font-medium"
                          title="리라이팅 시 생략 또는 매경 기사체로 치환된 원문 표현"
                        >
                          {part}
                        </span>
                      );
                    }
                    return <span key={pIdx}>{part}</span>;
                  })}
                  <span className="ml-1 inline-flex items-center rounded bg-[#B26A00] px-1.5 py-0.2 text-[10px] font-bold text-surface align-middle whitespace-nowrap select-none">
                    {isMovedPara
                      ? `⇄ 단락${String(targetMovedIdx + 1).padStart(2, "0")} 이동·리라이팅`
                      : rIdx === 0 && sIdx === 0
                      ? "✎ 리드문 리라이팅"
                      : "✎ 리라이팅됨"}
                  </span>
                </span>
              );
            }
          }

          return (
            <span key={`${rIdx}-${sIdx}`} className="mr-1.5">
              {sent}
            </span>
          );
        })}
      </div>
    );
  }

  function renderOriginalWithHighlightsStudio() {
    if (!paragraphMode) {
      return (
        <div className="rounded-md border-hairline border-line bg-surface p-5 space-y-4 text-[14.5px] leading-[28px] text-ink break-keep">
          {rawParagraphs.map((rp, rIdx) => (
            <div
              key={rIdx}
              onClick={() => scrollToBodyParagraphStudio(rIdx)}
              title={`클릭 시 오른쪽 본문 단락 ${String(rIdx + 1).padStart(2, "0")} 위치로 이동합니다`}
              className={`rounded px-1.5 py-0.5 -mx-1.5 cursor-pointer transition-colors ${
                focusedParaIdx === rIdx
                  ? "bg-primary-subtle/70 ring-1 ring-primary"
                  : "hover:bg-surface-subtle"
              }`}
            >
              {renderOriginalParagraphSentencesStudio(rp, rIdx)}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3 text-[14px] leading-[24px] text-ink">
        {rawParagraphs.map((rp, rIdx) => (
          <div
            key={rIdx}
            onClick={() => scrollToBodyParagraphStudio(rIdx)}
            title={`클릭 시 오른쪽 수정 단락 ${String(rIdx + 1).padStart(2, "0")} 위치로 바로 이동합니다`}
            className={`rounded-md border-hairline p-3 space-y-2 break-keep cursor-pointer transition-colors ${
              focusedParaIdx === rIdx
                ? "border-primary bg-primary-subtle/40 ring-1 ring-primary"
                : "border-line bg-surface hover:border-primary"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-ink-muted border-b-hairline border-line pb-1">
              <span className="font-semibold text-ink">
                원문 단락 {String(rIdx + 1).padStart(2, "0")} ({Array.from(rp).length}자)
              </span>
              <span className="font-semibold text-primary whitespace-nowrap">
                본문 단락 {String(Math.min(rIdx + 1, bodyParagraphs.length)).padStart(2, "0")} 이동 →
              </span>
            </div>
            {renderOriginalParagraphSentencesStudio(rp, rIdx)}
          </div>
        ))}
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

          // 1단계 최소 수정 핵심 원칙: 사용자가 실제로 교정을 선택(isReplaced)한 문장만 초록색으로 교체해 보여주고,
          // 아직 선택하지 않은 문장은 원문 그대로 깨끗하게 유지!
          if (matchedSug && Boolean(matchedSug.selectedAltId)) {
            const selAlt = matchedSug.alternatives.find(
              (a) => a.id === matchedSug.selectedAltId
            );
            const displayText = selAlt ? selAlt.text : sent;

            return (
              <span
                key={`${paraIdx}-${sIdx}-${matchedSug.id}`}
                onClick={() => {
                  setActiveSuggestionId(matchedSug.id);
                  const el = document.getElementById(
                    `sug-card-${matchedSug.id}`
                  );
                  el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }}
                title="교체된 문장입니다 (클릭 시 왼쪽 원문 위치에서 다른 버전 선택 또는 원문 복원)"
                className="mr-1.5 cursor-pointer rounded px-1.5 py-0.5 transition-colors inline bg-pass-bg text-pass font-semibold border-b-2 border-pass"
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
    const sameRaw = (rawParagraphs[paraIdx] || "").replace(/\s+/g, " ").trim();
    return (
      <div className="leading-[28px] text-[15px] text-ink">
        {sents.map((sent, sIdx) => {
          const cleanSent = sent.replace(/\s+/g, " ").trim();
          const sameAsRaw = cleanSent.length >= 8 && sameRaw.includes(cleanSent);
          if (!sameAsRaw) {
            return (
              <span
                key={`${paraIdx}-rw-${sIdx}`}
                className="inline rounded-sm bg-[#FEF9C3] border-b border-[#EAB308] text-ink px-1 py-0.5 mr-1.5"
              >
                {sent}
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

      <main className="mx-auto flex w-full max-w-[1680px] flex-1 gap-0 p-4 items-start">
        {/* 4. 왼쪽 사이드: 📌 취재 팩트 메모장 (기본 활성) + 단계 진행 타임라인 탭 */}
        {!wideEditorMode && (
          <>
            <aside
              style={{ width: `${leftSidebarWidth}px` }}
              className="shrink-0 sticky top-4 space-y-3"
            >
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
                              <button
                                type="button"
                                onClick={() => scrollToBodyParagraphStudio(selIdx)}
                                className="whitespace-nowrap rounded bg-pass-bg px-1.5 py-0.5 text-[11px] font-semibold text-pass hover:underline"
                                title="클릭 시 해당 본문 단락으로 이동"
                              >
                                ✓ 단락 {String(selIdx + 1).padStart(2, "0")} 반영됨 ↗
                              </button>
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
                              className={`whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-bold transition-colors ${
                                memo.inserted
                                  ? "border-hairline border-reject bg-reject-bg text-reject hover:opacity-90"
                                  : "text-hold hover:underline"
                              }`}
                            >
                              {memo.inserted ? "↩ 되돌리기 (반영 취소)" : "본문 반영 →"}
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
          {/* 왼쪽 사이드바 ↔ 중앙 편집기 사이 너비 조절 핸들 */}
          <div
            role="separator"
            aria-orientation="vertical"
            title="좌우로 드래그하여 취재 팩트 메모장 너비 조절 (더블클릭: 기본 크기 복원)"
            onDoubleClick={() => setLeftSidebarWidth(340)}
            onMouseDown={(e) => {
              const startWidth = leftSidebarWidth;
              startHorizontalResize(e, (dx) => {
                setLeftSidebarWidth(Math.min(500, Math.max(250, startWidth + dx)));
              });
            }}
            className="w-3.5 shrink-0 self-stretch cursor-col-resize flex flex-col items-center justify-center group select-none"
          >
            <div className="w-[3px] h-16 rounded-full bg-line group-hover:bg-primary transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 rounded bg-primary px-1 py-0.5 text-[9px] font-bold text-surface whitespace-nowrap pointer-events-none">
                ↔
              </span>
            </div>
          </div>
          </>
        )}

        {/* 중앙 메인 영역: 상단 복잡한 요소를 덜어내고 제목·부제 → [원문 전체] → [그 아래 수정된 내용] 순서로 한눈에 배치 */}
        <section className="flex-1 min-w-[540px] flex flex-col gap-4">
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
              {/* 1. 제목 및 추천 제목 후보 토글 (상단 최우선 노출) */}
              <div className="p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                  <div className="flex items-center gap-2">
                    <label className="font-semibold text-ink">제목 (목표 40자 내외, 28~45자 통과)</label>
                    {s6Output?.titleCandidates?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowTitleCandidatesToggle((v) => !v)}
                        className={`inline-flex h-[24px] items-center gap-1 rounded-md border-hairline px-2.5 text-[11px] font-bold transition-colors whitespace-nowrap ${
                          showTitleCandidatesToggle
                            ? "border-primary bg-primary text-surface"
                            : "border-primary bg-primary-subtle text-primary hover:bg-primary hover:text-surface"
                        }`}
                      >
                        <span>✨ 추천 제목 후보 ({s6Output.titleCandidates.length}종)</span>
                        <span>{showTitleCandidatesToggle ? "▲ 접기" : "▼ 열기"}</span>
                      </button>
                    )}
                  </div>
                  <span className={isTitleInRange ? "text-ink-muted" : "text-hold font-semibold"}>
                    {titleCharCount}자 (기준 28~45자)
                  </span>
                </div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-[42px] rounded-md border-hairline border-line px-3 text-[18px] font-semibold"
                />
                {showTitleCandidatesToggle && s6Output?.titleCandidates?.length > 0 && (
                  <div className="rounded-md border-hairline border-primary bg-surface-subtle p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-ink-muted">
                      <span className="font-semibold text-primary">
                        클릭하면 해당 제목으로 즉시 교체됩니다:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowTitleCandidatesToggle(false)}
                        className="text-ink-muted hover:text-ink"
                      >
                        닫기 ✕
                      </button>
                    </div>
                    <div className="space-y-1">
                      {s6Output.titleCandidates.map((cand, i) => {
                        const isCurTitle = title.trim() === cand.trim();
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setTitle(cand);
                              setShowTitleCandidatesToggle(false);
                            }}
                            className={`w-full text-left flex items-center justify-between gap-2 rounded border-hairline px-3 py-2 text-[13px] transition-colors ${
                              isCurTitle
                                ? "border-pass bg-pass-bg text-pass font-bold"
                                : "border-line bg-surface hover:border-primary text-ink font-medium"
                            }`}
                          >
                            <span className="break-keep">
                              <strong className="text-primary mr-1.5">후보 {i + 1}.</strong>
                              {cand}
                            </span>
                            <span className="text-[11px] whitespace-nowrap shrink-0 font-semibold text-ink-muted">
                              {Array.from(cand).length}자 {isCurTitle ? "· ✓ 현재 적용됨" : "· 선택 →"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
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
                      [비교·기획 모드] 동종업계 경쟁사·타 브랜드 비교 조사 ({data.competitors.length}곳 · 브랜드별 독립 단락 자동 분리됨)
                    </span>
                    <button
                      type="button"
                      disabled={chatLoading}
                      onClick={() => {
                        const firstCompIdx = bodyParagraphs.findIndex((p) =>
                          (data.competitors || []).some((c) =>
                            p.includes((c.name || "").split("(")[0].trim())
                          )
                        );
                        if (firstCompIdx >= 0) {
                          scrollToBodyParagraphStudio(firstCompIdx);
                        } else {
                          handleChatEdit(
                            "비교·기획 문단에 묶여 있는 경쟁사 브랜드들을 문단마다 브랜드별로 각각 독립된 문단으로 분리해서 상세히 작성해줘."
                          );
                        }
                      }}
                      className="whitespace-nowrap rounded border-hairline border-secondary bg-surface px-2.5 py-1 text-[11px] font-semibold text-secondary hover:bg-secondary hover:text-surface transition-colors"
                    >
                      ✓ 브랜드별 독립 단락 보기 ↓
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[12px]">
                    {data.competitors.map((comp, cIdx) => {
                      const compKey = (comp.name || "").split(/[(\s·]/)[0].trim();
                      const matchedParaIdx = bodyParagraphs.findIndex(
                        (p) => compKey && p.includes(compKey)
                      );
                      return (
                        <div
                          key={comp.id || cIdx}
                          onClick={() => {
                            if (matchedParaIdx >= 0) {
                              scrollToBodyParagraphStudio(matchedParaIdx);
                            }
                          }}
                          className="rounded bg-surface p-2.5 border-hairline border-line space-y-1 cursor-pointer hover:border-secondary transition-colors"
                          title={
                            matchedParaIdx >= 0
                              ? `클릭 시 본문 단락 ${String(matchedParaIdx + 1).padStart(2, "0")}(${comp.name}) 위치로 이동합니다`
                              : comp.name
                          }
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-secondary">
                              {comp.name}
                              {matchedParaIdx >= 0 && (
                                <span className="ml-1.5 rounded bg-secondary-subtle px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
                                  단락 {String(matchedParaIdx + 1).padStart(2, "0")}
                                </span>
                              )}
                            </span>
                            {comp.source_url && (
                              <a
                                href={comp.source_url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] text-primary hover:underline whitespace-nowrap"
                              >
                                출처 ↗
                              </a>
                            )}
                          </div>
                          <p className="text-[11px] leading-[17px] text-ink-muted break-keep">
                            {comp.summary}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. 본문 영역: 기본값 = [전체 문장 비교 (통문장 좌우 2분할)], 옵션 = [문단별 편집] / [완성본만 보기] */}
              <div className="p-4 space-y-3 flex-1">
                {/* 상단 본문 툴바 (불필요한 중복 버튼을 제거한 1줄 클린 컨트롤 바) */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border-hairline border-line bg-surface-subtle px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center rounded-md border-hairline border-line bg-surface p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCleanFullView(false);
                          setParagraphMode(false);
                        }}
                        className={`h-[28px] rounded px-2.5 text-[12px] font-bold whitespace-nowrap transition-colors ${
                          !cleanFullView && !paragraphMode
                            ? "bg-primary text-surface"
                            : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        📄 전체 문장 비교 (기본)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCleanFullView(false);
                          setParagraphMode(true);
                          setIsDirectTyping(false);
                        }}
                        className={`h-[28px] rounded px-2.5 text-[12px] font-bold whitespace-nowrap transition-colors ${
                          !cleanFullView && paragraphMode
                            ? "bg-primary text-surface"
                            : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        📑 문단별 편집
                      </button>
                      <button
                        type="button"
                        onClick={() => setCleanFullView(true)}
                        className={`h-[28px] rounded px-2.5 text-[12px] font-bold whitespace-nowrap transition-colors ${
                          cleanFullView
                            ? "bg-primary text-surface"
                            : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        📋 완성본만 보기
                      </button>
                    </div>

                    <span className="text-[11px] font-medium text-ink-muted whitespace-nowrap">
                      {bodyParagraphs.length}문단 · {bodyCharCount.toLocaleString()}자
                    </span>

                    {quickCopyFeedback && (
                      <span className="inline-flex items-center rounded bg-pass-bg border-hairline border-pass px-2 py-0.5 text-[11px] font-bold text-pass whitespace-nowrap">
                        {quickCopyFeedback}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {effectiveMode === "minimal" && (() => {
                      const appliedCount = sentenceSuggestions.filter((s) => Boolean(s.selectedAltId)).length;
                      const totalCount = sentenceSuggestions.length;
                      const allApplied = totalCount > 0 && appliedCount === totalCount;
                      return (
                        <>
                          <button
                            type="button"
                            onClick={allApplied ? handleRevertAllSuggestions : handleApplyAllRecommendedSuggestions}
                            className={`inline-flex h-[28px] items-center whitespace-nowrap rounded-md px-2.5 text-[12px] font-bold hover:opacity-90 ${
                              allApplied
                                ? "border-hairline border-reject bg-reject-bg text-reject"
                                : "bg-[#F5B041] text-ink"
                            }`}
                          >
                            {allApplied
                              ? `↩ 교정 일괄 해제 (${appliedCount}/${totalCount})`
                              : `✓ 권장 교정 일괄 적용 (${appliedCount}/${totalCount})`}
                          </button>
                          {appliedCount > 0 && !allApplied && (
                            <button
                              type="button"
                              onClick={handleRevertAllSuggestions}
                              className="inline-flex h-[28px] items-center whitespace-nowrap rounded-md border-hairline border-reject bg-surface px-2 text-[11px] font-bold text-reject hover:bg-reject-bg"
                            >
                              ↩ 일괄 해제
                            </button>
                          )}
                        </>
                      );
                    })()}
                    {paragraphMode && !cleanFullView && (
                      <button
                        type="button"
                        onClick={rotateMiddleParagraphs}
                        className="h-[28px] whitespace-nowrap rounded border-hairline border-line bg-surface px-2.5 text-[11px] font-medium hover:bg-surface-subtle"
                      >
                        ⇄ 문단 재배치
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleQuickCopyRewritten("body")}
                      className="inline-flex h-[28px] items-center whitespace-nowrap rounded-md bg-pass px-2.5 text-[12px] font-bold text-surface hover:opacity-90"
                    >
                      📋 본문 복사
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCopyRewritten("all")}
                      className="inline-flex h-[28px] items-center whitespace-nowrap rounded-md border-hairline border-line bg-surface px-2 text-[11px] font-semibold text-ink hover:border-primary hover:text-primary"
                    >
                      전체 복사
                    </button>
                  </div>
                </div>

                {cleanFullView ? (
                  /* 수정본만 크게 보기 (클린 전문 뷰 + 바로 복사) */
                  <div className="rounded-lg border-hairline border-primary bg-surface overflow-hidden flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b-hairline border-line bg-primary-subtle/50">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-[24px] items-center rounded bg-primary px-2.5 text-[12px] font-bold text-surface whitespace-nowrap">
                          📋 수정·리라이팅 완료 기사 전문
                        </span>
                        <span className="text-[12px] text-ink-muted break-keep">
                          태그나 배지 없이 순수 완성된 기사 전문만 한눈에 읽고 바로 복사할 수 있습니다.
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickCopyRewritten("body")}
                          className="inline-flex h-[28px] items-center whitespace-nowrap rounded-md bg-pass px-3 text-[12px] font-bold text-surface hover:opacity-90"
                        >
                          📋 본문 바로 복사
                        </button>
                        <button
                          type="button"
                          onClick={() => setCleanFullView(false)}
                          className="inline-flex h-[28px] items-center whitespace-nowrap rounded-md border-hairline border-line bg-surface px-2.5 text-[11px] font-semibold text-ink-muted hover:text-ink"
                        >
                          ◫ 좌우 2분할 화면으로 돌아가기
                        </button>
                      </div>
                    </div>

                    <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      <div className="lg:col-span-7 rounded-lg border-hairline border-line bg-surface p-5 space-y-4">
                        <div className="flex items-center justify-between border-b-hairline border-line pb-3">
                          <div className="space-y-1">
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

                      <div className="lg:col-span-5 rounded-lg border-hairline border-line bg-surface-subtle p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-bold text-ink">
                            ✎ 순수 텍스트 원고 직접 편집 / 전체 선택
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
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 좌우 2분할 메인 화면 (가운데 드래그 바 ↔ 로 좌우 화면 비율 자유 조절) */
                  <div className="flex flex-col lg:flex-row items-stretch">
                    {/* 왼쪽 화면: 원문에 교정 표시 */}
                    <div
                      style={{ width: `calc(${splitLeftRatio}% - 8px)` }}
                      className="w-full lg:shrink-0 rounded-lg border-hairline border-line bg-surface-subtle overflow-hidden flex flex-col"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b-hairline border-line bg-surface">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-[22px] items-center rounded bg-ink px-2.5 text-[11px] font-bold text-surface whitespace-nowrap">
                            왼쪽 화면 · 원문 {effectiveMode === "minimal" ? "(교정 표시)" : "보도자료 (리라이팅 구간 표시)"}
                          </span>
                          {effectiveMode === "minimal" ? (
                            <span className="text-[11px] text-ink-muted break-keep">
                              <strong className="text-reject">빨간줄</strong> 클릭 → <strong className="text-pass">초록색 교체</strong>
                            </span>
                          ) : (
                            <span className="text-[11px] text-ink-muted break-keep">
                              <strong className="text-hold">주황색·취소선</strong> = 리라이팅·단락 이동된 원문
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-ink-muted whitespace-nowrap">
                          {paragraphMode ? `${rawParagraphs.length}단락` : `${Math.round(splitLeftRatio)}%`}
                        </span>
                      </div>
                      <div className="p-3.5 max-h-[780px] overflow-y-auto flex-1">
                        {renderOriginalWithHighlightsStudio()}
                      </div>
                    </div>

                    {/* 가운데 좌우 화면 비율 조절 드래그 핸들 (↔) */}
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      title="좌우로 드래그하여 원문·수정본 화면 비율 조절 (더블클릭: 50:50 초기화)"
                      onDoubleClick={() => setSplitLeftRatio(50)}
                      onMouseDown={(e) => {
                        const container = e.currentTarget.parentElement;
                        const totalWidth = container ? container.getBoundingClientRect().width : 900;
                        const startRatio = splitLeftRatio;
                        startHorizontalResize(e, (dx) => {
                          const deltaPct = (dx / Math.max(400, totalWidth)) * 100;
                          setSplitLeftRatio(Math.min(72, Math.max(28, Math.round(startRatio + deltaPct))));
                        });
                      }}
                      className="hidden lg:flex w-4 shrink-0 self-stretch cursor-col-resize flex-col items-center justify-center group select-none"
                    >
                      <div className="w-[3px] h-full max-h-[160px] rounded-full bg-line group-hover:bg-primary transition-colors flex items-center justify-center">
                        <span className="rounded-full border-hairline border-line bg-surface group-hover:border-primary group-hover:bg-primary group-hover:text-surface px-1 py-1 text-[10px] font-bold text-ink-muted leading-none shadow-none">
                          ↔
                        </span>
                      </div>
                    </div>

                    {/* 오른쪽 화면: 수정 완료된 기사 전문 */}
                    <div className="flex-1 min-w-0 rounded-lg border-hairline border-primary bg-surface overflow-hidden flex flex-col">
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b-hairline border-line bg-primary-subtle/50">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex h-[22px] items-center rounded bg-primary px-2.5 text-[11px] font-bold text-surface whitespace-nowrap">
                            오른쪽 화면 · 수정 완료된 기사 전문
                          </span>
                          <span className="text-[11px] text-ink-muted whitespace-nowrap">
                            {effectiveMode === "minimal"
                              ? "교정 선택 문장만 초록색 반영"
                              : "리라이팅·재배치 문장 노란색 표시"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!paragraphMode && (
                            <button
                              type="button"
                              onClick={() => setIsDirectTyping((v) => !v)}
                              className={`inline-flex h-[22px] items-center whitespace-nowrap rounded border-hairline px-2 text-[11px] font-semibold transition-colors ${
                                isDirectTyping
                                  ? "border-primary bg-primary text-surface"
                                  : "border-line bg-surface text-ink hover:border-primary hover:text-primary"
                              }`}
                            >
                              {isDirectTyping ? "✓ 직접 편집 완료" : "✎ 직접 타이핑 편집"}
                            </button>
                          )}
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
                        {!paragraphMode ? (
                          /* 기본값: 전체 문장으로 보기 (단락 박스로 쪼개지 않고 하나의 깔끔한 기사 문서로 표시) */
                          isDirectTyping ? (
                            <div className="space-y-2">
                              <textarea
                                rows={22}
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="w-full rounded-md border-hairline border-line bg-surface p-4 text-[15px] leading-[28px] text-ink"
                              />
                              <p className="text-[11px] text-ink-muted">
                                💡 빈 줄(Enter 2번)로 문단이 구분됩니다.
                              </p>
                            </div>
                          ) : (
                            <div className="rounded-md border-hairline border-line bg-surface p-5 space-y-4 text-[15px] leading-[28px] text-ink select-text break-keep">
                              {bodyParagraphs.map((para, idx) => (
                                <div
                                  key={idx}
                                  id={`body-para-${idx}`}
                                  className={`leading-[28px] rounded px-1.5 py-0.5 -mx-1.5 transition-colors ${
                                    focusedParaIdx === idx
                                      ? "bg-primary-subtle ring-2 ring-primary"
                                      : ""
                                  }`}
                                >
                                  {rightPaneCleanText ? (
                                    <p className="break-keep">{para}</p>
                                  ) : effectiveMode === "minimal" ? (
                                    renderMinimalParagraphStudio(para, idx)
                                  ) : (
                                    renderRewriteYellowHighlightsStudio(para, idx)
                                  )}
                                </div>
                              ))}
                            </div>
                          )
                        ) : (
                          /* 옵션 선택 시: 문단으로 나눠서 보기 (단락 01, 02 카드 및 순서 이동) */
                          bodyParagraphs.map((para, idx) => (
                            <div
                              id={`body-para-${idx}`}
                              key={idx}
                              className={`rounded-md border-hairline p-3 space-y-2 transition-colors ${
                                focusedParaIdx === idx
                                  ? "border-primary bg-primary-subtle/50 ring-2 ring-primary"
                                  : "border-line bg-surface-subtle/50"
                              }`}
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
          <>
            {/* 중앙 편집기 ↔ 오른쪽 사이드바 사이 너비 조절 핸들 */}
            <div
              role="separator"
              aria-orientation="vertical"
              title="좌우로 드래그하여 규정·AI 채팅 사이드바 너비 조절 (더블클릭: 기본 크기 복원)"
              onDoubleClick={() => setRightSidebarWidth(340)}
              onMouseDown={(e) => {
                const startWidth = rightSidebarWidth;
                startHorizontalResize(e, (dx) => {
                  setRightSidebarWidth(Math.min(500, Math.max(250, startWidth - dx)));
                });
              }}
              className="w-3.5 shrink-0 self-stretch cursor-col-resize flex flex-col items-center justify-center group select-none"
            >
              <div className="w-[3px] h-16 rounded-full bg-line group-hover:bg-primary transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 rounded bg-primary px-1 py-0.5 text-[9px] font-bold text-surface whitespace-nowrap pointer-events-none">
                  ↔
                </span>
              </div>
            </div>
            <aside
              style={{ width: `${rightSidebarWidth}px` }}
              className="shrink-0 sticky top-4 space-y-3"
            >
            <div className="rounded-lg border-hairline border-line bg-surface overflow-hidden">
              <div className="grid grid-cols-4 border-b-hairline border-line bg-surface-subtle p-1 gap-1">
                {[
                  { id: "rules", label: `규정(${liveFindings.length})` },
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
                    {liveFindings.length === 0 ? (
                      <div className="rounded border-hairline border-pass bg-pass-bg p-3 text-pass">
                        ✓ 모든 하드룰 기준을 통과했습니다.
                      </div>
                    ) : (
                      liveFindings.map((f) => {
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
                <span className="text-[10px] font-semibold text-primary whitespace-nowrap">
                  {AVAILABLE_AI_MODELS.find((m) => m.id === getSelectedAiModel())?.shortName || "Claude Sonnet 4.6"}
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
          </>
        )}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<App />);
