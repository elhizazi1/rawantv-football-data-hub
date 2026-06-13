// Merge fixtures + standings from Football-Data.org (and OpenFootball historical).
import fs from "node:fs";
import path from "node:path";
import { matchId, compId, stadiumId } from "../normalizers/id.js";
import { normalizeTeamName } from "../normalizers/aliases.js";
import { resolveId } from "../normalizers/idMap.js";

function readJSON(p, fallback) {
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fallback;
}

function statusMap(s) {
  switch (s) {
    case "SCHEDULED":
    case "TIMED": return "scheduled";
    case "IN_PLAY":
    case "PAUSED": return "live";
    case "FINISHED": return "finished";
    case "POSTPONED": return "postponed";
    case "CANCELLED":
    case "SUSPENDED": return "cancelled";
    default: return "scheduled";
  }
}

export function mergeMatches() {
  const dir = ".tmp/raw/football-data";
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith(".matches.json"))
    : [];

  const out = [];
  const standings = [];
  let counter = 0;

  for (const file of files) {
    const code = file.replace(".matches.json", "");
    const data = readJSON(path.join(dir, file), { matches: [] });
    const season = data.filters?.season || data.competition?.currentSeason?.startDate?.slice(0, 4) || "current";

    for (const m of data.matches || []) {
      counter += 1;
      const id = resolveId("football_data", `match_${m.id}`, matchId(season, counter));
      out.push({
        id,
        competition_id: compId(m.competition?.name || code, season),
        home_team: `team_${normalizeTeamName(m.homeTeam?.name || "")}`,
        away_team: `team_${normalizeTeamName(m.awayTeam?.name || "")}`,
        stadium_id: m.venue ? stadiumId(m.venue) : null,
        date: m.utcDate,
        status: statusMap(m.status),
        score: {
          home: m.score?.fullTime?.home ?? 0,
          away: m.score?.fullTime?.away ?? 0,
        },
        events: [],
        referee_id: m.referees?.[0]?.name ? `ref_${normalizeTeamName(m.referees[0].name)}` : null,
        sources: { football_data: String(m.id) },
      });
    }

    const stData = readJSON(path.join(dir, `${code}.standings.json`), null);
    if (stData) {
      standings.push({
        competition_id: compId(stData.competition?.name || code, season),
        season,
        table: (stData.standings?.[0]?.table || []).map((row) => ({
          position: row.position,
          team_id: `team_${normalizeTeamName(row.team?.name || "")}`,
          played: row.playedGames,
          won: row.won,
          drawn: row.draw,
          lost: row.lost,
          goals_for: row.goalsFor,
          goals_against: row.goalsAgainst,
          points: row.points,
        })),
      });
    }
  }

  fs.mkdirSync("data/matches", { recursive: true });
  fs.mkdirSync("data/standings", { recursive: true });
  fs.writeFileSync("data/matches/fixtures.json", JSON.stringify(out, null, 2));
  fs.writeFileSync("data/standings/standings.json", JSON.stringify(standings, null, 2));
  console.log(`[merge] matches=${out.length} standings=${standings.length}`);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) mergeMatches();
