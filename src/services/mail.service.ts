import { Service } from "typedi";
import { ApiResponseMessage } from '../constants/api-response-message';
import Mailgun from 'mailgun-js';
import { ConfigService } from './config.service';
import { RegisterMail } from '../types/register-mail';
import { MailType } from '../constants/mail-types';
import { MailTemplateService } from './mail-template.service';


@Service()
export class MailService {

  private mailgun;

  constructor(private mailTemplateService: MailTemplateService) {
    this.mailgun = new Mailgun({
      apiKey: ConfigService.getEnvValue('MAILGUN_API_KEY'),
      domain: ConfigService.getEnvValue('MAILGUN_DOMAIN'),
      host: ConfigService.getEnvValue('MAILGUN_EU_HOST')
    });
  }

  public async send(userData: RegisterMail, mailType: MailType) {
    const data = {
      from: this.mailTemplateService.getSender(),
      to: userData.$emailAddress,
      subject: this.mailTemplateService.getSubject(mailType),
      html: this.mailTemplateService.getTemplatewithUserData(userData, mailType)
    }
  
    try {
      await this.mailgun.messages().send(data);
    } catch (err) {
      console.error(err);
      return ApiResponseMessage.EMAIL_SEND_FAIL;
    }
  }

  
}
