import Fastify from "fastify";
import authRouter from "./routers/auth.router";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { createClient } from "@supabase/supabase-js";
import Config from "./server.config";

const server = Fastify({
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

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

const supabase = createClient(
  Config.AUTH_HOST,
  Config.SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

await server.register(authRouter, { prefix: "/auth", supabase });

// Health check endpoint
server.get("/health", async (_req, reply) => {
  reply.send({ status: "ok" });
});

const port = Number(process.env.INTERNAL_PORT) || 3001;
server.listen({ port, host: "0.0.0.0" });
