# Resolve Construction Ltd - Worker Management System

## Overview
A construction site worker management app for Resolve Construction Ltd where:
- **Admin** accesses `/admin` with password "123resolve2026" to manage workers, view attendance, and see activity feed
- **Admin** manages employee contracts: contract type, dates, sick days, holiday days
- **Workers** log in at `/` with username/password to sign in/out daily (with GPS tracking)
- **Workers** post daily updates with notes and photos
- **Admin** sees real-time attendance, worker activity feed, and GPS locations

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + PostgreSQL + Drizzle ORM
- **Auth**: Session-based (express-session + connect-pg-simple)
  - Admin: separate password-based authentication (hardcoded password, no database user)
  - Workers: username/password from database (bcrypt hashed)
- **File Uploads**: Multer (saved to uploads/ directory, served via Express static)
- **Branding**: Orange primary color (hsl 24 89% 48%), Resolve Construction Ltd logo

## Data Model
- `users` - id, username, password, fullName, role (worker), active, contractType, contractStartDate, contractExpiryDate, sickDaysTotal, sickDaysUsed, holidayDaysTotal, holidayDaysUsed
- `attendance` - id, userId, date, signInTime, signOutTime, GPS coordinates (in/out)
- `feed_entries` - id, userId, note, imageUrl, createdAt
- `chat_messages` - id, userId, message, createdAt

## Access
- Admin: navigate to `/admin`, enter password `123resolve2026`
- Workers are created by admin via the Workers tab (no seed/demo workers)

## Structure
- `shared/schema.ts` - Drizzle schema + Zod validation (includes updateContractSchema)
- `server/routes.ts` - API endpoints with auth middleware (admin + worker)
- `server/storage.ts` - Database CRUD operations (includes updateContract)
- `server/seed.ts` - Seed data for workers
- `client/src/lib/auth.tsx` - Auth context (AuthProvider for workers, AdminProvider for admin)
- `client/src/pages/login.tsx` - Worker login page
- `client/src/pages/admin-login.tsx` - Admin login page
- `client/src/pages/worker-dashboard.tsx` - Worker view (attendance, GPS, team chat, daily updates)
- `client/src/pages/admin-dashboard.tsx` - Admin panel (workers, contracts, attendance, feed)
- `client/src/App.tsx` - Routing (/ = worker, /admin = admin)

## Contract Management (Admin Only)
- Contract type: Full-Time, Part-Time, Temporary, Contract, Apprentice
- Contract start/expiry dates with days remaining indicator
- Sick days: total allocated and used (shows remaining)
- Holiday days: total allocated and used (shows remaining)
- Visual alerts: expired contracts (red), expiring soon within 30 days (orange)
- API: PATCH /api/workers/:id/contract

## Team Chat (Workers)
- Group chat visible to all logged-in workers
- Real-time polling (5-second refresh interval)
- Messages display sender name (other workers) or right-aligned (own messages)
- API: GET /api/chat, POST /api/chat
