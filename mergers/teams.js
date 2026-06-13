// Merges team records from multiple sources into the unified Team schema.
import fs from "node:fs";
import path from "node:path";
import { teamId, stadiumId } from "../normalizers/id.js";
import { normalizeTeamName, normalizeCountry } from "../normalizers/aliases.js";
import { resolveId } from "../normalizers/idMap.js";

function readJSON(p, fallback = null) {
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fallback;
}

export function mergeTeams() {
  const sdb = readJSON(".tmp/raw/thesportsdb/teams.json", []) || [];
  const fdComps = fs.existsSync(".tmp/raw/football-data")
    ? fs.readdirSync(".tmp/raw/football-data").filter((f) => f.endsWith(".teams.json"))
    : [];

  const acc = new Map();

  const upsert = (id, patch) => {
    const cur = acc.get(id) || { id, sources: {} };
    acc.set(id, {
      ...cur,
      ...patch,
      sources: { ...cur.sources, ...(patch.sources || {}) },
    });
  };

  // TheSportsDB
  for (const t of sdb) {
    if (!t.strTeam) continue;
    const normalized = normalizeTeamName(t.strTeam);
    const id = resolveId("thesportsdb", t.idTeam, `team_${normalized}`);
    upsert(id, {
      name: t.strTeam,
      short_name: t.strTeamShort || null,
      country: normalizeCountry(t.strCountry),
      founded: t.intFormedYear ? Number(t.intFormedYear) : undefined,
      stadium_id: t.strStadium ? stadiumId(t.strStadium) : null,
      logo: t.strTeamBadge || null,
      sources: { thesportsdb: t.idTeam },
    });
  }

  // Football-Data.org
  for (const f of fdComps) {
    const data = readJSON(path.join(".tmp/raw/football-data", f), { teams: [] });
    for (const t of data.teams || []) {
      const normalized = normalizeTeamName(t.name);
      const id = resolveId("football_data", t.id, `team_${normalized}`);
      upsert(id, {
        name: t.name,
        short_name: t.tla || t.shortName || null,
        country: normalizeCountry(t.area?.name),
        founded: t.founded || undefined,
        logo: t.crest || null,
        sources: { football_data: String(t.id) },
      });
    }
  }

  const teams = [...acc.values()];
  fs.mkdirSync("data/teams", { recursive: true });
  fs.writeFileSync("data/teams/teams.json", JSON.stringify(teams, null, 2));
  console.log(`[merge] teams=${teams.length}`);
  return teams;
}

if (import.meta.url === `file://${process.argv[1]}`) mergeTeams();
