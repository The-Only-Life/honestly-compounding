import { Type } from "@fastify/type-provider-typebox";

export const CreateUserSchema = Type.Object({
  email: Type.Optional(Type.String({ format: "email" })),
  phone: Type.Optional(Type.String()),
  role: Type.Union([
    Type.Literal("admin"),
    Type.Literal("sponsor"),
    Type.Literal("subscriber"),
  ]),
});


export const UpdateUserRoleSchema = Type.Object({
  role: Type.Union([
    Type.Literal("admin"),
    Type.Literal("sponsor"),
    Type.Literal("subscriber"),
  ]),
});

export const AcknowledgeTermsSchema = Type.Object({});
