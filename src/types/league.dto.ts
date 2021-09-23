import { Bet, Player, PlayerStanding } from "../documents/league.document";
import {TeamStandingsDto} from "./team-standings.dto";

export interface LeagueDto {
	players: Player[];
	invitations: string[];
	seasons: SeasonDto[];
	name: string;
	creator: string;
	leagueAvatarUrl: string;
	id: string;
	teamStandings: TeamStandingsDto
}

export interface SeasonDto {
	year: number;
	numberOfSeason: number;
	numberOfSuperBowl: number;
	isOpen: boolean;
	weeks: WeekDto[];
	standings: PlayerStanding[];
	finalWinner: Record<string, string>;
	id: string;
}

export interface WeekDto  {
	weekId: string;
	number: number;
	isOpen: boolean;
	games: GameDto[];
	id: string;
}

export interface GameDto {
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
	bets: Bet[];
	id: string;
}