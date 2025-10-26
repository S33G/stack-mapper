'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { decodeSharePayload, SharePayload } from '@/lib/share';

type Props = {
  onLoad: (payload: SharePayload) => void;
};

// Invisible helper that parses the ?s= share param and notifies parent once.
export default function ShareUrlLoader({ onLoad }: Props) {
  const searchParams = useSearchParams();
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    const s = searchParams.get('s');
    if (!s) return;
    if (appliedRef.current === s) return; // avoid duplicate apply
    const payload = decodeSharePayload(s);
    if (payload) {
      appliedRef.current = s;
      onLoad(payload);
    }
  }, [onLoad, searchParams]);

  return null;
}
