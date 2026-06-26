/** A.R.M. Holding Command Centre — portfolio mock data */


// ---------- Home signal cards — updated 25 Jun 2026 ----------
export const SIGNALS = [
  {
    id: 'market', icon: 'trending-up', tone: 'warn', label: 'Market Movements',
    headline: 'Dubai May sales fell 19% vs April after record Q1',
    body: 'Q1 2026 hit AED 252B (+31% YoY) but May transactions dipped 19% month-on-month. Off-plan remains strong at 30,000 deals / AED 73.4B in Q1. Sentiment improving post US-Iran agreement.',
    metric: 'AED 252B', metricLabel: 'Q1 2026 total', spark: [62,70,78,85,90,96,100,105,88,82],
    ar: { label: 'تحركات السوق', headline: 'مبيعات دبي في مايو تراجعت 19٪ بعد ربع أول قياسي',
      body: 'بلغت المعاملات في الربع الأول 252 مليار درهم (+31٪ سنوياً)، لكن مايو شهد تراجعاً 19٪. العقارات على الخارطة لا تزال قوية.', metricLabel: 'إجمالي الربع الأول 2026' }
  },
  {
    id: 'competitor', icon: 'crosshair', tone: 'warn', label: 'Competitor Activity',
    headline: 'Design-led waterfront launches intensifying — HUNA positioning at stake',
    body: 'Multiple Dubai developers are launching curated lifestyle districts. Jebel Ali Racecourse masterplan (ARM + BIG) must accelerate narrative. HUNA launch sign-off overdue.',
    metric: '5km²', metricLabel: 'Jebel Ali site', spark: [40,44,48,52,55,58,62,65,68,72],
    ar: { label: 'نشاط المنافسين', headline: 'إطلاقات الواجهة البحرية تتصاعد — تموضع HUNA على المحك',
      body: 'مطورون متعددون يطلقون أحياء نمط حياة منسقة. مشروع ميدان جبل علي يحتاج تسريع السردية.', metricLabel: 'موقع جبل علي' }
  },
  {
    id: 'investment', icon: 'sparkles', tone: 'good', label: 'Investment Opportunities',
    headline: 'Jebel Ali Racecourse — ground-break imminent, WSP leading masterplan',
    body: 'ARM Holding + BIG 5 sq km development: 1.5 sq km central park, Dubai\'s first 10-minute city. WSP appointed Jan 2026 for detailed masterplan. Construction expected to start 2026. Milestone tracking needed.',
    metric: '5km²', metricLabel: 'Jebel Ali site', spark: [20,28,36,44,52,60,68,76,84,92],
    ar: { label: 'فرص الاستثمار', headline: 'ميدان جبل علي — البدء في البناء وشيك، WSP تقود المخطط الرئيسي',
      body: 'مشروع 5 كم² بشراكة BIG: حديقة مركزية 1.5 كم²، أول مدينة 10 دقائق في دبي. البناء يبدأ 2026.', metricLabel: 'موقع جبل علي' }
  },
  {
    id: 'performance', icon: 'activity', tone: 'risk', label: 'Internal Performance Signals',
    headline: 'HR attrition at 15.8% — 2 critical roles unfilled 8+ weeks',
    body: 'Attrition crossed the 15% threshold concentrated in property management. Head of Leasing Operations unfilled 9 weeks. Retention package approval and executive search escalation pending CEO decision.',
    metric: '15.8%', metricLabel: 'attrition rate', spark: [10,11,12,12,13,14,14,15,15,16], deptLink: 'hr',
    ar: { label: 'مؤشرات الأداء الداخلي', headline: 'معدل الدوران 15.8٪ — وظيفتان حرجتان شاغرتان أكثر من 8 أسابيع',
      body: 'تجاوز معدل الدوران عتبة 15٪ في فرق إدارة العقارات. رئيس عمليات التأجير شاغر 9 أسابيع.', metricLabel: 'معدل الدوران' }
  },
  {
    id: 'regulatory', icon: 'gavel', tone: 'warn', label: 'Regulatory Shifts',
    headline: 'RERA Smart Rental Index 2026 live — Ejari compliance mandatory',
    body: 'New 2026 RERA rules in effect: Ejari registration within 30 days, 90-day notice for rent adjustments, Smart Rental Index governs all increases (0–20% bands). Directly impacts DREC\'s 3,200+ unit portfolio. Compliance review required.',
    metric: '3,200+', metricLabel: 'DREC units affected', spark: [2,3,3,4,4,5,5,6,6,7], link: 'regulatory',
    ar: { label: 'تحولات تنظيمية', headline: 'مؤشر الإيجار الذكي 2026 ساري — الامتثال لـ Ejari إلزامي',
      body: 'قواعد RERA الجديدة: تسجيل Ejari خلال 30 يوماً، إشعار 90 يوماً لتعديلات الإيجار. يؤثر على 3,200+ وحدة لدى DREC.', metricLabel: 'وحدات DREC المتأثرة' }
  },
  {
    id: 'followup', icon: 'list-checks', tone: 'info', label: 'Follow-Up Actions',
    headline: '5 actions awaiting your decision',
    body: 'Jebel Ali milestone review, We Emerge Stronger CEO speaking slot (30 days left), HUNA launch sign-off, HR retention packages, DREC RERA compliance sign-off.',
    metric: '5', metricLabel: 'open items', spark: [6,5,5,4,5,4,3,4,5,5],
    ar: { label: 'إجراءات المتابعة', headline: '5 إجراءات بانتظار قرارك',
      body: 'مراجعة مراحل جبل علي، فرصة التحدث في We Emerge Stronger (30 يوماً متبقية)، اعتماد إطلاق HUNA، حزم الاحتفاظ، امتثال DREC لـ RERA.', metricLabel: 'بنود مفتوحة' }
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
    risks: [ {sev:'High', t:'Attrition crossed 15% — concentrated in property management teams'}, {sev:'High', t:'Head of Leasing Operations unfilled 9 weeks'}, {sev:'Medium', t:'Time-to-fill drifting above 70-day target'} ],
    blockers: ['Compensation bands for specialist leasing roles below market', 'Visa processing delays on 2 senior international hires'],
    actions: ['Approve off-cycle comp adjustment for property management band', 'Escalate 2 critical vacancies to executive search', 'Review retention plan for DREC operations team'],
    alert: 'Attrition >15% AND critical role unfilled >8 weeks',
    series: [12.1,12.4,12.9,13.3,13.8,14.2,14.9,15.8],
  },
  {
    id: 'sales', n: '02', name: 'Sales', nameAr: 'المبيعات', icon: 'target', rag: 'warn', trend: 'up',
    summary: 'Revenue tracking to target overall; pipeline healthy but one HUNA pre-sales deal slipping and needs CEO unblock.',
    kpis: [
      { k: 'Revenue vs target', v: '102%', pct: 102, tone: 'good' },
      { k: 'Pipeline value', v: 'AED 1.24B', pct: 84, tone: 'good' },
      { k: 'Win rate', v: '31%', pct: 62, tone: 'warn' },
      { k: 'Avg deal size', v: 'AED 6.8M', pct: 70, tone: 'good' },
      { k: 'New leases signed', v: '47 QTD', pct: 78, tone: 'good' },
    ],
    achievements: ['Closed 3 DREC commercial leases worth AED 21M', 'HUNA pre-sales inquiries +12% vs prior quarter', 'HIVE occupancy win-rate up to 91%'],
    risks: [ {sev:'High', t:'AED 90M HUNA waterfront pre-sales at risk — stalled 3 weeks'}, {sev:'Medium', t:'Win rate softening in DREC retail segment'} ],
    blockers: ['HUNA deal awaiting RERA escrow confirmation', 'Legal review backlog on 2 enterprise leasing contracts'],
    actions: ['Personally engage HUNA buyer sponsor this week', 'Clear legal review bottleneck with Legal & Compliance', 'Approve incentive for HIVE occupancy push'],
    alert: 'Revenue deviation >10% vs forecast',
    series: [88,92,95,97,99,100,101,102],
  },
  {
    id: 'ops', n: '03', name: 'Operations', nameAr: 'العمليات', icon: 'settings-2', rag: 'warn', trend: 'flat',
    summary: 'SLAs broadly met; one DLD registration bottleneck driving longer turnaround on new leases.',
    kpis: [
      { k: 'Service SLAs met', v: '94.2%', pct: 94, tone: 'good' },
      { k: 'Process efficiency', v: '81%', pct: 81, tone: 'warn' },
      { k: 'Cost vs budget', v: '98%', pct: 98, tone: 'good' },
      { k: 'Incident count (MTD)', v: '3', pct: 70, tone: 'warn' },
      { k: 'Avg turnaround', v: '5.6 days', pct: 66, tone: 'warn' },
    ],
    achievements: ['Lease registrations +22% handled within SLA', 'Zero critical operational incidents this quarter', 'Digital onboarding cut document errors 40%'],
    risks: [ {sev:'Medium', t:'DLD registration queue creating 5.6-day turnaround'}, {sev:'Low', t:'Resource constraint in property verification team'} ],
    blockers: ['Manual verification step in DLD registration not yet automated', 'Peak-season volume exceeding registry team capacity'],
    actions: ['Approve automation of DLD verification step', 'Authorise temporary registry resourcing for peak'],
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
    achievements: ['Property management portal upgrade shipped ahead of plan', 'Zero security incidents; posture rated Strong', 'AI adoption across teams reached 68%'],
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
    summary: 'Strategic initiatives largely on track; D33 alignment strong. One HUNA launch milestone at risk of slipping.',
    kpis: [
      { k: 'Initiative progress', v: '78%', pct: 78, tone: 'good' },
      { k: 'Milestones complete', v: '14 / 18', pct: 78, tone: 'good' },
      { k: 'D33 alignment', v: '86', pct: 86, tone: 'good' },
      { k: 'Competitive position', v: 'Top 3', pct: 85, tone: 'good' },
    ],
    achievements: ['D33 roadmap milestones 78% complete', 'Portfolio alignment score reached 86', 'Art Dubai sculpture commission launched'],
    risks: [ {sev:'Medium', t:'HUNA waterfront launch milestone at risk of 4-week slip'} ],
    blockers: ['Awaiting design partner input on HUNA launch narrative'],
    actions: ['Convene HUNA launch working session with Marketing and DREC'],
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
    summary: 'Filings current; however an RERA compliance deadline is approaching and a regulatory matter has escalated.',
    kpis: [
      { k: 'Regulatory pipeline', v: '9 matters', pct: 72, tone: 'warn' },
      { k: 'Filing status', v: '96% current', pct: 96, tone: 'good' },
      { k: 'Open legal matters', v: '12', pct: 64, tone: 'warn' },
      { k: 'Policy backlog', v: '4 updates', pct: 60, tone: 'warn' },
    ],
    achievements: ['96% of regulatory filings current', 'Closed 5 legacy legal matters this quarter'],
    risks: [ {sev:'High', t:'RERA rental disclosure filing due in 11 days'}, {sev:'Medium', t:'Cross-border leasing matter escalated to senior counsel'} ],
    blockers: ['Awaiting policy input from Strategy on HUNA escrow clauses'],
    actions: ['Approve resourcing to clear RERA filing on time', 'Review escalated cross-border leasing matter'],
    alert: 'Compliance deadline missed or regulatory matter escalated',
    series: [9,9,10,10,11,11,12,12],
  },
  {
    id: 'marketing', n: '09', name: 'Marketing & Comms', nameAr: 'التسويق والاتصال', icon: 'megaphone', rag: 'good', trend: 'up',
    summary: 'Strong campaign ROI and positive sentiment post-Art Dubai. We Emerge Stronger commission needs CEO speaking slot decision.',
    kpis: [
      { k: 'Campaign ROI', v: '3.4x', pct: 85, tone: 'good' },
      { k: 'Media coverage', v: '+38%', pct: 88, tone: 'good' },
      { k: 'Brand sentiment', v: '+72', pct: 86, tone: 'good' },
      { k: 'Digital engagement', v: '+19%', pct: 78, tone: 'good' },
    ],
    achievements: ['Art Dubai coverage up 38% YoY with +72 sentiment', 'Campaign ROI reached 3.4x', 'We Emerge Stronger open call launched'],
    risks: [ {sev:'Low', t:'Flagship roundtable needs CEO speaking confirmation'} ],
    blockers: ['Awaiting CEO availability for keynote roundtable'],
    actions: ['Confirm CEO speaking slot for flagship roundtable'],
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
    caps: ['Portfolio benchmarking', 'Live market intelligence', 'Investment opportunity scoring', 'D33 alignment tracking', 'Scenario planning'],
    integ: 'Bloomberg / Refinitiv · regulatory feeds · KB' },
  { id: 'policy', n:'03', name: 'Policy AI', icon: 'gavel', color:'var(--status-info)',
    fn: 'Regulatory intelligence & policy drafting',
    caps: ['Live monitoring of 12 jurisdictions', 'Policy drafting', 'International benchmarking', 'Impact assessment'],
    integ: 'Regulatory RSS + APIs · RERA portal' },
  { id: 'relationship', n:'04', name: 'Relationship AI', icon: 'network', color:'var(--sun-2)',
    fn: 'Institutional CRM memory',
    caps: ['Full interaction history', 'Living stakeholder profiles', 'Proactive follow-up alerts', 'Partnership tracking', 'Network mapping'],
    integ: 'CRM bidirectional sync · LinkedIn · Graph' },
  { id: 'comms', n:'05', name: 'Communications AI', icon: 'languages', color:'var(--status-good)',
    fn: 'All executive communications — EN & AR',
    caps: ['Speech drafting', 'Executive writing', 'Correspondence management', 'Bilingual board notes', 'CEO voice learning'],
    integ: 'Microsoft Graph email · KB · style loop' },
];

