// Run every merger in dependency order.
import { mergeLeagues }  from "../mergers/leagues.js";
import { mergeStadiums } from "../mergers/stadiums.js";
import { mergeTeams }    from "../mergers/teams.js";
import { mergePlayers }  from "../mergers/players.js";
import { mergeMatches }  from "../mergers/matches.js";

mergeLeagues();
mergeStadiums();
mergeTeams();
mergePlayers();
mergeMatches();
