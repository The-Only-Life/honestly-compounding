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
    email: Type.Optional(Type.String({ format: "email" })),
    phone: Type.Optional(Type.String({ pattern: '^(\\+91[- ]?)?[6-9]\\d{9}$' })),
    role: Type.Union([
        Type.Literal("admin"),
        Type.Literal("sponsor"),
        Type.Literal("subscriber"),
    ])
})

export const BulkInviteUserSchema = Type.Object({
    users: Type.Array(Type.Object({
        email: Type.Optional(Type.String({ format: "email" })),
        phone: Type.Optional(Type.String({ pattern: '^(\\+91[- ]?)?[6-9]\\d{9}$' })),
        role: Type.Union([
            Type.Literal("admin"),
            Type.Literal("sponsor"),
            Type.Literal("subscriber"),
        ])
    }))
})

export const VerifyInviteSchema = Type.Object({
    token_hash: Type.String(),
    type: Type.Literal("invite")
})

export const CompleteProfileSchema = Type.Object({
    email: Type.Optional(Type.String({ format: "email" })),
    phone: Type.Optional(Type.String({ pattern: '^(\\+91[- ]?)?[6-9]\\d{9}$' })),
    password: Type.String({ minLength: 6 })
})

// Login schemas
export const LoginSchema = Type.Object({
    email: Type.String({ format: "email" }),
    password: Type.String({ minLength: 6 })
})

export const PhoneLoginSchema = Type.Object({
    phone: Type.String({ pattern: '^(\\+91[- ]?)?[6-9]\\d{9}$' }),
    password: Type.String({ minLength: 6 })
})

// Auth response schemas
export const AuthUserSchema = Type.Object({
    id: Type.String(),
    email: Type.String({ format: "email" }),
    role: Type.Optional(Type.String()),
    emailVerified: Type.Boolean(),
    createdAt: Type.String()
})

export const LoginResponseSchema = Type.Object({
    user: AuthUserSchema,
    message: Type.String()
})

export const LogoutResponseSchema = Type.Object({
    message: Type.String()
})

// Phone OTP schemas
export const SendOTPSchema = Type.Object({
    phone: Type.String({ pattern: '^\\+91[6-9]\\d{9}$' })
})

export const VerifyOTPSchema = Type.Object({
    phone: Type.String({ pattern: '^\\+91[6-9]\\d{9}$' }),
    otp: Type.String({ minLength: 6, maxLength: 6 })
})