import type { FastifyInstance } from "fastify";
import { InviteUserSchema } from "../schemas/auth.schema";
import type { FastifyCustomOptions } from "../types";
import type { Static } from "@fastify/type-provider-typebox";
import Config from "../server.config";

export default async function authRouter(
  server: FastifyInstance,
  options: FastifyCustomOptions
) {
  server.post(
    "/user/invite",
    { 
      schema: { 
        body: InviteUserSchema,
        security: [{ bearerAuth: [] }]
      } 
    },
    async (req, res) => {
      try {
        const { supabase } = options;
        if (!supabase) throw new Error("Supabase client not initialized");
        console.log(req.body);
        const { email } = req.body as Static<typeof InviteUserSchema>;
        const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
          redirectTo: Config.FRONTEND_URL,
        });
        console.log(data, error);
        if (error) {
          throw new Error("Error while sending invite to user" + error.message);
        }
      } catch (error: any) {
        return res
          .status(500)
          .send({ error: "Internal server error " + error.message });
      }
    }
  );
}
