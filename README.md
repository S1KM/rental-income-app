# 🏢 Rental Income & Property Manager

A modern, bank-grade **Rental Income & Multi-Unit Property Ledger Management Web App** built with responsive aesthetics, live rent-roll accounting, atomic payment updates, Indian Tenancy Agreement generation, and **Supabase Cloud Sync**.

---

## 🚀 Live Deployment on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSachin-fin%2Frental-income-app&project-name=rental-income-app&repository-name=rental-income-app)

### Instant 1-Click Auto Import
Click the button above or visit:  
👉 **[Auto-Import into Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSachin-fin%2Frental-income-app&project-name=rental-income-app&repository-name=rental-income-app)**

1. Sign in with GitHub.
2. Vercel automatically imports `Sachin-fin/rental-income-app` with the production preset configured.
3. Click **Deploy**. Your app is live with a production `.vercel.app` domain in ~20 seconds!
4. From that moment forward, every push to `origin/main` (or running `npm run deploy`) automatically builds and deploys to production on Vercel!

---

## ⚡ Supabase Cloud Database Setup

This app features **Offline-First Hybrid Sync**: it works locally via browser storage and connects seamlessly to Supabase PostgreSQL for cloud persistence across devices.

### Step 1: Create your Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project (e.g. `rental-income-db`).
2. Go to **SQL Editor** in the left sidebar.
3. Open [`supabase-schema.sql`](./supabase-schema.sql), copy all queries, paste into the SQL Editor, and click **Run**.
4. Go to **Project Settings** -> **API** to copy:
   - **Project URL** (`https://xyzcompany.supabase.co`)
   - **Project API Anon Key** (`eyJhbGciOi...`)

### Step 2: Connect in the Web App
1. Open your live app on Vercel or locally.
2. In the top header, click **⚡ Supabase Sync**.
3. Paste your **Supabase URL** and **Anon Key**.
4. Click **Test & Connect**.
5. Click **⬆️ Push Local Data to Supabase** to upload your inventory and ledger to the cloud!
6. Enable **Auto-Sync** for background real-time persistence.

---

## 🛠️ Local Development & Testing

```bash
# Clone the repository
git clone https://github.com/Sachin-fin/rental-income-app.git
cd rental-income-app

# Serve locally
npx serve .
# Or open index.html directly in any modern browser!
```

---

## ✨ Features & Senior Engineering Architecture
- **Modular Native ES Architecture (`src/`)**: Zero-build step, standards-compliant ES modules (`src/config`, `src/state`, `src/services`, `src/utils`, `src/ui`) for scalable development, testing, and instant static deployment.
- **Executive Slate & Indigo UI**: Luxury glassmorphism, high-contrast status chips, micro-animated KPI cards, and smooth elevation effects.
- **Floating Toast Notification Engine**: Non-intrusive, micro-animated feedback for payments, cloud synchronization, and settings updates.
- **Scroll-Free Track Record & Rent Roll**: Zero horizontal overflow on standard screens with mathematically balanced columns.
- **Atomic Multi-Entity Payment Updation**: Update payment realization dates, modes, and amounts in-place with instant ledger recalculation.
- **Bank-Grade Chronological Running Balance**: Automatic calculation of dues, payments, and balances with clear `Due` and `Clear` status badges.
- **Instant JSON Backup & Restore**: One-click local backup download of entire portfolio inventory, tenant ledger, and tax records.
- **Keyboard Shortcuts**: Press `/` or `Ctrl+K` to search units and tenants instantly; `Esc` to dismiss any modal.
- **Legal Tenancy Studio**: Instant 11-month Indian Tenancy Agreements and HRA rent receipts with Landlord PAN compliance (`abcltd9925@gmail.com`).
- **Supabase Cloud Integration**: Two-way data synchronization with automated schema migrations and offline-first fallback.