// ---------- Portfolio benchmarking ----------
export const CENTRES = ['DREC','HUNA','HIVE','Emaar','Meraas'];

/**
 * 12-Dimension Benchmark — A.R.M. Holding portfolio vs Dubai developers
 * Scale 0–100. Mock data for executive dashboard.
 */
export const BENCH_DIMS: { d: string; src: string; v: number[] }[] = [
  { d: 'Occupancy & asset utilisation',
    src: 'DREC Portfolio Review Q1 2026',
    v: [94, 88, 91, 92, 89] },
  { d: 'Design differentiation & brand',
    src: 'HUNA Development Strategy 2026',
    v: [72, 95, 68, 78, 82] },
  { d: 'Community & coliving experience',
    src: 'HIVE Operations 2026',
    v: [70, 74, 92, 65, 60] },
  { d: 'Sales velocity & pre-sales',
    src: 'CBRE Dubai Market Q1 2026',
    v: [82, 88, 76, 94, 86] },
  { d: 'Rental yield & collections',
    src: 'DREC Portfolio Review Q1 2026',
    v: [90, 78, 72, 85, 88] },
  { d: 'Hospitality & RevPAR recovery',
    src: 'STR Global Dubai',
    v: [84, 92, 70, 88, 91] },
  { d: 'Regulatory compliance (RERA/DLD)',
    src: 'ARM RERA Compliance Framework',
    v: [92, 90, 88, 86, 88] },
  { d: 'Sustainability & ESG credentials',
    src: 'Group ESG Position Paper 2026',
    v: [78, 86, 74, 82, 80] },
  { d: 'Cultural & public art integration',
    src: 'We Emerge Stronger Commission Brief',
    v: [88, 96, 70, 62, 58] },
  { d: 'D33 alignment & economic contribution',
    src: 'ARM D33 Alignment Tracker 2026',
    v: [86, 84, 80, 78, 76] },
  { d: 'Talent retention & Emiratisation',
    src: 'HR Quarterly Review Q1 2026',
    v: [74, 82, 88, 80, 78] },
  { d: 'Digital & proptech adoption',
    src: 'Technology & IT Dashboard',
    v: [80, 86, 84, 88, 82] },
];

