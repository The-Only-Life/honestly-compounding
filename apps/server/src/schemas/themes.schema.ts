import { Type, Static } from "@sinclair/typebox";

// Schema for creating a new theme
export const CreateThemeSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 255 }),
  description: Type.String({ minLength: 1 }),
});

export type CreateThemeInput = Static<typeof CreateThemeSchema>;

// Schema for theme response
export const ThemeSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.String(),
  createdBy: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  creator: Type.Optional(
    Type.Object({
      fullName: Type.String(),
    })
  ),
});

export type ThemeResponse = Static<typeof ThemeSchema>;

// Schema for list themes response
export const ListThemesSchema = Type.Object({
  themes: Type.Array(ThemeSchema),
  total: Type.Number(),
});

export type ListThemesResponse = Static<typeof ListThemesSchema>;
