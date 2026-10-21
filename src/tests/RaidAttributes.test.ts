import { expect, test } from '@jest/globals';
import { MonsterAttribute } from '@/enums/MonsterAttribute';
import { getRaidMonsters } from '@/lib/RaidSupport';
import PlayerVsNPCCalc from '@/lib/PlayerVsNPCCalc';
import { GlobalState } from '@/state';
import {
  findEquipment, findSpell, getTestMonster, getTestPlayer,
} from '@/tests/utils/TestUtils';

const demons: [string, number][] = [
  ['Dreadnoth the Jellied', 25],
  ['Xarth', 80],
  ['Ocellus phase 1', 80],
  ['Ocellus phase 3', 80],
];

test('saved raid targets refresh published stats while retaining defence-drain inputs', () => {
  const store = new GlobalState();
  const stale = getTestMonster('Xarth');
  stale.defensive.stab = 0;
  stale.inputs.defenceReductions.dwh = 2;
  store.updateImportedData({
    serializationVersion: 10, loadouts: [], selectedLoadout: 0, monster: stale,
  });
  expect(store.monster.defensive.stab).toBe(115);
  expect(store.monster.inputs.defenceReductions.dwh).toBe(2);
  store.updateImportedData({
    serializationVersion: 10,
    loadouts: [],
    selectedLoadout: 0,
    monster: { ...stale, id: -1 },
  });
  expect(store.monster.defensive.stab).toBe(0);
});

test('raid attributes contain only supported values, with no scraped template fragments', () => {
  for (const monster of getRaidMonsters()) {
    for (const attr of monster.attributes) expect(Object.values(MonsterAttribute)).toContain(attr);
  }
});

test.each(demons)('%s applies its %i%% demonbane rate to weapons and Mark of Darkness', (name, rate) => {
  const monster = getTestMonster(name);
  expect(monster.attributes).toContain(MonsterAttribute.DEMON);
  const custom = {
    ...monster, id: -1, name: 'Custom', inputs: { ...monster.inputs, demonbaneVulnerability: rate },
  };
  const fullEffect = { ...custom, inputs: { ...custom.inputs, demonbaneVulnerability: 100 } };
  for (const weapon of ['Emberlight', 'Arclight', 'Scorching bow', 'Burning claws', 'Purging staff']) {
    const magic = weapon === 'Purging staff';
    const player = getTestPlayer(monster, {
      equipment: { weapon: findEquipment(weapon), ammo: weapon === 'Scorching bow' ? findEquipment('Dragon arrow') : null },
      buffs: { onSlayerTask: false, markOfDarknessSpell: magic },
      ...(magic ? {
        style: { name: 'Autocast', type: 'magic', stance: 'Autocast' },
        spell: findSpell('Dark Demonbane'),
      } as const : {}),
    });
    const actual = new PlayerVsNPCCalc(player, monster);
    const expected = new PlayerVsNPCCalc(player, custom);
    const defaultDemon = new PlayerVsNPCCalc(player, fullEffect);
    expect(actual.getMaxAttackRoll()).toBe(expected.getMaxAttackRoll());
    expect(actual.getDistribution().getMax()).toBe(expected.getDistribution().getMax());
    expect(actual.getDps()).toBeCloseTo(expected.getDps(), 8);
    expect(actual.getMaxAttackRoll()).toBeLessThan(defaultDemon.getMaxAttackRoll());
  }
});

test.each(['Ezekiel', 'Dreadnoth the Jellied', 'Xarth', 'Ocellus phase 1', 'Ocellus phase 3', 'Moia'])('Salve does not grant an unconfirmed undead bonus on %s', (name) => {
  const monster = getTestMonster(name);
  expect(monster.attributes).not.toContain(MonsterAttribute.UNDEAD);
  const equipment = { weapon: findEquipment('Abyssal bludgeon') };
  const plain = new PlayerVsNPCCalc(getTestPlayer(monster, { equipment }), monster);
  const salve = new PlayerVsNPCCalc(getTestPlayer(monster, {
    equipment: { ...equipment, neck: findEquipment('Salve amulet(ei)') },
  }), monster);
  expect(salve.getMaxAttackRoll()).toBe(plain.getMaxAttackRoll());
  expect(salve.getDistribution().getMax()).toBe(plain.getDistribution().getMax());
});

test.each(['melee', 'ranged', 'magic'])('Salve (ei) still buffs %s against a confirmed undead skeleton', (style) => {
  const monster = getTestMonster('Skeleton');
  expect(monster.attributes).toContain(MonsterAttribute.UNDEAD);
  const weapons: Record<string, string> = { melee: 'Abyssal bludgeon', ranged: 'Scorching bow', magic: 'Kodai wand' };
  const weapon = weapons[style];
  const player = getTestPlayer(monster, {
    equipment: { weapon: findEquipment(weapon), ammo: style === 'ranged' ? findEquipment('Dragon arrow') : null },
    buffs: { onSlayerTask: false },
    ...(style === 'magic' ? {
      style: { name: 'Autocast', type: 'magic', stance: 'Autocast' }, spell: findSpell('Ice Barrage'),
    } as const : {}),
  });
  const plain = new PlayerVsNPCCalc(player, monster);
  const salvePlayer = getTestPlayer(monster, { ...player, equipment: { ...player.equipment, neck: findEquipment('Salve amulet(ei)') } });
  const salve = new PlayerVsNPCCalc(salvePlayer, monster);
  expect(salve.getMaxAttackRoll()).toBeGreaterThan(plain.getMaxAttackRoll());
  expect(salve.getDistribution().getMax()).toBeGreaterThan(plain.getDistribution().getMax());
});
