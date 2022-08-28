import { DocumentName } from '../constants/document-names';
import { UserDocument } from '../documents/user.document';
import { Service } from "typedi";
import Transaction from 'mongoose-transactions-typescript';
import userModel from '../mongoose-models/user.model';


@Service()
export class UserRepositoryService {

  public async saveGoogleUser(user: UserDocument): Promise<UserDocument> {
    const transaction = new Transaction(true);
    transaction.insert(DocumentName.USER, user);

    try {
      const result = await transaction.run();
      return result ? result[0] : null;
    } catch (err)  {
      transaction.rollback();
      return null;
    }
  }

  public async getUserById(id: string): Promise<null | UserDocument> {
    try {
      const user = await userModel.findById(id).exec();
      return user ? user : null;
    } catch(err) {
      console.error(err);
      return null;
    }
  }

  public async getUserByNickname(nickname: string): Promise<null | UserDocument> {
    try {
      const user = await userModel.findOne({ nickname: nickname }).exec();
      return user ? user : undefined;
    } catch(err) {
      console.error(err);
      return null;
    }
  }

  public async getByEmail(email: string): Promise<null | UserDocument> {
    try {
      const user = await userModel.findOne({ email: email }).exec();
      return user ? user : null;
    } catch(err) {
      console.error(err);
      return null;
    }
  }

  public async getUsersByIds(ids: string[]): Promise<UserDocument[]> {
    try {
      return await userModel.find( { _id : { $in : ids } } ).exec();
    } catch(err) {
      console.error(err);
      return null;
    }
  }
}
