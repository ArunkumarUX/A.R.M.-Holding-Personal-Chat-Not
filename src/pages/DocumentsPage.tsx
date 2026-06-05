import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  MessageSquare,
  Loader2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DocumentPipeline } from '../components/infographics/DocumentPipeline';
import type { DocumentFile } from '../types';
import { FOCUS_AREA_MAP, getDocumentsForFocusArea, type FocusAreaId } from '../data/focusAreas';

export function DocumentsPage() {
  const [searchParams] = useSearchParams();
  const focusParam = searchParams.get('focus') as FocusAreaId | null;
  const activeFocus =
    focusParam && FOCUS_AREA_MAP[focusParam] ? FOCUS_AREA_MAP[focusParam] : null;

  const { documents, uploadDocument, removeDocument, setInputDraft, showToast } = useApp();
  const filteredDocs = useMemo(
    () => (activeFocus ? getDocumentsForFocusArea(activeFocus.id, documents) : documents),
    [activeFocus, documents],
  );
  const [selected, setSelected] = useState<DocumentFile | null>(null);
  useEffect(() => {
    setSelected((prev) => {
      if (prev && filteredDocs.some((d) => d.id === prev.id)) return prev;
      return filteredDocs[0] ?? null;
    });
  }, [filteredDocs]);
  const [question, setQuestion] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="grid mi-stagger cc-page cc-documents" style={{ gap: 16 }}>
      <motion.div
        className="cc-documents__header"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {activeFocus && (
          <Link
            to={`/focus/${activeFocus.id}`}
            className="text-sm text-adgm-primary hover:underline mb-1 inline-block"
          >
            ← {activeFocus.title}
          </Link>
        )}
        <h1 className="font-display text-xl font-semibold text-adgm-navy">Document analysis</h1>
        <p className="text-sm text-adgm-slate mt-1 mb-4">
          {activeFocus
            ? `Knowledge base documents tagged for ${activeFocus.shortTitle}.`
            : 'Upload PDF or DOCX for summaries, key clauses, and Q&A with cited snippets.'}
        </p>
        <div className="max-w-md">
          <DocumentPipeline />
        </div>
      </motion.div>

      <div className="cc-documents__layout">
        <div className="cc-documents__sidebar scrollbar-thin">
          <motion.label
            whileHover={{ scale: 1.01, borderColor: '#0088FF' }}
            whileTap={{ scale: 0.99 }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-adgm-champagne bg-adgm-ivory/50 p-6 cursor-pointer hover:bg-adgm-sky-bg transition-colors duration-300 mb-4"
          >
            <Upload className="h-8 w-8 text-adgm-primary mb-2" />
            <span className="text-sm font-medium text-adgm-navy">Upload PDF or DOCX</span>
            <span className="text-xs text-adgm-mist mt-1">Max 25 MB · Secure upload</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadDocument(f.name);
              }}
            />
          </motion.label>

          <ul className="space-y-2">
            {filteredDocs.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => setSelected(d)}
                  className={`w-full flex items-start gap-3 rounded-xl p-3 text-start transition-colors ${
                    selected?.id === d.id ? 'bg-adgm-sand/60 border border-adgm-champagne/50' : 'hover:bg-adgm-ivory'
                  }`}
                >
                  {d.status === 'processing' ? (
                    <Loader2 className="h-5 w-5 shrink-0 text-adgm-gold animate-spin" />
                  ) : (
                    <FileText className="h-5 w-5 shrink-0 text-adgm-gold" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-adgm-navy truncate">{d.name}</p>
                    <p className="text-xs text-adgm-mist">
                      {d.type} · {d.size} · {d.status}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="cc-documents__main scrollbar-thin">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-adgm-mist">
              <FileText className="h-12 w-12 mb-3 opacity-40" />
              <p>Select or upload a document</p>
            </div>
          ) : selected.status === 'processing' ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-10 w-10 text-adgm-gold animate-spin mb-4" />
              <p className="font-medium text-adgm-navy">Processing document...</p>
              <p className="text-sm text-adgm-mist mt-1">Extracting text, chunking, and indexing</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-adgm-navy">{selected.name}</h2>
                  <p className="text-xs text-adgm-mist mt-1">Uploaded {selected.uploadedAt}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="flex items-center gap-1 rounded-lg border border-adgm-line bg-white px-3 py-1.5 text-xs font-medium hover:border-adgm-gold"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeDocument(selected.id);
                      setSelected(documents.find((d) => d.id !== selected.id) ?? null);
                    }}
                    className="flex items-center gap-1 rounded-lg border border-adgm-line bg-white px-3 py-1.5 text-xs font-medium text-adgm-error hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>

              {selected.summary && (
                <section className="rounded-2xl border border-adgm-line bg-white p-5 shadow-adgm-sm">
                  <h3 className="text-sm font-semibold text-adgm-navy mb-2">Extracted summary</h3>
                  <p className="text-sm text-adgm-charcoal leading-relaxed">{selected.summary}</p>
                </section>
              )}

              {selected.keyInsights && selected.keyInsights.length > 0 && (
                <section className="rounded-2xl border border-adgm-line bg-white p-5 shadow-adgm-sm">
                  <h3 className="text-sm font-semibold text-adgm-navy mb-3">Key insights</h3>
                  <ul className="space-y-2">
                    {selected.keyInsights.map((k, i) => (
                      <li key={i} className="flex gap-2 text-sm text-adgm-charcoal">
                        <span className="text-adgm-gold font-bold">{i + 1}.</span>
                        {k}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {selected.clauses && selected.clauses.length > 0 && (
                <section className="rounded-2xl border border-adgm-line bg-white p-5 shadow-adgm-sm">
                  <h3 className="text-sm font-semibold text-adgm-navy mb-3">Key clauses</h3>
                  {selected.clauses.map((c, i) => (
                    <div key={i} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-0 border-adgm-line">
                      <p className="text-xs font-semibold text-adgm-gold-deep mb-1">{c.title}</p>
                      <p className="text-sm text-adgm-charcoal italic border-s-2 border-adgm-sand ps-3">
                        {c.text}
                      </p>
                    </div>
                  ))}
                </section>
              )}

              <section className="rounded-2xl border border-adgm-line bg-white p-5 shadow-adgm-sm">
                <h3 className="text-sm font-semibold text-adgm-navy mb-3">Ask about this document</h3>
                <div className="flex gap-2">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g. What FSRA approvals are implied?"
                    className="flex-1 rounded-xl border border-adgm-line px-4 py-2.5 text-sm focus:border-adgm-gold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!question.trim()) return;
                      setInputDraft(`[${selected.name}] ${question}`);
                      showToast('Question ready — open Chat to send', 'info');
                      setQuestion('');
                    }}
                    className="flex items-center gap-1 rounded-full bg-adgm-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-adgm-primary-hover"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Ask
                  </button>
                </div>
                <p className="text-xs text-adgm-mist mt-2">
                  Cited snippets will appear in the Sources panel with confidence scores.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>

      {previewOpen && selected && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-adgm-navy/40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-adgm-lg animate-slide-up">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-adgm-navy">Document preview</h3>
              <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-xl bg-adgm-ivory p-8 text-center text-sm text-adgm-mist min-h-[200px] flex flex-col items-center justify-center">
              <FileText className="h-12 w-12 text-adgm-gold mb-3" />
              <p className="font-medium text-adgm-navy">{selected.name}</p>
              <p className="mt-2">Preview placeholder — full PDF viewer in production</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
