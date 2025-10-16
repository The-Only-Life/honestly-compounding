# Users Feature Implementation TODO

## Status: ✅ Completed

## Manual Admin Role Assignment

To manually assign the admin role to a user, use the following CURL command:

```bash
# First, log in to get cookies (or use an existing admin session)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}' \
  -c cookies.txt

# Then, update user role to admin
curl -X PATCH http://localhost:3001/api/users/{USER_ID}/role \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"role":"admin"}'
```

Replace `{USER_ID}` with the actual user ID from Supabase.

**Alternative: Direct Supabase Admin API**

If you don't have an admin user yet, use Supabase's Admin API directly:

```bash
curl -X PATCH https://uzscnckjhxzjeowjqywa.supabase.co/auth/v1/admin/users/{USER_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: YOUR_SUPABASE_SERVICE_ROLE_KEY" \
  -d '{"role":"admin"}'
```

Replace:
- `{USER_ID}` with the actual user ID
- `YOUR_SUPABASE_SERVICE_ROLE_KEY` with your Supabase service role key
- Update the Supabase URL if different

### Tasks Completed:

- [✅] 1. Review current Users.tsx component and codebase structure
- [✅] 2. Create HOC for role-based access control (withRoleAccess)
- [✅] 3. Update AppSidebar.tsx to conditionally show Users tab (admin only)
- [✅] 4. Update routes to protect Users page (admin only) - Already protected in App.tsx
- [✅] 5. Implement Users.tsx component:
  - [✅] 5.1. Fetch and display all users from the platform
  - [✅] 5.2. Display user information (email, phone, role, verified status, etc.)
  - [✅] 5.3. Add ability to assign roles (Sponsor/Subscriber) to existing users
  - [✅] 5.4. Add create new user form (email or phone + role)
  - [✅] 5.5. Statistics cards showing user metrics
- [✅] 6. Create API endpoints on server:
  - [✅] 6.1. GET /api/users - fetch all users (admin only)
  - [✅] 6.2. POST /api/users - create new user with role (admin only)
  - [✅] 6.3. PATCH /api/users/:id/role - update user role (admin only)
  - [✅] 6.4. (Manual) Admin role assignment - CURL commands provided above
- [✅] 7. Created TypeScript types and schemas
- [✅] 8. Created custom React hooks for user management
- [✅] 9. Added proper error handling and loading states

## Notes:
- Admin can see everything (Sponsor + Subscriber + Admin-only components)
- Sponsors and Subscribers see the same components
- Users.tsx is admin-only
- Roles: admin, sponsor, subscriber
- User creation via email or phone number
