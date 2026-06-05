/** ADGM Command Centre — full mock data (from Personal AI reference) */


// ---------- Home signal cards ----------
export const SIGNALS = [
  {
    id: 'market', icon: 'trending-up', tone: 'info', label: 'Market Movements',
    headline: 'GCC capital flows up 4.2% overnight',
    body: 'Gulf sovereign allocations tilting toward private credit and digital assets. UAE 10Y yields eased 6bps.',
    metric: '+4.2%', metricLabel: 'GCC inflow 24h', spark: [38,42,40,46,44,52,49,58,55,62],
    ar: { label: 'تحركات السوق', headline: 'تدفقات رأس المال الخليجي ترتفع 4.2٪ بين عشية وضحاها',
      body: 'تتجه مخصصات الصناديق السيادية الخليجية نحو الائتمان الخاص والأصول الرقمية.', metricLabel: 'تدفق خليجي 24س' }
  },
  {
    id: 'competitor', icon: 'crosshair', tone: 'warn', label: 'Competitor Activity',
    headline: 'DIFC launches tokenised fund regime',
    body: 'DIFC announced a tokenised real-estate fund framework. Recommend ADGM accelerate FSRA digital-fund guidance.',
    metric: '3', metricLabel: 'moves to watch', spark: [50,48,52,49,55,53,60,58,64,67],
    ar: { label: 'نشاط المنافسين', headline: 'مركز دبي المالي يطلق نظام الصناديق المرمزة',
      body: 'أعلن مركز دبي المالي عن إطار لصناديق العقارات المرمزة. يُوصى بتسريع إرشادات FSRA.', metricLabel: 'تحركات للمتابعة' }
  },
  {
    id: 'investment', icon: 'sparkles', tone: 'good', label: 'Investment Opportunities',
    headline: 'AI infrastructure flagged — Falcon Economy fit 92',
    body: 'Sovereign-grade data-centre & compute capacity attracting record VC. Strong alignment with Falcon Economy targets.',
    metric: '92', metricLabel: 'Falcon Economy alignment', spark: [30,34,40,38,46,52,60,66,74,82],
    ar: { label: 'فرص الاستثمار', headline: 'البنية التحتية للذكاء الاصطناعي — توافق الاقتصاد الصقور يبلغ 92',
      body: 'تجذب سعة مراكز البيانات والحوسبة السيادية تمويلاً قياسياً من رأس المال الجريء.', metricLabel: 'توافق الاقتصاد الصقور' }
  },
  {
    id: 'performance', icon: 'activity', tone: 'risk', label: 'Internal Performance Signals',
    headline: 'HR flagging attrition risk — 15.8%',
    body: 'Attrition crossed the 15% threshold; 2 critical roles unfilled beyond 8 weeks. Escalated for CSO review.',
    metric: '15.8%', metricLabel: 'attrition rate', spark: [10,11,12,12,13,14,14,15,15,16], deptLink: 'hr',
    ar: { label: 'مؤشرات الأداء الداخلي', headline: 'الموارد البشرية تشير إلى مخاطر دوران الموظفين — 15.8٪',
      body: 'تجاوز معدل الدوران عتبة 15٪؛ وظيفتان حرجتان شاغرتان لأكثر من 8 أسابيع.', metricLabel: 'معدل الدوران' }
  },
  {
    id: 'regulatory', icon: 'gavel', tone: 'warn', label: 'Regulatory Shifts',
    headline: 'FSRA refreshes virtual-asset custody guidance',
    body: '3 high-relevance regulatory moves overnight across FSRA, MAS and FATF. AML filing due in 11 days.',
    metric: '3', metricLabel: 'high-relevance', spark: [2,3,2,4,3,5,4,6,5,7], link: 'regulatory',
    ar: { label: '\u062a\u062d\u0648\u0644\u0627\u062a \u062a\u0646\u0638\u064a\u0645\u064a\u0629', headline: 'FSRA \u062a\u062d\u062f\u0651\u062b \u0625\u0631\u0634\u0627\u062f\u0627\u062a \u062d\u0641\u0638 \u0627\u0644\u0623\u0635\u0648\u0644 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629',
      body: '3 \u062a\u062d\u0631\u0643\u0627\u062a \u062a\u0646\u0638\u064a\u0645\u064a\u0629 \u0639\u0627\u0644\u064a\u0629 \u0627\u0644\u0635\u0644\u0629 \u0639\u0628\u0631 FSRA \u0648MAS \u0648FATF.', metricLabel: '\u0639\u0627\u0644\u064a\u0629 \u0627\u0644\u0635\u0644\u0629' }
  },
  {
    id: 'followup', icon: 'list-checks', tone: 'info', label: 'Follow-Up Actions',
    headline: '4 actions awaiting your decision',
    body: 'MAS delegation brief, FSRA digital-fund sign-off, Q2 ministerial note, and 1 at-risk Sales deal need attention.',
    metric: '4', metricLabel: 'open items', spark: [6,5,5,4,5,4,3,4,4,4],
    ar: { label: 'إجراءات المتابعة', headline: '4 إجراءات بانتظار قرارك',
      body: 'إحاطة وفد MAS، اعتماد صناديق FSRA الرقمية، مذكرة الربع الثاني، وصفقة مبيعات معرّضة للخطر.', metricLabel: 'بنود مفتوحة' }
  },
];

