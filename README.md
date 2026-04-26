# Smart Clinic CMS

Smart Clinic CMS is a Next.js App Router application for OPD token booking, role-based clinic administration, live queue handling, doctor consultation flow, and daily financial reporting.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
SESSION_SECRET="replace-with-a-long-random-secret"
```

`SESSION_SECRET` is required in production. Development uses a local fallback only so local onboarding does not break.

3. Generate Prisma Client:

```bash
npx prisma generate
```

4. Apply the schema and seed data:

```bash
npx prisma db push
npm run prisma:seed
```

If your database is managed by migrations, create and apply a migration instead:

```bash
npx prisma migrate dev --name production-foundation
```

5. Start development:

```bash
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm test
npx prisma generate
npx prisma db push
npx prisma db seed
```

## Seed Login Credentials

All seeded accounts use OTP-style login. Request a code on `/login`, then enter:

- Patient: `9876543210`, code `1234`
- Admin: `8888888888`, code `admin`
- Doctor: `7777777777`, code `doctor`
- Super admin: `9999999999`, code `super`

SMS is currently logged through the notification stub in development.

## Implemented Foundation

- DB-backed OTP challenge login.
- JWT session with `userId`, `role`, and expiry.
- Role guards for patient, doctor, admin, and super-admin routes.
- Expanded Prisma domain: users, doctors, schedules, sessions, tokens, payments, settings, queue events, appointment types, and OTP challenges.
- Patient doctor/session loading, booking, token locking, confirmation, and token ownership checks.
- Admin dashboard, live queue actions, doctor management, settings, financial aggregation, and CSV export.
- Doctor assigned queue view, start consultation, complete consultation, and patient `lastVisit` update.
- Expired locked token cleanup through server-action entry points.
- Queue audit events for booking, status changes, expiry, session changes, and emergency tokens.
- Unit tests for role access rules, follow-up eligibility, token expiry, token allocation, and queue completion rules.

## Current Limitations

- Payment integration is represented as immediate cash/waived confirmation; no payment gateway is connected yet.
- OTP delivery is a stub and should be replaced with MSG91, Twilio, or another provider.
- Weekly/monthly financial charts are placeholders over the daily payment data.
- Doctor schedule editing is partially modeled and seeded, but the admin UI currently creates doctor profiles only.
- Database backup/reset controls are intentionally disabled in the UI and should be handled by deployment tooling.

## Deployment Notes

- Set `SESSION_SECRET` in production.
- Use a production PostgreSQL database.
- Run `npx prisma migrate deploy` for migration-based deployments.
- Run `npx prisma generate --no-engine` when deploying to environments that provide Prisma Accelerate or equivalent engine handling.
- Keep queue-changing actions server-side; they depend on role guards and Prisma transactions.
