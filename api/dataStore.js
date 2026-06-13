import fs from "node:fs/promises";
import path from "node:path";
import { REGIONS, normalizeRegion } from "./regions.js";

const DATA_DIR = path.resolve("data");

async function readJson(relativePath, fallback) {
  try {
    const payload = await fs.readFile(path.join(DATA_DIR, relativePath), "utf8");
    return JSON.parse(payload);
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

function indexById(items) {
  return new Map(items.map((item) => [item.id, item]));
}

function textIncludes(value, search) {
  return String(value ?? "").toLowerCase().includes(search);
}

function isWorldCupCompetition(competition) {
  const text = `${competition?.id ?? ""} ${competition?.name ?? ""}`.toLowerCase();
  return REGIONS["world-cup"].competitionKeywords.some((keyword) => text.includes(keyword));
}

function competitionMatchesRegion(competition, region) {
  if (!competition) return false;
  if (region.id === "world-cup") return isWorldCupCompetition(competition);

  const countryMatches = region.countries.includes(competition.country);
  const text = `${competition.id ?? ""} ${competition.name ?? ""}`.toLowerCase();
  const keywordMatches = region.competitionKeywords.some((keyword) => text.includes(keyword));

  return countryMatches || keywordMatches;
}

function teamMatchesRegion(team, region) {
  if (!team || region.id === "world-cup") return false;
  return region.countries.includes(team.country);
}

function parseDateFilter(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function applyMatchFilters(matches, filters, lookups) {
  const regionId = normalizeRegion(filters.region);
  const region = regionId ? REGIONS[regionId] : null;
  const from = parseDateFilter(filters.from);
  const to = parseDateFilter(filters.to);
  const status = filters.status?.toLowerCase();
  const search = filters.q?.trim().toLowerCase();
  const team = filters.team?.trim().toLowerCase();
  const competition = filters.competition?.trim().toLowerCase();

  return matches.filter((match) => {
    const matchDate = new Date(match.date);
    const homeTeam = lookups.teams.get(match.home_team);
    const awayTeam = lookups.teams.get(match.away_team);
    const matchCompetition =
      lookups.competitions.get(match.competition_id) ?? lookups.leagues.get(match.competition_id);

    if (status && match.status !== status) return false;
    if (from && matchDate < from) return false;
    if (to && matchDate > to) return false;
    if (team && ![match.home_team, match.away_team, homeTeam?.name, awayTeam?.name].some((value) => textIncludes(value, team))) {
      return false;
    }
    if (competition && ![match.competition_id, matchCompetition?.name].some((value) => textIncludes(value, competition))) {
      return false;
    }
    if (search) {
      const searchable = [
        match.id,
        match.competition_id,
        matchCompetition?.name,
        homeTeam?.name,
        awayTeam?.name,
        match.status,
      ];
      if (!searchable.some((value) => textIncludes(value, search))) return false;
    }
    if (region) {
      const regionMatch =
        competitionMatchesRegion(matchCompetition, region) ||
        teamMatchesRegion(homeTeam, region) ||
        teamMatchesRegion(awayTeam, region) ||
        (region.id === "world-cup" && textIncludes(match.competition_id, "world_cup"));

      if (!regionMatch) return false;
    }

    return true;
  });
}

function enrichMatch(match, lookups) {
  return {
    ...match,
    competition: lookups.competitions.get(match.competition_id) ?? lookups.leagues.get(match.competition_id) ?? null,
    home_team_details: lookups.teams.get(match.home_team) ?? null,
    away_team_details: lookups.teams.get(match.away_team) ?? null,
    stadium: lookups.stadiums.get(match.stadium_id) ?? null,
    referee: lookups.referees.get(match.referee_id) ?? null,
  };
}

export async function loadData() {
  const [matches, teams, leagues, competitions, stadiums, referees] = await Promise.all([
    readJson("matches/fixtures.json", []),
    readJson("teams/teams.json", []),
    readJson("leagues/leagues.json", []),
    readJson("competitions/competitions.json", []),
    readJson("stadiums/stadiums.json", []),
    readJson("referees/referees.json", []),
  ]);

  const lookups = {
    teams: indexById(teams),
    leagues: indexById(leagues),
    competitions: indexById(competitions),
    stadiums: indexById(stadiums),
    referees: indexById(referees),
  };

  return { matches, teams, leagues, competitions, stadiums, referees, lookups };
}

export async function listMatches(filters = {}) {
  const data = await loadData();
  const offset = Math.max(Number.parseInt(filters.offset ?? "0", 10) || 0, 0);
  const limit = Math.min(Math.max(Number.parseInt(filters.limit ?? "50", 10) || 50, 1), 200);
  const filtered = applyMatchFilters(data.matches, filters, data.lookups)
    .sort((left, right) => new Date(left.date) - new Date(right.date));
  const page = filtered.slice(offset, offset + limit).map((match) => enrichMatch(match, data.lookups));

  return {
    meta: {
      total: filtered.length,
      offset,
      limit,
      has_more: offset + limit < filtered.length,
    },
    data: page,
  };
}

export async function getMatchById(id) {
  const data = await loadData();
  const match = data.matches.find((item) => item.id === id);
  return match ? enrichMatch(match, data.lookups) : null;
}

export async function listCompetitions(filters = {}) {
  const data = await loadData();
  const regionId = normalizeRegion(filters.region);
  const region = regionId ? REGIONS[regionId] : null;
  const competitions = [...data.leagues, ...data.competitions].filter((competition) => {
    return region ? competitionMatchesRegion(competition, region) : true;
  });

  return { meta: { total: competitions.length }, data: competitions };
}
