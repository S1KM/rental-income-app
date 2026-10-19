# 🏢 Rental Income & Property Manager

A modern, bank-grade **Rental Income & Multi-Unit Property Ledger Management Web App** built with responsive aesthetics, live rent-roll accounting, atomic payment updates, Indian Tenancy Agreement generation, and **Supabase Cloud Sync**.

---

## 🚀 Live Deployment on Vercel

### Step 1: Connect to Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and log in with your GitHub account.
2. Under **Import Git Repository**, select `Sachin-fin/rental-income-app`.
3. In Project Settings:
   - **Framework Preset**: Other (Static / HTML)
   - **Root Directory**: `./`
4. Click **Deploy**. Your app will be live with a production `.vercel.app` URL in under 30 seconds!

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

## ✨ Features
- **Scroll-Free Track Record & Rent Roll**: Zero horizontal overflow on standard screens with mathematically balanced columns.
- **Atomic Multi-Entity Payment Updation**: Update payment realization dates, modes, and amounts in-place with instant ledger recalculation.
- **Bank-Grade Chronological Running Balance**: Automatic calculation of dues, payments, and balances with clear `Due` and `Clear` status badges.
- **Legal Tenancy Studio**: Instant 11-month Indian Tenancy Agreements and HRA rent receipts with Landlord PAN compliance.
- **Supabase Cloud Integration**: Two-way data synchronization with automated schema migrations.
