// StatsBomb Open Data collector.
// Repo: https://github.com/statsbomb/open-data (CC BY-NC-SA — attribution required)
import fs from "node:fs";
import path from "node:path";

const BASE = "https://raw.githubusercontent.com/statsbomb/open-data/master/data";
const OUT = path.resolve(".tmp/raw/statsbomb");

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`statsbomb ${res.status} ${url}`);
  return res.json();
}

export async function fetchAll() {
  fs.mkdirSync(path.join(OUT, "matches"), { recursive: true });

  const competitions = await get(`${BASE}/competitions.json`);
  fs.writeFileSync(path.join(OUT, "competitions.json"), JSON.stringify(competitions, null, 2));

  // Sample first 5 competitions to avoid huge downloads in CI.
  for (const c of competitions.slice(0, 5)) {
    try {
      const matches = await get(`${BASE}/matches/${c.competition_id}/${c.season_id}.json`);
      fs.writeFileSync(
        path.join(OUT, "matches", `${c.competition_id}_${c.season_id}.json`),
        JSON.stringify(matches, null, 2)
      );
    } catch (e) {
      console.warn(`[statsbomb] skip comp=${c.competition_id} season=${c.season_id}: ${e.message}`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) fetchAll();
