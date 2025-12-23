const environment = import.meta.env.ENVIRONMENT;

export enum ENVIRONMENT {
    DEVELOPMENT = "development",
    PRODUCTION = "production"
}

export type TAppConfig = {
    [key in ENVIRONMENT]: {
        DB_CONN_URL: string;
        API_BASE_URL: string;
    };
};

const Config: TAppConfig = {
    [ENVIRONMENT.DEVELOPMENT]: {
        DB_CONN_URL: import.meta.env.DB_CONNECTION_STRING_DEV,
        // In development, API server runs on port 3001
        API_BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3001"
    },
    [ENVIRONMENT.PRODUCTION]: {
        DB_CONN_URL: import.meta.env.DB_CONNECTION_STRING_PROD,
        // In production, use relative URLs since nginx proxies /api/ to backend
        API_BASE_URL: import.meta.env.VITE_API_URL || ""
    }
}

export const AppConfig = Config[environment || ENVIRONMENT.PRODUCTION]