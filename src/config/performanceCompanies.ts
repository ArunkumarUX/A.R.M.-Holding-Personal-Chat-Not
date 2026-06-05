import type { KbCompanyId } from './kbCompanies';

/** Department ids shown per company on the Performance page */
export const PERFORMANCE_COMPANY_DEPT_IDS: Record<KbCompanyId, readonly string[]> = {
  adgm: [
    'hr',
    'sales',
    'ops',
    'it',
    'finance',
    'strategy',
    'procurement',
    'legal',
    'marketing',
  ],
  adio: ['strategy', 'finance', 'sales', 'procurement'],
  'company-3': ['ops', 'it', 'procurement', 'hr'],
  'company-4': ['legal', 'marketing', 'finance', 'strategy'],
};
