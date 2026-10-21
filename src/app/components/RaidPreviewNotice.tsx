import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import { calculationBlocker, getRaidDefenceFloor, getRaidProfile } from '@/lib/RaidSupport';

const RaidPreviewNotice = observer(() => {
  const store = useStore();
  const raid = getRaidProfile(store.monster);
  const defenceFloor = getRaidDefenceFloor(store.monster);
  const blockers = store.loadouts.map((p) => ({ name: p.name, reason: calculationBlocker(p, store.monster) }))
    .filter((p) => p.reason);
  const missing = raid ? Object.entries(raid.defensive).filter(([key, v]) => v === null && key !== 'flat_armour').map(([key]) => key) : [];
  return (
    <aside className="max-w-[1420px] mx-auto px-4 py-3 text-sm text-gray-900 dark:text-gray-200 bg-body-100 dark:bg-dark-400">
      <p>
        <strong>Unofficial raid data preview.</strong>
        {' Original OSRS Wiki calculator interface; base snapshot: 20 October 2026. Defence hotfix and demonbane review: 21 October 2026. '}
        <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/sources.html`}>Sources and limitations</a>
      </p>
      {raid && (
        <p className="mt-1">
          Outgoing raw DPS only. Raid scaling, movement and phase damage modifiers are not modelled.
          {' Published Defence floors are enforced; other encounter restrictions remain unverified. Unpublished flat armour is assumed to be zero. '}
          {missing.length > 0 && `Unpublished defence fields (${missing.join(', ')}) show zero placeholders; affected calculations are unavailable. `}
          {raid.notes.some((n) => /screenshot|provisional/i.test(n)) && 'This target includes provisional screenshot stats. '}
          {raid.source.url && <a href={raid.source.url} target="_blank" rel="noreferrer">NPC source</a>}
        </p>
      )}
      {defenceFloor !== undefined && (
        <p className="mt-1">
          {raid?.defenceFloorPercent === 0
            ? 'Official hotfix: Defence can be reduced to 0. '
            : `Official hotfix: Defence floor ${defenceFloor} (60% of base; maximum 40% reduction). Additional drains cannot go below this floor. `}
          <a href={raid?.defenceReductionSource?.url} target="_blank" rel="noreferrer">Jagex source</a>
        </p>
      )}
      {raid?.demonbaneVulnerability !== undefined && (
        <p className="mt-1">
          {'Demonbane effectiveness: '}
          {raid.demonbaneVulnerability}
          {'% of the normal bonus. Applied automatically to supported demonbane weapons and spells. '}
          <a href={raid.attributeSource?.url} target="_blank" rel="noreferrer">Wiki source</a>
        </p>
      )}
      {raid?.encounterNote && <p className="mt-1">{raid.encounterNote}</p>}
      {blockers.map((p, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <p key={i} className="mt-1 text-red-700 dark:text-red-200">
          {p.name}
          :
          {' '}
          {p.reason}
        </p>
      ))}
    </aside>
  );
});

export default RaidPreviewNotice;
