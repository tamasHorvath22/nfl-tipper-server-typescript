import { Service } from "typedi";
import { LeagueBackupDocument } from '../documents/league.document';
import LeagueBackupModel from '../mongoose-models/league-backup.model';
import Transaction from 'mongoose-transactions-typescript';
import { DocumentName } from '../constants/document-names';

@Service()
export class LeagueBackupRepositoryService {

	public async updateBackup(backup: LeagueBackupDocument): Promise<LeagueBackupDocument> {
		const transaction = new Transaction(true);
		backup.markModified('backups')
		transaction.insert(DocumentName.LEAGUE_BACKUP, backup);

		try {
			return await transaction.run();
		} catch (err)  {
			console.error(err);
			transaction.rollback();
			return null;
		}
	}

	public async getLeagueBackup(): Promise<LeagueBackupDocument> {
		try {
			const backup = await LeagueBackupModel.find({});
			return backup && backup[0] ? backup[0] : null
		} catch(err) {
			console.error(err);
			return null;
		}
	}
}
