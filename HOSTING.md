# Separate raid-data preview

This folder is an independent clone of the original Wiki calculator. It does not
import, call or edit Scry, the local DPS bridge, bank exports, or the original
upstream checkout.

Repository: https://github.com/discjenny/osrs-dps-calc

GitHub Pages URL: https://discjenny.github.io/osrs-dps-calc/

The `origin` remote points only to this separate fork. The local `pages-live`
branch tracks its `main` branch; the local `main` branch preserves the original
prepared snapshot. Publish updates with the manual workflow below.

## GitHub Pages

1. Commit reviewed changes to this fork's `main` branch. Retain the original
   LICENSE, attribution, and source files.
2. **Settings > Pages** already uses **GitHub Actions** as the source.
3. Run **Actions > Deploy raid preview to GitHub Pages > Run workflow** on `main`.
4. The workflow reports the hosted URL. It detects the repository subpath or
   custom domain through `configure-pages`; no hardcoded account name is needed.

Deployment is manual. No scheduled scraper, upstream deployment credentials,
Scry services, database, API server or paid hosting plan is required.

## Local build

Use Node 22, and the checked-in Yarn executable:

```powershell
node .yarn/releases/yarn-4.9.2.cjs install --immutable
node .yarn/releases/yarn-4.9.2.cjs build:preview
python -m http.server 8088 --bind 127.0.0.1 --directory out
```

Open http://localhost:8088. To verify a Pages repository path locally, set
`NEXT_PUBLIC_BASE_PATH=/osrs-dps-web` before building, then serve `out` mounted at
that path with `python scripts/serve-preview.py --base-path /osrs-dps-web`.
`NEXT_PUBLIC_BASE_URL` is the site's origin, without the repository path.

## Data and supported mechanics

Equipment and aliases are copied snapshots from 20 October 2026 (5,462 items).
The 30 scoped raid boss/add profiles are in `cdn/json/raid-profiles.json` with source
revisions and per-field publication status. Other NPCs retain upstream data.
No automatic refresh is enabled: review upstream engine and data changes together.

The 22 October 2026 review refreshes Wiki revisions for bosses and adds. Grounded
Guardian ranged stats and 40% fire weakness, Moia's 80% air weakness, Dagon'hai
stats, Jelly/Corpse ranged stats and weaknesses, Jelly's demon attribute, and
Undead binder corrections are included. Corpse water/ice spells use a 1-tick
interval; dousing remains a manually selected target state. The Smorks use 2
flat armour. Stunned Bork has guaranteed melee accuracy and zero armour.
Normal Bork's physical armour is disputed (infobox 10 vs strategy 8), so physical
DPS is blocked; the agreed 2-point magic resistance is applied. Guardian Magic
drains are blocked pending a confirmed absorption formula. Unknown crystal/add
ranged defences remain blocked. Source revisions and limitations accompany the
profiles. This review does not refresh the equipment snapshot or Scry.

The 21 October 2026 attribute review applies the Wiki's reduced demonbane
effectiveness: Dreadnoth 25%, Xarth and Ocellus phases 1/3 80%. The rates scale
weapon/spell bonuses through the original engine's rounding. Salve still requires
a confirmed undead attribute; raid minion appearances are not treated as proof.
The profile JSON records the review sources and the separately checked Xarth and
Ezekiel stab defences (115 and 150).

Items with unimplemented new mechanics and calculations needing unpublished NPC
stats display an explanation rather than a DPS figure. The official 21 October
Defence hotfix is enforced: Guardian, Bork, Ezekiel, Moia, Xarth and Ocellus stop
at 60% of base Defence. Dreadnoth, Smorks, the Dagon'hai trio and the P2 Blade can
reach zero. Ocellus P3 drains persist between quadrants. Other phase transitions,
add-specific floors and encounter restrictions remain unverified. Earlier
below-floor comparisons for capped bosses are obsolete.
See the site's Sources and limitations page for details.

UI changes are limited to a preview/source notice, guards for incomplete data,
local assets, and self-contained share links. Shared loadouts include the selected
NPC and equipment in the URL fragment, so friends need no account or backend.

New item/NPC artwork missing from the upstream cache uses a question-mark icon.
It does not affect numerical calculations. Original imagery/credits are retained.

## Validation

```powershell
node .yarn/releases/yarn-4.9.2.cjs jest src/tests/RaidPreview.test.ts src/tests/StaticShare.test.ts --runInBand
node node_modules/typescript/bin/tsc --noEmit
node .yarn/releases/yarn-4.9.2.cjs build:preview
```

Preparation checks: production export, lint and type checks passed; 340 tests passed
and four pre-existing tests were skipped. The old Bowfa roll tests now explicitly
select the charged variant; their expected results are unchanged.
