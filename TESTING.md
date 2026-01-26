# Honestly Compounding - Comprehensive Testing Plan

## Overview
This document outlines all user flows, features, and critical testing scenarios for the Honestly Compounding platform. The application is a research content management system with role-based access control (Admin, Sponsor, Subscriber).

---

## GUEST USER FLOWS

### 1. Authentication & Waitlist
- **Sign In Page** (`/auth`)
  - Email/password login with reCAPTCHA verification
  - Join waitlist functionality with email capture
  - Error handling for invalid credentials
  - Loading states and form validation

- **Waitlist Submission**
  - Email validation
  - Duplicate email detection
  - reCAPTCHA token validation
  - Success confirmation message
  - Prevents duplicate waitlist entries

### 2. Public Pages
- **Index/Landing Page** (`/`)
  - Public information display
  - Navigation to sign in
  - Navigation to waitlist

---

## AUTHENTICATED USER FLOWS (All roles)

### 1. Core Authentication Lifecycle
- **Login**
  - Email/password authentication via Supabase
  - Cookie-based session management (HTTPOnly cookies)
  - Token refresh mechanism (7-day session validity)
  - CAPTCHA verification in production
  - User metadata retrieval (role, access_approved, profile_completed, has_agreed_to_terms)

- **Logout**
  - Single device logout
  - Logout from all devices
  - Cookie clearing
  - Session revocation

- **Token Management**
  - Access token refresh endpoint
  - Refresh token validation
  - Invalid token handling

### 2. Profile Setup (First-Time Users)
- **Complete Profile Page** (`/complete-profile`)
  - Email invitation verification via invite token
  - Email field population from JWT
  - Phone number field population from JWT
  - Password creation (6+ characters minimum)
  - Password confirmation validation
  - Support for both email and phone-based invites
  - Profile completion flag update
  - Automatic redirect based on access approval status

- **Invite Verification Flow**
  - Token hash verification
  - JWT exchange for session creation
  - Type detection (invite/phone)
  - Automatic progression to acknowledgement or dashboard

### 3. Acknowledgement Page (`/acknowledgement`)
- **Terms Acknowledgement**
  - 7 investment philosophy checkboxes (all must be checked)
  - Submit acknowledgement endpoint
  - `has_agreed_to_terms` flag update
  - Redirect to dashboard on completion
  - Loading states during submission

### 4. Account Management
- **Account Page** (`/account`)
  - View profile information (email, role, access status)
  - User ID display
  - Member since date
  - Email verification status badge
  - Access approval status
  - Password management info (currently admin-managed)
  - Sign out button
  - Security information display

### 5. Dashboard
- **Main Dashboard** (`/dashboard`)
  - Welcome message with user name or email
  - Role display (Admin/Sponsor/Subscriber)
  - Statistics cards (role-specific visibility):
    - Total Users (Admin only)
    - Research Themes
    - Risk Buckets
    - Stocks Covered
    - Content Access Grants
    - Monthly Growth (Admin only)
  - Recent Activity feed
  - Quick Actions panel

### 6. Research Content
- **Themes Page** (`/themes`)
  - List all available themes
  - View theme details in side panel
  - Markdown rendering of theme descriptions
  - Theme statistics (total count)
  - Create Theme button (Admin only)
  - Hover preview cards
  - Creator attribution display

- **Stock Research Page** (`/stocks`)
  - Paginated stock listing (10 per page)
  - Stock details: symbol, company name, theme, bucket, PDF
  - Theme association with view capability
  - Bucket association with view capability
  - PDF viewer for research documents
  - Pagination controls (previous/next)
  - Page indicator
  - View PDF button functionality
  - Add Stock button (Admin only)
  - Empty state messaging

- **Risk Buckets Page** (`/buckets`)
  - List all risk buckets
  - Bucket details: name, description, risk measure badge
  - Side panel with full bucket description
  - Markdown rendering
  - Total bucket count statistics
  - Create Bucket button (Admin only)
  - Risk measure categorization

