# Snake Case Database Column Updates

## Summary

All database columns have been updated to use snake_case naming convention. The Prisma schema uses `@map()` directives to maintain camelCase in the application code while using snake_case in the database.

---

## Changes Made

### 1. Migration File Updated

**File:** [migrations/2025-01-26_recreate_themes_and_buckets.sql](migrations/2025-01-26_recreate_themes_and_buckets.sql)

All column names now use snake_case:
- `createdBy` → `created_by`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `riskMeasure` → `risk_measure`
- `companyName` → `company_name`
- `themeId` → `theme_id`
- `bucketId` → `bucket_id`
- `pdfUrl` → `pdf_url`

Foreign key references also updated:
- `profiles("userId")` → `profiles(user_id)`
- Constraint names updated to use snake_case

### 2. Prisma Schema Updated

**File:** [libs/db/prisma/schema.prisma](libs/db/prisma/schema.prisma)

Added `@map()` directives to maintain camelCase in code:

```prisma
model Theme {
  id          String   @id @default(cuid())
  name        String   @unique
  description String   @db.Text
  createdBy   String   @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  creator Profile @relation("ThemeCreator", fields: [createdBy], references: [userId])
  stocks  Stock[]

  @@map("themes")
}

model Bucket {
  id           String   @id @default(cuid())
  name         String   @unique
  description  String   @db.Text
  riskMeasure  String   @map("risk_measure")
  createdBy    String   @map("created_by")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  creator Profile @relation("BucketCreator", fields: [createdBy], references: [userId])
  stocks  Stock[]

  @@map("buckets")
}

model Stock {
  id          String   @id @default(cuid())
  symbol      String   @unique
  companyName String   @map("company_name")
  themeId     String   @map("theme_id")
  bucketId    String   @map("bucket_id")
  pdfUrl      String?  @map("pdf_url")
  createdBy   String   @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  theme   Theme   @relation(fields: [themeId], references: [id], onDelete: Restrict)
  bucket  Bucket  @relation(fields: [bucketId], references: [id], onDelete: Restrict)
  creator Profile @relation("StockCreator", fields: [createdBy], references: [userId])

  @@map("stocks")
}
```

### 3. Server Code Updated

#### Buckets Router

**File:** [apps/server/src/routers/buckets.router.ts](apps/server/src/routers/buckets.router.ts)

**Changes:**
- All Supabase queries now use snake_case column names
- Profile queries use `user_id` instead of `userId`
- Foreign key references updated: `buckets_created_by_fkey`
- Profile field changed: `full_name` instead of `fullName`

**Example - GET /api/buckets:**
```typescript
const { data: buckets, error } = await supabase
  .from("buckets")
  .select(`
    id,
    name,
    description,
    risk_measure,
    created_by,
    created_at,
    updated_at,
    creator:profiles!buckets_created_by_fkey(full_name)
  `)
  .order("created_at", { ascending: false });

// Transform to camelCase for API response
const formattedBuckets = (buckets || []).map((bucket: any) => ({
  id: bucket.id,
  name: bucket.name,
  description: bucket.description,
  riskMeasure: bucket.risk_measure,
  createdBy: bucket.created_by,
  createdAt: bucket.created_at,
  updatedAt: bucket.updated_at,
  creator: bucket.creator
    ? { fullName: bucket.creator.full_name }
    : undefined,
}));
```

**Example - POST /api/buckets:**
```typescript
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("user_id")
  .eq("user_id", user.id)
  .single();

const { data: bucket, error } = await supabase
  .from("buckets")
  .insert({
    id: bucketId,
    name,
    description,
    risk_measure: riskMeasure,
    created_by: profile.user_id,
    created_at: now,
    updated_at: now,
  })
  .select(`
    id,
    name,
    description,
    risk_measure,
    created_by,
    created_at,
    updated_at,
    creator:profiles!buckets_created_by_fkey(full_name)
  `)
  .single();
```

#### Themes Router

**File:** [apps/server/src/routers/themes.router.ts](apps/server/src/routers/themes.router.ts)

**Changes:**
- All Supabase queries now use snake_case column names
- Profile queries use `user_id` instead of `userId`
- Foreign key references updated: `themes_created_by_fkey`
- Profile field changed: `full_name` instead of `fullName`

