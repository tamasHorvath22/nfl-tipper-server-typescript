export enum EnvKey {
  PORT = 'PORT',
  JWT_PRIVATE_KEY = 'JWT_PRIVATE_KEY',
  DB_USERNAME = 'DB_USERNAME',
  DB_PASS = 'DB_PASS',
  DB_NAME = 'DB_NAME',
  SPORTRADAR_KEY = 'SPORTRADAR_KEY',
  API_PRIVATE_KEY = 'API_PRIVATE_KEY'
}

export interface EnvModel {
  [EnvKey.PORT]: string;
  [EnvKey.DB_USERNAME]: string;
  [EnvKey.DB_PASS]: string;
  [EnvKey.DB_NAME]: string;
  [EnvKey.SPORTRADAR_KEY]: string;
  [EnvKey.JWT_PRIVATE_KEY]: string;
  [EnvKey.API_PRIVATE_KEY]: string;
}

export class ConfigService {

  private static env = (process.env as unknown as EnvModel);

  public static getEnvValue(key: keyof EnvModel): string {
    return this.env[key];
  }

  public static getDbConnectionString(): string {
    const username = ConfigService.getEnvValue(EnvKey.DB_USERNAME);
    const pass = ConfigService.getEnvValue(EnvKey.DB_PASS);
    const name = ConfigService.getEnvValue(EnvKey.DB_NAME);
    return `mongodb+srv://${username}:${pass}@cluster0-m8z4s.mongodb.net/${name}?retryWrites=true&w=majority`;
  }

}
