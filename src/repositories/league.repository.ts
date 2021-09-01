import { LeagueDocument } from '../documents/league.document';
import { Service } from "typedi";
import mongoose from 'mongoose';
import LeagueModel from '../mongoose-models/league.model';
import { UserDocument } from "../documents/user.document";
import Transaction from 'mongoose-transactions-typescript';
import { DocumentName } from '../constants/document-names';
import { LeagueDataDto } from "../types/league-data.dto";

@Service()
export class LeagueRepositoryService {

  public async getLeaguesByIds(idList: string[]): Promise<LeagueDocument[] | null> {
    const mongooseIdArray: mongoose.Types.ObjectId[] = idList.map(league => {
      return new mongoose.Types.ObjectId(league);
    });
    try {
      // @ts-ignore
      const leagues = await LeagueModel.find({ _id: { $in: mongooseIdArray } });
      return leagues.length ? leagues : null;
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

  public async saveLeagueAndUser(user: UserDocument, league: LeagueDocument) {
    const transaction = new Transaction(true);
    league.markModified('seasons')
    transaction.insert(DocumentName.LEAGUE, league);
    transaction.insert(DocumentName.USER, user);

    try {
      await transaction.run();
      return true;
    } catch (err)  {
      transaction.rollback();
      console.error(err);
      return false;
    }
  }

  public async getLeagueById(id: string) {
    try {
      const league = await LeagueModel.findById(id).exec();
      return league ? league : null;
    } catch(err) {
      console.error(err);
      return null;
    }
  }

  public async getLeaguesData(idList: string[]): Promise<LeagueDataDto[]> {
    try {
      const leagues = await this.getLeaguesByIds(idList);
      if (!leagues) {
        return null;
      }
      return leagues.map(league => {
        return { id: league._id.toString(), name: league.name, avatar: league.leagueAvatarUrl }
      });
    } catch(err) {
      console.error(err);
      return null;
    }
  }



}
