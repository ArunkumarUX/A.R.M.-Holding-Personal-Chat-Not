import type { KbCompanyId } from './kbCompanies';

/** Department ids shown per company on the Performance page */
export const PERFORMANCE_COMPANY_DEPT_IDS: Record<KbCompanyId, readonly string[]> = {
  arm: ['hr', 'sales', 'ops', 'it', 'finance', 'strategy', 'procurement', 'legal', 'marketing'],
  drec: ['strategy', 'finance', 'sales', 'procurement', 'ops'],
  huna: ['marketing', 'finance', 'strategy', 'legal'],
  hive: ['ops', 'it', 'marketing', 'finance'],
  capri: ['strategy', 'finance', 'legal', 'ops'],
};
