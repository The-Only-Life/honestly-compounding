# Prisma Schema Management

This directory contains the Prisma schema and migration tools for managing the Supabase PostgreSQL database.

## Overview

The Prisma schema (`schema.prisma`) defines the database structure for the Honestly Insight Hub application. The database is hosted on Supabase and uses PostgreSQL with Supabase Auth for authentication.

## Database Structure

The schema includes the following main tables:

- **profiles** - User profile information (maps to Supabase auth.users)
- **user_metadata** - Additional user metadata including roles and access approval
- **user_roles** - User role assignments with expiration support
- **user_sessions** - User login/logout tracking
- **themes** - Investment themes
- **buckets** - Risk buckets for categorizing stocks
- **stocks** - Stock information with theme and bucket associations
- **content_access** - User access permissions for content
- **audit_logs** - Audit trail for user actions
- **waitlist** - Email waitlist for pending users

## Setup Instructions

### 1. Environment Configuration

Ensure your `.env` file contains the correct Supabase connection string:

```env
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://[user]:[password]@[host]:[port]/[database]"
```

- `DATABASE_URL` - Used for connection pooling (via PgBouncer)
- `DIRECT_URL` - Direct connection for migrations

### 2. Generate Prisma Client

After making schema changes, regenerate the Prisma client:

```bash
cd libs/db
bun prisma generate
```

This will generate the TypeScript client in `libs/db/src/generated`.

### 3. Database Migrations

#### Option A: Using SQL Migrations (Recommended for Supabase)

For structural changes (creating/dropping tables), use SQL migrations directly in Supabase:

1. Navigate to Supabase Dashboard > SQL Editor
2. Run the migration SQL files from the `migrations/` directory
3. Update the Prisma schema to match the database structure
4. Run `bun prisma generate` to update the client

Example migration files:
- `migrations/2025-01-26_recreate_themes_and_buckets.sql` - Recreates themes and buckets tables with snake_case columns

#### Option B: Using Prisma Migrate (Development)

For development environments:

```bash
cd libs/db
bun prisma migrate dev --name migration_name
```

**Warning:** Prisma Migrate requires direct database access and may not work well with Supabase's auth schema.

### 4. Introspect Database (Pull Schema from Database)

If you need to sync your Prisma schema with the current database state:

```bash
cd libs/db
bun prisma db pull
```

This will update your `schema.prisma` file to match the database structure.

### 5. Push Schema Changes (Development Only)

To push schema changes without creating migrations:

```bash
cd libs/db
bun prisma db push
```

**Warning:** This bypasses migration history and should only be used in development.

## Updating Tables in Supabase

### Step 1: Prepare the Migration

1. Create a new SQL migration file in the `migrations/` directory
2. Use descriptive naming: `YYYY-MM-DD_description.sql`
3. Include comments explaining what the migration does
4. Test the migration locally first if possible

### Step 2: Backup Your Data

Before running destructive migrations:

1. Go to Supabase Dashboard > Database > Backups
2. Create a manual backup
3. Alternatively, export critical data using SQL:

```sql
-- Export themes
COPY themes TO '/tmp/themes_backup.csv' CSV HEADER;

-- Export buckets
COPY buckets TO '/tmp/buckets_backup.csv' CSV HEADER;

-- Export stocks
COPY stocks TO '/tmp/stocks_backup.csv' CSV HEADER;
```

### Step 3: Run the Migration in Supabase

1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy your migration SQL
4. Review the SQL carefully
5. Click "Run" to execute

### Step 4: Update Prisma Schema

1. Update `schema.prisma` to match the new database structure
2. Ensure all field mappings are correct (use `@map()` for snake_case columns)
3. Regenerate the Prisma client:

```bash
cd libs/db
bun prisma generate
```

### Step 5: Verify the Changes

1. Test database queries using the updated Prisma client
2. Check that all foreign key relationships work correctly
3. Verify indexes are properly created
4. Test your application endpoints

## Common Migration Patterns

