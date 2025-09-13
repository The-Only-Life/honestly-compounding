const environment = import.meta.env.ENVIRONMENT;

export enum ENVIRONMENT {
    DEVELOPMENT = "development",
    PRODUCTION = "production"
}

export type TAppConfig = {
    [key in ENVIRONMENT]: {
        DB_CONN_URL: string;
    };
};

const Config: TAppConfig = {
    [ENVIRONMENT.DEVELOPMENT]: {
        DB_CONN_URL: import.meta.env.DB_CONNECTION_STRING_DEV
    },
    [ENVIRONMENT.PRODUCTION]: {
        DB_CONN_URL: import.meta.env.DB_CONNECTION_STRING_PROD
    }
}

export const AppConfig = Config[environment || ENVIRONMENT.PRODUCTION]