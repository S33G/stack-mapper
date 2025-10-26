import { Connector, PinMapping } from '@/types';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export type SharePayload = {
  e: Connector; // escConnector
  f: Connector; // fcConnector
  m: PinMapping[]; // mappings
  v: 1; // version for future proofing
};

export function buildPayload(escConnector: Connector, fcConnector: Connector, mappings: PinMapping[]): SharePayload {
  return { e: escConnector, f: fcConnector, m: mappings, v: 1 };
}

export function encodeSharePayload(payload: SharePayload): string {
  // Encodes to URL-safe string
  return compressToEncodedURIComponent(JSON.stringify(payload));
}

export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (parsed && parsed.e && parsed.f && Array.isArray(parsed.m)) {
      return parsed as SharePayload;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildShareUrl(encoded: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('s', encoded);
  return url.toString();
}