// ---------- Departments ----------
export const DEPARTMENTS = [
  {
    id: 'hr', n: '01', name: 'Human Resources', nameAr: 'الموارد البشرية', icon: 'users', rag: 'risk', trend: 'down',
    summary: 'Attrition above threshold; two critical roles unfilled. Engagement holding but hiring velocity slipping.',
    kpis: [
      { k: 'Headcount vs plan', v: '412 / 430', pct: 96, tone: 'warn' },
      { k: 'Attrition rate', v: '15.8%', pct: 79, tone: 'risk', note: '↑ from 12.1%' },
      { k: 'Time-to-fill', v: '74 days', pct: 62, tone: 'warn' },
      { k: 'Training completion', v: '88%', pct: 88, tone: 'good' },
      { k: 'Engagement score', v: '7.4 / 10', pct: 74, tone: 'good' },
    ],
    achievements: ['Graduate Emiratisation cohort up 18% YoY', 'Engagement steady at 7.4 despite restructuring', 'Leadership academy launched on schedule'],
    risks: [ {sev:'High', t:'Attrition crossed 15% — concentrated in FSRA technical teams'}, {sev:'High', t:'Head of Digital Supervision unfilled 9 weeks'}, {sev:'Medium', t:'Time-to-fill drifting above 70-day target'} ],
    blockers: ['Compensation bands for specialist regulatory roles below market', 'Visa processing delays on 2 senior international hires'],
    actions: ['Approve off-cycle comp adjustment for FSRA technical band', 'Escalate 2 critical vacancies to executive search', 'Review retention plan for digital supervision team'],
    alert: 'Attrition >15% AND critical role unfilled >8 weeks',
    series: [12.1,12.4,12.9,13.3,13.8,14.2,14.9,15.8],
  },
  {
    id: 'sales', n: '02', name: 'Sales', nameAr: 'المبيعات', icon: 'target', rag: 'warn', trend: 'up',
    summary: 'Revenue tracking to target overall; pipeline healthy but one strategic deal slipping and needs CSO unblock.',
    kpis: [
      { k: 'Revenue vs target', v: '102%', pct: 102, tone: 'good' },
      { k: 'Pipeline value', v: 'AED 1.24B', pct: 84, tone: 'good' },
      { k: 'Win rate', v: '31%', pct: 62, tone: 'warn' },
      { k: 'Avg deal size', v: 'AED 6.8M', pct: 70, tone: 'good' },
      { k: 'New acquisitions', v: '47 QTD', pct: 78, tone: 'good' },
    ],
    achievements: ['Closed 3 asset-management licences worth AED 21M', 'New-client acquisitions +12% vs prior quarter', 'Fintech segment win-rate up to 38%'],
    risks: [ {sev:'High', t:'AED 90M sovereign-fund mandate at risk — stalled 3 weeks'}, {sev:'Medium', t:'Win rate softening in traditional banking segment'} ],
    blockers: ['Sovereign-fund deal awaiting FSRA fast-track confirmation', 'Legal review backlog on 2 enterprise contracts'],
    actions: ['Personally engage sovereign-fund sponsor this week', 'Clear legal review bottleneck with Legal & Compliance', 'Approve incentive for fintech acquisition push'],
    alert: 'Revenue deviation >10% vs forecast',
    series: [88,92,95,97,99,100,101,102],
  },
  {
    id: 'ops', n: '03', name: 'Operations', nameAr: 'العمليات', icon: 'settings-2', rag: 'warn', trend: 'flat',
    summary: 'SLAs broadly met; one licensing process bottleneck driving longer turnaround on incorporations.',
    kpis: [
      { k: 'Service SLAs met', v: '94.2%', pct: 94, tone: 'good' },
      { k: 'Process efficiency', v: '81%', pct: 81, tone: 'warn' },
      { k: 'Cost vs budget', v: '98%', pct: 98, tone: 'good' },
      { k: 'Incident count (MTD)', v: '3', pct: 70, tone: 'warn' },
      { k: 'Avg turnaround', v: '5.6 days', pct: 66, tone: 'warn' },
    ],
    achievements: ['Incorporation volume +22% handled within SLA', 'Zero critical operational incidents this quarter', 'Digital onboarding cut document errors 40%'],
    risks: [ {sev:'Medium', t:'Licensing review queue creating 5.6-day turnaround'}, {sev:'Low', t:'Resource constraint in registry verification team'} ],
    blockers: ['Manual verification step in licensing not yet automated', 'Peak-season volume exceeding registry team capacity'],
    actions: ['Approve automation of licensing verification step', 'Authorise temporary registry resourcing for peak'],
    alert: 'SLA breach or operational incident flagged',
    series: [93,94,94,95,94,94,94,94],
  },
  {
    id: 'it', n: '04', name: 'Technology & IT', nameAr: 'التقنية', icon: 'cpu', rag: 'good', trend: 'up',
    summary: 'Strong delivery posture; uptime excellent and AI adoption climbing. One project amber on integration dependency.',
    kpis: [
      { k: 'Project delivery (RAG)', v: '8G / 2A / 0R', pct: 80, tone: 'good' },
      { k: 'Cyber posture', v: 'Strong', pct: 90, tone: 'good' },
      { k: 'System uptime', v: '99.96%', pct: 99, tone: 'good' },
      { k: 'AI adoption', v: '68%', pct: 68, tone: 'warn' },
      { k: 'Digital initiatives', v: '11 active', pct: 85, tone: 'good' },
    ],
    achievements: ['eCourts platform upgrade shipped ahead of plan', 'Zero security incidents; posture rated Strong', 'AI adoption across teams reached 68%'],
    risks: [ {sev:'Medium', t:'CRM integration project amber on vendor dependency'}, {sev:'Low', t:'Legacy reporting tool end-of-life in Q3'} ],
    blockers: ['Vendor API delivery slipping on CRM integration'],
    actions: ['Review CRM vendor escalation path', 'Approve legacy reporting migration budget'],
    alert: 'Security incident or critical project delay >2 weeks',
    series: [72,74,76,78,80,82,84,86],
  },
  {
    id: 'finance', n: '05', name: 'Finance', nameAr: 'المالية', icon: 'landmark', rag: 'good', trend: 'up',
    summary: 'Budget on track with healthy variance; forecast accuracy strong. One unplanned commitment to note.',
    kpis: [
      { k: 'Budget performance', v: '97%', pct: 97, tone: 'good' },
      { k: 'Revenue vs forecast', v: '+3.1%', pct: 88, tone: 'good' },
      { k: 'Cash flow', v: 'Healthy', pct: 92, tone: 'good' },
      { k: 'Forecast accuracy', v: '96%', pct: 96, tone: 'good' },
      { k: 'Variance', v: '2.9%', pct: 90, tone: 'good' },
    ],
    achievements: ['Revenue 3.1% ahead of forecast', 'Forecast accuracy held at 96%', 'Capital allocation review delivered on time'],
    risks: [ {sev:'Low', t:'Unplanned AED 4M technology commitment pending approval'} ],
    blockers: [],
    actions: ['Note unplanned technology capital commitment'],
    alert: 'Budget variance >10% or unplanned capital commitment',
    series: [94,95,95,96,96,96,97,97],
  },
  {
    id: 'strategy', n: '06', name: 'Strategy', nameAr: 'الاستراتيجية', icon: 'compass', rag: 'good', trend: 'up',
    summary: 'Strategic initiatives largely on track; Falcon Economy alignment strong. One milestone at risk of slipping.',
    kpis: [
      { k: 'Initiative progress', v: '78%', pct: 78, tone: 'good' },
      { k: 'Milestones complete', v: '14 / 18', pct: 78, tone: 'good' },
      { k: 'Falcon Economy alignment', v: '88', pct: 88, tone: 'good' },
      { k: 'Competitive position', v: 'Top 3', pct: 85, tone: 'good' },
    ],
    achievements: ['Falcon Economy roadmap milestones 78% complete', 'Falcon Economy alignment score reached 88', 'Two cross-border MoUs advanced'],
    risks: [ {sev:'Medium', t:'Digital-assets policy milestone at risk of 4-week slip'} ],
    blockers: ['Awaiting inter-authority input on digital-assets framework'],
    actions: ['Convene inter-authority working session on digital-assets policy'],
    alert: 'KPI deviation >15% or strategic milestone delay >4 weeks',
    series: [70,72,73,74,75,76,77,78],
  },
  {
    id: 'procurement', n: '07', name: 'Procurement', nameAr: 'المشتريات', icon: 'package', rag: 'warn', trend: 'flat',
    summary: 'Cost savings delivered; however a critical contract renewal is inside 30 days with no action logged.',
    kpis: [
      { k: 'Cycle time', v: '21 days', pct: 74, tone: 'warn' },
      { k: 'Vendor performance', v: '4.1 / 5', pct: 82, tone: 'good' },
      { k: 'Renewal pipeline', v: '6 active', pct: 70, tone: 'warn' },
      { k: 'Cost savings', v: 'AED 7.2M', pct: 88, tone: 'good' },
    ],
    achievements: ['Delivered AED 7.2M in cost savings YTD', 'Vendor performance scores up to 4.1/5'],
    risks: [ {sev:'High', t:'Critical data-centre contract expires in 24 days — no renewal logged'}, {sev:'Medium', t:'Two vendor SLAs trending below threshold'} ],
    blockers: ['Data-centre renewal awaiting Finance sign-off'],
    actions: ['Urgently approve data-centre contract renewal (<30 days)', 'Review underperforming vendor SLAs'],
    alert: 'Critical contract expiry <30 days or major supplier risk',
    series: [22,22,21,21,21,21,21,21],
  },
  {
    id: 'legal', n: '08', name: 'Legal & Compliance', nameAr: 'القانونية والامتثال', icon: 'scale', rag: 'warn', trend: 'down',
    summary: 'Filings current; however an FSRA compliance deadline is approaching and a regulatory matter has escalated.',
    kpis: [
      { k: 'Regulatory pipeline', v: '9 matters', pct: 72, tone: 'warn' },
      { k: 'Filing status', v: '96% current', pct: 96, tone: 'good' },
      { k: 'Open legal matters', v: '12', pct: 64, tone: 'warn' },
      { k: 'Policy backlog', v: '4 updates', pct: 60, tone: 'warn' },
    ],
    achievements: ['96% of regulatory filings current', 'Closed 5 legacy legal matters this quarter'],
    risks: [ {sev:'High', t:'FSRA AML enhancement filing due in 11 days'}, {sev:'Medium', t:'Cross-border matter escalated to senior counsel'} ],
    blockers: ['Awaiting policy input from Strategy on digital-assets clauses'],
    actions: ['Approve resourcing to clear FSRA AML filing on time', 'Review escalated cross-border regulatory matter'],
    alert: 'Compliance deadline missed or regulatory matter escalated',
    series: [9,9,10,10,11,11,12,12],
  },
  {
    id: 'marketing', n: '09', name: 'Marketing & Comms', nameAr: 'التسويق والاتصال', icon: 'megaphone', rag: 'good', trend: 'up',
    summary: 'Strong campaign ROI and positive sentiment post-ADFW. One flagship event needs CSO speaking slot decision.',
    kpis: [
      { k: 'Campaign ROI', v: '3.4x', pct: 85, tone: 'good' },
      { k: 'Media coverage', v: '+38%', pct: 88, tone: 'good' },
      { k: 'Brand sentiment', v: '+72', pct: 86, tone: 'good' },
      { k: 'Digital engagement', v: '+19%', pct: 78, tone: 'good' },
    ],
    achievements: ['ADFW coverage up 38% YoY with +72 sentiment', 'Campaign ROI reached 3.4x', 'Digital engagement up 19%'],
    risks: [ {sev:'Low', t:'Flagship roundtable needs CSO speaking confirmation'} ],
    blockers: ['Awaiting CSO availability for keynote roundtable'],
    actions: ['Confirm CSO speaking slot for flagship roundtable'],
    alert: 'Negative media spike or major event requiring CSO involvement',
    series: [2.8,2.9,3.0,3.1,3.2,3.3,3.3,3.4],
  },
];

