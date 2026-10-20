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

## ⚡ Permanent Supabase + Vercel Integration

This application features **zero-touch, permanent cloud linking** powered by Vercel Serverless API (`api/supabase-config.js`) and Supabase PostgreSQL. There are no manual configuration popups or credential prompts required in the UI.

### Step 1: Initialize Database in Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste all SQL statements from [`supabase-schema.sql`](./supabase-schema.sql), and click **Run**.
3. Retrieve your **Project URL** and **Anon Key** under **Project Settings** -> **API**.

### Step 2: Link Permanently with Vercel
1. Go to your Vercel Project Dashboard -> **Settings** -> **Environment Variables**.
2. Add the two environment variables:
   - `SUPABASE_URL`: `https://your-project-id.supabase.co`
   - `SUPABASE_ANON_KEY`: `eyJhbGciOi...`
3. Click **Save** and trigger a redeploy (or simply git push).
4. **Done!** The application automatically reads these variables on production load via `/api/supabase-config`, establishes permanent cloud database connectivity in the background, and enables continuous auto-sync across all devices and team members with seamless offline-first caching.

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
- **Dark & Light Theme Mode**: One-click theme switcher in header with instant persistent preference (localStorage & OS media preference). Features a luxury obsidian slate dark mode (`#070b14`), luminous accents, deep glassmorphism surfaces, and high-contrast typography. Quick shortcut: press `Ctrl+D` to toggle anywhere.
- **Keyboard Shortcuts**: Press `/` or `Ctrl+K` to search units and tenants instantly; `Ctrl+D` to toggle Dark/Light theme; `Esc` to dismiss any modal.
- **Statewise Police Verification Studio**: Court-compliant statutory verification forms under Section 144 CrPC and State Police Acts. Supports tailored templates for Delhi, Maharashtra (Mumbai PCS), Uttar Pradesh (UP COP / CCTNS), Haryana (HarSamay), Karnataka (Bengaluru KSP), West Bengal, Tamil Nadu, and All-India standards. Features auto-fill from properties and tenants, official police headers, self-attested photo boxes, two local referees, legal statutory declarations, official citizen portal links, and printable counterfoil acknowledgment receipts.
- **Tenant Registration Invite Hub (WhatsApp, SMS, Email)**: Automated trigger immediately upon completing registration in Tenant Master. 1-click sharing of pre-formatted tenancy welcome message containing tenant name, assigned property unit, monthly rent, security deposit, and direct secure link to the Tenant App.
- **Dedicated Tenant View Only Self-Service Portal (`?view=tenant&tenantId={id}`)**: Lightweight, view-only mobile-responsive web app tailored for tenants. Features assigned unit particulars, monthly rent cycle, refundable security deposit status, zero-due clearance badge, landlord profile & UPI rent payment details, printable HRA rent receipts, 11-month lease agreement preview, and step-by-step PWA install instructions ("Add to Home Screen" for Android Chrome & Apple iOS Safari).
- **Interactive 2-Way Landlord & Tenant Chat Studio**: Real-time messaging hub between landlord and tenant with instant notification feed. Includes tenant quick chips for payment confirmation (*"Paid rent for this month via UPI"*), rent receipt requests, and maintenance reporting (*"Plumbing issue"*, *"Electrical issue"*). Landlord drawer includes quick canned replies (*"Payment received"*, *"Technician dispatched"*), chat history persistence across reloads (`state.chats`), and 1-click invite sharing.
- **Automated Monthly GST Tax Invoicing (Rule 46 CGST Act, 2017)**: Fully automated monthly GST invoice generation engine triggered on the **1st of every month** for all active tenants. Issued under **Rule 46 of CGST Rules, 2017** with Service Accounting Code (**SAC 997212** for rental services), standard 18% GST (CGST 9% + SGST 9% for intra-state supply, or IGST 18% for inter-state), consecutive serial numbers (`GST/26-27/MMM/UNIT`), Place of Supply determination, Reverse Charge (RCM) declaration, and Indian numbering amount in words.
- **Start-of-Month Dispatch Hub & Multi-Channel Delivery (WhatsApp & Email)**: Prominent Start-of-Month Alert Banner on Dashboard and GST Studio when invoices are ready. 1-click individual and batch dispatch via WhatsApp (`wa.me`) and Email (`mailto:`) with pre-composed legal tax messages, UPI remittance instructions, and direct online tax invoice viewer links (`?view=gst-invoice&invoiceId={id}`).
- **Statutory GST Tax Invoice Viewer & Print Layout (`#gstInvoiceModal`)**: High-fidelity, bank-grade tax invoice layout meeting all Govt of India GST requirements, complete with supplier GSTIN/PAN, recipient GSTIN/address, itemized SAC table, bank account and instant UPI remittance QR details, and digital/authorized signature stamp. Supports instant print and PDF download.
- **Tenant Self-Service Portal GST Invoices**: Direct tenant-side invoice repository within `#tenantPortalSection` enabling tenants to view, verify, and download their monthly tax invoices anytime for accounts and corporate HRA claims.
- **Tenant Master Suite**: Comprehensive tenant profiles with auto-calculated security deposits based on lease duration, separated PAN & Aadhaar identification fields with document attachment viewers (PDF/Image), profile photo uploads, direct communication shortcuts (`[💬 Chat]`, `[📲 Share App]`, `[🏛️ GST Invoice]`), and legal workflow triggers (`[👮 Police Form]`, `[Draft Agreement]`, `[🧾 Receipt]`).
- **Legal Tenancy Studio**: Instant 11-month Indian Tenancy Agreements and HRA rent receipts with Landlord PAN compliance (`abcltd9925@gmail.com`).
- **Supabase Cloud Integration**: Two-way data synchronization with automated schema migrations and offline-first fallback.
