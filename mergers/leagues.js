// Merge leagues/competitions from TheSportsDB + Football-Data.org
import fs from "node:fs";
import { leagueId, compId } from "../normalizers/id.js";
import { normalizeCountry } from "../normalizers/aliases.js";

function readJSON(p, fallback) {
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fallback;
}

export function mergeLeagues() {
  const acc = new Map();

  for (const l of readJSON(".tmp/raw/thesportsdb/leagues.json", []) || []) {
    const id = leagueId(l.strLeague);
    acc.set(id, {
      id,
      name: l.strLeague,
      country: normalizeCountry(l.strCountry) || "International",
      tier: null,
      logo: l.strBadge || null,
      current_season: null,
      sources: { thesportsdb: l.idLeague },
    });
  }

  const fd = readJSON(".tmp/raw/football-data/competitions.json", { competitions: [] });
  for (const c of fd.competitions || []) {
    const id = leagueId(c.name);
    const cur = acc.get(id) || { id, sources: {} };
    acc.set(id, {
      ...cur,
      name: cur.name || c.name,
      country: cur.country || normalizeCountry(c.area?.name) || "International",
      tier: cur.tier ?? (c.type === "LEAGUE" ? 1 : null),
      logo: cur.logo || c.emblem || null,
      current_season: c.currentSeason?.startDate?.slice(0, 4) || cur.current_season || null,
      sources: { ...cur.sources, football_data: String(c.id) },
    });
  }

  const leagues = [...acc.values()];
  fs.mkdirSync("data/leagues", { recursive: true });
  fs.mkdirSync("data/competitions", { recursive: true });
  fs.writeFileSync("data/leagues/leagues.json", JSON.stringify(leagues, null, 2));
  fs.writeFileSync("data/competitions/competitions.json", JSON.stringify(leagues, null, 2));
  console.log(`[merge] leagues=${leagues.length}`);
  return leagues;
}

if (import.meta.url === `file://${process.argv[1]}`) mergeLeagues();
