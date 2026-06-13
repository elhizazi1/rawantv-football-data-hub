# RawanTV Football Data Hub

A unified, normalized football data warehouse powering the **RawanTV** mobile app.
Aggregates data from multiple free open sources, normalizes it under a single schema,
and publishes clean JSON files optimized for mobile consumption (Android/iOS),
offline caching, and use as a drop-in API replacement for SofaScore-style apps.

> This is **not** a scraper. It is a production-grade data pipeline:
> **Collect → Normalize → Merge → Publish**.

---

## Data Sources

| Source | Purpose | License |
|---|---|---|
| [TheSportsDB](https://www.thesportsdb.com/api.php) | Teams, players, leagues, logos | Free API |
| [Football-Data.org](https://www.football-data.org/) | Fixtures, standings, competitions | Free tier |
| [OpenFootball](https://github.com/openfootball) | Historical fixtures, league seasons | Public Domain |
| [StatsBomb Open Data](https://github.com/statsbomb/open-data) | Match events, advanced stats | Free (with attribution) |
| [Wikidata](https://www.wikidata.org/) | Player & stadium metadata | CC0 |
| [OpenStreetMap](https://www.openstreetmap.org/) | Stadium geo coordinates | ODbL |

---

## Repository Structure

```
/data                 Published, mobile-ready JSON (output)
  /leagues
  /competitions
  /teams
  /players            (sharded per-player + index)
  /matches
  /standings
  /stadiums
  /referees
  /statistics
  /transfers
/collectors           One folder per source, each exposes fetch()
/normalizers          Name/ID/country normalization helpers
/mergers              Entity-by-entity merge logic into unified schema
/schemas              JSON Schema (draft-07) definitions
/scripts              CLI entrypoints (collect, normalize, merge, build)
.github/workflows     Cron job (every 12h) to refresh & commit data
```

---

## Pipeline

```
   [collectors/*]            raw, per-source data → /tmp/raw/<source>/*.json
        │
        ▼
   [normalizers]             unify names, generate slugs, map countries
        │
        ▼
   [mergers]                 merge per-entity by ID map → unified objects
        │
        ▼
   [schemas]                 validate against JSON Schema
        │
        ▼
   /data/**/*.json           published artifacts (committed by Actions)
```

Each entity carries a `sources` map preserving the original IDs from every
provider, so the merger is idempotent and re-runnable.

---

## Unified Identifiers

Internal IDs are **deterministic slugs** (no random UUIDs) so the pipeline is
re-runnable and diff-friendly:

```
team_real_madrid
player_kylian_mbappe
stadium_santiago_bernabeu
match_2026_001
competition_world_cup_2026
```

The `/normalizers/id.js` module owns slug generation. A persisted
`data/_index/id-map.json` stores `(source, externalId) → internalId` so we
never re-issue IDs.

---

## Quick start (local)

```bash
npm install

# Configure API keys
cp .env.example .env

# Fetch from all sources
npm run collect

# Normalize + merge into /data
npm run build

# Validate all output against /schemas
npm run validate
```

Individual stages:

```bash
node scripts/collect.js   --source thesportsdb
node scripts/normalize.js --entity teams
node scripts/merge.js     --entity matches
```

---

## Local REST API

Start a read-only API over the published JSON files:

```bash
npm run api
```

Default URL:

```text
http://localhost:3000
```

Available endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /health` | API status and endpoint list |
| `GET /api/regions` | Supported football regions |
| `GET /api/competitions` | Leagues and competitions |
| `GET /api/matches` | Fixtures with filters |
| `GET /api/matches/:id` | Single match details |

Match filters:

| Query | Example | Notes |
|---|---|---|
| `region` | `europe`, `north-africa`, `middle-east`, `world-cup` | Also accepts aliases like `uefa`, `mena`, `maghreb` |
| `status` | `scheduled`, `live`, `finished` | Uses the unified match schema |
| `from` / `to` | `2026-06-01`, `2026-07-01` | ISO date or datetime |
| `team` | `france` | Team ID or team name |
| `competition` | `world_cup` | Competition ID or name |
| `q` | `brazil` | General search |
| `limit` / `offset` | `25`, `0` | Pagination, max limit is 200 |

Examples:

```bash
curl "http://localhost:3000/api/matches?region=europe&status=scheduled"
curl "http://localhost:3000/api/matches?region=north-africa"
curl "http://localhost:3000/api/matches?region=middle-east"
curl "http://localhost:3000/api/matches?region=world-cup"
curl "http://localhost:3000/api/matches/match_2026_0001"
```

Responses include the original match plus enriched `competition`,
`home_team_details`, `away_team_details`, `stadium`, and `referee` objects when
those records exist in `/data`.

---

## Mobile-friendly output

* `/data/players/index.json` — slim list (id, name, club_id, photo)
* `/data/players/<id>.json`  — full player payload (shard per player)
* `/data/matches/fixtures.json` — upcoming + live + last 30 days
* `/data/matches/archive/<season>.json` — historical seasons
* All payloads are gzipped well by CDNs; no payload exceeds a few hundred KB.

---

## Automation

`.github/workflows/update-data.yml` runs:

* Every 12 hours via cron
* On manual `workflow_dispatch`
* Fetches → normalizes → merges → validates → commits diff to `main`

Secrets required:

* `FOOTBALL_DATA_TOKEN` — Football-Data.org API token
* `THESPORTSDB_KEY`     — TheSportsDB API key (defaults to `3` for free tier)

---

## License

Code: MIT.
Data: redistributed under each source's original license (see `data/LICENSES.md`).