**Example - GET /api/themes:**
```typescript
const { data: themes, error } = await supabase
  .from("themes")
  .select(`
    id,
    name,
    description,
    created_by,
    created_at,
    updated_at,
    creator:profiles!themes_created_by_fkey(full_name)
  `)
  .order("created_at", { ascending: false });

// Transform to camelCase for API response
const formattedThemes = (themes || []).map((theme: any) => ({
  id: theme.id,
  name: theme.name,
  description: theme.description,
  createdBy: theme.created_by,
  createdAt: theme.created_at,
  updatedAt: theme.updated_at,
  creator: theme.creator
    ? { fullName: theme.creator.full_name }
    : undefined,
}));
```

**Example - POST /api/themes:**
```typescript
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("user_id")
  .eq("user_id", user.id)
  .single();

const { data: theme, error } = await supabase
  .from("themes")
  .insert({
    id: themeId,
    name,
    description,
    created_by: profile.user_id,
    created_at: now,
    updated_at: now,
  })
  .select(`
    id,
    name,
    description,
    created_by,
    created_at,
    updated_at,
    creator:profiles!themes_created_by_fkey(full_name)
  `)
  .single();
```

---

## API Layer Pattern

The API maintains **camelCase** for JSON responses while the database uses **snake_case**. This is achieved through:

1. **Database Layer (Supabase queries):** Use snake_case
2. **Transformation Layer:** Convert snake_case to camelCase
3. **API Response:** Send camelCase JSON to frontend

**Example transformation:**
```typescript
// Database returns snake_case
{
  created_by: "user_123",
  created_at: "2025-01-26T12:00:00Z",
  risk_measure: "High"
}

// API returns camelCase
{
  createdBy: "user_123",
  createdAt: "2025-01-26T12:00:00Z",
  riskMeasure: "High"
}
```

---

## Frontend (No Changes Required)

The frontend code remains unchanged because:
- API client expects and receives camelCase responses
- TypeScript interfaces use camelCase
- React components use camelCase props

**Files that remain the same:**
- ✅ [apps/web/src/lib/api-client.ts](apps/web/src/lib/api-client.ts)
- ✅ [apps/web/src/hooks/use-buckets-api.ts](apps/web/src/hooks/use-buckets-api.ts)
- ✅ [apps/web/src/hooks/use-themes-api.ts](apps/web/src/hooks/use-themes-api.ts)
- ✅ All page components
- ✅ All dialog components

---

## Migration Steps

### 1. Run the Migration

```bash
# Connect to your database and run the migration
psql -h <host> -U <user> -d <database> -f migrations/2025-01-26_recreate_themes_and_buckets.sql
```

### 2. Regenerate Prisma Client

```bash
cd libs/db
bun prisma generate
```

### 3. Restart Server

```bash
cd apps/server
bun run dev
```

---

## Column Mapping Reference

| Application Code (camelCase) | Database Column (snake_case) |
|------------------------------|------------------------------|
| `createdBy`                  | `created_by`                 |
| `createdAt`                  | `created_at`                 |
| `updatedAt`                  | `updated_at`                 |
| `riskMeasure`                | `risk_measure`               |
| `companyName`                | `company_name`               |
| `themeId`                    | `theme_id`                   |
| `bucketId`                   | `bucket_id`                  |
| `pdfUrl`                     | `pdf_url`                    |
| `userId`                     | `user_id`                    |
| `fullName`                   | `full_name`                  |

---

## Testing Checklist

After running migration:

1. ✅ **GET /api/buckets** - Returns list of buckets with camelCase fields
2. ✅ **POST /api/buckets** - Creates bucket with snake_case in DB
3. ✅ **GET /api/buckets/:id** - Returns single bucket with camelCase
4. ✅ **GET /api/themes** - Returns list of themes with camelCase fields
5. ✅ **POST /api/themes** - Creates theme with snake_case in DB
6. ✅ **GET /api/themes/:id** - Returns single theme with camelCase
7. ✅ Frontend can create and view buckets
8. ✅ Frontend can create and view themes
9. ✅ Markdown content displays correctly
10. ✅ Creator names display correctly

---

## Summary of Files Changed

### Database Layer
- ✅ `migrations/2025-01-26_recreate_themes_and_buckets.sql`
- ✅ `libs/db/prisma/schema.prisma`

### Server Layer
- ✅ `apps/server/src/routers/buckets.router.ts`
- ✅ `apps/server/src/routers/themes.router.ts`

### Frontend Layer
- ❌ No changes required (API contract maintained)

---

**All database columns now use snake_case while maintaining camelCase in the application layer!** ✅
