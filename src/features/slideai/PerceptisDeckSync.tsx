import { useEffect, useRef } from 'react';
import type { PerceptisDeckPayload } from '../../api/perceptisDeckPayload';
import { usePerceptisDeckStore } from './perceptisDeckStore';

type Props = {
  payload: PerceptisDeckPayload | null;
  sourceKey: string;
  enabled?: boolean;
};

/** Sync Perceptis generation when presentation builder payload changes. */
export function PerceptisDeckSync({ payload, sourceKey, enabled = true }: Props) {
  const startFromPrompt = usePerceptisDeckStore((s) => s.startFromPrompt);
  const reset = usePerceptisDeckStore((s) => s.reset);
  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  useEffect(() => {
    if (!enabled || !payloadRef.current) {
      reset();
      return;
    }
    const displayPrompt =
      payloadRef.current.prompt?.trim() ||
      payloadRef.current.deck?.title?.trim() ||
      'Apparel Group Presentation';
    startFromPrompt(payloadRef.current, sourceKey, displayPrompt);
  }, [enabled, sourceKey, startFromPrompt, reset]);

  return null;
}
