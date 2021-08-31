import { ApiResponseMessage } from './../constants/api-response-message';
import { LeagueDocument } from './../documents/league.document';
import { Service } from "typedi";
import mongoose from 'mongoose';
import leagueModel from '../mongoose-models/league.model';
import { UserDocument } from "../documents/user.document";
import Transaction from 'mongoose-transactions-typescript';
import { DocumentName } from '../constants/document-names';

@Service()
export class LeagueRepositoryService {

  public async getLeaguesByIds(idList: string[]): Promise<LeagueDocument[] | null> {
    const mongooseIdArray: mongoose.Types.ObjectId[] = idList.map(league => {
      return new mongoose.Types.ObjectId(league);
    });
    try {
      const allLeagues = [];
      for (const id of mongooseIdArray) {
        const league = await leagueModel.findById(id);
        allLeagues.push(league);
      }
      // TODO
      // const leagues = await leagueModel.find({ _id: { $in: mongooseIdArray } });
      return allLeagues.length ? allLeagues : null;
    } catch(err) {
      console.error(err);
      return null;
    }
  }

  public async changeUserData(user: UserDocument, leagues: LeagueDocument[]): Promise<UserDocument | null> {
    const transaction = new Transaction(true);
    transaction.insert(DocumentName.USER, user);
  
    if (leagues && leagues.length) {
      leagues.forEach(league => {
        league.markModified('players');
        transaction.update(DocumentName.LEAGUE, league._id, league, { new: true });
      })
    }
  
    try {
      await transaction.run();
      return user;
    } catch (err)  {
      console.error(err);
      transaction.rollback();
      return null;
    };
  }
  
}
