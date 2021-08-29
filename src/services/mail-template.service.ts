import { Service } from "typedi";
import { MailType } from "../constants/mail-types";
import { RegisterMail } from "../types/register-mail";
import * as fs from 'fs';

@Service()
export class MailTemplateService {

  private BASE_TEMPLATE_PATH = 'constants/mail-templates/';
  private CREDENTIALS = {
    SENDER: 'no-reply@nfl-tipper-game.com'
  };

  public getSender(): string {
    return this.CREDENTIALS.SENDER;
  }

  public getTemplate(type: MailType): { path: string, subject: string } {
    if (type === MailType.EMAIL_CONFIRM ) {
      return {
        path: `${this.BASE_TEMPLATE_PATH}confirm-email-template.html`,
        subject: 'Welcome to NFL tipper!'
      };
    } else if (type === MailType.FORGOT_PASSWORD) {
      return {
        path: `${this.BASE_TEMPLATE_PATH}forgot-password-template.html`,
        subject: 'Reset yout password'
      };
    } else if (type === MailType.LEAGUE_INVITE) {
      return {
        path: `${this.BASE_TEMPLATE_PATH}league-invitation-template.html`,
        subject: 'League invitation'
      };
    } else if (type === MailType.REGISTRATION) {
      return {
        path: `${this.BASE_TEMPLATE_PATH}registration-mail-template.html`,
        subject: 'Welcome to NFL tipper!'
      };
    }
    return {
      path: '',
      subject: ''
    };
  }

  public getTemplatewithUserData(userData: RegisterMail, type: MailType): string {
    const templatePath = this.getTemplatePath(type);
    if (!templatePath) {
      return '';
    }
    let onelinerTemplate = this.getTempalteAsOneLiner(templatePath);
    const keys = Object.keys(userData);
    keys.forEach(key => {
      while (onelinerTemplate.includes(key)) {
        onelinerTemplate = onelinerTemplate.replace(key, (userData as any)[key]);
      }
    })
    return this.removeBrackets(onelinerTemplate);
  }

  public getSubject(type: MailType): string {
    if (type === MailType.EMAIL_CONFIRM ) {
      return 'Welcome to NFL tipper!';
    } else if (type === MailType.FORGOT_PASSWORD) {
      return 'Reset yout password';
    } else if (type === MailType.LEAGUE_INVITE) {
      return 'League invitation';
    } else if (type === MailType.REGISTRATION) {
      return 'Welcome to NFL tipper!'
    } else {
      return '';
    }
  }

  private getTemplatePath(type: MailType): string {
    if (type === MailType.EMAIL_CONFIRM ) {
      return `${this.BASE_TEMPLATE_PATH}confirm-email-template.html`;
    } else if (type === MailType.FORGOT_PASSWORD) {
      return `${this.BASE_TEMPLATE_PATH}forgot-password-template.html`;
    } else if (type === MailType.LEAGUE_INVITE) {
      return `${this.BASE_TEMPLATE_PATH}league-invitation-template.html`;
    } else if (type === MailType.REGISTRATION) {
      return `${this.BASE_TEMPLATE_PATH}registration-mail-template.html`;
    } else {
      return '';
    }
  }

  private getTempalteAsOneLiner(templatePath: string) {
    const fileUrl = new URL(this.getBasePath(templatePath));
    const rawFile = fs.readFileSync(fileUrl, 'utf8').toString();
    let result = rawFile.replace(/(\r\n|\n|\r)/gm, ""); //removes break lines
    while (result.includes('    ')) {
      result = result.replace('    ', '');
    }
    return result;
  }

  private getBasePath(filePath: string): string {
    const fileBase = 'file:///' + __dirname.replace(/\\/g, '/').slice(0, -8);
    return fileBase + filePath;
  }

  private removeBrackets(template: string): string {
    const brackets = ['{{ ', ' }}'];
    brackets.forEach(bracket => {
      while (template.includes(bracket)) {
        template = template.replace(bracket, '');
      }
    });
    return template;
}

}
