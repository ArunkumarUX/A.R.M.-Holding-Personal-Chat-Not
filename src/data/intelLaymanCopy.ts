/** Plain-language explanations for Market Intelligence panels */

export type IntelLaymanBlock = {
  title: string;
  intro: string;
  bullets: string[];
  note: string;
  label: string;
};

export const INTEL_LAYMAN: Record<
  'competitiveFootprint' | 'capitalFlows' | 'benchmark12' | 'investmentOps',
  { en: IntelLaymanBlock; ar: IntelLaymanBlock }
> = {
  competitiveFootprint: {
    en: {
      label: 'Explain the competitive footprint chart',
      title: 'What am I looking at?',
      intro: 'A simple picture of how DREC, HUNA or HIVE compares with another Dubai developer (Emaar, Meraas, etc.) across six topics that matter to the portfolio.',
      bullets: [
        'Each spoke is a topic: design, occupancy, sales velocity, hospitality, community living, and compliance.',
        'The solid line is the selected A.R.M. Holding company; the dashed line is the competitor.',
        'Further from the centre = stronger on that topic (higher score).',
        'The number beside each name (e.g. 85) is the average score out of 100 across all six topics.',
      ],
      note: 'These scores are for leadership discussion and planning — not live stock prices or official league tables.',
    },
    ar: {
      label: 'شرح مخطط البصمة التنافسية',
      title: 'ماذا أرى هنا؟',
      intro: 'صورة مبسطة لمقارنة DREC أو HUNA أو HIVE مع مطور دبي آخر (إعمار، ميراس…) في ستة محاور مهمة للمحفظة.',
      bullets: [
        'كل محور يمثل موضوعاً: التصميم، الإشغال، سرعة المبيعات، الضيافة، العيش المجتمعي، والامتثال.',
        'الخط الصلب هو شركة A.R.M. Holding المختارة؛ الخط المتقطع هو المنافس.',
        'كلما ابتعد الخط عن المركز كان الأداء أقوى (درجة أعلى).',
        'الرقم بجانب الاسم (مثل 85) هو متوسط الدرجات من 100 على المحاور الستة.',
      ],
      note: 'الدرجات للنقاش والتخطيط التنفيذي — وليست أسعار سوق لحظية أو ترتيباً رسمياً.',
    },
  },
  capitalFlows: {
    en: {
      label: 'Explain capital flows',
      title: 'What am I looking at?',
      intro: 'Where real estate capital moved in the last 24 hours — and how much is heading toward Dubai and the A.R.M. Holding portfolio.',
      bullets: [
        'Each row is a region (GCC, Europe, South Asia, etc.) with a % change — like "+4.2%" net inflow.',
        'Green "Live 24h" means the view is meant to feel current; data here is illustrative for scenarios.',
        'The chart bands show volume flowing toward Dubai as the destination.',
        'The leader at the bottom (e.g. GCC +4.2%) is the strongest source region in this snapshot.',
      ],
      note: 'Use this to spot geographic rotation in capital — not as an audited financial report.',
    },
    ar: {
      label: 'شرح تدفقات رأس المال',
      title: 'ماذا أرى هنا؟',
      intro: 'أين تحرك رأس المال العقاري خلال 24 ساعة — وكم يتجه نحو دبي ومحفظة A.R.M. Holding.',
      bullets: [
        'كل صف منطقة (الخليج، أوروبا، جنوب آسيا…) مع نسبة مثل «+4.2٪» صافي تدفق.',
        'شارة «مباشر 24س» تعني عرضاً لحظياً؛ البيانات هنا توضيحية للسيناريوهات.',
        'الأشرطة تبيّن حجم التدفق باتجاه دبي.',
        'الأعلى في الأسفل (مثل الخليج +4.2٪) هو أقوى مصدر في هذه اللقطة.',
      ],
      note: 'لرصد تحول رأس المال جغرافياً — وليس كتقرير مالي مدقق.',
    },
  },
  benchmark12: {
    en: {
      label: 'Explain the 12-dimension benchmark',
      title: 'What am I looking at?',
      intro: 'A scorecard that lines DREC, HUNA and HIVE up against Dubai developers on twelve real-estate metrics.',
      bullets: [
        'Companies compared: DREC, HUNA, HIVE, Emaar, Meraas — number under each name is its overall average.',
        'Each row is one dimension (e.g. occupancy, design differentiation, coliving engagement).',
        'Bar length = score out of 100; longer bar = stronger on that dimension.',
        'Small crown = who leads that row; portfolio bars are highlighted.',
      ],
      note: 'Refreshed for daily executive review — illustrative benchmarking, not an external published index.',
    },
    ar: {
      label: 'شرح مقارنة الـ12 بُعداً',
      title: 'ماذا أرى هنا؟',
      intro: 'بطاقة أداء تقارن DREC وHUNA وHIVE مع مطوري دبي في اثني عشر محوراً عقارياً.',
      bullets: [
        'الشركات: DREC وHUNA وHIVE وإعمار وميراس — الرقم تحت كل اسم هو المتوسط العام.',
        'كل صف بُعد واحد (مثل الإشغال، التميّز التصميمي، العيش المجتمعي).',
        'طول الشريطة = درجة من 100؛ الأطول = أقوى في ذلك البُعد.',
        'التاج الصغير = المتصدّر في ذلك الصف.',
      ],
      note: 'للمراجعة التنفيذية اليومية — مقارنة توضيحية وليست مؤشراً منشوراً خارجياً.',
    },
  },
  investmentOps: {
    en: {
      label: 'Explain investment opportunity scores',
      title: 'What am I looking at?',
      intro: 'The top four strategic opportunities for A.R.M. Holding right now, scored against D33 economic agenda fit and portfolio readiness.',
      bullets: [
        'Each row is a real opportunity: HIVE expansion, HUNA waterfront launch, Jebel Ali construction, Capri LLC pipeline.',
        'The ring number (e.g. 92) = fit with D33 + market timing — higher is better, out of 100.',
        '#1, #2… = rank order for leadership attention this cycle.',
        'Short note explains the key driver (e.g. HIVE demand outpacing supply at 91% occupancy).',
      ],
      note: 'This prioritises strategic focus — it is not buy/sell investment advice.',
    },
    ar: {
      label: 'شرح درجات فرص الاستثمار',
      title: 'ماذا أرى هنا؟',
      intro: 'أفضل أربع فرص استراتيجية لـ A.R.M. Holding الآن، بدرجات توافق مع أجندة D33 وجاهزية المحفظة.',
      bullets: [
        'كل صف فرصة حقيقية: توسعة HIVE، إطلاق HUNA، بناء جبل علي، خط Capri LLC.',
        'رقم الحلقة (مثل 92) = توافق مع D33 + توقيت السوق — الأعلى أفضل، من 100.',
        '«#1، #2…» = ترتيب الأولوية لاهتمام القيادة في هذه الدورة.',
        'الملاحظة تشرح المحرك الرئيسي (مثل طلب HIVE يتجاوز العرض بإشغال 91٪).',
      ],
      note: 'لترتيب الأولويات الاستراتيجية — وليست توصية شراء أو بيع.',
    },
  },
};

