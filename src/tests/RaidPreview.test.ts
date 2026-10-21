import { expect, test } from '@jest/globals';
import { getRaidMonsters, calculationBlocker } from '@/lib/RaidSupport';
import { getTestMonster, getTestPlayer, findEquipmentById } from '@/tests/utils/TestUtils';
import PlayerVsNPCCalc from '@/lib/PlayerVsNPCCalc';
import { PlayerEquipment } from '@/types/Player';
import { Prayer } from '@/enums/Prayer';
import { scaleMonster } from '@/lib/MonsterScaling';

function gear(ids: Record<string, number>): Partial<PlayerEquipment> {
  return Object.fromEntries(Object.entries(ids).map(([slot, id]) => [slot, findEquipmentById(id)]));
}

test('raid targets preserve P3 ranged bonuses and separate Bork states', () => {
  expect(getRaidMonsters()).toHaveLength(17);
  const p3 = getTestMonster('Ocellus phase 3');
  expect(p3.skills.def).toBe(250);
  expect(p3.defensive).toMatchObject({
    crush: 30, light: 250, standard: 250, heavy: 250,
  });
  expect(getTestMonster('Bork').defensive.flat_armour).toBe(12);
  expect(getTestMonster('Bork (stunned)').defensive.flat_armour).toBe(0);
});

test('browser engine reproduces the Bowfa comparison and hammer threshold', () => {
  const m = getTestMonster('Ocellus phase 3', '', { inputs: { monsterCurrentHp: 500 } });
  const p = getTestPlayer(m, {
    equipment: gear({
      head: 23971, body: 23975, legs: 23979, weapon: 25865, cape: 28951, neck: 19547, hands: 26235, feet: 31097, ring: 25975,
    }),
    boosts: { ranged: 13 },
    prayers: [Prayer.RIGOUR],
    buffs: { onSlayerTask: false },
    style: { name: 'Rapid', type: 'ranged', stance: 'Rapid' },
  });
  expect(calculationBlocker(p, m)).toBeUndefined();
  expect(new PlayerVsNPCCalc(p, m).getDps()).toBeCloseTo(3.515, 3);
  m.inputs.defenceReductions.dwh = 2;
  expect(scaleMonster(m).skills.def).toBe(123);
});

test('browser engine reproduces the compact bludgeon swap', () => {
  const m = getTestMonster('Ocellus phase 3');
  const p = getTestPlayer(m, {
    equipment: gear({
      head: 26382, body: 11828, legs: 27241, weapon: 13263, cape: 28951, neck: 24780, hands: 22981, feet: 31097, ring: 25975,
    }),
    boosts: { atk: 19, str: 19 },
    prayers: [Prayer.PIETY],
    buffs: { onSlayerTask: false },
    style: { name: 'Pound', type: 'crush', stance: 'Aggressive' },
  });
  expect(new PlayerVsNPCCalc(p, m).getDps()).toBeCloseTo(5.349, 3);
});

test('unpublished stats cannot silently turn into a usable zero-defence target', () => {
  const m = getTestMonster('Ezekiel');
  const p = getTestPlayer(m, { style: { name: 'Lunge', type: 'stab', stance: 'Aggressive' } });
  expect(m.defensive.stab).toBe(150);
  expect(getTestMonster('Xarth').defensive.stab).toBe(115);
  expect(calculationBlocker(p, m)).toBeUndefined();
  p.style.type = 'ranged';
  expect(calculationBlocker(p, getTestMonster('Archive Guardian (unshielded)'))).toMatch(/Unpublished NPC defence bonuses/);
  p.style.type = 'crush';
  expect(calculationBlocker(p, m)).toBeUndefined();
  expect(calculationBlocker(p, getTestMonster('Ocellus phase 2'))).toMatch(/Unpublished NPC levels: hp/);
});

test('new unsupported effects are searchable but do not produce misleading DPS', () => {
  const m = getTestMonster('Ocellus phase 3');
  const p = getTestPlayer(m);
  p.equipment.weapon = { ...findEquipmentById(13263), name: 'Obligator' };
  expect(calculationBlocker(p, m)).toMatch(/not implemented/);
});
