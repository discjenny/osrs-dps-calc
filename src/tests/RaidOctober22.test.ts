import { expect, test } from '@jest/globals';
import { calculationBlocker } from '@/lib/RaidSupport';
import PlayerVsNPCCalc from '@/lib/PlayerVsNPCCalc';
import { MonsterAttribute } from '@/enums/MonsterAttribute';
import { scaleMonster } from '@/lib/MonsterScaling';
import { GlobalState } from '@/state';
import {
  findEquipment, findSpell, getTestMonster, getTestPlayer,
} from '@/tests/utils/TestUtils';

test.each([
  ['Xarth', -20003], ["Dagon'hai Elder", -20007], ["Dagon'hai Monk", -20008], ['Ocellus phase 1', -20009],
] as const)('old %s share links retain their identity after publishing NPC IDs', (name, id) => {
  const store = new GlobalState();
  const stale = getTestMonster(name);
  stale.skills.hp = 1;
  stale.id = id;
  stale.inputs.defenceReductions.dwh = 1;
  store.updateImportedData({
    serializationVersion: 10, loadouts: [], selectedLoadout: 0, monster: stale,
  });
  expect(store.monster.name).toBe(name);
  expect(store.monster.skills.hp).toBeGreaterThan(1);
  expect(store.monster.inputs.defenceReductions.dwh).toBe(1);
});

test('grounded Guardian enables ranged calculations and uses its own fire weakness', () => {
  const m = getTestMonster('Archive Guardian (unshielded)');
  const p = getTestPlayer(m, { style: { name: 'Rapid', type: 'ranged', stance: 'Rapid' } });
  expect(calculationBlocker(p, m)).toBeUndefined();
  expect(m.defensive).toMatchObject({ light: 50, standard: 115, heavy: 50 });
  expect(m.weakness).toEqual({ element: 'fire', severity: 40 });
  expect(getTestMonster('Archive Guardian (shielded)').weakness?.severity).toBe(80);
  m.inputs.defenceReductions.accursed = true;
  expect(calculationBlocker(p, m)).toMatch(/Magic-drain behaviour is unverified/);
});

test.each(["Dagon'hai Elder", "Dagon'hai Monk"])('%s has usable stats and remains fully drainable', (name) => {
  const m = getTestMonster(name);
  const p = getTestPlayer(m, { style: { name: 'Rapid', type: 'ranged', stance: 'Rapid' } });
  expect(calculationBlocker(p, m)).toBeUndefined();
  expect(m.skills).toMatchObject({ hp: 640, def: 100, magic: 290 });
  expect(m.defensive).toMatchObject({ light: 80, standard: 80, heavy: 80 });
  m.inputs.defenceReductions.bgs = 1000;
  expect(scaleMonster(m).skills.def).toBe(0);
});

test('jelly adds support ranged and demonbane with their published stats', () => {
  const m = getTestMonster('Jelly (Fractured Archive)');
  expect(m.skills.hp).toBe(61);
  expect(m.attributes).toContain(MonsterAttribute.DEMON);
  expect(m.defensive).toMatchObject({ light: -45, standard: 18, heavy: -50 });
  expect(m.weakness).toEqual({ element: 'fire', severity: 60 });
  const p = getTestPlayer(m, { equipment: { weapon: findEquipment('Emberlight') } });
  const demon = new PlayerVsNPCCalc(p, m);
  const ordinary = new PlayerVsNPCCalc(p, {
    ...m, id: -1, name: 'Custom', attributes: [],
  });
  expect(demon.getMaxAttackRoll()).toBeGreaterThan(ordinary.getMaxAttackRoll());
  expect(demon.getDistribution().getMax()).toBeGreaterThan(ordinary.getDistribution().getMax());
});

test('corpse water and ice spells use one tick without speeding other spells or custom targets', () => {
  const m = getTestMonster('Corpse (Xarth)');
  expect(m.skills.hp).toBe(20);
  expect(m.defensive).toMatchObject({ light: -20, standard: 80, heavy: 80 });
  for (const spell of ['Water Surge', 'Ice Barrage', 'Fire Surge', 'Blood Barrage']) {
    const p = getTestPlayer(m, {
      equipment: { weapon: findEquipment('Kodai wand') },
      style: { name: 'Autocast', type: 'magic', stance: 'Autocast' },
      spell: findSpell(spell),
    });
    const actual = new PlayerVsNPCCalc(p, m);
    const custom = new PlayerVsNPCCalc(p, { ...m, id: -1 });
    if (spell === 'Water Surge' || spell === 'Ice Barrage') {
      expect(actual.getAttackSpeed()).toBe(1);
      expect(actual.getDps()).toBeCloseTo(custom.getDps() * custom.getAttackSpeed(), 8);
    } else {
      expect(actual.getAttackSpeed()).toBe(custom.getAttackSpeed());
    }
  }
});

test('stunned Bork guarantees melee accuracy only, without altering custom targets', () => {
  const m = getTestMonster('Bork (stunned)');
  const p = getTestPlayer(m, {
    equipment: { weapon: findEquipment('Abyssal bludgeon') },
    style: { name: 'Pound', type: 'crush', stance: 'Aggressive' },
  });
  expect(new PlayerVsNPCCalc(p, m).getHitChance()).toBe(1);
  expect(new PlayerVsNPCCalc(p, { ...m, id: -1 }).getHitChance()).toBeLessThan(1);
  expect(calculationBlocker(p, getTestMonster('Bork'))).toMatch(/Conflicting Wiki armour/);
  p.style = { name: 'Rapid', type: 'ranged', stance: 'Rapid' };
  p.equipment.weapon = findEquipment('Zaryte crossbow');
  p.equipment.ammo = findEquipment('Diamond dragon bolts (e)');
  expect(new PlayerVsNPCCalc(p, m).getHitChance()).toBeLessThan(1);
});

test('normal Bork applies the agreed two-point magic resistance', () => {
  const m = getTestMonster('Bork');
  const p = getTestPlayer(m, {
    equipment: { weapon: findEquipment('Kodai wand') },
    style: { name: 'Autocast', type: 'magic', stance: 'Autocast' },
    spell: findSpell('Earth Surge'),
  });
  expect(calculationBlocker(p, m)).toBeUndefined();
  const actual = new PlayerVsNPCCalc(p, m);
  const noResistance = new PlayerVsNPCCalc(p, { ...m, id: -1 });
  expect(actual.getDistribution().getMax()).toBe(noResistance.getDistribution().getMax() - 2);
  expect(actual.getDps()).toBeLessThan(noResistance.getDps());
});

test('unpublished crystal ranged defences still block calculations', () => {
  const m = getTestMonster('Void Augmenter');
  const p = getTestPlayer(m, { style: { name: 'Rapid', type: 'ranged', stance: 'Rapid' } });
  expect(calculationBlocker(p, m)).toMatch(/Unpublished NPC defence bonuses/);
  expect(getTestMonster('Moia').weakness).toEqual({ element: 'air', severity: 80 });
  expect(getTestMonster('Undead binder').skills).toMatchObject({ def: 225, magic: 50 });
});
