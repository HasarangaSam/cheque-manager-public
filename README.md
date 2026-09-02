# 🏦 Cheque Manager — Version 1.0

A modern, full-stack **Cheque Management System** designed for tracking customer cheques, monitoring due dates, managing cash flow, and automatically notifying when cheques become overdue.

Built with **Next.js 16 (App Router)**, **React 19**, **Zod**, **Prisma ORM**, **PostgreSQL (Neon)**, **Tailwind CSS**, and **Nodemailer**.

---

## ✨ Features

### 📋 Cheque Lifecycle Management
- **Status Tracking**: Monitor cheques across `PENDING`, `CLEARED`, and `BOUNCED` states.
- **Smart Due-Date Status**: Dynamic urgency badges:
  - 🟢 **Upcoming** (Due in > 3 days)
  - 🟡 **Due Soon** (Due in 0–3 days)
  - 🔴 **Overdue** (Passed due date)
- **Detailed History**: Search by cheque number, customer name, bank, or date range.

### 🛡️ End-to-End Runtime Validation (Zod)
- **Robust Type & Input Safety**: Strict runtime schemas using **Zod** across all Server Actions, API routes, and forms.
- **Data Sanitization**: Automatic trimming, normalization, date-to-UTC standardization, and monetary precision validation.
- **User-Friendly Feedback**: Clear, instant error reporting for invalid data or failed validations.

### 📧 Consolidated Overdue Summary Email Notifications
- **Automated Vercel Cron**: Scheduled daily checks (`03:00 UTC` / `8:30 AM SLST`).
- **Consolidated Summary Email**: Instead of sending separate emails per overdue cheque, sends a single, elegant summary email aggregating all currently uncleared overdue cheques.
- **Zero-Noise Condition**: If all overdue cheques have been cleared or there are no overdue cheques pending, no email is sent.
- **Rich HTML Email Report**: Formatted breakdown of total overdue liability, individual cheque details, days delayed, customer contact info, and direct quick-links to the dashboard.

### 👥 Customer Management
- Add, update, and search customer records.
- View customer cheque histories, total transaction values, and pending liabilities.

### 📊 Data Export & Filtering
- Export cheque records and reports to **CSV**.
- Multi-dimensional filtering by status, urgency, bank, and date ranges.

### 🔐 Security & Authentication
- Protected routes with secure session-based authentication.
- Single-admin user management with password hashing via `bcryptjs`.
- Protected cron API routes verified via `CRON_SECRET` headers.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Validation**: [Zod](https://zod.dev/) (Runtime schema validation)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **Database & ORM**: [PostgreSQL (Neon)](https://neon.tech/), [Prisma ORM 7](https://www.prisma.io/)
- **Email Service**: [Nodemailer](https://nodemailer.com/) (Gmail / SMTP)
- **Deployment**: [Vercel](https://vercel.com/) (with Vercel Cron Jobs)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20+ 
- **npm**, **pnpm**, or **yarn**
- **PostgreSQL Database** (e.g. Neon, Supabase, or local Postgres)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/HasarangaSam/cheque-manager-public.git
cd cheque-manager-public
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the following variables in `.env`:

```env
# Neon Database Connection URLs
DATABASE_URL="postgresql://user:password@pooler-url/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@direct-url/neondb?sslmode=require"

# Admin Authentication
AUTH_USERNAME="admin"
AUTH_PASSWORD="your_secure_password"
AUTH_SECRET="your_32_character_random_secret"

# Email Notifications (Gmail SMTP)
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_google_app_password"
NOTIFICATION_EMAIL_TO="recipient_email@gmail.com"

# Vercel Cron Security
CRON_SECRET="your_secure_cron_secret"
```

### 4. Database Setup & Migrations

Sync the database schema and generate Prisma client:

```bash
npx prisma db push
npx prisma generate
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to access the application.

---

## ⏰ Cron Jobs & Overdue Alerts (Vercel)

The project includes a `vercel.json` configuration for running scheduled cron tasks:

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

### Manual Trigger / Testing
You can manually test the overdue check endpoint locally or remotely:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/check-overdue
```
*(Or navigate to `/api/cron/check-overdue?secret=<CRON_SECRET>` while logged into the admin dashboard).*

---

## 📦 Project Structure

```
├── prisma/
│   └── schema.prisma           # Prisma database models (Cheque, Customer, User)
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # Dashboard & cheque views
│   │   │   ├── cheques/        # Cheques listing, creation, and detail views
│   │   │   └── customers/      # Customer management
│   │   ├── actions/            # Next.js Server Actions with Zod runtime validation
│   │   │   ├── auth-actions.ts # Authentication & session actions
│   │   │   ├── cheque-actions.ts # Cheque CRUD & status actions
│   │   │   └── customer-actions.ts # Customer CRUD & search actions
│   │   ├── api/
│   │   │   ├── cheques/export/ # CSV export API
│   │   │   └── cron/           # Automated overdue check cron endpoint
│   │   ├── login/              # Admin login page
│   │   └── register/           # Admin registration page
│   ├── components/             # Reusable UI & table components
│   ├── lib/
│   │   ├── auth.ts             # JWT session helpers
│   │   ├── cheque-status.ts    # Date calculation & urgency logic
│   │   ├── email.ts            # Nodemailer transport & HTML email template
│   │   ├── prisma.ts           # Prisma client singleton
│   │   └── validations/        # Zod runtime schemas & validation helpers
│   │       ├── auth.ts         # Login & register schemas
│   │       ├── cheque.ts       # Cheque CRUD & export filter schemas
│   │       ├── customer.ts     # Customer CRUD & selection schemas
│   │       └── index.ts        # Re-exports & error formatters
│   └── middleware.ts           # Route protection & cron bypass middleware
├── vercel.json                 # Vercel Cron job configuration
└── README.md                   # Project documentation
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
