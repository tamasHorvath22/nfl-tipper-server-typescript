import mongoose, { Schema } from 'mongoose';
import { DocumentName } from '../constants/document-names';
import { LeagueDocument } from '../documents/league.document';

const leagueSchema = new Schema<LeagueDocument>({
  players: [],
  invitations: [],
  seasons: [],
  name: String,
  creator: String,
  leagueAvatarUrl: String
}, { timestamps: true });

export default mongoose.model<LeagueDocument>(DocumentName.LEAGUE, leagueSchema);
