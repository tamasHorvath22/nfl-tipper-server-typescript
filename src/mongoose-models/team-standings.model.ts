import mongoose, { Schema } from 'mongoose';
import { DocumentName } from '../constants/document-names';
import { TeamStandingsDocument } from "../documents/team-standings.document";

const teamStandingsSchema = new Schema<TeamStandingsDocument>({
	teams: Object,
	year: Number
}, { timestamps: true });

export default mongoose.model<TeamStandingsDocument>(DocumentName.TEAM_STANDINGS, teamStandingsSchema);