// ---------- Briefing formats (focused executive workflows) ----------
export const BRIEF_FORMATS = [
  { id:'premeeting', icon:'calendar-check', name:'Pre-meeting brief', desc:'Paste an agenda, email trail, or upload documents', time:'< 30s' },
  { id:'email', icon:'mail', name:'Email draft', desc:'Paste an email and get a ready-to-send reply', time:'< 20s' },
  { id:'boardpack', icon:'clipboard-list', name:'Board pack summary', desc:'Upload board materials — key decisions & risks', time:'< 60s' },
  { id:'stakeholder', icon:'id-card', name:'Stakeholder profile', desc:'Profile from notes, CRM, and uploaded context', time:'< 30s' },
];

// ---------- 8-week plan ----------
export const PLAN = [
  { w:'01', focus:'Pilot', deliver:'Personalised prototype · 5 deliverables · HR + Sales + Ops loaded · Arabic demonstrated', gate:'CEO approves full build' },
  { w:'02', focus:'Infrastructure', deliver:'Azure UAE North · Kubernetes · Weaviate + Neo4j · Azure AD SSO · RBAC · audit logging', gate:'A.R.M. Holding IT security sign-off' },
  { w:'03', focus:'Knowledge System', deliver:'Ingestion pipeline · 50+ docs seeded · Knowledge Graph · SharePoint auto-sync', gate:'50 test queries pass' },
  { w:'04', focus:'Five Agents', deliver:'All 5 LangGraph agents · orchestration graph · all modules on seeded data', gate:'Agents pass CEO scenarios' },
  { w:'05', focus:'Market & Docs', deliver:'Bloomberg/Refinitiv · RERA sync · news feeds · 08:00 & 22:00 GST refresh', gate:'Briefing quality approved' },
  { w:'06', focus:'Relationship & Comms', deliver:'Graph calendar + email · CRM history · Arabic RTL complete', gate:'Arabic QA sign-off' },
  { w:'07', focus:'9 Depts + Regulatory', deliver:'ERP/HR ETL for all 9 departments · regulatory feeds active', gate:'Dashboards reviewed by A.R.M. Holding' },
  { w:'08', focus:'Go-Live', deliver:'Integration testing · security scan · CEO onboarding · go-live', gate:'CEO sign-off on system' },
];

