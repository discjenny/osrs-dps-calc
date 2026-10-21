# Separate raid-data preview

This folder is an independent clone of the original Wiki calculator. It does not
import, call or edit Scry, the local DPS bridge, bank exports, or the original
upstream checkout. There is no configured Git remote and nothing is published.

## GitHub Pages

1. Create a **new public repository** for this folder, separate from Scry. Retain
   the original LICENSE, attribution, and source files.
2. Push this folder's source to that repository.
3. In the repository's **Settings > Pages**, select **GitHub Actions** as the source.
4. Run **Actions > Deploy raid preview to GitHub Pages > Run workflow**.
5. The workflow reports the hosted URL. It detects the repository subpath or
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
The 17 scoped raid phase profiles are in `cdn/json/raid-profiles.json` with source
revisions and per-field publication status. Other NPCs retain upstream data.
No automatic refresh is enabled: review upstream engine and data changes together.

Items with unimplemented new mechanics and calculations needing unpublished NPC
stats display an explanation rather than a DPS figure. Raid Defence drains are
what-if scenarios: encounter restoration, floors and resets are unverified.
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
