import { BetType } from "../constants/bet-types";
import { BaseDocument } from "./base.document";


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
  homeTeamAlias: string;
  awayTeam: string;
  awayTeamAlias: string;
  status: string;
  homeScore: number;
  awayScore: number;
  season: number;
  weekNo: number;
  startTime: Date;
  isOpen: boolean;
  winner: string;
  winnerTeamAlias: string;
  winnerValue: string;
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
