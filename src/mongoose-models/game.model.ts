import mongoose, { Schema } from 'mongoose';
import { DocumentName } from '../constants/document-names';
import { GameDocument } from '../documents/league.document';

const emailConfirmSchema = new Schema<GameDocument>({
  gameId: String,
  homeTeam: String,
  homeTeamAlias: String,
  awayTeam: String,
  awayTeamAlias: String,
  status: String,
  homeScore: Number,
  awayScore: Number,
  season: Number,
  weekNo: Number,
  startTime: Date,
  isOpen: Boolean,
  winner: String,
  winnerTeamAlias: String,
  winnerValue: String,
  bets: []
}, { timestamps: true });

export default mongoose.model<GameDocument>(DocumentName.GAME, emailConfirmSchema);
