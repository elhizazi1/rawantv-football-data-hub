// Merge players from TheSportsDB; shard to /data/players/<id>.json + index.json
import fs from "node:fs";
import path from "node:path";
import { teamId } from "../normalizers/id.js";
import { normalizePlayerName, normalizeTeamName, normalizeCountry } from "../normalizers/aliases.js";
import { resolveId } from "../normalizers/idMap.js";

const OUT_DIR = "data/players";

export function mergePlayers() {
  const sdb = fs.existsSync(".tmp/raw/thesportsdb/players.json")
    ? JSON.parse(fs.readFileSync(".tmp/raw/thesportsdb/players.json", "utf8"))
    : [];

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const index = [];

  for (const p of sdb) {
    if (!p.strPlayer) continue;
    const id = resolveId("thesportsdb", p.idPlayer, `player_${normalizePlayerName(p.strPlayer)}`);
    const club_id = p.strTeam ? `team_${normalizeTeamName(p.strTeam)}` : null;

    const player = {
      id,
      name: p.strPlayer,
      position: p.strPosition || null,
      nationality: normalizeCountry(p.strNationality),
      birth_date: p.dateBorn || null,
      height: p.strHeight ? parseInt(p.strHeight, 10) || null : null,
      weight: p.strWeight ? parseInt(p.strWeight, 10) || null : null,
      club_id,
      photo: p.strThumb || p.strCutout || null,
      statistics: { goals: 0, assists: 0, matches: 0 },
      sources: { thesportsdb: p.idPlayer },
    };

    fs.writeFileSync(path.join(OUT_DIR, `${id}.json`), JSON.stringify(player, null, 2));
    index.push({ id, name: player.name, club_id, photo: player.photo, position: player.position });
  }

  fs.writeFileSync(path.join(OUT_DIR, "index.json"), JSON.stringify(index, null, 2));
  console.log(`[merge] players=${index.length}`);
  return index;
}

if (import.meta.url === `file://${process.argv[1]}`) mergePlayers();
