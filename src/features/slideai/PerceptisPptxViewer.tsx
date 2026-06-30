import { useEffect, useRef, useState } from 'react';

type Props = {
  blob: ArrayBuffer;
  slideIndex: number;
  onSlideCount?: (count: number) => void;
  className?: string;
};

export function PerceptisPptxViewer({ blob, slideIndex, onSlideCount, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<{ renderSlide: (i: number, c: HTMLCanvasElement) => Promise<unknown>; destroy: () => void; getSlideCount: () => number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !blob.byteLength) return;

    let cancelled = false;
    setLoadError(null);
    setReady(false);

    (async () => {
      try {
        const { PPTXViewer } = await import('pptxviewjs');
        if (cancelled) return;

        const viewer = new PPTXViewer({
          canvas,
          backgroundColor: '#ffffff',
          slideSizeMode: 'fit',
        });
        viewerRef.current = viewer;

        await viewer.loadFile(blob);
        if (cancelled) return;

        const count = viewer.getSlideCount();
        onSlideCount?.(count);
        const index = Math.min(Math.max(slideIndex, 0), Math.max(count - 1, 0));
        await viewer.renderSlide(index, canvas);
        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Could not render Perceptis deck');
        }
      }
    })();

    return () => {
      cancelled = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [blob, onSlideCount]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const canvas = canvasRef.current;
    if (!viewer || !canvas || !ready) return;
    void viewer.renderSlide(slideIndex, canvas);
  }, [slideIndex, ready]);

  if (loadError) {
    return (
      <div className="cc-slideai__perceptis-error">
        <p>{loadError}</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={['cc-slideai__perceptis-canvas', className].filter(Boolean).join(' ')}
      aria-label="Perceptis PowerPoint preview"
    />
  );
}
