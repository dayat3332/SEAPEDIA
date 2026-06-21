# SEAPEDIA Marketplace Platform

Welcome to **SEAPEDIA**, a comprehensive e-commerce marketplace platform that seamlessly connects buyers, sellers, and delivery drivers in a single, high-fidelity experience.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- MySQL / MariaDB (Running locally or via Docker)

### Setup Instructions

1. **Clone & Explore the Workspace:**
   The workspace is divided into two parts:
   - `/backend`: Node.js, Express, and MySQL connection layer.
   - `/frontend`: React, Vite, Tailwind CSS, and custom HSL aesthetics.

2. **Backend Installation & Seed Database:**
   ```bash
   cd backend
   npm install
   
   # Configure your environment variables (.env)
   # DB_HOST=localhost
   # DB_USER=your_user
   # DB_PASSWORD=your_password
   # DB_NAME=seapedia
   # JWT_SECRET=your_jwt_secret_key
   
   # Run the database migration and seeder
   npm run seed
   
   # Start the backend development server (Runs on Port 5000)
   npm run dev
   ```

3. **Frontend Installation:**
   ```bash
   cd ../frontend
   npm install
   
   # Start the frontend development server (Runs on Port 3000)
   npm run dev
   ```

---

## 👥 Demo Accounts & Credentials

All default seed accounts use the password: **`Password123!`**

| Username | Roles | Purpose / Demo Target |
| :--- | :--- | :--- |
| **`admin1`** | `admin` | System monitoring, voucher/promo management, and SLA time leap simulations. |
| **`buyer1`** | `buyer` | Shopping, cart operations, top-ups, addresses, and order tracking. |
| **`buyer2`** | `buyer` | Secondary buyer account. |
| **`seller1`** | `seller` | Store manager for "Toko Makmur". Product CRUD and order packaging. |
| **`seller2`** | `seller` | Store manager for "Elektronik Jaya". Product CRUD. |
| **`driver1`** | `driver` | Delivery jobs portal. Accept assignments and confirm delivery payouts. |
| **`multirole`**| `buyer`, `seller`, `driver` | Demonstrates the session-switching logic without logging out. |

---

## 📐 Core Business Logic Rules

### 1. Single-Store Checkout Rule
SEAPEDIA is a multi-merchant marketplace. To maintain transaction sanity, **a buyer's cart can only contain items from a single store at any one time.** 
- If a buyer attempts to add a product from a different merchant store, the interface blocks the action and prompts the buyer to either clear the existing cart or complete checkout for current items.
- The backend strictly validates and enforces this condition on cart write operations.

### 2. Tax & Discount Calculations
Indonesia's **12% PPN tax** is applied directly to the taxable subtotal *after* discount deductions have been calculated.
$$\text{Taxable Subtotal} = \text{Items Subtotal} - \text{Discount Amount}$$
$$\text{PPN 12\%} = \text{Taxable Subtotal} \times 0.12$$
$$\text{Final Total Payment} = \text{Taxable Subtotal} + \text{PPN 12\%} + \text{Delivery Fee}$$

- **Vouchers vs. Promos:** Vouchers have usage limits (`used_count` locked with `FOR UPDATE` transaction blocks at checkout), whereas Promos are constrained strictly by valid date windows.

### 3. Driver Earnings
Drivers receive **80% of the delivery fee** paid by the buyer upon completion:
- **Instant:** Rp 25,000 (Driver payout: Rp 20,000)
- **Next Day:** Rp 15,000 (Driver payout: Rp 12,000)
- **Regular:** Rp 10,000 (Driver payout: Rp 8,000)
*Payouts are automatically credited to the driver's wallet and recorded in the transactions ledger upon completing the delivery assignment.*

### 4. Overdue Delivery SLAs & Next-Day Time Simulation
To handle delivery delays, SEAPEDIA defines SLAs based on delivery methods:
- **Instant:** 2 hours threshold.
- **Next Day:** 24 hours threshold.
- **Regular:** 72 hours threshold.

**Next-Day Simulation:**
Admins can trigger a **Time Leap** simulation in their dashboard. The backend shifts order timestamps back and automatically processes overdue orders:
- Overdue active orders are transitioned to `dikembalikan`.
- The buyer receives a full refund credited directly back to their wallet balance.
- Product stock counts are restored to original levels.
- Reversals are recorded in the system logs and wallet history.

### 5. Email Verification & OTP Flow
- **New Registrations:** Newly registered accounts are created in an unverified state (`is_verified = FALSE`). A 6-character numeric OTP is generated and sent via SMTP (or logged in console if SMTP is unconfigured) to complete verification.
- **Pre-verified Demo Accounts:** All default demo accounts (`admin1`, `buyer1`, `seller1`, etc.) are pre-verified by default (`is_verified = TRUE`) to allow seamless, instant access during testing.

---

## 🔒 Security Hardening Protocol

1. **SQL Injection (SQLi) Prevention:**
   - Para-meterized database queries are used for all CRUD operations and state changes. User input is never concatenated directly into raw queries.

2. **Cross-Site Scripting (XSS) Prevention:**
   - React handles output compilation natively by escaping user variables rendered inside JSX brackets. Script tags or malicious tags entered in the public application review forms are treated purely as inert text strings.

3. **Server-Side Session & Authorization (RBAC):**
   - Routes are guarded via a custom Express middleware (`roleGuard`) which validates requests against the user's active session role token, preventing spoofing or manual route manipulation.
   - Database record owners are checked on updating/deleting products and completing delivery actions.

---

## 📄 Key API Reference

### Auth
- `POST /api/auth/register` - Create user
- `POST /api/auth/login` - Login & select active session role
- `POST /api/auth/role` - Switch active role
- `GET /api/auth/me` - Profile context

### Orders & Checkout
- `POST /api/orders/checkout` - Single-store checkout with discount code validation
- `GET /api/orders/buyer` - Buyer order history
- `GET /api/orders/seller` - Seller processed orders
- `PUT /api/orders/:id/status` - Package order transition (`sedang_dikemas` -> `menunggu_pengirim`)

### Delivery Jobs (Driver)
- `GET /api/deliveries/dashboard` - Stats, balance, and active/historical logs
- `GET /api/deliveries/available` - Unassigned jobs awaiting driver (`menunggu_pengirim` status)
- `POST /api/deliveries/:id/take` - Claim delivery (`sedang_dikirim`)
- `POST /api/deliveries/:id/complete` - Deliver delivery & earn payout (`pesanan_selesai`)

### Admin & Overdue Simulation
- `GET /api/admin/metrics` - Overdue orders count & platform metrics
- `POST /api/admin/simulate-next-day` - Time shift simulation and SLA refund engine
- `POST /api/discounts/vouchers` - Generate voucher
- `POST /api/discounts/promos` - Generate promo
