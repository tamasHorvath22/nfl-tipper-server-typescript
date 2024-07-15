export enum EnvKey {
  PORT = 'PORT',
  JWT_PRIVATE_KEY = 'JWT_PRIVATE_KEY',
  DB_USERNAME = 'DB_USERNAME',
  DB_PASS = 'DB_PASS',
  APP_NAME = 'APP_NAME',
  SPORTRADAR_KEY = 'SPORTRADAR_KEY',
  API_PRIVATE_KEY = 'API_PRIVATE_KEY',
  CLUSTER = 'CLUSTER'
}

export interface EnvModel {
  [EnvKey.PORT]: string;
  [EnvKey.DB_USERNAME]: string;
  [EnvKey.DB_PASS]: string;
  [EnvKey.APP_NAME]: string;
  [EnvKey.SPORTRADAR_KEY]: string;
  [EnvKey.JWT_PRIVATE_KEY]: string;
  [EnvKey.API_PRIVATE_KEY]: string;
  [EnvKey.CLUSTER]: string;
}

export class ConfigService {

  private static env = (process.env as unknown as EnvModel);

  public static getEnvValue(key: keyof EnvModel): string {
    return this.env[key];
  }

  public static getDbConnectionString(): string {
    const username = ConfigService.getEnvValue(EnvKey.DB_USERNAME);
    const pass = ConfigService.getEnvValue(EnvKey.DB_PASS);
    const appName = ConfigService.getEnvValue(EnvKey.APP_NAME);
    const cluster = ConfigService.getEnvValue(EnvKey.CLUSTER);
    return `mongodb+srv://${username}:${pass}@${cluster}/?retryWrites=true&w=majority&appName=${appName}`;
  }

}