- **PDF Viewer** (SecurePDFViewer component)
  - Secure PDF viewing without download capability
  - Page navigation (previous/next)
  - Zoom controls (0.5x to 3.0x)
  - Current page indicator
  - Total page count
  - Loading states
  - Error handling with retry
  - Sheet modal presentation
  - CDN-based PDF.js worker loading

---

## ADMIN-SPECIFIC FLOWS

### 1. User Management
- **Users Page** (`/users`)
  - **Tabs**
    - Users Tab
    - Waitlist Tab

  - **User List**
    - Paginated user table (10 per page)
    - Columns: Email/Phone, Contact Method (Email/Phone badge), Role, Access Approved (toggle), Email Verified (badge), Invited By, Created Date, Last Sign In
    - User statistics:
      - Total Users count
      - Approved Users count (percentage)
      - Verified Email count (percentage)
      - Pending Approval count
      - Pending Waitlist count

    - **User Actions**
      - Role change dropdown (Admin/Sponsor/Subscriber)
      - Access approval toggle switch
      - Resend invitation button (for unverified emails)
      - Generate verification link button (for incomplete profiles)
      - Delete user with confirmation dialog
      - View user ID truncated display

    - **Invite New User Dialog**
      - Contact method selection (Email/Phone)
      - Email input or Phone input (conditional)
      - Role selection (Subscriber/Sponsor)
      - Send Invite button
      - Loading states
      - Success/error toast notifications

    - **Bulk Invite Dialog**
      - CSV format input (email/phone, role per line)
      - Example format display
      - Role validation (subscriber, sponsor, admin)
      - Batch processing
      - Success/failure reporting

    - **Pagination**
      - Previous/Next buttons
      - Page number links
      - Disabled state when at boundaries

  - **Waitlist Tab**
    - Pending waitlist entries table
    - Columns: Email, Requested Date, Status, Actions
    - Approve & Invite button
    - Creates user account with subscriber role
    - Sets access_approved to false for subscribers
    - Sends invitation email
    - Updates waitlist status to "invited"
    - Loading states during approval

### 2. Content Management
- **Create Theme** (Dialog)
  - Theme name input
  - Description field (markdown support)
  - Admin verification via middleware
  - Unique theme name validation
  - Creator attribution
  - Timestamp tracking (created_at, updated_at)

- **Create Bucket** (Dialog)
  - Bucket name input
  - Description field (markdown support)
  - Risk Measure dropdown (Low/Medium/High/Very High)
  - Admin verification via middleware
  - Unique bucket name validation
  - Creator attribution
  - Timestamp tracking

- **Create Stock** (Dialog)
  - Stock symbol input (uppercase conversion)
  - Company name input
  - Theme selection (required)
  - Bucket selection (required)
  - PDF upload functionality
  - Admin verification via middleware
  - Foreign key validation (theme & bucket exist)
  - Unique stock symbol validation
  - PDF storage to Supabase Storage
  - Public URL generation

- **PDF Management**
  - Upload PDF endpoint (`POST /api/stocks/upload-pdf`)
  - File storage in `research-pdfs` bucket
  - Timestamped file naming
  - Public URL return
  - Download PDF endpoint (`GET /api/stocks/download-pdf/:fileName`)
  - Secure PDF retrieval
  - MIME type handling

### 3. Admin Dashboard Features
- Statistics overview (all 6 cards visible)
- User management access
- Waitlist management access
- Content creation buttons visible throughout platform

---

## SPONSOR-SPECIFIC FLOWS

### 1. User Invitations
- Can invite individual users
- Can bulk invite users
- Can approve waitlist entries
- Can resend invitations to unverified users
- Cannot delete users (Admin only)

### 2. Content Viewing
- Can view all themes
- Can view all stocks
- Can view all buckets
- Cannot create/edit content

### 3. Access Approval
- Cannot toggle user access (this requires explicit admin privilege)

