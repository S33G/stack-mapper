'use client';

import { useMemo } from 'react';
import { Connector, PinMapping } from '@/types';
import { buildPayload, encodeSharePayload } from '@/lib/share';

type Props = {
  escConnector: Connector | null;
  fcConnector: Connector | null;
  mappings: PinMapping[];
};

export default function ShareButtons({ escConnector, fcConnector, mappings }: Props) {
  const shareEncoded = useMemo(() => {
    if (!escConnector || !fcConnector) return '';
    try {
      return encodeSharePayload(buildPayload(escConnector, fcConnector, mappings || []));
    } catch {
      return '';
    }
  }, [escConnector, fcConnector, mappings]);

  const shareUrl = useMemo(() => {
    if (!shareEncoded) return '';
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('s', shareEncoded);
    return url.toString();
  }, [shareEncoded]);

  if (!escConnector || !fcConnector) return null;

  return (
    <>
      <button
        onClick={() => {
          if (!shareUrl) return;
          try {
            navigator.clipboard.writeText(shareUrl);
          } catch {}
        }}
        className="px-3 py-1 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700"
        title="Copy a shareable link to your current configuration"
      >
        Copy Share Link
      </button>
      <a
        href={shareUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1 text-sm rounded border border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        title="Open this configuration in a new tab via URL"
      >
        Open Link
      </a>
    </>
  );
}
