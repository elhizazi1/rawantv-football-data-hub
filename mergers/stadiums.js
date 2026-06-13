// Merge stadiums from Wikidata + OSM, fall back to TheSportsDB team venue strings.
import fs from "node:fs";
import { stadiumId } from "../normalizers/id.js";
import { normalizeCountry } from "../normalizers/aliases.js";

function readJSON(p, fallback) {
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fallback;
}

function parseCoord(point) {
  // Wikidata "Point(lon lat)"
  if (!point) return null;
  const m = /Point\(([-\d.]+)\s+([-\d.]+)\)/.exec(point);
  if (!m) return null;
  return { lat: Number(m[2]), lon: Number(m[1]) };
}

export function mergeStadiums() {
  const acc = new Map();

  for (const b of readJSON(".tmp/raw/wikidata/stadiums.json", []) || []) {
    const name = b.stadiumLabel?.value;
    if (!name) continue;
    const id = stadiumId(name);
    acc.set(id, {
      id,
      name,
      city: b.cityLabel?.value || null,
      country: normalizeCountry(b.countryLabel?.value),
      capacity: b.capacity?.value ? Number(b.capacity.value) : null,
      location: parseCoord(b.coord?.value),
      image: null,
      sources: { wikidata: b.stadium?.value?.split("/").pop() },
    });
  }

  for (const el of readJSON(".tmp/raw/openstreetmap/stadiums.json", []) || []) {
    const name = el.tags?.name;
    if (!name) continue;
    const id = stadiumId(name);
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const cur = acc.get(id) || { id, name, sources: {} };
    acc.set(id, {
      ...cur,
      name: cur.name || name,
      city: cur.city || el.tags["addr:city"] || null,
      country: cur.country || normalizeCountry(el.tags["addr:country"]),
      capacity: cur.capacity ?? (el.tags.capacity ? Number(el.tags.capacity) : null),
      location: cur.location || (lat && lon ? { lat, lon } : null),
      image: cur.image || null,
      sources: { ...cur.sources, openstreetmap: `${el.type}/${el.id}` },
    });
  }

  const stadiums = [...acc.values()];
  fs.mkdirSync("data/stadiums", { recursive: true });
  fs.writeFileSync("data/stadiums/stadiums.json", JSON.stringify(stadiums, null, 2));
  console.log(`[merge] stadiums=${stadiums.length}`);
  return stadiums;
}

if (import.meta.url === `file://${process.argv[1]}`) mergeStadiums();
