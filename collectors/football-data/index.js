// Football-Data.org collector. Requires FOOTBALL_DATA_TOKEN
import "../../utils/loadEnv.js";
import fs from "node:fs";
import path from "node:path";

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const BASE = "https://api.football-data.org/v4";
const OUT = path.resolve(".tmp/raw/football-data");

const COMPETITIONS = ["PL", "PD", "SA", "BL1", "FL1", "CL", "WC"];

// 👇 مهم: throttle بسيط
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function get(url) {
  if (!TOKEN) throw new Error("FOOTBALL_DATA_TOKEN missing");

  const res = await fetch(url, {
    headers: { "X-Auth-Token": TOKEN }
  });

  if (!res.ok) {
    throw new Error(`football-data ${res.status} ${url}`);
  }

  return res.json();
}

export async function fetchAll() {
  fs.mkdirSync(OUT, { recursive: true });

  // competitions list
  const competitions = await get(`${BASE}/competitions`);
  fs.writeFileSync(
    path.join(OUT, "competitions.json"),
    JSON.stringify(competitions, null, 2)
  );

  for (const code of COMPETITIONS) {
    try {
      console.log(`[football-data] collecting ${code}`);

      // 👇 بدل Promise.all (سبب 429)
      const standings = await get(`${BASE}/competitions/${code}/standings`);
      await sleep(1200);

      const matches = await get(`${BASE}/competitions/${code}/matches`);
      await sleep(1200);

      const teams = await get(`${BASE}/competitions/${code}/teams`);
      await sleep(1200);

      fs.writeFileSync(
        path.join(OUT, `${code}.standings.json`),
        JSON.stringify(standings, null, 2)
      );

      fs.writeFileSync(
        path.join(OUT, `${code}.matches.json`),
        JSON.stringify(matches, null, 2)
      );

      fs.writeFileSync(
        path.join(OUT, `${code}.teams.json`),
        JSON.stringify(teams, null, 2)
      );

      // extra pause بين البطولات (مهم)
      await sleep(5000);

    } catch (e) {
      console.warn(`[football-data] ${code} failed: ${e.message}`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAll();
}