// ---------- Five agents ----------
export const AGENTS = [
  { id: 'cos', n:'01', name: 'Chief of Staff AI', icon: 'calendar-clock', color:'var(--teal-300)',
    fn: 'Operational cadence of the executive office',
    caps: ['Auto pre-meeting briefs', 'Post-meeting action extraction', 'Action register tracking', 'Board pack assembly', 'Morning briefing orchestration'],
    integ: 'Microsoft Graph · CRM register · SharePoint' },
  { id: 'strategy', n:'02', name: 'Strategy AI', icon: 'compass', color:'var(--gold-500)',
    fn: 'Always-available strategy & intelligence team',
    caps: ['12-dimension competitor benchmarking', 'Live market intelligence', 'Investment opportunity scoring', 'Falcon Economy alignment', 'Scenario planning'],
    integ: 'Bloomberg / Refinitiv · regulatory feeds · KB' },
  { id: 'policy', n:'03', name: 'Policy AI', icon: 'gavel', color:'var(--status-info)',
    fn: 'Regulatory intelligence & policy drafting',
    caps: ['Live monitoring of 12 jurisdictions', 'Policy drafting', 'International benchmarking', 'Impact assessment'],
    integ: 'Regulatory RSS + APIs · FSRA SharePoint' },
  { id: 'relationship', n:'04', name: 'Relationship AI', icon: 'network', color:'var(--sun-2)',
    fn: 'Institutional CRM memory',
    caps: ['Full interaction history', 'Living stakeholder profiles', 'Proactive follow-up alerts', 'Partnership tracking', 'Network mapping'],
    integ: 'CRM bidirectional sync · LinkedIn · Graph' },
  { id: 'comms', n:'05', name: 'Communications AI', icon: 'languages', color:'var(--status-good)',
    fn: 'All executive communications — EN & AR',
    caps: ['Speech drafting', 'Executive writing', 'Correspondence management', 'Bilingual ministerial notes', 'CSO voice learning'],
    integ: 'Microsoft Graph email · KB · style loop' },
];

