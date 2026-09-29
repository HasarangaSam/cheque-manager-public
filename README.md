# 🏦 Cheque Manager

A modern, full-stack **Cheque Management System** built to track customer cheques, monitor due dates, manage cash flow, and automatically alert on overdue cheques.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Zod**, **Prisma ORM 7**, **PostgreSQL (Neon)**, **Tailwind CSS 4**, and **Nodemailer**.

---

## ✨ Features

### 📋 Cheque Lifecycle Management

- **Status Tracking**: Monitor cheques across `PENDING`, `CLEARED`, and `BOUNCED` states with one-click inline status updates.
- **Smart Due-Date Urgency**: Dynamic real-time urgency badges:
  - 🟢 **Upcoming** — Due in more than 3 days
  - 🟡 **Due Soon** — Due within 0–3 days
  - 🔴 **Overdue** — Passed the realization date
- **Full Cheque Ledger**: Search by cheque number, customer name, bank, or filter by status and urgency.

### 🏗️ Modern Next.js Architecture

- **Server Actions** — All mutations (create, update, delete) run as typed server-side functions with no API routes needed.
- **`useActionState`** — Form state (errors, loading, response) managed via React 19's `useActionState` hook, replacing manual `useState + useTransition` patterns.
- **`useFormStatus`** — Submit buttons read pending state from the parent `<form>` via `useFormStatus` — zero prop drilling.
- **Native form `action` prop** — Forms use `<form action={serverAction}>` for progressive enhancement (works without JS).
- **Server-side `redirect()`** — Auth redirects happen entirely server-side inside the action, eliminating client-side `window.location` hacks.

### 🛡️ Authentication & Security

- **Database-Backed Sessions** — Random 256-bit tokens are stored as SHA-256 hashes, expire after seven days, and can be revoked on logout.
- **Proxy Route Guard** — [`proxy.ts`](src/proxy.ts) performs a cookie-presence redirect; the dashboard, server actions, and API routes validate the session against the database.
- **bcrypt Password Hashing** — 12 rounds via `bcryptjs` for stored credentials.
- **Dual Credential Sources** — Supports both environment variable credentials (dev/admin override) and database-stored accounts.
- **Single-Account Registration** — Registration permanently closes after the first account is created.
- **`requireAuth()` guard** — Every server action verifies the session before touching the database.

### 🛡️ End-to-End Runtime Validation (Zod)

- Strict runtime schemas via **Zod v4** across all Server Actions, API routes, and forms.
- Auto-trimming, UTC date normalization, and monetary precision validation.
- Server action errors surfaced inline via `useActionState` state — not just toast-only.

### 📧 Overdue Notifications (Automated Email)

- **Vercel Cron**: Daily scheduled check at `03:00 UTC` (8:30 AM SLST).
- **Consolidated Summary**: One elegant HTML email aggregating all uncleared overdue cheques — no per-cheque spam.
- **Zero-Noise Condition**: No email sent if no cheques are overdue.
- **Rich HTML Report**: Total liability, per-cheque breakdown, days delayed, customer contact, and dashboard deep-link.

### 👥 Customer Management

- Full CRUD for customer profiles with name, phone, address, and notes.
- Per-customer cheque history with total pending liabilities.
- Inline searchable customer picker when creating cheques.

### 📊 Data Export & Filtering

- Export filtered cheque records to **CSV** via a dedicated API route.
- Multi-dimensional filtering: status, urgency, bank, date range, and free-text search.

---

## 🛠️ Tech Stack

