import mongoose, { Schema } from 'mongoose';
import { DocumentName } from '../constants/document-names';
import { SeasonDocument } from '../documents/league.document';

const emailConfirmSchema = new Schema<SeasonDocument>({
  year: Number,
  numberOfSeason: Number,
  numberOfSuperBowl: Number,
  isOpen: Boolean,
  weeks: [],
  standings: [],
  finalWinner: {}
}, { timestamps: true });

export default mongoose.model<SeasonDocument>(DocumentName.SEASON, emailConfirmSchema);
