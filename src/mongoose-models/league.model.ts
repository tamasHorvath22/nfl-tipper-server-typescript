import mongoose, { Schema } from 'mongoose';
import { DocumentName } from '../constants/document-names';
import { LeagueDocument } from '../documents/league.document';

const emailConfirmSchema = new Schema<LeagueDocument>({
  players: [],
  invitations: [],
  seasons: [],
  name: String,
  creator: String,
  leagueAvatarUrl: String
}, { timestamps: true });

export default mongoose.model<LeagueDocument>(DocumentName.LEAGUE, emailConfirmSchema);
