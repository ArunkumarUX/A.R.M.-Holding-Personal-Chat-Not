import { KB_COMPANIES } from '../../config/kbCompanies';
import { DEPARTMENTS } from '../../data/commandCentreData';
import { getPerformanceDepartments, type PerfCompanyFilter } from '../../data/performanceViews';

type Props = {
  company: PerfCompanyFilter;
  ar: boolean;
  hasFilter: boolean;
  onCompanyChange: (id: PerfCompanyFilter) => void;
  onClear: () => void;
};

export function PerformanceCompanyFilter({
  company,
  ar,
  hasFilter,
  onCompanyChange,
  onClear,
}: Props) {
  const allCount = DEPARTMENTS.length;

  return (
    <div className="kb-filter-row" role="search" aria-label={ar ? 'تصفية حسب الشركة' : 'Filter by company'}>
      <label className="kb-filter-row__field">
        <span className="kb-filter-row__label">{ar ? 'الشركة' : 'Company'}</span>
        <span className="kb-filter-row__select-wrap">
          <select
            className="kb-filter-row__select"
            value={company}
            onChange={(e) => onCompanyChange(e.target.value as PerfCompanyFilter)}
          >
            <option value="all">
              {ar ? `كل الشركات (${allCount})` : `All companies (${allCount})`}
            </option>
            {KB_COMPANIES.map((c) => {
              const n = getPerformanceDepartments(c.id).length;
              return (
                <option key={c.id} value={c.id}>
                  {ar ? `${c.labelAr} (${n})` : `${c.label} (${n})`}
                </option>
              );
            })}
          </select>
        </span>
      </label>

      <button
        type="button"
        className={
          'btn btn-sm kb-filter-row__clear' + (hasFilter ? ' btn-primary' : ' kb-filter-row__clear--idle')
        }
        disabled={!hasFilter}
        onClick={onClear}
        aria-label={ar ? 'مسح التصفية' : 'Clear filter'}
      >
        {ar ? 'مسح' : 'Clear'}
      </button>
    </div>
  );
}
