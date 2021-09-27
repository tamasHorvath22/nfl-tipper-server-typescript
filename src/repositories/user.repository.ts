import { DocumentName } from '../constants/document-names';
import { UserDocument } from '../documents/user.document';
import { EmailConfirmDocument } from '../documents/email-confirm.document';
import { Service } from "typedi";
import { ApiResponseMessage } from '../constants/api-response-message';
import Transaction from 'mongoose-transactions-typescript';
import userModel from '../mongoose-models/user.model';
import { ForgotPasswordDocument } from '../documents/forgot-password.document';
import forgotPasswordModel from '../mongoose-models/forgot-password.model';
import emailConfirmModel from '../mongoose-models/email-confirm.model';


@Service()
export class UserRepositoryService {

  public async saveUser(user: UserDocument, emailConfirm: EmailConfirmDocument): Promise<ApiResponseMessage> {
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
    }
  }

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

  public async getUserByUsername(username: string): Promise<null | UserDocument> {
    try {
      const user = await userModel.findOne({ username: username }).exec();
      return user ? user : null;
    } catch(err) {
      console.error(err);
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

  public async createPasswordReset(forgotPassword: ForgotPasswordDocument): Promise<boolean> {
    const transaction = new Transaction(true);
    transaction.insert(DocumentName.FORGOT_PASSWORD, forgotPassword);
  
    try {
      await transaction.run();
      return true;
    } catch (err)  {
      console.error(err);
      transaction.rollback();
      return false;
    }
  }

  public async getForgotPasswordById(id: string): Promise<ForgotPasswordDocument | null> {
    try {
      return await forgotPasswordModel.findById(id).exec();
    } catch(err) {
      console.error(err);
      return null;
    }
  }

  public async createNewPassword(user: UserDocument, forgotPassword: ForgotPasswordDocument): Promise<boolean> {
    const transaction = new Transaction(true);
    transaction.insert(DocumentName.USER, user);
    transaction.remove(DocumentName.FORGOT_PASSWORD, forgotPassword._id);
  
    try {
      await transaction.run();
      return true;
    } catch (err)  {
      console.error(err);
      transaction.rollback();
      return false;
    }
  }

  public async getEmailConfirmById(id: string) {
    try {
      const confirm = await emailConfirmModel.findById(id).exec();
      return confirm ? confirm : null;
    } catch(err) {
      console.error(err);
      return null;
    }
  }

  public async confirmEmail(user: UserDocument, emailConfirm: EmailConfirmDocument): Promise<boolean> {
    const transaction = new Transaction(true);
    transaction.remove(DocumentName.EMAIL_CONFIRM, emailConfirm._id);
    transaction.insert(DocumentName.USER, user);
  
    try {
      await transaction.run();
      return true;
    } catch (err)  {
      console.error(err);
      transaction.rollback();
      return false;
    }
  }

  public async changePassword(user: UserDocument): Promise<boolean> {
    const transaction = new Transaction(true);
    transaction.insert(DocumentName.USER, user);
  
    try {
      await transaction.run();
      return true;
    } catch (err)  {
      console.error(err);
      transaction.rollback();
      return false;
    }
  }
  
  
}
