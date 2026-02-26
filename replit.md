# Resolve Construction Ltd - Worker Management System

## Overview
A construction site worker management app for Resolve Construction Ltd where:
- **Admin** accesses `/admin` with password "123resolve2026" to manage workers, view attendance, and see activity feed
- **Workers** log in at `/` with username/password to sign in/out daily (with GPS tracking)
- **Workers** post daily updates with notes and photos
- **Admin** sees real-time attendance, worker activity feed, and GPS locations

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + PostgreSQL + Drizzle ORM
- **Auth**: Session-based (express-session + connect-pg-simple)
  - Admin: separate password-based authentication (hardcoded password, no database user)
  - Workers: username/password from database
- **File Uploads**: Multer (saved to client/public/uploads)
- **Branding**: Orange primary color (hsl 24 89% 48%), Resolve Construction Ltd logo

## Data Model
- `users` - id, username, password, fullName, role (worker), active
- `attendance` - id, userId, date, signInTime, signOutTime, GPS coordinates (in/out)
- `feed_entries` - id, userId, note, imageUrl, createdAt

## Access
- Admin: navigate to `/admin`, enter password `123resolve2026`
- Sample workers: `john.mason`, `maria.silva`, `tom.builder` (all password `worker123`)

## Structure
- `shared/schema.ts` - Drizzle schema + Zod validation
- `server/routes.ts` - API endpoints with auth middleware (admin + worker)
- `server/storage.ts` - Database CRUD operations
- `server/seed.ts` - Seed data for workers
- `client/src/lib/auth.tsx` - Auth context (AuthProvider for workers, AdminProvider for admin)
- `client/src/pages/login.tsx` - Worker login page
- `client/src/pages/admin-login.tsx` - Admin login page
- `client/src/pages/worker-dashboard.tsx` - Worker view (attendance, daily updates)
- `client/src/pages/admin-dashboard.tsx` - Admin panel (workers, attendance, feed)
- `client/src/App.tsx` - Routing (/ = worker, /admin = admin)
