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
      intro: 'A simple picture of how ADGM compares with another financial centre (pick DIFC, Singapore, etc.) across six topics that matter to Abu Dhabi.',
      bullets: [
        'Each spoke is a topic: digital assets, rules & regulation, fintech, access to capital, green finance, and talent.',
        'The solid blue line is ADGM; the dashed line is the other centre.',
        'Further from the centre = stronger on that topic (higher score).',
        'The number beside each name (e.g. 85) is the average score out of 100 across all six topics.',
      ],
      note: 'These scores are for leadership discussion and planning — not live stock prices or official league tables.',
    },
    ar: {
      label: 'شرح مخطط البصمة التنافسية',
      title: 'ماذا أرى هنا؟',
      intro: 'صورة مبسطة لمقارنة ADGM مع مركز مالي آخر (دبي، سنغافورة…) في ستة محاور مهمة لأبوظبي.',
      bullets: [
        'كل محور يمثل موضوعاً: الأصول الرقمية، التنظيم، التقنية المالية، رأس المال، التمويل المستدام، والمواهب.',
        'الخط الأزرق الصلب هو ADGM؛ الخط المتقطع هو المركز الآخر.',
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
      intro: 'Where money moved in the last 24 hours — and how much is heading toward Abu Dhabi and ADGM.',
      bullets: [
        'Each row is a region (GCC, US, Singapore, Europe, etc.) with a % change — like “+4.2%” net inflow.',
        'Green “Live 24h” means the view is meant to feel current; data here is illustrative for scenarios.',
        'The chart bands show volume flowing toward ADGM / Abu Dhabi as the destination.',
        'The leader at the bottom (e.g. GCC +4.2%) is the strongest source region in this snapshot.',
      ],
      note: 'Use this to spot geographic rotation in capital — not as a audited financial report.',
    },
    ar: {
      label: 'شرح تدفقات رأس المال',
      title: 'ماذا أرى هنا؟',
      intro: 'أين تحرك رأس المال خلال 24 ساعة — وكم يتجه نحو أبوظبي وADGM.',
      bullets: [
        'كل صف منطقة (الخليج، أمريكا، سنغافورة…) مع نسبة مثل «+4.2٪» صافي تدفق.',
        'شارة «مباشر 24س» تعني عرضاً لحظياً؛ البيانات هنا توضيحية للسيناريوهات.',
        'الأشرطة تبيّن حجم التدفق باتجاه ADGM / أبوظبي.',
        'الأعلى في الأسفل (مثل الخليج +4.2٪) هو أقوى مصدر في هذه اللقطة.',
      ],
      note: 'لرصد تحول رأس المال جغرافياً — وليس كتقرير مالي مدقق.',
    },
  },
  benchmark12: {
    en: {
      label: 'Explain the 12-dimension benchmark',
      title: 'What am I looking at?',
      intro: 'A scorecard that lines ADGM up against four global centres on twelve things policymakers care about.',
      bullets: [
        'Centres compared: ADGM, DIFC, Singapore, Hong Kong, Luxembourg — number under each name is its overall average.',
        'Each row is one dimension (e.g. digital-asset framework, regulatory agility, fintech ecosystem).',
        'Bar length = score out of 100; longer bar = stronger on that dimension.',
        'Small crown = who leads that row; ADGM bars are highlighted in blue.',
      ],
      note: 'Refreshed for daily executive review — illustrative benchmarking, not an external published index.',
    },
    ar: {
      label: 'شرح مقارنة الـ12 بُعداً',
      title: 'ماذا أرى هنا؟',
      intro: 'بطاقة أداء تقارن ADGM مع أربعة مراكز عالمية في اثني عشر محوراً يهم صناع القرار.',
      bullets: [
        'المراكز: ADGM ودبي وسنغافورة وهونغ كونغ ولوكسمبورغ — الرقم تحت كل اسم هو المتوسط العام.',
        'كل صف بُعد واحد (مثل إطار الأصول الرقمية، سرعة التنظيم، منظومة التقنية المالية).',
        'طول الشريطة = درجة من 100؛ الأطول = أقوى في ذلك البُعد.',
        'التاج الصغير = المتصدّر في ذلك الصف؛ أشرطة ADGM باللون الأزرق.',
      ],
      note: 'للمراجعة التنفيذية اليومية — مقارنة توضيحية وليست مؤشراً منشوراً خارجياً.',
    },
  },
  investmentOps: {
    en: {
      label: 'Explain investment opportunity scores',
      title: 'What am I looking at?',
      intro: 'Which sectors Abu Dhabi should prioritise next, scored against the Falcon Economy long-term economic plan.',
      bullets: [
        'Each row is a theme (AI infrastructure, private credit, tokenised assets, sustainable finance).',
        'The ring number (e.g. 92) = fit with Falcon Economy priorities — higher is better alignment, out of 100.',
        '#1, #2… = rank order for leadership attention this cycle.',
        'Short note under the title explains why that theme scores high (e.g. record VC inflow).',
      ],
      note: 'This prioritises strategic focus — it is not buy/sell investment advice.',
    },
    ar: {
      label: 'شرح درجات فرص الاستثمار',
      title: 'ماذا أرى هنا؟',
      intro: 'أي القطاعات يجب أن تُقدَّم لأبوظبي، بدرجات توافق مع خطة الاقتصاد الصقور.',
      bullets: [
        'كل صف قطاع (بنية الذكاء الاصطناعي، ائتمان خاص، أصول مرمزة، تمويل مستدام).',
        'رقم الحلقة (مثل 92) = توافق مع أولويات الاقتصاد الصقور — الأعلى أفضل، من 100.',
        '«#1، #2…» = ترتيب الأولوية لاهتمام القيادة في هذه الدورة.',
        'الملاحظة القصيرة تشرح سبب الدرجة (مثل تدفق قياسي من رأس المال الجريء).',
      ],
      note: 'لترتيب الأولويات الاستراتيجية — وليس توصية شراء أو بيع.',
    },
  },
};
