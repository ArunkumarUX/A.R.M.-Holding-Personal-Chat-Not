/** What stakeholders can trust vs prototype scenario data */

export type DataSourceMode = 'live' | 'institutional' | 'prototype' | 'ai';

export type DataSourceStatus = {
  id: string;
  labelEn: string;
  labelAr: string;
  mode: DataSourceMode;
  detailEn: string;
  detailAr: string;
};

export type DataProvenance = {
  lastSync: string;
  refreshedAt?: string;
  scheduleLabel?: string;
  bloombergLive: boolean;
  bloombergFetchedAt?: string;
  bloombergHeadline?: string;
  claudeEnabled: boolean;
  kbChunkCount: number;
  sources: DataSourceStatus[];
};

export const KB_CHUNK_COUNT = 183;

export function buildDefaultProvenance(opts?: {
  lastSync?: string;
  bloombergLive?: boolean;
  bloombergFetchedAt?: string;
  bloombergHeadline?: string;
  claudeEnabled?: boolean;
  scheduleLabel?: string;
}): DataProvenance {
  const lastSync = opts?.lastSync ?? new Date().toISOString();
  const bloombergLive = Boolean(opts?.bloombergLive);

  return {
    lastSync,
    refreshedAt: lastSync,
    scheduleLabel: opts?.scheduleLabel ?? '08:00 & 22:00 GST refresh',
    bloombergLive,
    bloombergFetchedAt: opts?.bloombergFetchedAt,
    bloombergHeadline: opts?.bloombergHeadline,
    claudeEnabled: opts?.claudeEnabled ?? false,
    kbChunkCount: KB_CHUNK_COUNT,
    sources: [
      {
        id: 'claude',
        labelEn: 'Personal AI (Claude Sonnet 4.6)',
        labelAr: 'الذكاء الشخصي (Claude Sonnet 4.6)',
        mode: 'ai',
        detailEn: opts?.claudeEnabled
          ? 'Answers synthesised from grounded records below — no invented figures.'
          : 'API key required for live synthesis; demo scripts used as fallback.',
        detailAr: opts?.claudeEnabled
          ? 'إجابات مبنية على السجلات الموثقة أدناه — دون اختلاق أرقام.'
          : 'يتطلب مفتاح API؛ سيناريوهات تجريبية عند عدم التوفر.',
      },
      {
        id: 'bloomberg',
        labelEn: 'Market headlines',
        labelAr: 'عناوين السوق',
        mode: bloombergLive ? 'live' : 'prototype',
        detailEn: bloombergLive
          ? `Live Bloomberg categories via Apify${opts?.bloombergHeadline ? `: ${opts.bloombergHeadline.slice(0, 80)}` : ''}.`
          : 'Set APIFY_TOKEN on server for live Bloomberg wire; otherwise rotation snapshot only.',
        detailAr: bloombergLive
          ? 'عناوين Bloomberg حية عبر Apify.'
          : 'أضف APIFY_TOKEN للحصول على Bloomberg حي؛ وإلا لقطة سيناريو فقط.',
      },
      {
        id: 'kb',
        labelEn: 'Knowledge base (Falcon & ADGM PDFs)',
        labelAr: 'قاعدة المعرفة',
        mode: 'institutional',
        detailEn: `${KB_CHUNK_COUNT} grounded chunks from official ADGM / Falcon PDFs (KB-006–KB-015).`,
        detailAr: `${KB_CHUNK_COUNT} مقطعاً من مستندات ADGM واقتصاد الصقور الرسمية.`,
      },
      {
        id: 'calendar',
        labelEn: 'Calendar & action register',
        labelAr: 'التقويم وسجل الإجراءات',
        mode: 'prototype',
        detailEn: 'CSO scenario dataset — dates roll with GST refresh; not Microsoft Graph yet.',
        detailAr: 'بيانات سيناريو للكبير مسؤولي الاستراتيجية — تُحدَّث بتوقيت الإمارات.',
      },
      {
        id: 'departments',
        labelEn: 'Nine department dashboards',
        labelAr: 'لوحات الإدارات التسع',
        mode: 'prototype',
        detailEn: 'Illustrative ERP-style metrics for demo; cite as internal records only.',
        detailAr: 'مؤشرات توضيحية للعرض — تُستشهد كسجلات داخلية فقط.',
      },
      {
        id: 'ticker',
        labelEn: 'Market ticker & charts',
        labelAr: 'شريط الأسعار والرسوم',
        mode: 'prototype',
        detailEn: 'Scenario indices for layout — not a live exchange feed.',
        detailAr: 'مؤشرات سيناريو للعرض — ليست بيانات بورصة حية.',
      },
    ],
  };
}
