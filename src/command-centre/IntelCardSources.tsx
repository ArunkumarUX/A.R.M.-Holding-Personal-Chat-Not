import { useMemo } from 'react';
import { SourceCitationChip } from '../components/chat/SourceCitationChip';
import { useApp } from '../context/AppContext';
import type { Source } from '../types';

type Props = {
  sources: Source[];
  ar?: boolean;
  /** When the card is a button, stop drill-in navigation on source click */
  stopCardNavigation?: boolean;
};

export function IntelCardSources({ sources, ar, stopCardNavigation }: Props) {
  const { setActiveSources, setSourcesPanelOpen } = useApp();

  const list = useMemo(() => sources, [sources]);

  if (list.length === 0) return null;

  const openSources = () => {
    setActiveSources(list);
    setSourcesPanelOpen(true);
  };

  return (
    <div
      className="intel-card__sources"
      onClick={stopCardNavigation ? (e) => e.stopPropagation() : undefined}
      onKeyDown={stopCardNavigation ? (e) => e.stopPropagation() : undefined}
    >
      <SourceCitationChip sources={list} ar={ar} onClick={openSources} maxAvatars={3} />
    </div>
  );
}