// ---------- Integrations ----------
export const INTEGRATIONS = [
  { name:'Market Data', sys:'Bloomberg / Refinitiv Eikon', wk:'Week 5', icon:'trending-up' },
  { name:'Document Repository', sys:'SharePoint / DMS (Graph)', wk:'Week 5', icon:'folder-sync' },
  { name:'Calendar & Email', sys:'Microsoft Exchange (Graph)', wk:'Week 6', icon:'mail' },
  { name:'CRM & Relationships', sys:'Salesforce or equivalent', wk:'Week 6', icon:'contact' },
  { name:'Regulatory Intel', sys:'RERA · DLD · DET · CBUAE', wk:'Week 7', icon:'gavel' },
  { name:'Performance & HR', sys:'SAP / Oracle ERP + HR ETL', wk:'Week 7', icon:'database' },
  { name:'A.R.M. Holding RERA Portal', sys:'SharePoint + internal API', wk:'Week 5', icon:'building-2' },
  { name:'News & Intelligence', sys:'Reuters · Gulf News · regional', wk:'Week 5', icon:'newspaper' },
];

export const TICKER = [
  { k: 'DFM', v: '5,318.2', c: +0.41 },
  { k: 'ADX', v: '9,742.6', c: +0.84 },
  { k: 'Emaar', v: 'AED 8.42', c: +1.8 },
  { k: 'Damac', v: 'AED 1.86', c: -0.5 },
  { k: 'DREC Occ.', v: '94.2%', c: +0.4 },
  { k: 'HIVE Occ.', v: '91%', c: +1.2 },
  { k: 'HUNA Pipe.', v: 'AED 124M', c: +12 },
  { k: 'RERA Index', v: '+4.2%', c: +0.3 },
  { k: 'Jebel Ali', v: 'WSP · 2026', c: 0 },
  { k: 'USD/AED', v: '3.6725', c: 0.0 },
];

