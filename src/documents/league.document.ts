import { BetType } from "../constants/bet-types";
import { BaseDocument } from "./base.document";
import { TeamAlias } from "../constants/team-alias";
import { GameStatus } from "../constants/game-status";
import { GameOutcome } from "../constants/game-outcome";


export interface LeagueDocument extends BaseDocument {
  players: Player[];
  invitations: string[];
  seasons: SeasonDocument[];
  name: string;
  creator: string;
  leagueAvatarUrl: string;
}

export interface SeasonDocument extends BaseDocument {
  year: number;
  numberOfSeason: number;
  numberOfSuperBowl: number;
  isOpen: boolean;
  weeks: WeekDocument[];
  standings: PlayerStanding[];
  finalWinner: Record<string, string>
}

export interface WeekDocument extends BaseDocument {
  weekId: string;
  number: number;
  isOpen: boolean;
  games: GameDocument[];
}

export interface GameDocument extends BaseDocument {
  gameId: string;
  homeTeam: string;
  homeTeamAlias: TeamAlias;
  awayTeam: string;
  awayTeamAlias: TeamAlias;
  status: GameStatus;
  homeScore: number;
  awayScore: number;
  season: number;
  weekNo: number;
  startTime: Date;
  isOpen: boolean;
  winner: GameOutcome;
  winnerTeamAlias: TeamAlias;
  winnerValue: BetType;
  bets: Bet[]
}

export interface PlayerStanding {
  id: string;
  name: string;
  score: number;
}

export interface Bet {
  id: string;
  name: string;
  bet: BetType;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
}
