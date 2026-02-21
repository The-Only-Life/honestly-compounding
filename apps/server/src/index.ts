import Fastify from "fastify";
import authRouter from "./routers/auth.router";
import usersRouter from "./routers/users.router";
import waitlistRouter from "./routers/waitlist.router";
import bucketsRouter from "./routers/buckets.router";
import themesRouter from "./routers/themes.router";
import stocksRouter from "./routers/stocks.router";
import notificationsRouter from "./routers/notifications.router";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { createClient } from "@supabase/supabase-js";
import Config from "./server.config";
import { initRealtimeSubscription } from "./notification-broadcaster";

const server = Fastify({
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

// Register cookie plugin
await server.register(import("@fastify/cookie"), {
  secret: Config.COOKIE_SECRET,
  parseOptions: {
    httpOnly: true,
    secure: Config.IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
  },
});

// Register multipart plugin for file uploads
await server.register(import("@fastify/multipart"), {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

await server.register(import("@fastify/swagger"), {
  openapi: {
    openapi: "3.0.0",
    info: {
      title: "Honestly Compounding",
      description: "API documentation",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
});

await server.register(import("@fastify/swagger-ui"), {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "full",
    deepLinking: false,
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
});

const supabase = createClient(Config.AUTH_HOST, Config.SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

await server.register(authRouter, { prefix: "/api/auth", supabase });
await server.register(usersRouter, { prefix: "/api/users", supabase });
await server.register(waitlistRouter, { prefix: "/api/waitlist", supabase });
await server.register(bucketsRouter, { prefix: "/api/buckets", supabase });
await server.register(themesRouter, { prefix: "/api/themes", supabase });
await server.register(stocksRouter, { prefix: "/api/stocks", supabase });
await server.register(notificationsRouter, { prefix: "/api/notifications", supabase });

initRealtimeSubscription(supabase);

// Health check endpoint
server.get("/health", async (_req, reply) => {
  reply.send({ status: "ok" });
});

const port = Number(process.env.INTERNAL_PORT) || 3001;
await server.listen({ port, host: "0.0.0.0" });
console.log(`Server listening on http://0.0.0.0:${port}`);
