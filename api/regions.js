export const REGION_ALIASES = {
  europe: "europe",
  eu: "europe",
  uefa: "europe",
  "north-africa": "north-africa",
  north_africa: "north-africa",
  maghreb: "north-africa",
  mena: "middle-east",
  "middle-east": "middle-east",
  middle_east: "middle-east",
  west_asia: "middle-east",
  "world-cup": "world-cup",
  world_cup: "world-cup",
  fifa_world_cup: "world-cup",
};

export const REGIONS = {
  europe: {
    id: "europe",
    name: "Europe",
    confederation: "UEFA",
    countries: [
      "Albania", "Andorra", "Armenia", "Austria", "Azerbaijan", "Belarus",
      "Belgium", "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Cyprus",
      "Czech Republic", "Denmark", "England", "Estonia", "Faroe Islands",
      "Finland", "France", "Georgia", "Germany", "Gibraltar", "Greece",
      "Hungary", "Iceland", "Ireland", "Israel", "Italy", "Kazakhstan",
      "Kosovo", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg",
      "Malta", "Moldova", "Montenegro", "Netherlands", "North Macedonia",
      "Northern Ireland", "Norway", "Poland", "Portugal", "Romania",
      "San Marino", "Scotland", "Serbia", "Slovakia", "Slovenia", "Spain",
      "Sweden", "Switzerland", "Turkey", "Ukraine", "Wales",
    ],
    competitionKeywords: ["uefa", "champions league", "europa league", "conference league", "euro"],
  },
  "north-africa": {
    id: "north-africa",
    name: "North Africa",
    confederation: "CAF",
    countries: ["Algeria", "Egypt", "Libya", "Morocco", "Sudan", "Tunisia"],
    competitionKeywords: ["caf", "north africa", "maghreb", "botola", "ligue 1 tunisia", "egyptian premier"],
  },
  "middle-east": {
    id: "middle-east",
    name: "Middle East",
    confederation: "AFC/CAF",
    countries: [
      "Bahrain", "Iran", "Iraq", "Jordan", "Kuwait", "Lebanon", "Oman",
      "Palestine", "Qatar", "Saudi Arabia", "Syria", "United Arab Emirates",
      "Yemen",
    ],
    competitionKeywords: ["afc", "arab", "gcc", "gulf", "saudi", "qatar", "uae"],
  },
  "world-cup": {
    id: "world-cup",
    name: "FIFA World Cup",
    confederation: "FIFA",
    countries: [],
    competitionKeywords: ["world cup", "fifa world cup", "mundial"],
  },
};

export function normalizeRegion(value) {
  if (!value) return null;
  return REGION_ALIASES[String(value).trim().toLowerCase()] ?? null;
}
