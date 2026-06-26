/** McKinsey-level deck guidance — SCQA, templates, title standards, quick starts. */

export const MCKINSEY_MODELS = [
  {
    id: 'claude-opus-4-8',
    label: 'Claude Opus 4.8',
    badge: 'Recommended',
    descriptionEn: 'Best reasoning and structure — the right choice for McKinsey-level decks.',
    descriptionAr: 'أفضل استدلال وبنية — الخيار المناسب لعروض مستوى McKinsey.',
    default: true,
  },
  {
    id: 'claude-sonnet-4-6',
    label: 'Claude Sonnet 4.6',
    badge: null,
    descriptionEn: 'Faster, still high quality — use when speed matters.',
    descriptionAr: 'أسرع وجودة عالية — عندما يكون السرعة أولوية.',
    default: false,
  },
] as const;

export const SCQA_FORMULA = {
  en: [
    { key: 'S', label: 'Situation', detail: 'Context and audience — portfolio, market, timing.' },
    { key: 'C', label: 'Complication', detail: 'The tension — why leadership must decide now.' },
    { key: 'Q', label: 'Question', detail: 'The central strategic question the deck must answer.' },
    { key: 'A', label: 'Answer', detail: 'Recommended answer upfront — Pyramid Principle.' },
  ],
  ar: [
    { key: 'S', label: 'الوضع', detail: 'السياق والجمهور — المحفظة والسوق والتوقيت.' },
    { key: 'C', label: 'التعقيد', detail: 'التوتر — لماذا يجب اتخاذ القرار الآن.' },
    { key: 'Q', label: 'السؤال', detail: 'السؤال الاستراتيجي المركزي الذي يجيب عليه العرض.' },
    { key: 'A', label: 'الإجابة', detail: 'التوصية في المقدمة — مبدأ الهرم.' },
  ],
};

export const MCKINSEY_BOARD_TEMPLATE = `Create a 10-slide McKinsey board deck for H.E. Mohammad Saeed Al Shehhi, CEO A.R.M. Holding.

Topic: [YOUR TOPIC]
Situation (S): [Context — audience, portfolio (DREC · HUNA · HIVE · Capri LLC · Jebel Ali)]
Complication (C): [The tension — why we must decide now]
Question (Q): [Central strategic question this deck must answer]
Answer (A): [Recommended answer upfront — Pyramid Principle]

Must-have slides:
1. Executive summary (recommendation upfront)
2. Market sizing table
3. Competitive benchmark (insightPanel)
4. Financial model (3 scenarios: conservative, base, upside)
5. Risk register (table with severity scores)
6. 12-month roadmap (timeline with decision gates)
7. Decisions required (what the CEO must approve today)

Formatting rules:
- Two-column layout + insightPanel on every data slide
- Every title = full action sentence (the "so what")
- soWhat callouts + sourceNote on every slide
- Use table field for tabular data; never plain bullets for matrices`;

export const TITLE_EXAMPLES = {
  en: {
    bad: ['Market Overview', 'Key Findings', 'Agenda', 'HIVE Update', 'Financial Summary'],
    good: [
      "HIVE's 91% occupancy across 340 units proves co-living demand — 3 new sites are justified now",
      "Emaar's Q3 2026 entry narrows A.R.M.'s first-mover window to 6 months",
      'Three sites deliver AED 180M uplift with break-even at month 14 under base case',
    ],
  },
  ar: {
    bad: ['نظرة عامة على السوق', 'النتائج الرئيسية', 'جدول الأعمال', 'تحديث HIVE', 'ملخص مالي'],
    good: [
      'إشغال HIVE بنسبة 91% عبر 340 وحدة يثبت طلب الكوليفينغ — 3 مواقع جديدة مبررة الآن',
      'دخول إعمار في Q3 2026 يضيق نافذة A.R.M. الأولى إلى 6 أشهر',
      'ثلاثة مواقع تحقق 180 مليون درهم مع نقطة التعادل في الشهر 14 في السيناريو الأساسي',
    ],
  },
};

