import {TeamAlias} from "../constants/team-alias";

export type TeamStandingsDto = {
	[key in TeamAlias]: {
		win: number;
		loss: number;
		tie: number;
	}
}
