import type { ReactNode } from 'react';
import { KB_CATS } from '../../data/commandCentreData';
import { KB_COMPANIES, type KbCompanyId } from '../../config/kbCompanies';
import type { KbListDoc } from '../../command-centre/kbCorpus';
import { countKbByCategory, countKbByCompany } from '../../command-centre/kbCorpus';

type CompanyFilter = 'all' | KbCompanyId;

type Props = {
  company: CompanyFilter;
  cat: string;
  corpus: KbListDoc[];
  ar: boolean;
  hasFilters: boolean;
  onCompanyChange: (id: CompanyFilter) => void;
  onCatChange: (id: string) => void;
  onClear: () => void;
};

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="kb-filter-row__field">
      <span className="kb-filter-row__label">{label}</span>
      <span className="kb-filter-row__select-wrap">
        <select className="kb-filter-row__select" value={value} onChange={(e) => onChange(e.target.value)}>
          {children}
        </select>
      </span>
    </label>
  );
}

export function KbFiltersRow({
  company,
  cat,
  corpus,
  ar,
  hasFilters,
  onCompanyChange,
  onCatChange,
  onClear,
}: Props) {
  const total = corpus.length;
  const topicScope =
    company === 'all' ? corpus : corpus.filter((d) => d.companyId === company);
  const topicTotal = topicScope.length;

  return (
    <div className="kb-filter-row" role="search" aria-label={ar ? 'تصفية المستندات' : 'Filter documents'}>
      <FilterSelect
        label={ar ? 'الشركة' : 'Company'}
        value={company}
        onChange={(v) => onCompanyChange(v as CompanyFilter)}
      >
        <option value="all">
          {ar ? `كل الشركات (${total})` : `All companies (${total})`}
        </option>
        {KB_COMPANIES.map((c) => {
          const n = countKbByCompany(corpus, c.id);
          return (
            <option key={c.id} value={c.id}>
              {ar ? `${c.labelAr} (${n})` : `${c.label} (${n})`}
            </option>
          );
        })}
      </FilterSelect>

      <div className="kb-filter-row__topic-group">
        <FilterSelect label={ar ? 'الموضوع' : 'Topic'} value={cat} onChange={onCatChange}>
          <option value="all">
            {ar ? `كل المواضيع (${topicTotal})` : `All topics (${topicTotal})`}
          </option>
          {KB_CATS.map((c) => {
            const n = countKbByCategory(topicScope, c.id);
            return (
              <option key={c.id} value={c.id}>
                {ar ? `${c.labelAr} (${n})` : `${c.label} (${n})`}
              </option>
            );
          })}
        </FilterSelect>

        <button
          type="button"
          className={
            'btn btn-sm kb-filter-row__clear' + (hasFilters ? ' btn-primary' : ' kb-filter-row__clear--idle')
          }
          disabled={!hasFilters}
          onClick={onClear}
          aria-label={ar ? 'مسح التصفية' : 'Clear filters'}
        >
          {ar ? 'مسح' : 'Clear'}
        </button>
      </div>
    </div>
  );
}
