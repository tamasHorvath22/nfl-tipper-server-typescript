import { EmailConfirmDocument } from './../documents/email-confirm.document';
import { Service } from "typedi";
import { ApiResponseMessage } from '../constants/api-response-message';
import Transaction from 'mongoose-transactions-typescript';
import { DocumentName } from "../constants/document-names";
import { UserDocument } from "../documents/user.document";
import userModel from '../mongoose-models/user.model';
import { ForgotPasswordDocument } from '../documents/forgot-password.document';


@Service()
export class UserRepositoryService {

  public async saveUser(user: UserDocument, emailConfirm: EmailConfirmDocument): Promise<string> {
    const transaction = new Transaction(true);
    transaction.insert(DocumentName.USER, user);
    transaction.insert(DocumentName.EMAIL_CONFIRM, emailConfirm);

    try {
      await transaction.run();
      return ApiResponseMessage.SUCCESSFUL_REGISTRATION;
    } catch (err)  {
      transaction.rollback();
      if (err.error.keyPattern.hasOwnProperty('username')) {
        return ApiResponseMessage.USERNAME_TAKEN;
      } else if (err.error.keyPattern.hasOwnProperty('email')) {
        return ApiResponseMessage.EMAIL_TAKEN;
      } else {
        return ApiResponseMessage.UNSUCCESSFUL_REGISTRATION;
      }
    };
  }

  public async getByUsername(username: string): Promise<null | UserDocument> {
    try {
      const user = await userModel.findOne({ username: username }).exec();
      return user ? user : null;
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

  public async createPasswordReset(forgotPassword: ForgotPasswordDocument) {
    const transaction = new Transaction(true);
    transaction.insert(DocumentName.FORGOT_PASSWORD, forgotPassword);
  
    try {
      await transaction.run();
      return true;
    } catch (err)  {
      console.error(err);
      transaction.rollback();
      return false;
    };
  }
  
  
}
