import { expect, test } from '@jest/globals';
import { scaleMonster } from '@/lib/MonsterScaling';
import { getDefenceFloor } from '@/lib/scaling/DefenceReduction';
import { getTestMonster } from '@/tests/utils/TestUtils';

const capped: [string, number][] = [
  ['Archive Guardian (shielded)', 156],
  ['Archive Guardian (unshielded)', 156],
  ['Bork', 180], ['Bork (stunned)', 180], ['Ezekiel', 78], ['Moia', 117],
  ['Xarth', 102], ['Ocellus phase 1', 129], ['Ocellus phase 2', 150], ['Ocellus phase 3', 150],
];

test.each(capped)('%s enforces its published floor of %i for every Defence drain', (name, floor) => {
  const original = getTestMonster(name);
  expect(getDefenceFloor(original)).toBe(floor);
  expect(scaleMonster(original).skills.def).toBe(original.skills.def);
  for (const method of ['dwh', 'elderMaul', 'arclight', 'emberlight', 'tonalztic', 'bgs'] as const) {
    const monster = getTestMonster(name);
    monster.inputs.defenceReductions[method] = 1000;
    const reduced = scaleMonster(monster);
    expect(reduced.skills.def).toBe(floor);
    expect(getDefenceFloor(reduced)).toBe(floor);
  }
});

test('hammers precede BGS and excess BGS does not spill past a nonzero Defence floor', () => {
  const monster = getTestMonster('Ocellus phase 3');
  monster.inputs.defenceReductions.dwh = 1;
  expect(scaleMonster(monster).skills.def).toBe(175);
  monster.inputs.defenceReductions.bgs = 24;
  expect(scaleMonster(monster).skills.def).toBe(151);
  monster.inputs.defenceReductions.bgs = 25;
  expect(scaleMonster(monster).skills.def).toBe(150);
  monster.inputs.defenceReductions.bgs = 1000;
  const reduced = scaleMonster(monster);
  expect(reduced.skills.def).toBe(150);
  expect(reduced.skills.magic).toBe(monster.skills.magic);
  expect(reduced.skills.atk).toBe(monster.skills.atk);
  monster.inputs.defenceReductions.bgs = 0;
  monster.inputs.defenceReductions.dwh = 2;
  expect(scaleMonster(monster).skills.def).toBe(150);
});

test.each([
  'Dreadnoth the Jellied', 'The Smorks', "Dagon'hai (shielded)",
  "Dagon'hai (unshielded)", 'The Blade (Ocellus phase 2)',
])('%s can still reach zero Defence', (name) => {
  const monster = getTestMonster(name);
  monster.inputs.defenceReductions.bgs = 1000;
  expect(getDefenceFloor(monster)).toBe(0);
  expect(scaleMonster(monster).skills.def).toBe(0);
});

test('the Defence hotfix does not invent a Magic floor or affect custom targets', () => {
  const monster = getTestMonster('Xarth');
  monster.inputs.defenceReductions.accursed = true;
  monster.inputs.defenceReductions.dwh = 10;
  const reduced = scaleMonster(monster);
  expect(reduced.skills.def).toBe(102);
  expect(reduced.skills.magic).toBe(Math.trunc(monster.skills.magic * 0.85));
  monster.id = -1;
  monster.inputs.defenceReductions.bgs = 1000;
  expect(getDefenceFloor(monster)).toBe(0);
  expect(scaleMonster(monster).skills.def).toBe(0);
});
