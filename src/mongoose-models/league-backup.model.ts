import mongoose, { Schema } from 'mongoose';
import { DocumentName } from '../constants/document-names';
import { LeagueBackupDocument } from '../documents/league.document';

const leagueBackupSchema = new Schema<LeagueBackupDocument>({
	backups: {}
}, { timestamps: true });

export default mongoose.model<LeagueBackupDocument>(DocumentName.LEAGUE_BACKUP, leagueBackupSchema);