---

## SUBSCRIBER-SPECIFIC FLOWS

### 1. Access Control
- Initially set with `access_approved: false` after profile completion
- Must wait for admin approval
- Cannot access protected content until approved

### 2. Awaiting Approval State
- Displays when user has:
  - No role assigned OR
  - Role assigned but `access_approved: false`
- Shows "AwaitingApproval" component
- Directs user to contact administrator

### 3. Content Access (After Approval)
- View themes
- View stocks with research documents
- View risk buckets
- Access PDF viewer
- View account settings
- Cannot perform admin functions

### 4. Acknowledgement Requirement
- Must complete 7-point investment philosophy acknowledgement before first dashboard access
- All checkboxes must be selected to proceed
- Redirect to dashboard after acknowledgement

---

## ROLE-BASED ACCESS CONTROL (RBAC)

### Route Protection
- `/dashboard` - All authenticated users with completed profile and approved access
- `/acknowledgement` - All authenticated users who haven't agreed to terms
- `/complete-profile` - Unauthenticated users with valid invite tokens
- `/users` - Admin only
- `/themes` - All authenticated users (create/edit: Admin only)
- `/buckets` - All authenticated users (create/edit: Admin only)
- `/stocks` - All authenticated users (create/edit: Admin only)
- `/account` - All authenticated users
- `/auth` - Public (redirects to dashboard if already logged in)
- `/auth/confirm` - Public (processes invite tokens)

### Component-Level Access
- Create buttons visible only to Admin
- Action buttons (edit, delete, etc.) visible based on role
- Statistics cards show role-specific data
- User management tab only for Admin

---

## API ENDPOINTS FOR TESTING

