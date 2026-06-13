// OpenStreetMap (Overpass API) collector — football stadium coordinates.
// Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
import fs from "node:fs";
import path from "node:path";

const ENDPOINT = "https://overpass-api.de/api/interpreter";
const OUT = path.resolve(".tmp/raw/openstreetmap");

const QUERY = `
[out:json][timeout:60];
(
  node["leisure"="stadium"]["sport"="soccer"];
  way["leisure"="stadium"]["sport"="soccer"];
  relation["leisure"="stadium"]["sport"="soccer"];
);
out center tags;`;

export async function fetchAll() {
  fs.mkdirSync(OUT, { recursive: true });
  const res = await fetch(ENDPOINT, {
    method: "POST",
    body: QUERY,
    headers: { "Content-Type": "text/plain" },
  });
  if (!res.ok) throw new Error(`overpass ${res.status}`);
  const data = await res.json();
  fs.writeFileSync(path.join(OUT, "stadiums.json"), JSON.stringify(data.elements, null, 2));
  console.log(`[osm] stadiums=${data.elements.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) fetchAll();
