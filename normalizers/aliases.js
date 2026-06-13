// Cross-source name aliases so "Man Utd", "Manchester United FC", "Man. United"
// all collapse to the same internal team_manchester_united.
import { slug } from "./id.js";

const TEAM_ALIASES = {
  man_utd: "manchester_united",
  man_united: "manchester_united",
  manchester_united_fc: "manchester_united",
  man_city: "manchester_city",
  psg: "paris_saint_germain",
  paris_sg: "paris_saint_germain",
  real_madrid_cf: "real_madrid",
  fc_barcelona: "barcelona",
  bayern_munchen: "bayern_munich",
  fc_bayern_munich: "bayern_munich",
  inter: "internazionale",
  inter_milan: "internazionale",
};

const COUNTRY_ALIASES = {
  england: "England",
  uk: "England",
  united_kingdom: "England",
  usa: "United States",
  us: "United States",
  korea_republic: "South Korea",
  ksa: "Saudi Arabia",
};

export function normalizeTeamName(name) {
  const s = slug(name);
  return TEAM_ALIASES[s] || s;
}

export function normalizePlayerName(name) {
  // strip accents, collapse case (Mbappé → mbappe)
  return slug(
    String(name)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  );
}

export function normalizeCountry(c) {
  if (!c) return null;
  const s = slug(c);
  return COUNTRY_ALIASES[s] || String(c).trim();
}