export const PORTFOLIO_QUICK_STARTS = [
  {
    id: 'hive-expansion',
    icon: 'building-2',
    labelEn: 'HIVE expansion deck',
    labelAr: 'عرض توسع HIVE',
    descriptionEn: 'McKinsey board pack — 91% occupancy case for 3 new co-living sites',
    descriptionAr: 'حزمة مجلس McKinsey — حالة الإشغال 91% لـ 3 مواقع كوليفينغ',
    prompt: `Create a 10-slide McKinsey board deck for H.E. Mohammad Saeed Al Shehhi, CEO A.R.M. Holding.

Topic: HIVE Co-living Expansion — 3 New Dubai Sites
Situation (S): HIVE operates 340 coliving units at 91% occupancy across Dubai; A.R.M. Holding portfolio strategy prioritises scalable residential formats.
Complication (C): Demand is outpacing supply; competitors (Nester, The Collective) are entering Dubai; delay risks losing prime sites and first-mover advantage.
Question (Q): Should A.R.M. approve 3 new HIVE sites in 2026, and which locations maximise IRR?
Answer (A): Approve 3 sites (JVC, Dubai South, Business Bay) — AED 180M total capex, break-even month 14 base case, 22% IRR upside.

Must-have slides: executive summary · market sizing table · competitive benchmark (insightPanel) · 3-scenario financial model · risk register · 12-month roadmap · CEO decisions required.

Rules: action titles only, two-col + insightPanel on data slides, soWhat + sourceNote every slide.`,
  },
  {
    id: 'huna-launch',
    icon: 'sparkles',
    labelEn: 'HUNA launch deck',
    labelAr: 'عرض إطلاق HUNA',
    descriptionEn: 'Design-led residential launch — We Emerge Stronger positioning',
    descriptionAr: 'إطلاق سكني بتصميم رائد — موضع We Emerge Stronger',
    prompt: `Create a 10-slide McKinsey board deck for H.E. Mohammad Saeed Al Shehhi, CEO A.R.M. Holding.

Topic: HUNA Design-Led Residential Launch — H Residence & We Emerge Stronger
Situation (S): HUNA is A.R.M.'s design-led residential brand; pipeline includes H Residence and cultural partnership "We Emerge Stronger" (open call closes 25 Jul 2026).
Complication (C): Emaar and Meraas are launching design-led waterfront districts; HUNA must differentiate on culture, art, and off-plan velocity before Q3 2026 competitor launches.
Question (Q): What launch sequence and pricing strategy maximises HUNA pre-sales while protecting brand premium?
Answer (A): Phased launch — H Residence Phase 1 at AED 2,400/sqft with art-curator partnership; We Emerge Stronger as brand amplifier; target AED 124M pipeline in 12 months.

Must-have slides: executive summary · market sizing · competitive benchmark vs Emaar/Meraas (insightPanel) · pricing scenarios · risk register · launch roadmap · decisions required.

Rules: action titles, insightPanel on every exhibit slide, sourceNote citing CBRE/JLL/RERA where possible.`,
  },
  {
    id: 'jebel-ali',
    icon: 'map-pin',
    labelEn: 'Jebel Ali masterplan deck',
    labelAr: 'عرض مخطط جبل علي',
    descriptionEn: '5 km² BIG + WSP racecourse masterplan — ground-break 2026',
    descriptionAr: 'مخطط سباق جبل علي 5 كم² BIG + WSP — انطلاق 2026',
    prompt: `Create a 10-slide McKinsey board deck for H.E. Mohammad Saeed Al Shehhi, CEO A.R.M. Holding.

Topic: Jebel Ali Racecourse Masterplan — 5 km² BIG + WSP Development
Situation (S): A.R.M. Holding holds the Jebel Ali Racecourse land parcel; BIG and WSP have delivered a 5 km² masterplan with ground-break targeted 2026, aligned with Dubai D33 and tourism growth.
Complication (C): Capital requirement is significant; phasing errors could delay IRR; regulatory and infrastructure dependencies (RTA, DET, DLD) must align before board commitment.
Question (Q): Which phasing and capital structure unlocks the masterplan while protecting A.R.M. downside?
Answer (A): Approve Phase 1 mixed-use core (hospitality + retail + F&B) — AED 2.1B over 36 months; JV option for Phase 2 residential; decision gates at months 6, 12, 18.

Must-have slides: executive summary · market sizing (tourism + mixed-use) · phasing timeline · 3-scenario financial model · stakeholder map · risk register · decisions required today.

Rules: McKinsey action titles, two-col layout + insightPanel, soWhat on every data slide.`,
  },
] as const;
