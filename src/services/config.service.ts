export class ConfigService {

  private static env = (process.env as any);

  public static getDbConnectionString(): string {
    const username = process.env.DB_USERNAME;
    const pass = process.env.DB_PASS;
    const name = process.env.DB_NAME;
    return `mongodb+srv://${username}:${pass}@cluster0-m8z4s.mongodb.net/${name}?retryWrites=true&w=majority`;
  }

  public static getEnvValue(key: string): string {
    return this.env[key];
  }

  public static getConfirmEmailUrl(): string {
    return `${this.env.UI_BASE_URL}${this.env.CONFIRM_EMAIL_URL}`;
  }
}
