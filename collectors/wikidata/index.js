// Wikidata SPARQL collector for stadiums and notable players.
// Endpoint: https://query.wikidata.org/sparql
import fs from "node:fs";
import path from "node:path";

const ENDPOINT = "https://query.wikidata.org/sparql";
const OUT = path.resolve(".tmp/raw/wikidata");

const STADIUMS_QUERY = `
SELECT ?stadium ?stadiumLabel ?capacity ?coord ?cityLabel ?countryLabel WHERE {
  ?stadium wdt:P31/wdt:P279* wd:Q483110 .
  OPTIONAL { ?stadium wdt:P1083 ?capacity. }
  OPTIONAL { ?stadium wdt:P625 ?coord. }
  OPTIONAL { ?stadium wdt:P131 ?city. }
  OPTIONAL { ?stadium wdt:P17  ?country. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 2000`;

async function sparql(query) {
  const url = `${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": "RawanTV-DataHub/1.0 (https://github.com/rawantv)" } });
  if (!res.ok) throw new Error(`wikidata ${res.status}`);
  return res.json();
}

export async function fetchAll() {
  fs.mkdirSync(OUT, { recursive: true });
  const stadiums = await sparql(STADIUMS_QUERY);
  fs.writeFileSync(path.join(OUT, "stadiums.json"), JSON.stringify(stadiums.results.bindings, null, 2));
  console.log(`[wikidata] stadiums=${stadiums.results.bindings.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) fetchAll();