// ---------- Organisational momentum (index) ----------
export const MOMENTUM = { data: [71, 73, 72, 75, 77, 76, 79, 81, 80, 83, 85, 87], labels: ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'] };

// ---------- Capital flows toward Dubai real estate ----------
export const FLOWS = [
  { k: 'GCC', kAr: 'الخليج', flow: 92, v: '+4.2%' },
  { k: 'Europe', kAr: 'أوروبا', flow: 68, v: '+2.8%' },
  { k: 'South Asia', kAr: 'جنوب آسيا', flow: 74, v: '+3.4%' },
  { k: 'East Asia', kAr: 'شرق آسيا', flow: 58, v: '+1.9%' },
  { k: 'North America', kAr: 'أمريكا الشمالية', flow: 52, v: '+1.6%' },
];

// ---------- Regulatory change monitor ----------
export const REGULATORY = [
  { body: 'RERA', region: 'Dubai', topic: 'Rental index', date: 'Today', title: 'RERA updates rental index guidance for Q3', rel: 'High', impact: 'Directly affects DREC portfolio repricing — review within 30 days.', titleAr: 'RERA تحدّث إرشادات مؤشر الإيجار للربع الثالث', impactAr: 'يؤثر مباشرة على إعادة تسعير محفظة DREC.' },
  { body: 'DLD', region: 'Dubai', topic: 'Registration', date: '2 days ago', title: 'DLD streamlines off-plan registration for design-led projects', rel: 'High', impact: 'Positive for HUNA launch timeline — expedite H Residence filings.', titleAr: 'DLD تبسّط تسجيل المشاريع على الخارطة', impactAr: 'إيجابي لجدول إطلاق HUNA.' },
  { body: 'DET', region: 'Dubai', topic: 'Tourism', date: '4 days ago', title: 'Dubai tourism targets 20M visitors — hospitality incentives expanded', rel: 'High', impact: 'Supports DREC hospitality assets and HUNA lifestyle positioning.', titleAr: 'دبي تستهدف 20 مليون زائر', impactAr: 'يدعم أصول الضيافة وموقع HUNA.' },
  { body: 'Dubai Municipality', region: 'Dubai', topic: 'Planning', date: '5 days ago', title: 'Updated guidelines for public art in residential developments', rel: 'Medium', impact: 'Relevant to We Emerge Stronger sculpture at HUNA Sculpture Park.', titleAr: 'إرشادات محدّثة للفن العام في المشاريع السكنية', impactAr: 'ذات صلة بمنحوتة We Emerge Stronger.' },
  { body: 'CBUAE', region: 'UAE', topic: 'Mortgage', date: '1 week ago', title: 'Mortgage affordability rules adjusted for expat buyers', rel: 'Medium', impact: 'May lift HUNA pre-sales conversion — monitor with Sales.', titleAr: 'تعديل قواعد تمويل الرهن العقاري للمشترين الأجانب', impactAr: 'قد يرفع مبيعات HUNA المسبقة.' },
  { body: 'D33 Office', region: 'Dubai', topic: 'Economic agenda', date: '1 week ago', title: 'D33 SME accelerator fund — real estate tech eligible', rel: 'Medium', impact: 'HIVE proptech pilot may qualify — Strategy to assess.', titleAr: 'صندوق مسرّع الشركات الصغيرة D33', impactAr: 'تجربة HIVE قد تتأهل.' },
  { body: 'RERA', region: 'Dubai', topic: 'Compliance', date: '2 weeks ago', title: 'Enhanced rental disclosure requirements for landlords', rel: 'High', impact: 'Group filing due in 11 days — Legal & Compliance action required.', titleAr: 'متطلبات إفصاح إيجار محسّنة', impactAr: 'إيداع المجموعة خلال 11 يوماً.' },
  { body: 'DET', region: 'Dubai', topic: 'Events', date: '2 weeks ago', title: 'Art Dubai 2026 partnership framework published', rel: 'Low', impact: 'Supports We Emerge Stronger commission narrative.', titleAr: 'نشر إطار شراكة Art Dubai 2026', impactAr: 'يدعم سردية منحوتة We Emerge Stronger.' },
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
  { t: 'A.R.M. Holding Group Strategy 2025\u20132030', cat: 'strategy', date: 'May 2026', pages: 64, by: 'SharePoint sync' },
  { t: 'Q1 2026 Board Pack \u2014 Full', cat: 'board', date: 'Apr 2026', pages: 112, by: 'Uploaded' },
  { t: 'RERA & DLD Compliance Framework', cat: 'policy', date: 'Feb 2026', pages: 22, by: 'Legal & Compliance' },
  { t: 'Dubai Real Estate Market Benchmark Report', cat: 'market', date: 'May 2026', pages: 41, by: 'CBRE / Knight Frank' },
  { t: 'HR Quarterly Performance Review', cat: 'performance', date: 'Apr 2026', pages: 23, by: 'ERP/HR ETL' },
  { t: 'D33 Portfolio Alignment Tracker 2026', cat: 'strategy', date: 'May 2026', pages: 16, by: 'Strategy · Approved KB' },
  { t: 'DREC Portfolio Review Q1 2026', cat: 'performance', date: 'Apr 2026', pages: 32, by: 'DREC · Approved KB' },
  { t: 'HUNA Development Strategy 2026', cat: 'strategy', date: 'Mar 2026', pages: 18, by: 'HUNA · Approved KB' },
  { t: 'HIVE Coliving Operations 2026', cat: 'performance', date: 'Apr 2026', pages: 14, by: 'HIVE · Approved KB' },
  { t: 'We Emerge Stronger — Commission Brief', cat: 'strategy', date: 'Jun 2026', pages: 12, by: 'Art Dubai · Approved KB' },
  { t: 'A.R.M. Holding Values & Leadership', cat: 'general', date: 'May 2026', pages: 8, by: 'armholding.ae · Approved KB' },
  { t: 'Art Dubai 2026 Partnership Register', cat: 'general', date: 'Jun 2026', pages: 24, by: 'SharePoint sync' },
  { t: 'Sales Pipeline & Leasing Status', cat: 'performance', date: 'Apr 2026', pages: 14, by: 'CRM sync' },
  { t: 'Hospitality Recovery Position Paper', cat: 'market', date: 'Mar 2026', pages: 29, by: 'Uploaded' },
  { t: 'RERA Rental Disclosure Programme Brief', cat: 'policy', date: 'Apr 2026', pages: 18, by: 'RERA portal' },
];

// ---------- Dubai differentiation ----------
export const DIFFERENTIATION = [
  { icon: 'palette', t: 'Lead on design-led living', d: 'HUNA curates architecture, culture and commerce — a durable edge over volume developers in Dubai.', tAr: 'الريادة في السكن بتصميم رائد', dAr: 'HUNA تجمع العمارة والثقافة والتجارة — ميزة دائمة على مطوري الحجم.' },
  { icon: 'home', t: 'Own community coliving', d: 'HIVE captures young professionals and creatives — a segment Emaar and Meraas under-serve.', tAr: 'تصدّر العيش المشترك', dAr: 'HIVE تستهدف الشباب والمبدعين — شريحة يقلّل المنافسون خدمتها.' },
  { icon: 'building-2', t: 'Stabilise income via DREC', d: '3,200+ units across Palm Spring Village and The Beach Centre provide resilient recurring revenue.', tAr: 'دخل مستقر عبر DREC', dAr: 'أكثر من 3200 وحدة توفر إيرادات متكررة مرنة.' },
  { icon: 'sparkles', t: 'Culture in public life', d: 'We Emerge Stronger sculpture commission at HUNA Sculpture Park — art woven into everyday urban life (D33 fit 94).', tAr: 'الثقافة في الحياة العامة', dAr: 'منحوتة We Emerge Stronger — الفن جزء من الحياة اليومية.' },
];

// ---------- Scripted chat suggestions + canned answers ----------
/** Static fallback; UI uses getTimeBasedChatSuggestions() for GST-aware first chip */
export const SUGGESTIONS = [
  { q: "Good morning — what's happened today?", agents: ['cos'] },
  { q: "How does HUNA's design-led positioning compare to Emaar this quarter?", agents:['strategy'] },
  { q: "What strategic decisions did A.R.M. Holding make in 2025 and how do they track against D33 priorities?", agents:['strategy','cos'] },
  { q: "Brief me on my DREC board meeting tomorrow.", agents:['cos','relationship'] },
  { q: "Top investment opportunities in Dubai real estate from current capital flows?", agents:['strategy'] },
  { q: "Draft talking points for the We Emerge Stronger sculpture announcement.", agents:['comms'] },
];

export const CANNED = {
  "How does HUNA's design-led positioning compare to Emaar this quarter?":
`## HUNA vs Emaar — design positioning

> **In plain terms:** HUNA leads on cultural curation; Emaar leads on scale and brand recognition.

| What it means | Score | Signal |
|---------------|-------|--------|
| HUNA design differentiation | 96/100 | 🟢 |
| Emaar brand & scale | 94/100 | 🟢 |
| Pre-sales velocity | HUNA catching up | 🟡 |

████████░░ **90/100**

| Topic | HUNA | Emaar |
|-------|------|-------|
| Strength | Culture + design | Volume + distribution |
| Weakness | Scale | Design curation |
| Next move | Waterfront launch | N/A |

🔴 **Do this:** Accelerate HUNA launch narrative before competitor waterfront announcement.

*Agents: Strategy · Market intelligence*`,

  "What strategic decisions did A.R.M. Holding make in 2025 and how do they track against D33 priorities?":
`## 2025 decisions vs D33

> **In plain terms:** Portfolio initiatives on track; talent retention needs attention.

████████░░ **86/100**

| Initiative | Status | Signal |
|------------|--------|--------|
| HUNA design-led launches | On track · Q3 2026 | 🟢 |
| We Emerge Stronger commission | Live · Jun 2026 | 🟢 |
| DREC occupancy stabilisation | 94.2% | 🟢 |
| Talent pipeline | Attrition elevated | 🔴 |

*Agents: Strategy · Chief of Staff · ARM_D33_Alignment_Tracker_2026.xlsx*`,

  "Brief me on my DREC board meeting tomorrow.":
`## Pre-meeting — DREC board

> **In plain terms:** Tomorrow 10:00 — review occupancy, leasing pipeline, and RERA filing.

| Fact | Detail | Signal |
|------|--------|--------|
| When | Tomorrow 10:00 UAE | 🟢 |
| Prep | Ready | 🟢 |
| Focus | Occupancy + RERA | 🟢 |

**Agenda highlights**
- Q1 occupancy 94.2% across core assets
- AED 124M leasing pipeline — 1 deal at risk
- RERA rental disclosure due in 11 days

🔴 **Do this:** Confirm escalation path for stalled HUNA pre-sales link.

*Agents: Chief of Staff · Relationship · Strategy*`,

  "Top investment opportunities in Dubai real estate from current capital flows?":
`## Top opportunities — Dubai real estate

> **In plain terms:** Hospitality recovery and design-led residential score highest for the portfolio.

| Sector | D33 score | Signal |
|--------|-----------|--------|
| Design-led residential | 90/100 | 🟢 |
| Hospitality recovery | 88/100 | 🟢 |
| Coliving / flexible living | 84/100 | 🟢 |
| Commercial retail | 82/100 | 🟢 |

█████████░ **90/100**

🔴 **Do this:** Prioritise HUNA waterfront pre-sales and DREC hospitality asset review.

*Agents: Strategy · Market intelligence*`,

  "Draft talking points for the We Emerge Stronger sculpture announcement.":
`## We Emerge Stronger — talking points

> **In plain terms:** Culture woven into everyday life; permanent sculpture at HUNA Sculpture Park.

| Theme | Message | Signal |
|-------|---------|--------|
| Commission | Open call live 17 Jun – 25 Jul | 🟢 |
| Partnership | Art Dubai × A.R.M. Holding | 🟢 |
| Inspiration | نظهر أقوى — resilience & renewal | 🟢 |

### Key lines
- "Art should be woven into everyday life."
- "Giving artists freedom to develop bold, individual proposals."
- "A lasting public presence deeply connected to its environment."

*Agents: Communications · ARM_Values_Leadership_2026.pdf*`,
};


export type CommandCentreSignal = (typeof SIGNALS)[number];
export type CommandCentreDepartment = (typeof DEPARTMENTS)[number];
export type CommandCentreAgent = (typeof AGENTS)[number];
