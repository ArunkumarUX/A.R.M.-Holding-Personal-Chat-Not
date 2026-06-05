/** Split long market / investment strings into scannable card titles */

export function parseFalconScoreFromSector(topSector: string): string {
  const m = topSector.match(/Falcon Economy score\s*(\d+)/i);
  if (m) return m[1];
  const align = topSector.match(/alignment\s*(\d+)/i);
  if (align) return align[1];
  return '88';
}

export function formatMarketSignalHeadline(
  gcc: string,
  digital: string,
): { headline: string; headlineSub: string } {
  const gccIsIndexList = /^(ADX|DFM|Tadawul|MSCI)/i.test(gcc.trim());
  const gccHeadline = gccIsIndexList
    ? 'GCC indices (live)'
    : /^[+-]/.test(gcc.trim())
      ? `GCC equities ${gcc.trim()}`
      : gcc.trim();

  let digitalSub = digital.trim();
  const btc = digitalSub.match(/BTC\s+[^(]+(?:\([^)]+\))?/i)?.[0]?.trim();
  const eth = digitalSub.match(/ETH\s+[^(]+(?:\([^)]+\))?/i)?.[0]?.trim();
  if (btc && eth) {
    digitalSub = `${btc} · ${eth}`;
  } else {
    digitalSub = digitalSub.replace(/^digital assets\s*/i, 'Digital · ');
  }

  if (gccIsIndexList && gcc.includes(' · ')) {
    return { headline: gccHeadline, headlineSub: `${gcc} · ${digitalSub}` };
  }

  return { headline: gccHeadline, headlineSub: digitalSub };
}

export function formatInvestmentSignalHeadline(
  topSector: string,
  falconScore: string,
): { headline: string; headlineSub: string } {
  const falconInParens = topSector.match(/^(.+?)\s*\(Falcon Economy score\s*(\d+)\)/i);
  if (falconInParens) {
    return {
      headline: falconInParens[1].trim(),
      headlineSub: `Falcon Economy ${falconInParens[2]}/100`,
    };
  }

  const beforeDash = topSector.split(/\s*—\s*/)[0]?.trim() ?? topSector;
  if (beforeDash.length < topSector.length && /Falcon Economy/i.test(topSector)) {
    return {
      headline: beforeDash.replace(/\s*\(Falcon Economy[^)]*\)/i, '').trim(),
      headlineSub: `Falcon Economy ${falconScore}/100`,
    };
  }

  if (topSector.length > 56) {
    return {
      headline: `${topSector.slice(0, 53).trim()}…`,
      headlineSub: `Falcon Economy ${falconScore}/100`,
    };
  }

  return {
    headline: topSector.replace(/\s*\(Falcon Economy[^)]*\)/i, '').trim(),
    headlineSub: `Falcon Economy ${falconScore}/100`,
  };
}