// ---------- Competitor benchmarking ----------
export const CENTRES = ['ADGM','DIFC','Singapore','Hong Kong','Luxembourg'];

/**
 * 12-Dimension Benchmark — ADGM vs global financial centres
 * Sources per dimension (cross-referenced):
 *   GFCI 37  = Z/Yen Global Financial Centres Index 37, March 2024
 *   WB       = World Bank Business Ready Index 2024
 *   ADGM     = ADGM Annual Report 2023 / published competitive positioning
 *   IMF      = IMF Article IV UAE Consultation 2024
 *   PwC      = PwC Global Crypto Regulation Report 2024
 *   FATF     = FATF Mutual Evaluation Report UAE 2024
 *   IOSCO    = IOSCO Transition Finance Final Report 2024
 * Scale 0–100. Validate against internal benchmark report before formal external use.
 */
export const BENCH_DIMS: { d: string; src: string; v: number[] }[] = [
  // Regulatory & Legal
  { d: 'Regulatory framework & legal certainty',
    src: 'GFCI 37 · ADGM Annual Report 2023',
    v: [90, 84, 88, 80, 86] },
  { d: 'Digital assets & tokenisation framework',
    src: 'PwC Crypto Regulation Report 2024 · FSRA framework',
    v: [88, 82, 90, 85, 68] },
  { d: 'Governance & compliance maturity',
    src: 'FATF Mutual Evaluation UAE 2024 · GFCI 37',
    v: [90, 86, 92, 84, 90] },
  // Market & Capital
  { d: 'Capital access & market depth',
    src: 'GFCI 37 · IMF Article IV UAE 2024',
    v: [88, 85, 92, 94, 82] },
  { d: 'Investor ecosystem & institutional base',
    src: 'GFCI 37 · ADGM Annual Report 2023',
    v: [84, 88, 92, 90, 84] },
  { d: 'Market access & connectivity',
    src: 'GFCI 37 · WB Business Ready Index 2024',
    v: [86, 88, 93, 94, 82] },
  // Innovation & Ecosystem
  { d: 'Fintech ecosystem & innovation',
    src: 'GFCI 37 FinTech sub-ranking',
    v: [80, 84, 94, 82, 70] },
  { d: 'Ease of setup & licensing speed',
    src: 'WB Business Ready Index 2024 · ADGM published data',
    v: [89, 84, 90, 82, 74] },
  // Strategic Position
  { d: 'Strategic ambition & sovereign backing',
    src: 'Falcon Economy Strategy 2025–2045 · ADGM positioning',
    v: [92, 88, 86, 70, 78] },
  { d: 'Global perception & brand ranking',
    src: 'GFCI 37 overall rank (#25 · #18 · #3 · #4 · #17)',
    v: [74, 82, 94, 88, 82] },
  // Sustainability & Talent
  { d: 'Sustainable & transition finance',
    src: 'IOSCO Final Report 2024 · ADGM Sustainable Finance Agenda',
    v: [82, 76, 84, 72, 91] },
  { d: 'Talent pipeline & workforce depth',
    src: 'GFCI 37 Human Capital sub-score · IMF Article IV 2024',
    v: [78, 82, 93, 85, 80] },
];

