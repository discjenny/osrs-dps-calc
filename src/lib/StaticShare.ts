import { ImportableData } from '@/types/State';

export function encodeShare(data: ImportableData): string {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function decodeShare(token: string): ImportableData {
  if (token.length > 500000) throw new Error('Shared loadout is too large');
  const text = new TextDecoder().decode(Uint8Array.from(atob(token.replaceAll('-', '+').replaceAll('_', '/')), (c) => c.charCodeAt(0)));
  const data = JSON.parse(text, (key, value) => {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error('Invalid shared loadout');
    return value;
  });
  if (!data || !Array.isArray(data.loadouts) || data.loadouts.length > 6 || !data.monster || !data.serializationVersion) {
    throw new Error('Invalid shared loadout');
  }
  return data;
}
