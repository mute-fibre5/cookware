# Buyer & Seller Profile Setup

## Why profiles matter

- **Buyers**: A profile is created when you first log in after registering. It stores your name and email so the app can recognize you.
- **Employees**: Added by the admin from the Admin Panel (Employees tab), not from the Register page.

## If you can't create a profile (buyer)

**The buyer row is created when you log in**, not when you register. So:

1. Register as buyer → check your email and **click the confirmation link**.
2. Come back to the app → open **Login** → sign in with the same email and password.
3. Your profile is created in the `buyers` table at that moment.

If you already did that and still see an error, the **`buyers` table is probably missing** in Supabase. Create it once:

1. Open [Supabase Dashboard](https://app.supabase.com) → your project.
2. Go to **SQL Editor** → New query.
3. Copy the contents of **`supabase-buyers-table.sql`** from this project (or the SQL below), paste, and **Run**.

```sql
-- Buyers table (id matches auth.users.id)
CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyers_email ON buyers(email);

-- Allow authenticated users to manage their own row
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own buyer row"
  ON buyers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own buyer row"
  ON buyers FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own buyer row"
  ON buyers FOR UPDATE
  USING (auth.uid() = id);
```

4. Run it. After that, **Register** creates your auth account and **Login** creates/updates your buyer profile automatically.

## Flow summary

| Step | What happens |
|------|-------------------------------|
| **Register** (Buyer) | Creates Supabase Auth account. You may need to confirm email. |
| **Login** (Buyer)   | Logs you in and creates or updates your row in `buyers`. |
| **Register** (Employee) | Creates Auth account only. Ask admin to add you as an employee. |
| **Login** (Employee)   | Only the admin email can log in as employee. |

## Email confirmation

If your project has **Confirm email** enabled in Supabase (Authentication → Providers → Email):

1. After **Register**, check your email and click the confirmation link.
2. Then go to **Login** and sign in. Your buyer profile will be created on that first login.

If you don’t want to confirm email during development, turn **Confirm email** off in Supabase so you can log in right after registering.
