/** @jest-environment node */
import { expect, test } from '@jest/globals';
import { encodeShare, decodeShare } from '@/lib/StaticShare';
import { ImportableData } from '@/types/State';

test('share links round-trip Unicode names and NPC data without a server', () => {
  const data = {
    serializationVersion: 10, loadouts: [{ name: 'Bowfa → Ocellus' }], selectedLoadout: 0, monster: { name: 'Ocellus phase 3', skills: { def: 250 } },
  } as ImportableData;
  const token = encodeShare(data);
  expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  expect(decodeShare(token)).toEqual(data);
});

test('malformed and oversized shared data is rejected', () => {
  expect(() => decodeShare('!not-json')).toThrow();
  expect(() => decodeShare('a'.repeat(500001))).toThrow(/too large/);
  expect(() => decodeShare(btoa('{"loadouts":[]}'))).toThrow(/Invalid/);
});
