import type { KbCompanyId } from '../config/kbCompanies';
import { PERFORMANCE_COMPANY_DEPT_IDS } from '../config/performanceCompanies';
import { DEPARTMENTS, type CommandCentreDepartment } from './commandCentreData';

export type PerfCompanyFilter = 'all' | KbCompanyId;

function deptIdsForCompany(company: PerfCompanyFilter): Set<string> | null {
  if (company === 'all') return null;
  return new Set(PERFORMANCE_COMPANY_DEPT_IDS[company]);
}

export function getPerformanceDepartments(
  company: PerfCompanyFilter,
): CommandCentreDepartment[] {
  const allowed = deptIdsForCompany(company);
  if (!allowed) return [...DEPARTMENTS];
  return DEPARTMENTS.filter((d) => allowed.has(d.id));
}

export function countRagStatuses(depts: CommandCentreDepartment[]) {
  return depts.reduce(
    (a, x) => {
      if (x.rag === 'good' || x.rag === 'warn' || x.rag === 'risk') a[x.rag]++;
      return a;
    },
    { good: 0, warn: 0, risk: 0 },
  );
}

export type PerformanceEscalationItem = {
  id: string;
  deptId: string;
  icon: string;
  title: string;
  sev: string;
};

const ESCALATION_DEFS: {
  id: string;
  deptId: string;
  icon: string;
  titleEn: string;
  titleAr: string;
  sev: string;
}[] = [
  {
    id: 'esc-hr',
    deptId: 'hr',
    icon: 'users',
    titleEn: 'Attrition >15% · 2 critical roles unfilled',
    titleAr: 'دوران >15٪ · وظيفتان حرجتان شاغرتان',
    sev: 'High',
  },
  {
    id: 'esc-procurement',
    deptId: 'procurement',
    icon: 'package',
    titleEn: 'Data-centre contract expires in 24 days',
    titleAr: 'عقد مركز البيانات ينتهي خلال 24 يوماً',
    sev: 'High',
  },
  {
    id: 'esc-legal',
    deptId: 'legal',
    icon: 'scale',
    titleEn: 'FSRA AML filing due in 11 days',
    titleAr: 'إيداع FSRA AML مستحق خلال 11 يوماً',
    sev: 'High',
  },
  {
    id: 'esc-sales',
    deptId: 'sales',
    icon: 'target',
    titleEn: 'AED 90M sovereign-fund mandate stalled',
    titleAr: 'تفويض صندوق سيادي 90M درهم متوقف',
    sev: 'Medium',
  },
];

export function getPerformanceEscalations(
  ar: boolean,
  company: PerfCompanyFilter,
): PerformanceEscalationItem[] {
  const allowed = deptIdsForCompany(company);
  return ESCALATION_DEFS.filter((i) => !allowed || allowed.has(i.deptId)).map((i) => ({
    id: i.id,
    deptId: i.deptId,
    icon: i.icon,
    sev: i.sev,
    title: ar ? i.titleAr : i.titleEn,
  }));
}