// ---------- Briefing formats ----------
export const BRIEF_FORMATS = [
  { id:'premeeting', icon:'calendar-check', name:'Pre-meeting brief', desc:'Auto-triggered from live calendar', time:'< 30s' },
  { id:'boardpack', icon:'clipboard-list', name:'Board pack summary', desc:'Condense board materials to decisions', time:'< 60s' },
  { id:'stakeholder', icon:'id-card', name:'Stakeholder profile', desc:'Living profile from CRM + enrichment', time:'< 30s' },
  { id:'policy', icon:'scale', name:'Policy impact analysis', desc:'Assess regulatory change impact', time:'< 90s' },
  { id:'opportunity', icon:'sparkles', name:'Strategic opportunity brief', desc:'Scored against Abu Dhabi economic priorities', time:'< 60s' },
  { id:'ministerial', icon:'languages', name:'Ministerial note (AR/EN)', desc:'Bilingual executive correspondence', time:'< 45s' },
];

// ---------- 8-week plan ----------
export const PLAN = [
  { w:'01', focus:'Demo', deliver:'Personalised prototype · 5 demo deliverables · HR + Sales + Ops loaded · Arabic demonstrated', gate:'CSO approves full build' },
  { w:'02', focus:'Infrastructure', deliver:'Azure UAE North · Kubernetes · Weaviate + Neo4j · Azure AD SSO · RBAC · audit logging', gate:'ADGM IT security sign-off' },
  { w:'03', focus:'Knowledge System', deliver:'Ingestion pipeline · 50+ docs seeded · Knowledge Graph · SharePoint auto-sync', gate:'50 test queries pass' },
  { w:'04', focus:'Five Agents', deliver:'All 5 LangGraph agents · orchestration graph · all modules on seeded data', gate:'Agents pass CSO scenarios' },
  { w:'05', focus:'Market & Docs', deliver:'Bloomberg/Refinitiv · FSRA sync · news feeds · 08:00 & 22:00 GST refresh', gate:'Briefing quality approved' },
  { w:'06', focus:'Relationship & Comms', deliver:'Graph calendar + email · CRM history · Arabic RTL complete', gate:'Arabic QA sign-off' },
  { w:'07', focus:'9 Depts + Regulatory', deliver:'ERP/HR ETL for all 9 departments · regulatory feeds active', gate:'Dashboards reviewed by ADGM' },
  { w:'08', focus:'Go-Live', deliver:'Integration testing · security scan · CSO onboarding · go-live', gate:'CSO sign-off on system' },
];

// ---------- Integrations ----------
export const INTEGRATIONS = [
  { name:'Market Data', sys:'Bloomberg / Refinitiv Eikon', wk:'Week 5', icon:'trending-up' },
  { name:'Document Repository', sys:'SharePoint / DMS (Graph)', wk:'Week 5', icon:'folder-sync' },
  { name:'Calendar & Email', sys:'Microsoft Exchange (Graph)', wk:'Week 6', icon:'mail' },
  { name:'CRM & Relationships', sys:'Salesforce or equivalent', wk:'Week 6', icon:'contact' },
  { name:'Regulatory Intel', sys:'FCA · SEC · MAS · BIS · IOSCO', wk:'Week 7', icon:'gavel' },
  { name:'Performance & HR', sys:'SAP / Oracle ERP + HR ETL', wk:'Week 7', icon:'database' },
  { name:'ADGM FSRA Portal', sys:'SharePoint + internal API', wk:'Week 5', icon:'building-2' },
  { name:'News & Intelligence', sys:'Reuters · Gulf News · regional', wk:'Week 5', icon:'newspaper' },
];

