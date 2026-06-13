// OpenFootball collector — clones JSON datasets from the openfootball org.
// Datasets: https://github.com/openfootball/football.json
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(".tmp/raw/openfootball");
const SEASONS = ["2024-25", "2023-24"];
const LEAGUES = ["en.1", "es.1", "it.1", "de.1", "fr.1"];

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`openfootball ${res.status} ${url}`);
  return res.json();
}

export async function fetchAll() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const season of SEASONS) {
    for (const lg of LEAGUES) {
      const url = `https://raw.githubusercontent.com/openfootball/football.json/master/${season}/${lg}.json`;
      try {
        const data = await get(url);
        fs.writeFileSync(path.join(OUT, `${season}_${lg}.json`), JSON.stringify(data, null, 2));
      } catch (e) {
        console.warn(`[openfootball] skip ${season}/${lg}: ${e.message}`);
      }
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) fetchAll();
