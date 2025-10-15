export const Environment = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
} as const;

type TConfig = {
  PROTOCOL: string;
  AUTH_HOST: string;
  FRONTEND_URL: string;
  SERVICE_ROLE_KEY: string;
  COOKIE_SECRET: string;
  IS_PRODUCTION: boolean;
};

const cfg: Record<string, Omit<TConfig, "PROTOCOL">> = {
  [Environment.DEVELOPMENT]: {
    AUTH_HOST:
      process.env.SUPABASE_URL || "https://uzscnckjhxzjeowjqywa.supabase.co",
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:8080",
    SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    COOKIE_SECRET:
      process.env.COOKIE_SECRET || "dev-secret-change-in-production",
    IS_PRODUCTION: false,
  },
  [Environment.PRODUCTION]: {
    AUTH_HOST: process.env.SUPABASE_URL!,
    FRONTEND_URL: process.env.FRONTEND_URL!,
    SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    COOKIE_SECRET: process.env.COOKIE_SECRET!,
    IS_PRODUCTION: true,
  },
};

const commonCfg = {};

const env =
  process.env.NODE_ENV === Environment.PRODUCTION
    ? Environment.PRODUCTION
    : Environment.DEVELOPMENT;

const EnvironmentConfig = cfg[env]!;
const Config = { ...commonCfg, ...EnvironmentConfig };
export default Config;
