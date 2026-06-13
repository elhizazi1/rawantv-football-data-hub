import slugify from "slugify";

const slugOpts = { lower: true, strict: true, locale: "en", trim: true };

export function slug(input) {
  return slugify(String(input || ""), slugOpts).replace(/-/g, "_");
}

export const teamId      = (name)        => `team_${slug(name)}`;
export const playerId    = (name)        => `player_${slug(name)}`;
export const stadiumId   = (name)        => `stadium_${slug(name)}`;
export const leagueId    = (name)        => `league_${slug(name)}`;
export const compId      = (name, year)  => `competition_${slug(name)}${year ? `_${year}` : ""}`;
export const refereeId   = (name)        => `ref_${slug(name)}`;
export const matchId     = (season, n)   => `match_${season}_${String(n).padStart(4, "0")}`;