### Authentication Routes
- `POST /api/auth/login` - Sign in with email/password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Single device logout
- `POST /api/auth/logout-all` - Logout all devices
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/verify-invite` - Verify invitation token
- `POST /api/auth/complete-profile` - Complete user profile
- `POST /api/auth/generate-verification-link` - Generate verification link (Admin)
- `POST /api/auth/invite` - Invite single user (Admin/Sponsor)
- `POST /api/auth/invite-bulk` - Bulk invite users (Admin/Sponsor)
- `POST /api/auth/phone/send-otp` - Send OTP to phone
- `POST /api/auth/phone/verify-otp` - Verify OTP and create session

### User Management Routes
- `GET /api/users` - List all users (Admin only)
- `POST /api/users` - Create user (Admin only)
- `PATCH /api/users/:id/role` - Update user role (Admin only)
- `PATCH /api/users/:id/access` - Toggle access approval (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `POST /api/users/acknowledge-terms` - Acknowledge terms (Authenticated)

### Waitlist Routes
- `POST /api/waitlist/join` - Join waitlist (Public)
- `GET /api/waitlist` - Get waitlist entries (Admin/Sponsor)
- `POST /api/waitlist/approve` - Approve and invite waitlist user (Admin/Sponsor)

### Content Routes
- `GET /api/themes` - List themes (Authenticated)
- `POST /api/themes` - Create theme (Admin only)
- `GET /api/themes/:id` - Get theme details (Authenticated)
- `GET /api/buckets` - List buckets (Authenticated)
- `POST /api/buckets` - Create bucket (Admin only)
- `GET /api/buckets/:id` - Get bucket details (Authenticated)
- `GET /api/stocks` - List stocks with pagination (Authenticated)
- `POST /api/stocks` - Create stock (Admin only)
- `GET /api/stocks/:id` - Get stock details (Authenticated)
- `POST /api/stocks/upload-pdf` - Upload PDF (Admin only)
- `GET /api/stocks/download-pdf/:fileName` - Download PDF (Authenticated)

---

## CROSS-CUTTING CONCERNS TO TEST

### 1. Security
- HTTPOnly cookie handling
- CAPTCHA validation (production)
- Role-based middleware verification
- Token expiration and refresh
- Unauthorized access prevention
- Email verification flags

### 2. Error Handling
- Invalid token errors
- Missing required fields
- Duplicate entry detection
- Foreign key constraint violations
- File upload failures
- Network error recovery

### 3. State Management
- User metadata caching
- Query client updates
- Profile completion tracking
- Access approval status updates
- Terms acknowledgement persistence

### 4. Email Communications
- Invite emails with token-based links
- Waitlist approval emails
- Access approval emails
- Email template rendering
- Resend functionality

### 5. File Management
- PDF upload validation
- File naming conventions
- Storage bucket operations
- Public URL generation
- Secure download with authentication

### 6. Session Management
- Cookie-based authentication
- Token refresh mechanism
- Session invalidation on logout
- Multi-device session tracking

---

## CRITICAL USER FLOWS TO TEST END-TO-END

### 1. Guest → Subscriber Journey
1. Join waitlist
2. Admin approves from waitlist tab
3. User receives invite email
4. Complete profile (set password)
5. Acknowledge terms (check all 7 boxes)
6. See "Awaiting Approval" screen
7. Admin approves access
8. Access dashboard and content

### 2. Direct Invite → Subscriber Journey
1. Admin invites user directly
2. User receives invite email
3. Complete profile
4. Acknowledge terms
5. See "Awaiting Approval" screen
6. Admin approves access
7. Access dashboard

### 3. Admin User Management
1. Admin creates user
2. User completes profile
3. Admin manages user roles
4. Admin approves access
5. Admin views user list with filters

### 4. Content Discovery
1. User views themes list
2. Clicks on theme to see details
3. Views stocks associated with theme
4. Opens stock PDF in viewer
5. Reviews risk bucket association

### 5. Admin Content Creation
1. Create theme with markdown description
2. Create risk bucket with risk measure
3. Create stock with theme/bucket associations
4. Upload PDF for stock
5. View PDF in secure viewer

---

## ROLE-BASED TESTING MATRIX

| Feature | Guest | Subscriber | Sponsor | Admin |
|---------|-------|------------|---------|-------|
| Join Waitlist | ✅ | - | - | - |
| Login | ✅ | ✅ | ✅ | ✅ |
| Complete Profile | ✅ (with invite) | - | - | - |
| Acknowledge Terms | - | ✅ (first login) | ✅ (first login) | ✅ (first login) |
| View Dashboard | - | ✅ (if approved) | ✅ | ✅ |
| View Themes/Buckets/Stocks | - | ✅ (if approved) | ✅ | ✅ |
| View PDFs | - | ✅ (if approved) | ✅ | ✅ |
| Invite Users | - | - | ✅ | ✅ |
| Approve Waitlist | - | - | ✅ | ✅ |
| Manage Users | - | - | - | ✅ |
| Create Content | - | - | - | ✅ |
| Approve User Access | - | - | - | ✅ |
| Change User Roles | - | - | - | ✅ |
| Delete Users | - | - | - | ✅ |

---

## TEST PRIORITY ORDER

### P0 (Critical - Test First)
1. **PDF Viewer** - Just fixed with CDN worker, verify it loads and functions correctly
2. **Login/Logout** - Core authentication flow
3. **New User Onboarding** - Invite → Complete profile → Acknowledge terms → Awaiting approval → Admin approval → Dashboard access
4. **View Stocks and Open PDFs** - Core content consumption flow

### P1 (High Priority)
5. **Admin User Management** - Invite, approve, change role
6. **Waitlist Join and Approval** - Guest to subscriber journey
7. **Create Themes/Buckets/Stocks** - Content creation workflows
8. **Role-Based Access Control** - Verify permissions across all roles

### P2 (Medium Priority)
9. **Pagination** - Users list and stocks list
10. **Token Refresh and Session Management** - Session persistence
11. **Resend Invitations** - Re-invite flow for failed emails
12. **Bulk User Invites** - CSV-based bulk operations

---

## TEST ENVIRONMENT SETUP

### Required Test Accounts
- **Admin Account** - Full access to all features
- **Sponsor Account** - Can invite users, view content
- **Subscriber Account (Approved)** - Can view content
- **Subscriber Account (Pending)** - Awaiting approval state

### Test Data Requirements
- At least 3 themes
- At least 3 risk buckets
- At least 15 stocks (to test pagination)
- PDFs uploaded for stocks
- Waitlist entries
- Users in various states (verified, unverified, approved, pending)

---

## RECENT CHANGES TO TEST

### PDF Viewer Fix (Latest)
- **Change**: Switched from bundled worker to CDN-based PDF.js worker
- **Test**: Verify PDF loads correctly from `cdnjs.cloudflare.com`
- **Location**: `apps/web/src/components/SecurePDFViewer.tsx:12`

### Content Management Removal
- **Change**: Removed Content Management tab and page
- **Test**: Verify `/dashboard/content-management` route no longer exists
- **Test**: Verify "Content Management" menu item is gone from sidebar

---

## TESTING CHECKLIST

### Authentication & Authorization
- [ ] Guest can join waitlist
- [ ] Login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] reCAPTCHA validation works
- [ ] Session persists on page refresh
- [ ] Logout clears session
- [ ] Token refresh works before expiration
- [ ] Expired tokens redirect to login

### User Onboarding
- [ ] Invite email contains valid token link
- [ ] Complete profile page loads with invite token
- [ ] Email/phone pre-populated from token
- [ ] Password validation (min 6 characters)
- [ ] Password confirmation must match
- [ ] Profile completion redirects to acknowledgement
- [ ] All 7 checkboxes required for acknowledgement
- [ ] Submit acknowledgement updates flag
- [ ] Redirect to awaiting approval or dashboard

### Admin User Management
- [ ] User list displays with pagination
- [ ] Statistics cards show correct counts
- [ ] Invite user dialog works for email
- [ ] Invite user dialog works for phone
- [ ] Role dropdown changes user role
- [ ] Access toggle approves/revokes access
- [ ] Resend invitation sends new email
- [ ] Delete user removes from system
- [ ] Bulk invite processes CSV correctly
- [ ] Waitlist tab shows pending entries
- [ ] Approve waitlist creates user and sends invite

### Content Management (Admin)
- [ ] Create theme with markdown
- [ ] Create bucket with risk measure
- [ ] Create stock with PDF upload
- [ ] Upload PDF stores in Supabase Storage
- [ ] View theme details in side panel
- [ ] View bucket details in side panel

### Content Viewing (All Users)
- [ ] Themes list loads
- [ ] Buckets list loads
- [ ] Stocks list loads with pagination
- [ ] Next/previous pagination works
- [ ] View PDF button opens viewer
- [ ] PDF viewer loads from CDN
- [ ] PDF page navigation works
- [ ] PDF zoom controls work
- [ ] Close PDF viewer

### Role-Based Access
- [ ] Admin sees all menu items
- [ ] Sponsor sees limited menu items
- [ ] Subscriber sees limited menu items
- [ ] Unapproved subscriber sees awaiting approval
- [ ] Create buttons only visible to admin
- [ ] Direct URL access blocked for unauthorized roles

### Error Handling
- [ ] Network errors show user-friendly messages
- [ ] Invalid tokens redirect appropriately
- [ ] Duplicate entries prevented
- [ ] Missing required fields show validation
- [ ] File upload errors handled gracefully

---

## Bug Reporting Template

When reporting bugs found during testing:

```markdown
**Title**: Brief description of the issue

**Priority**: P0 / P1 / P2

**User Role**: Admin / Sponsor / Subscriber / Guest

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**: What should happen

**Actual Result**: What actually happened

**Screenshots**: (if applicable)

**Browser/Environment**: Chrome/Firefox/Safari, Production/Staging

**Additional Context**: Any other relevant information
```
