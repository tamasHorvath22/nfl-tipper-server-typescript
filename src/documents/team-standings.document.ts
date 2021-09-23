import { BaseDocument } from "./base.document";
import { TeamStandingsDto } from "../types/team-standings.dto";

export interface TeamStandingsDocument extends BaseDocument {
	teams: TeamStandingsDto;
	year: number;
}
