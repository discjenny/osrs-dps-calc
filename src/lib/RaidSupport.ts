import { Monster } from '@/types/Monster';
import { Player } from '@/types/Player';
import profiles from '../../cdn/json/raid-profiles.json';
import equipment from '../../cdn/json/equipment.json';

type RaidProfile = {
  name: string; version: string; sourceNpcIds: number[]; size: number; speed: number;
  skills: Record<string, number | null>; offensive: Record<string, number | null>;
  defensive: Record<string, number | null>; attributes: string[];
  weakness: Monster['weakness']; immunities: { burn: string | null };
  notes: string[]; source: { url?: string; timestamp?: string };
  demonbaneVulnerability?: number;
  defenceFloorPercent?: number;
  defenceReductionSource?: { url: string; checkedAt: string };
  encounterNote?: string;
  attributeSource?: { url: string; checkedAt: string };
};

const rows = Object.values(profiles.bosses) as unknown as RaidProfile[];
const numeric = (values: Record<string, number | null>) => Object.fromEntries(
  Object.entries(values).map(([key, value]) => [key, value ?? 0]),
);

export const getRaidMonsters = (): Omit<Monster, 'inputs'>[] => rows.map((row, i) => ({
  id: row.sourceNpcIds[0] ?? (-20000 - i),
  name: row.name,
  version: row.version,
  image: '',
  size: row.size,
  speed: row.speed,
  style: null,
  maxHit: 0,
  skills: numeric(row.skills),
  offensive: numeric(row.offensive),
  defensive: numeric(row.defensive),
  attributes: row.attributes,
  weakness: row.weakness,
  immunities: row.immunities,
  is_slayer_monster: false,
} as Omit<Monster, 'inputs'>));

export const getRaidProfile = (monster: Pick<Monster, 'name'>) => rows.find((r) => r.name === monster.name);

export const getRaidDefenceFloor = (monster: Pick<Monster, 'id' | 'name'>): number | undefined => {
  if (monster.id === -1) return undefined;
  const raid = getRaidProfile(monster);
  if (raid?.defenceFloorPercent === undefined || raid.skills.def === null) return undefined;
  // Use the published base level, even when the displayed monster is already drained.
  return Math.trunc(raid.skills.def * raid.defenceFloorPercent / 100);
};

export const calculationBlocker = (player: Player, monster: Monster): string | undefined => {
  for (const item of Object.values(player.equipment)) {
    if (!item) continue;
    if (/^(Obligator|Zorya's tome|Ascension crossbows)$/.test(item.name)
      || /ascension bolts|^Living record/i.test(item.name)) {
      return `${item.name}: its new combat effects are not implemented in this engine yet.`;
    }
    const row = equipment.find((e) => e.id === item.id) as { dataWarnings?: string[] } | undefined;
    if (row?.dataWarnings?.length) return `${item.name}: ${row.dataWarnings.join('; ')}`;
  }
  const raid = getRaidProfile(monster);
  if (!raid) return undefined;
  const required = ['hp', 'def', 'magic'].filter((key) => raid.skills[key] === null);
  if (required.length) return `Unpublished NPC levels: ${required.join(', ')}. No DPS result is available.`;
  const style = player.style.type;
  const keys = style === 'ranged' ? ['light', 'standard', 'heavy'] : [style || 'crush'];
  const missing = keys.filter((key) => raid.defensive[key] === null);
  if (missing.length) return `Unpublished NPC defence bonuses: ${missing.join(', ')}. This attack style cannot be calculated yet.`;
  if (monster.name.startsWith('Archive Guardian') && player.spell?.spellbook === 'ancient') {
    return 'Archive Guardian is immune to Ancient Magicks.';
  }
  return undefined;
};
