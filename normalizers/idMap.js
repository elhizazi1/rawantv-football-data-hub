// Persistent map of (source, externalId) → internalId.
// Guarantees stable IDs across runs even if a source renames an entity.
import fs from "node:fs";
import path from "node:path";

const FILE = path.resolve("data/_index/id-map.json");

function load() {
  if (!fs.existsSync(FILE)) return {};
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return {}; }
}
function save(map) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(map, null, 2));
}

const cache = load();

export function resolveId(source, externalId, fallbackInternalId) {
  const key = `${source}:${externalId}`;
  if (cache[key]) return cache[key];
  cache[key] = fallbackInternalId;
  save(cache);
  return fallbackInternalId;
}

export function getMap() { return { ...cache }; }
