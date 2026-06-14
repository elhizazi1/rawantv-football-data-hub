import "../../utils/loadEnv.js";
import fs from "node:fs";
import path from "node:path";

const KEY = process.env.THESPORTSDB_KEY || "3";
const BASE = `https://www.thesportsdb.com/api/v1/json/${KEY}`;
const OUT = path.resolve(".tmp/raw/thesportsdb");

async function get(url) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`thesportsdb ${res.status} ${url}`);
  }

  return res.json();
}

export async function fetchAll() {
  fs.mkdirSync(OUT, { recursive: true });

  // 1. Leagues
  const leagues = await get(`${BASE}/all_leagues.php`);
  const soccer = (leagues.leagues || []).filter(
    (l) => l.strSport === "Soccer"
  );

  fs.writeFileSync(
    path.join(OUT, "leagues.json"),
    JSON.stringify(soccer, null, 2)
  );

  // 2. Top leagues teams
  const TOP_LEAGUES = [
    "English Premier League",
    "Spanish La Liga",
    "Italian Serie A",
    "German Bundesliga",
    "French Ligue 1",
  ];

  const teams = [];

  for (const name of TOP_LEAGUES) {
    const data = await get(
      `${BASE}/search_all_teams.php?l=${encodeURIComponent(name)}`
    );

    if (data.teams) teams.push(...data.teams);
  }

  fs.writeFileSync(
    path.join(OUT, "teams.json"),
    JSON.stringify(teams, null, 2)
  );

  // 3. Players (FIX: limit requests to avoid 429)
  const players = [];

  const SAFE_LIMIT = 10; // 🔥 important fix

  for (const team of teams.slice(0, SAFE_LIMIT)) {
    try {
      const data = await get(
        `${BASE}/lookup_all_players.php?id=${team.idTeam}`
      );

      if (data.player) {
        players.push(...data.player);
      }
    } catch (e) {
      console.warn(
        "player fetch failed",
        team.strTeam,
        e.message
      );
    }
  }

  fs.writeFileSync(
    path.join(OUT, "players.json"),
    JSON.stringify(players, null, 2)
  );

  console.log(
    `[thesportsdb] leagues=${soccer.length} teams=${teams.length} players=${players.length}`
  );
}

// CLI entry
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAll();
}