| Layer      | Technology                                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| Framework  | [Next.js 16](https://nextjs.org/) (App Router, Turbopack)                                                       |
| Language   | [TypeScript 5](https://www.typescriptlang.org/)                                                                 |
| UI         | [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/) |
| Validation | [Zod v4](https://zod.dev/)                                                                                      |
| Database   | [PostgreSQL via Neon](https://neon.tech/)                                                                       |
| ORM        | [Prisma ORM 7](https://www.prisma.io/)                                                                          |
| Auth       | `jose` (JWT) + `bcryptjs`                                                                                       |
| Email      | [Nodemailer](https://nodemailer.com/) (Gmail SMTP)                                                              |
| Deployment | [Vercel](https://vercel.com/) + Vercel Cron Jobs                                                                |

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js** v20+
- **npm**, **pnpm**, or **yarn**
- **PostgreSQL Database** (e.g. Neon, Supabase, or local Postgres)

### 2. Clone & Install

```bash
git clone https://github.com/HasarangaSam/cheque-manager-public.git
cd cheque-manager-public
npm install
```

### 3. Environment Configuration

```bash
cp .env.example .env
```

Fill in `.env`:

```env
# PostgreSQL — Neon (or any Postgres provider)
DATABASE_URL="postgresql://user:password@pooler-url/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@direct-url/neondb?sslmode=require"

# Admin Credentials (env override — no DB needed for initial login)
AUTH_USERNAME="admin"
AUTH_PASSWORD="your_secure_password"
# Email Notifications (Gmail SMTP with App Password)
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_google_app_password"
NOTIFICATION_EMAIL_TO="recipient_email@gmail.com"

# Vercel Cron Security
CRON_SECRET="your_secure_cron_secret"
```

### 4. Database Setup

```bash
npx prisma db push     # Push schema to database (no migration files)
npx prisma generate    # Generate the Prisma client
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first run, visit `/register` to create the admin account.

---

## ⏰ Cron Jobs & Overdue Alerts

Configured via [`vercel.json`](vercel.json) — runs daily at 03:00 UTC:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-overdue",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Test manually:**

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/check-overdue
```

---

## 📦 Project Structure

```
├── prisma/
│   └── schema.prisma               # DB models: Cheque, Customer, User
├── src/
│   ├── app/
│   │   ├── (dashboard)/            # Protected dashboard routes
│   │   │   ├── page.tsx            # Dashboard overview & stats
│   │   │   ├── cheques/            # Cheque listing, creation, detail, edit
│   │   │   └── customers/          # Customer management
│   │   ├── actions/                # Server Actions (typed, Zod-validated)
│   │   │   ├── auth-actions.ts     # Login, register, logout + server redirect
│   │   │   ├── cheque-actions.ts   # Cheque CRUD & status mutations
│   │   │   └── customer-actions.ts # Customer CRUD & search
│   │   ├── api/
│   │   │   ├── cheques/export/     # CSV export API route
│   │   │   └── cron/               # Automated overdue check endpoint
│   │   ├── login/                  # Login page (useActionState)
│   │   └── register/               # One-time admin registration
│   ├── components/
│   │   ├── cheques/                # ChequeForm, ChequesTable, QuickStatusSelector
│   │   ├── customers/              # CustomerForm, CustomersTable
│   │   ├── layout/                 # Sidebar, navigation
│   │   └── ui/                     # SubmitButton (useFormStatus), StatusBadge
│   ├── lib/
│   │   ├── auth.ts                 # JWT sign/verify, getSession, requireAuth
│   │   ├── auth-db.ts              # bcrypt, DB credential verification
│   │   ├── cheque-status.ts        # Due-date calculation & urgency logic
│   │   ├── email.ts                # Nodemailer transport & HTML email template
│   │   ├── prisma.ts               # Prisma client singleton
│   │   └── validations/            # Zod schemas
│   │       ├── auth.ts             # Login & register schemas
│   │       ├── cheque.ts           # Cheque CRUD & export filter schemas
│   │       ├── customer.ts         # Customer CRUD & selection schemas
│   │       └── index.ts            # Re-exports & error formatters
│   ├── types/
│   │   └── actions.ts              # Shared ActionResponse<T> type
│   └── middleware.ts               # Edge-compatible route protection
├── vercel.json                     # Vercel Cron configuration
└── README.md
```

---

## 🏛️ Architecture Highlights

### Server Actions Pattern

Every mutation uses a Server Action with the `(prevState, formData)` signature required by `useActionState`:

```ts
// Server action
export async function createCheque(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  await requireAuth();          // Session guard
  const parsed = schema.safeParse(...); // Zod validation
  // ...DB mutation...
  revalidatePath("/cheques");   // Surgical cache invalidation
  return { success: true, ... };
}

// Client form
const [state, formAction, isPending] = useActionState(createCheque, null);
// <form action={formAction}>  — no onSubmit, no manual FormData
```

### useFormStatus — Decoupled Pending State

```tsx
// submit-button.tsx — child of <form>
function SubmitButton() {
  const { pending } = useFormStatus(); // reads parent <form> state
  return <button disabled={pending}>...</button>;
}
```

### Auth Flow

```
Request → proxy.ts → cookie-presence redirect
  ├── /login, /register  → allow (public)
  ├── /api/cron/*        → allow (secured by CRON_SECRET in handler)
  └── dashboard           → getSession() checks token hash, expiry, and revocation in Postgres

Server Action → requireAuth() → database session check → proceed or throw
Logout        → set revokedAt → delete cookie
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
