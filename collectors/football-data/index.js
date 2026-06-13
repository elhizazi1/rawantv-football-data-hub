// Football-Data.org collector. Requires FOOTBALL_DATA_TOKEN.
// Docs: https://www.football-data.org/documentation/quickstart
import "../../utils/loadEnv.js";
import fs from "node:fs";
import path from "node:path";

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const BASE = "https://api.football-data.org/v4";
const OUT = path.resolve(".tmp/raw/football-data");

const COMPETITIONS = ["PL", "PD", "SA", "BL1", "FL1", "CL", "WC"];

async function get(url) {
  if (!TOKEN) throw new Error("FOOTBALL_DATA_TOKEN missing");
  const res = await fetch(url, { headers: { "X-Auth-Token": TOKEN } });
  if (!res.ok) throw new Error(`football-data ${res.status} ${url}`);
  return res.json();
}

export async function fetchAll() {
  fs.mkdirSync(OUT, { recursive: true });

  const competitions = await get(`${BASE}/competitions`);
  fs.writeFileSync(path.join(OUT, "competitions.json"), JSON.stringify(competitions, null, 2));

  for (const code of COMPETITIONS) {
    try {
      const [standings, matches, teams] = await Promise.all([
        get(`${BASE}/competitions/${code}/standings`),
        get(`${BASE}/competitions/${code}/matches`),
        get(`${BASE}/competitions/${code}/teams`),
      ]);
      fs.writeFileSync(path.join(OUT, `${code}.standings.json`), JSON.stringify(standings, null, 2));
      fs.writeFileSync(path.join(OUT, `${code}.matches.json`),   JSON.stringify(matches,   null, 2));
      fs.writeFileSync(path.join(OUT, `${code}.teams.json`),     JSON.stringify(teams,     null, 2));
      // Free tier: 10 req/min. Sleep between competitions.
      await new Promise((r) => setTimeout(r, 6500));
    } catch (e) {
      console.warn(`[football-data] ${code} failed: ${e.message}`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) fetchAll();
