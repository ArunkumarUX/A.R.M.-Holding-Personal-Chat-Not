import { Fragment } from 'react';

function inline(s: string) {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i} style={{ fontWeight: 700, color: 'var(--ink)' }}>
        {p.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    ),
  );
}

function isTableRow(line: string) {
  const t = line.trim();
  return t.startsWith('|') && t.endsWith('|') && t.includes('|');
}

function isTableSep(line: string) {
  const t = line.trim().replace(/\|/g, '').replace(/ /g, '');
  return /^[\-:]+$/.test(t) && line.includes('-');
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

function VizBar({ text }: { text: string }) {
  const m = text.match(/([█░]+)\s*\*\*(\d+\/\d+)\*\*/);
  if (!m) {
    return (
      <div className="chat-viz-bar">
        <code className="chat-viz-bar__chars">{text}</code>
      </div>
    );
  }
  return (
    <div className="chat-viz-bar" role="img" aria-label={`Score ${m[2]}`}>
      <span className="chat-viz-bar__chars" aria-hidden>
        {m[1]}
      </span>
      <span className="chat-viz-bar__score">{m[2]}</span>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="chat-md-table-wrap">
      <table className="chat-md-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{inline(h.replace(/\*\*/g, ''))}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci}>{inline(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function mdToNodes(text: string) {
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  let list: React.ReactNode[] | null = null;
  let key = 0;

  const flush = () => {
    if (list) {
      out.push(
        <ul key={`u${key++}`} className="chat-md-list">
          {list}
        </ul>,
      );
      list = null;
    }
  };

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const t = raw.trim();

    if (!t) {
      flush();
      i += 1;
      continue;
    }

    if (isTableRow(t)) {
      flush();
      const headers = parseTableRow(t);
      i += 1;
      if (i < lines.length && isTableSep(lines[i])) i += 1;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        rows.push(parseTableRow(lines[i]));
        i += 1;
      }
      out.push(<Table key={`tbl${key++}`} headers={headers} rows={rows} />);
      continue;
    }

    if (/^[•\-]\s/.test(t) || /^\d+\.\s/.test(t)) {
      list = list || [];
      const item = t.replace(/^[•\-]\s/, '').replace(/^\d+\.\s/, '');
      list.push(
        <li key={key++} className="chat-md-list__item">
          {inline(item)}
        </li>,
      );
      i += 1;
      continue;
    }

    flush();

    if (t.startsWith('> ')) {
      out.push(
        <blockquote key={key++} className="chat-verdict">
          {inline(t.slice(2).trim())}
        </blockquote>,
      );
      i += 1;
      continue;
    }

    if (t.startsWith('### ')) {
      out.push(
        <h4 key={key++} className="chat-md-h3">
          {inline(t.slice(4))}
        </h4>,
      );
      i += 1;
      continue;
    }

    if (t.startsWith('## ')) {
      out.push(
        <h3 key={key++} className="chat-md-h2">
          {inline(t.slice(3))}
        </h3>,
      );
      i += 1;
      continue;
    }

    if (/^[█░]/.test(t) || (t.includes('█') && t.includes('░░'))) {
      out.push(<VizBar key={key++} text={t} />);
      i += 1;
      continue;
    }

    if (/^\*\*.+\*\*$/.test(t) && !t.slice(2, -2).includes('**')) {
      out.push(
        <div key={key++} className="chat-md-strong-line">
          {inline(t)}
        </div>,
      );
      i += 1;
      continue;
    }

    if (t.startsWith('*') && t.endsWith('*') && !t.startsWith('**')) {
      out.push(
        <p key={key++} className="chat-md-caption muted-3">
          {t.slice(1, -1)}
        </p>,
      );
      i += 1;
      continue;
    }

    out.push(
      <p key={key++} className="chat-md-p">
        {inline(t)}
      </p>,
    );
    i += 1;
  }

  flush();
  return out;
}
