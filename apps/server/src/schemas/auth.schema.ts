import { Type } from '@fastify/type-provider-typebox';

export const UserRoles = {
    ADMIN: "admin",
    SUBSCRIBER: "subscriber",
    SPONSOR: "sponsor"
} as const

export const UserSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    email: Type.String({ format: "email" }),
    phone: Type.String({ pattern: '^(\\+91[- ]?)?[6-9]\\d{9}$' }),
    role: Type.Enum(Object.values(UserRoles)),
    approved: Type.Boolean(),
    active: Type.Boolean(),
    _created_at: Type.String({ format: "date-time" }),
    _updated_at: Type.String({ format: "date-time" }),
})

export const CreateUserSchema = Type.Omit(UserSchema, ['id', "_created_at", "_updated_at"]);

export const InviteUserSchema = Type.Object({
    email: Type.String({ format: "email" })
})