### Adding a New Column

```sql
ALTER TABLE table_name
ADD COLUMN column_name TYPE DEFAULT value;

-- Then update schema.prisma
-- Add the field to the model
-- Run: bun prisma generate
```

### Renaming a Column (Preserves Data)

```sql
ALTER TABLE table_name
RENAME COLUMN old_name TO new_name;

-- Update schema.prisma with @map()
-- Run: bun prisma generate
```

### Creating a New Table with Foreign Keys

```sql
CREATE TABLE new_table (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT new_table_user_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(user_id)
    ON DELETE CASCADE
);

CREATE INDEX idx_new_table_user_id ON new_table(user_id);
```

### Recreating Tables (Destructive)

When you need to completely restructure a table:

```sql
-- Step 1: Backup data if needed
CREATE TABLE themes_backup AS SELECT * FROM themes;

-- Step 2: Drop dependent tables (cascade)
DROP TABLE IF EXISTS stocks CASCADE;
DROP TABLE IF EXISTS themes CASCADE;

-- Step 3: Recreate with new structure
CREATE TABLE themes (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  -- ... other columns
);

-- Step 4: Recreate dependent tables
CREATE TABLE stocks (
  -- ... columns
  CONSTRAINT stocks_theme_fkey
    FOREIGN KEY (theme_id)
    REFERENCES themes(id)
);

-- Step 5: Restore data if applicable
-- INSERT INTO themes SELECT * FROM themes_backup;
```

## Schema Conventions

### Naming Conventions

- **Tables:** Use snake_case (e.g., `user_sessions`, `audit_logs`)
- **Columns:** Use snake_case (e.g., `created_at`, `user_id`)
- **Prisma Models:** Use PascalCase (e.g., `UserSession`, `AuditLog`)
- **Prisma Fields:** Use camelCase with `@map()` for snake_case columns

### Type Mappings

| PostgreSQL Type | Prisma Type | Notes |
|----------------|-------------|-------|
| `UUID` | `String @db.Uuid` | For user IDs and system-generated IDs |
| `TEXT` | `String` or `String @db.Text` | For variable-length strings |
| `TIMESTAMP(3)` | `DateTime @db.Timestamp(3)` | For themes/buckets/stocks timestamps |
| `TIMESTAMPTZ(6)` | `DateTime @db.Timestamptz(6)` | For user-related timestamps |
| `INET` | `String @db.Inet` | For IP addresses |
| `BOOLEAN` | `Boolean` | For flags |

### ID Generation

- **User-related tables:** Use `@default(uuid()) @db.Uuid` (Supabase generates these)
- **Content tables (themes, buckets, stocks):** Use custom string IDs (no default)
- **System tables:** Use `@default(uuid()) @db.Uuid`

## Troubleshooting

### Prisma Client Out of Sync

If you see errors about missing fields or tables:

```bash
cd libs/db
bun prisma generate
```

### Foreign Key Constraint Errors

Ensure referenced records exist before inserting:

```typescript
// Create theme first
const theme = await prisma.theme.create({ data: { ... } });

// Then create stocks referencing the theme
const stock = await prisma.stock.create({
  data: {
    themeId: theme.id,
    // ...
  }
});
```

### Migration Conflicts

If Prisma migrations conflict with Supabase:

1. Use SQL migrations for structural changes
2. Keep `schema.prisma` as the source of truth for your app
3. Use `prisma db pull` to sync after manual SQL changes
4. Regenerate the client with `bun prisma generate`

## Best Practices

1. **Always backup** before running destructive migrations
2. **Test migrations** in a development environment first
3. **Use transactions** for complex migrations
4. **Document changes** in migration files with comments
5. **Update both** the database AND schema.prisma
6. **Regenerate client** after every schema change
7. **Version control** all schema changes and migrations
8. **Use indexes** for frequently queried foreign keys
9. **Set appropriate cascading rules** for foreign keys
10. **Validate data** after migrations complete

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
