import { Type } from "@fastify/type-provider-typebox";
import type { Static } from "@fastify/type-provider-typebox";

export const JoinWaitlistSchema = Type.Object({
  email: Type.String({ format: "email" }),
});

export const GetWaitlistSchema = Type.Object({
  status: Type.Optional(Type.Union([
    Type.Literal("pending"),
    Type.Literal("invited"),
  ])),
});

export const ApproveWaitlistSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  email: Type.String({ format: "email" }),
});

export type JoinWaitlistInput = Static<typeof JoinWaitlistSchema>;
export type GetWaitlistInput = Static<typeof GetWaitlistSchema>;
export type ApproveWaitlistInput = Static<typeof ApproveWaitlistSchema>;