/** Dashboard signal card quick-info tooltips */
export const SIGNAL_CARD_INFO: Record<
  string,
  { en: IntelLaymanBlock; ar: IntelLaymanBlock }
> = {
  market: {
    en: {
      label: 'About Dubai property market',
      title: 'Dubai Property Market',
      intro: 'Live Dubai real estate transactions, pricing and sentiment — refreshed at 08:00 & 22:00 GST.',
      bullets: ['DLD transaction volumes and deal values', 'Off-plan vs ready market split', 'Sources: Arabian Business, Gulf News, CBRE, Zawya'],
      note: 'Live badge shown when price feeds succeed at refresh.',
    },
    ar: {
      label: 'عن سوق العقارات في دبي',
      title: 'سوق العقارات في دبي',
      intro: 'معاملات دبي العقارية والأسعار والمزاج — تحديث 08:00 و22:00.',
      bullets: ['أحجام معاملات DLD وقيم الصفقات', 'العقارات على الخارطة مقابل الجاهزة', 'المصادر: أرابيان بزنس، الخليج، CBRE'],
      note: 'شارة «مباشر» عند نجاح المصادر.',
    },
  },
  competitor: {
    en: {
      label: 'About developer watch',
      title: 'Developer Watch',
      intro: 'Latest moves by Dubai developers that affect HUNA, DREC and HIVE positioning.',
      bullets: ['Emaar, Meraas, Nakheel, DAMAC, Aldar launches tracked', 'Design-led and waterfront community announcements', 'Strategic implications flagged for HUNA narrative'],
      note: 'Each headline links to its source. Interpretation is leadership\'s.',
    },
    ar: {
      label: 'عن رصد المطورين',
      title: 'رصد المطورين',
      intro: 'أحدث تحركات مطوري دبي المؤثرة على HUNA وDREC وHIVE.',
      bullets: ['رصد إطلاقات إعمار وميراس ونخيل وDAMAC وألدار', 'إعلانات المجتمعات المصممة والواجهة البحرية', 'تداعيات استراتيجية لسردية HUNA'],
      note: 'كل عنوان مرتبط بمصدره.',
    },
  },
  investment: {
    en: {
      label: 'About Jebel Ali & pipeline',
      title: 'Jebel Ali & Pipeline',
      intro: 'ARM Holding\'s flagship development and Capri LLC investment pipeline.',
      bullets: ['Jebel Ali Racecourse: 5km² masterplan with BIG, WSP leading detailed plan', 'Capri LLC: investment arm tracking UAE & international opportunities', 'Ground-break 2026 — construction milestones monitored'],
      note: 'Jebel Ali is ARM Holding\'s largest active development.',
    },
    ar: {
      label: 'عن جبل علي والمشاريع',
      title: 'جبل علي والمشاريع',
      intro: 'مشروع ARM Holding الرائد وخط أنابيب استثمارات Capri LLC.',
      bullets: ['ميدان جبل علي: مخطط 5 كم² مع BIG، WSP تقود التخطيط التفصيلي', 'Capri LLC: الذراع الاستثمارية ترصد فرص الإمارات والأسواق الدولية', 'بدء البناء 2026 — مراحل البناء مُراقبة'],
      note: 'ميدان جبل علي هو أكبر مشروع نشط لـ ARM Holding.',
    },
  },
  performance: {
    en: {
      label: 'About portfolio performance',
      title: 'Portfolio Performance',
      intro: 'Real-time health of DREC, HUNA and HIVE — plus macro context.',
      bullets: ['DREC: 3,200+ units, occupancy, leasing velocity, RERA compliance', 'HUNA: pre-sales pipeline, design-led launches, H Residence', 'HIVE: coliving occupancy (91%), community metrics', 'Macro data: UAE market rates when live feed available'],
      note: 'Internal data + live macro when Yahoo Finance feed succeeds.',
    },
    ar: {
      label: 'عن أداء المحفظة',
      title: 'أداء المحفظة',
      intro: 'صحة DREC وHUNA وHIVE في الوقت الفعلي — مع السياق الكلي.',
      bullets: ['DREC: 3,200+ وحدة، الإشغال، سرعة التأجير، امتثال RERA', 'HUNA: خط مبيعات مسبقة، إطلاقات بتصميم رائد', 'HIVE: إشغال العيش المشترك (91٪)', 'بيانات كلية عند توفر المصدر المباشر'],
      note: 'بيانات داخلية + ماكرو مباشر عند نجاح Yahoo Finance.',
    },
  },
  regulatory: {
    en: {
      label: 'About RERA & compliance',
      title: 'RERA & Compliance',
      intro: 'Dubai regulatory changes directly affecting the DREC, HUNA and HIVE portfolio.',
      bullets: ['RERA Smart Rental Index 2026 — Ejari compliance for 3,200+ DREC units', 'DLD registration rules, escrow updates, off-plan regulations', 'Compliance deadlines and filing status tracked'],
      note: 'Traceable to RERA, DLD or CBUAE issuing notice.',
    },
    ar: {
      label: 'عن RERA والامتثال',
      title: 'RERA والامتثال',
      intro: 'تغييرات تنظيمية دبي تؤثر مباشرة على محفظة DREC وHUNA وHIVE.',
      bullets: ['مؤشر RERA الذكي 2026 — امتثال Ejari لـ 3,200+ وحدة DREC', 'قواعد تسجيل DLD وتحديثات الضمان', 'مواعيد الامتثال وحالة التقديم مُتابعة'],
      note: 'قابل للتتبع لـ RERA أو DLD أو CBUAE.',
    },
  },
  followup: {
    en: {
      label: 'About culture & brand',
      title: 'Culture & Brand',
      intro: 'Art Dubai collaboration, We Emerge Stronger commission, and ARM Holding cultural initiatives.',
      bullets: ['We Emerge Stronger: open call for HUNA Sculpture Park at H Residence (closes 25 Jul 2026)', 'Art Dubai partnership — public sculpture for everyday life', 'CEO speaking slot and cultural narrative decisions tracked'],
      note: 'Live Art Dubai + ARM Holding news when available.',
    },
    ar: {
      label: 'عن الثقافة والعلامة التجارية',
      title: 'الثقافة والعلامة التجارية',
      intro: 'تعاون آرت دبي ومشروع We Emerge Stronger والمبادرات الثقافية.',
      bullets: ['We Emerge Stronger: نداء مفتوح لحديقة النحت HUNA في H Residence (يغلق 25 يوليو 2026)', 'شراكة آرت دبي — نحت عام للحياة اليومية', 'قرار فرصة تحدث الرئيس التنفيذي ومتابعة السردية الثقافية'],
      note: 'أخبار آرت دبي و ARM Holding المباشرة عند توفرها.',
    },
  },
};

export const SOURCE_EXPLANATION_SLIDE = {
  en: `## Data sources — A.R.M. Holding Command Centre\n\n| Source | Used for | Credibility |\n|--------|----------|-------------|\n| CBRE / Knight Frank | Market benchmarks | Industry research |\n| RERA / DLD / DET | Regulatory monitor | Dubai regulators |\n| SharePoint / DMS | Knowledge base | Approved group docs |\n| ERP / HR | Performance | Internal data |`,
  ar: `## مصادر البيانات — مركز قيادة A.R.M. Holding\n\n| المصدر | الاستخدام | الموثوقية |\n|--------|-----------|----------|\n| CBRE / Knight Frank | مقارنة السوق | أبحاث القطاع |\n| RERA / DLD / DET | الرقابة | جهات دبي |\n| SharePoint | قاعدة المعرفة | وثائق معتمدة |`,
};
