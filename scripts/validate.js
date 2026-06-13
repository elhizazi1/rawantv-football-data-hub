// Validate every output JSON against its schema (draft-07 via Ajv).
import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const schemas = {
  team:    JSON.parse(fs.readFileSync("schemas/team.schema.json",    "utf8")),
  player:  JSON.parse(fs.readFileSync("schemas/player.schema.json",  "utf8")),
  match:   JSON.parse(fs.readFileSync("schemas/match.schema.json",   "utf8")),
  stadium: JSON.parse(fs.readFileSync("schemas/stadium.schema.json", "utf8")),
  league:  JSON.parse(fs.readFileSync("schemas/league.schema.json",  "utf8")),
};

const validators = Object.fromEntries(
  Object.entries(schemas).map(([k, s]) => [k, ajv.compile(s)])
);

function validateArray(file, kind) {
  if (!fs.existsSync(file)) return;
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const fn = validators[kind];
  let bad = 0;
  for (const item of data) if (!fn(item)) bad += 1;
  console.log(`${file}: ${data.length - bad}/${data.length} valid (${kind})`);
}

function validateDir(dir, kind) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json") || f === "index.json") continue;
    const item = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    if (!validators[kind](item)) console.warn(`invalid ${kind}: ${f}`);
  }
}

validateArray("data/teams/teams.json",                "team");
validateArray("data/leagues/leagues.json",            "league");
validateArray("data/competitions/competitions.json",  "league");
validateArray("data/stadiums/stadiums.json",          "stadium");
validateArray("data/matches/fixtures.json",           "match");
validateDir  ("data/players",                         "player");