export const TICKER = [
  { k: 'ADX General', v: '9,742.6', c: +0.84 },
  { k: 'DFM', v: '5,318.2', c: +0.41 },
  { k: 'Brent', v: '$82.14', c: -0.62 },
  { k: 'Gold', v: '$2,418', c: +0.93 },
  { k: 'USD/AED', v: '3.6725', c: 0.0 },
  { k: 'BTC', v: '$71,240', c: +2.18 },
  { k: 'MSCI EM', v: '1,094.7', c: +0.57 },
  { k: 'UAE 10Y', v: '4.18%', c: -0.06 },
  { k: 'Sukuk Idx', v: '142.8', c: +0.22 },
];

// ---------- Organisational momentum (index) ----------
export const MOMENTUM = { data: [71, 73, 72, 75, 77, 76, 79, 81, 80, 83, 85, 87], labels: ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'] };

// ---------- Capital flows toward Abu Dhabi ----------
export const FLOWS = [
  { k: 'GCC', kAr: 'الخليج', flow: 92, v: '+4.2%' },
  { k: 'United States', kAr: 'أمريكا', flow: 70, v: '+2.8%' },
  { k: 'Singapore', kAr: 'سنغافورة', flow: 64, v: '+3.1%' },
  { k: 'Europe', kAr: 'أوروبا', flow: 52, v: '+1.6%' },
  { k: 'South Asia', kAr: 'جنوب آسيا', flow: 58, v: '+2.4%' },
];

// ---------- Regulatory change monitor ----------
export const REGULATORY = [
  { body: 'FSRA', region: 'ADGM · Abu Dhabi', topic: 'Digital assets', date: 'Today', title: 'FSRA refreshes virtual-asset custody guidance', rel: 'High', impact: 'Directly strengthens ADGM\u2019s tokenisation proposition \u2014 foreground with institutional issuers this quarter.', titleAr: 'FSRA تُحدّث إرشادات حفظ الأصول الافتراضية', impactAr: 'يعزّز مباشرةً عرض الترميز لدى سوق أبوظبي العالمي.' },
  { body: 'MAS', region: 'Singapore', topic: 'Funds', date: '2 days ago', title: 'MAS expands tokenised-fund pilot to retail tranches', rel: 'High', impact: 'Competitive pressure \u2014 ADGM should accelerate FSRA digital-fund guidance to hold its lead.', titleAr: 'MAS توسّع تجربة الصناديق المرمزة لتشمل شرائح التجزئة', impactAr: 'ضغط تنافسي \u2014 يُوصى بتسريع إرشادات الصناديق الرقمية.' },
  { body: 'FATF', region: 'Global', topic: 'AML', date: '4 days ago', title: 'Updated guidance on virtual-asset travel rule', rel: 'High', impact: 'Aligns with ADGM\u2019s AML enhancement \u2014 Legal & Compliance FSRA filing due in 11 days.', titleAr: 'إرشادات محدّثة لقاعدة تتبّع الأصول الافتراضية', impactAr: 'يتوافق مع تعزيز مكافحة غسل الأموال \u2014 إيداع خلال 11 يوماً.' },
  { body: 'FCA', region: 'United Kingdom', topic: 'Capital markets', date: '5 days ago', title: 'Consultation on private-fund disclosure regime', rel: 'Medium', impact: 'Monitor for benchmarking \u2014 informs ADGM private-markets positioning.', titleAr: 'استشارة حول نظام إفصاح الصناديق الخاصة', impactAr: 'يُراقب لأغراض المقارنة المرجعية.' },
  { body: 'HKMA', region: 'Hong Kong', topic: 'Fintech', date: '1 week ago', title: 'Stablecoin issuer licensing framework finalised', rel: 'Medium', impact: 'Competitor capability gap to assess against ADGM digital-asset framework.', titleAr: 'إقرار إطار ترخيص مُصدري العملات المستقرة', impactAr: 'فجوة قدرات منافِسة يجب تقييمها.' },
  { body: 'IOSCO', region: 'Global', topic: 'Sustainable finance', date: '1 week ago', title: 'Final report on transition-finance disclosures', rel: 'Medium', impact: 'Supports ADGM sustainable-finance differentiation thesis.', titleAr: 'تقرير نهائي حول إفصاحات تمويل التحول', impactAr: 'يدعم تميّز سوق أبوظبي في التمويل المستدام.' },
  { body: 'BIS', region: 'Global', topic: 'Banking', date: '2 weeks ago', title: 'Basel guidance on crypto-asset exposures', rel: 'Low', impact: 'Background context for prudential framework alignment.', titleAr: 'إرشادات بازل حول التعرّض للأصول المشفّرة', impactAr: 'سياق خلفي لمواءمة الإطار التحوطي.' },
  { body: 'CSSF', region: 'Luxembourg', topic: 'Funds', date: '2 weeks ago', title: 'ELTIF 2.0 marketing rules clarified', rel: 'Low', impact: 'Competitor fund-domicile development \u2014 low immediate relevance.', titleAr: 'توضيح قواعد تسويق ELTIF 2.0', impactAr: 'تطوّر لدى منافِس \u2014 صلة فورية منخفضة.' },
];

// ---------- Approved knowledge base ----------
export const KB_CATS = [
  { id: 'strategy', label: 'Strategy', labelAr: 'الاستراتيجية', color: 'var(--teal-300)' },
  { id: 'performance', label: 'Performance', labelAr: 'الأداء', color: 'var(--status-good)' },
  { id: 'market', label: 'Market Intelligence', labelAr: 'استخبارات السوق', color: 'var(--status-info)' },
  { id: 'board', label: 'Board Pack', labelAr: 'حزمة المجلس', color: 'var(--gold-500)' },
  { id: 'policy', label: 'Policy / Regulatory', labelAr: 'السياسات والتنظيم', color: 'var(--sun-2)' },
  { id: 'general', label: 'General', labelAr: 'عام', color: 'var(--ink-3)' },
];
export const KB_DOCS = [
  { t: 'ADGM Five-Year Strategy 2025\u20132030', cat: 'strategy', date: 'May 2026', pages: 64, by: 'SharePoint sync' },
  { t: 'Q1 2026 Board Pack \u2014 Full', cat: 'board', date: 'Apr 2026', pages: 112, by: 'Uploaded' },
  { t: 'FSRA Digital Assets Regulatory Framework', cat: 'policy', date: 'Jun 2025', pages: 88, by: 'FSRA portal' },
  { t: 'Global Financial Centres Benchmark Report', cat: 'market', date: 'May 2026', pages: 41, by: 'Bloomberg' },
  { t: 'HR Quarterly Performance Review', cat: 'performance', date: 'Apr 2026', pages: 23, by: 'ERP/HR ETL' },
  { t: 'Falcon Economy Strategy 2025–2045 (English)', cat: 'strategy', date: 'Sep 2024', pages: 120, by: 'ADDED · Approved KB' },
  { t: 'Falcon Strategy (Executive Summary)', cat: 'strategy', date: 'May 2024', pages: 24, by: 'ADDED · Approved KB' },
  { t: 'ADGM Law No. 1547 — April 2026', cat: 'policy', date: 'Apr 2026', pages: 49, by: 'Archive · Approved KB' },
  { t: 'ADGM Law No. 1547 — Version 2025', cat: 'policy', date: 'Jan 2025', pages: 28, by: 'Archive · Approved KB' },
  { t: 'ADGM Law No. 1547 — Version 01.11.0319', cat: 'policy', date: 'Nov 2019', pages: 20, by: 'Archive · Approved KB' },
  { t: 'ADGM Law No. 1547 — Version 3.14', cat: 'policy', date: 'Jan 2024', pages: 3, by: 'Archive · Approved KB' },
  { t: 'Application of English Law Regulations — Amendment 1 (2022)', cat: 'policy', date: 'Jan 2022', pages: 1, by: 'Archive · Approved KB' },
  { t: 'UAE Cabinet Resolution No. 4 of 2013', cat: 'policy', date: 'Jan 2013', pages: 1, by: 'Archive · Approved KB' },
  { t: 'Falcon Economy Strategic Alignment Tracker', cat: 'strategy', date: 'May 2026', pages: 18, by: 'Uploaded' },
  { t: 'ADFW 2025 Outcomes & MoU Register', cat: 'general', date: 'Dec 2025', pages: 36, by: 'SharePoint sync' },
  { t: 'Sales Pipeline & Mandate Status', cat: 'performance', date: 'Apr 2026', pages: 14, by: 'CRM sync' },
  { t: 'Sustainable Finance Position Paper', cat: 'market', date: 'Mar 2026', pages: 29, by: 'Uploaded' },
  { t: 'AML Enhancement Programme Brief', cat: 'policy', date: 'Apr 2026', pages: 31, by: 'FSRA portal' },
];

// ---------- Abu Dhabi differentiation ----------
export const DIFFERENTIATION = [
  { icon: 'scale', t: 'Lead on legal certainty', d: 'Foreground direct English common law for tokenised instruments \u2014 a durable edge over MAS and HKMA.', tAr: 'الريادة في اليقين القانوني', dAr: 'إبراز تطبيق القانون الإنجليزي العام مباشرةً على الأدوات المرمزة.' },
  { icon: 'coins', t: 'Win institutional custody', d: 'Move first on institutional-grade tokenised-RWA custody while DIFC is still framing its regime.', tAr: 'كسب الحفظ المؤسسي', dAr: 'التحرك أولاً في حفظ الأصول الحقيقية المرمزة للمؤسسات.' },
  { icon: 'leaf', t: 'Own transition finance', d: 'Anchor a regional transition-finance taxonomy aligned to IOSCO \u2014 a space Luxembourg leads but Abu Dhabi can localise.', tAr: 'تصدّر تمويل التحول', dAr: 'ترسيخ تصنيف إقليمي لتمويل التحول متوافق مع IOSCO.' },
  { icon: 'cpu', t: 'Magnet for AI capital', d: 'Pair sovereign compute capacity with fast-track licensing to capture record AI-infrastructure inflows (Falcon Economy fit 92).', tAr: 'قطب لرأس مال الذكاء', dAr: 'دمج سعة الحوسبة السيادية مع الترخيص السريع لجذب تدفقات الذكاء الاصطناعي.' },
];

// ---------- Scripted chat suggestions + canned answers ----------
/** Static fallback; UI uses getTimeBasedChatSuggestions() for GST-aware first chip */
export const SUGGESTIONS = [
  { q: "Good morning — what's happened today?", agents: ['cos'] },
  { q: "Compare ADGM's digital assets framework against Singapore MAS.", agents:['strategy','policy'] },
  { q: "What strategic decisions did ADGM make in 2024 and how do they track against Falcon Economy priorities?", agents:['strategy','cos'] },
  { q: "Brief me on my 3pm meeting tomorrow.", agents:['cos','relationship'] },
  { q: "Top investment opportunities Abu Dhabi should prioritise from current capital flows?", agents:['strategy'] },
  { q: "Draft a note to HH's office on ADGM's Q2 performance in Arabic.", agents:['comms'] },
];

export const CANNED = {
  "Compare ADGM's digital assets framework against Singapore MAS.":
`## ADGM vs MAS — digital assets

> **In plain terms:** ADGM suits big institutions; Singapore is slightly ahead on retail crypto and stablecoin rules.

| What it means | Number | Signal |
|---------------|--------|--------|
| ADGM framework | 88/100 | 🟢 |
| MAS framework | 90/100 | 🟡 |
| Legal edge | English common law | 🟢 |

████████░░ **88/100**

| Topic | ADGM | Singapore |
|-------|------|-----------|
| Best for | Banks & funds | More retail tests |
| Stablecoins | Aligning | Consultation ends Friday |

🔴 **Do this:** Brief FSRA on MAS outcome before **12 Jun**.

*Agents: Policy · Strategy · Institutional intelligence*`,

  "What strategic decisions did ADGM make in 2024 and how do they track against Falcon Economy priorities?":
`## 2024 decisions vs Falcon Economy

> **In plain terms:** Most initiatives are on track; talent retention needs attention.

████████░░ **82/100**

| Initiative | Status | Signal |
|------------|--------|--------|
| Digital assets framework | On track · Q2 2026 | 🟢 |
| Italy engagement | Complete · May 2026 | 🟢 |
| Fund reforms | Licences +12% YoY | 🟢 |
| Talent pipeline | Attrition elevated | 🔴 |

*Agents: Strategy · Chief of Staff · Falcon_Economy_Strategic_Alignment_2024-26.xlsx*`,

  "Brief me on my 3pm meeting tomorrow.":
`## Pre-meeting — Singapore MAS delegation

> **In plain terms:** Tomorrow 15:00 — warm relationship; agree a working group before Q3.

| Fact | Detail | Signal |
|------|--------|--------|
| When | Tomorrow 15:00 UAE | 🟢 |
| Prep | Ready | 🟢 |
| Relationship | Warm · ADFW 2025 | 🟢 |

**Their focus:** digital-asset recognition · green finance rules

**Your 3 bullets**
- Common-law certainty for tokenised funds
- Fast-track custodian pilot
- Ecosystem growth (+12% licences YoY)

🔴 **Do this:** Confirm Q3 working-group date.

*Agents: Chief of Staff · Relationship · Strategy*`,

  "Top investment opportunities Abu Dhabi should prioritise from current capital flows?":
`## Top opportunities for Abu Dhabi

> **In plain terms:** Climate tech and tokenised funds score highest on Falcon Economy right now.

| Sector | Falcon Economy score | Signal |
|--------|-----------|--------|
| AI / sovereign compute | 92/100 | 🟢 |
| Tokenised RWAs | 84/100 | 🟢 |
| Private credit | 86/100 | 🟢 |
| Climate tech | 88/100 | 🟢 |

█████████░ **92/100**

🔴 **Do this:** Lead with climate GPs + institutional tokenised fund pathway.

*Agents: Strategy · Market intelligence*`,

  "Draft a note to HH's office on ADGM's Q2 performance in Arabic.":
`## Ministerial note — Q2

> **In plain terms:** Report a strong quarter; keep it short and formal in both languages.

| Metric | Value | Signal |
|--------|-------|--------|
| Falcon Economy alignment | 82/100 | 🟢 |
| Licence growth | +12% YoY | 🟢 |
| Risk | DIFC fintech pace | 🟡 |

### العربية (short)
معالي الوزير، أداء قوي للربع الثاني مع نمو التراخيص ومحاذاة الاقتصاد الصقور.

### English (short)
Your Excellency, ADGM delivered strong Q2 results: licence growth, robust FSRA pipeline, Falcon Economy score 82/100.

*Agents: Communications · Ministerial_Note_Q2_AR_EN.docx*`,
};


export type CommandCentreSignal = (typeof SIGNALS)[number];
export type CommandCentreDepartment = (typeof DEPARTMENTS)[number];
export type CommandCentreAgent = (typeof AGENTS)[number];
