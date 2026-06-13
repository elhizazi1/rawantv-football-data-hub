// Orchestrates every collector. Failures in one source must not break others.
import { fetchAll as sdb }    from "../collectors/thesportsdb/index.js";
import { fetchAll as fd }     from "../collectors/football-data/index.js";
import { fetchAll as of }     from "../collectors/openfootball/index.js";
import { fetchAll as sb }     from "../collectors/statsbomb/index.js";
import { fetchAll as wd }     from "../collectors/wikidata/index.js";
import { fetchAll as osm }    from "../collectors/openstreetmap/index.js";

const sources = [
  ["thesportsdb",   sdb],
  ["football-data", fd],
  ["openfootball",  of],
  ["statsbomb",     sb],
  ["wikidata",      wd],
  ["openstreetmap", osm],
];

const only = process.argv.includes("--source")
  ? process.argv[process.argv.indexOf("--source") + 1]
  : null;

for (const [name, fn] of sources) {
  if (only && name !== only) continue;
  try {
    console.log(`\n=== collecting ${name} ===`);
    await fn();
  } catch (e) {
    console.error(`[${name}] failed: ${e.message}`);
  }
}
