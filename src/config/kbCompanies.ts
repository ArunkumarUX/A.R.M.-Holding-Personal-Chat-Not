/** Knowledge base — four company repositories */
export type KbCompanyId = 'adgm' | 'adio' | 'company-3' | 'company-4';

export type KbCompany = {
  id: KbCompanyId;
  label: string;
  labelAr: string;
  short: string;
  /** One-line context on repository card */
  tagline: string;
  taglineAr: string;
  icon: string;
  color: string;
};

export const KB_COMPANIES: readonly KbCompany[] = [
  {
    id: 'adgm',
    label: 'ADGM · Abu Dhabi',
    labelAr: 'سوق أبوظبي العالمي',
    short: 'ADGM',
    tagline: 'Abu Dhabi financial centre · regulatory & board intelligence',
    taglineAr: 'مركز أبوظبي المالي · التنظيم وحزم المجلس',
    icon: 'landmark',
    color: 'var(--adgm-navy)',
  },
  {
    id: 'adio',
    label: 'ADIO',
    labelAr: 'ADIO',
    short: 'ADIO',
    tagline: 'Abu Dhabi investment · Falcon Economy alignment',
    taglineAr: 'استثمار أبوظبي · توافق الاقتصاد الصقور',
    icon: 'trending-up',
    color: 'var(--status-info)',
  },
  {
    id: 'company-3',
    label: 'Company 3',
    labelAr: 'الشركة 3',
    short: 'Co. 3',
    tagline: 'Operations & performance',
    taglineAr: 'العمليات والأداء',
    icon: 'layers',
    color: 'var(--status-warn)',
  },
  {
    id: 'company-4',
    label: 'Company 4',
    labelAr: 'الشركة 4',
    short: 'Co. 4',
    tagline: 'Market & policy research',
    taglineAr: 'السوق والسياسات',
    icon: 'globe',
    color: 'var(--status-good)',
  },
] as const;

const BY_ID = Object.fromEntries(KB_COMPANIES.map((c) => [c.id, c])) as Record<KbCompanyId, KbCompany>;

export function getKbCompany(id?: string | null): KbCompany | undefined {
  if (!id) return undefined;
  return BY_ID[id as KbCompanyId];
}

export function kbCompanyLabel(id: KbCompanyId | undefined, ar: boolean): string {
  const c = id ? BY_ID[id] : undefined;
  if (!c) return ar ? 'غير محدد' : 'Unassigned';
  return ar ? c.labelAr : c.label;
}
