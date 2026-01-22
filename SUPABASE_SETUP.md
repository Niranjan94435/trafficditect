# Supabase Integration Setup Guide

This guide will help you set up Supabase for the STP Analyser project.

## Step 1: Create a Supabase Account

1. Go to [Supabase](https://app.supabase.com)
2. Sign up for a free account or log in
3. Create a new project

## Step 2: Get Your Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **Anonymous Key**
3. Create a `.env.local` file in your project root (copy from `.env.example`)
4. Paste the values:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 3: Create Database Tables

In your Supabase dashboard, go to the **SQL Editor** and run these queries:

### Create User Profiles Table
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  email VARCHAR NOT NULL,
  full_name VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
```

### Create Traffic Analysis Table
```sql
CREATE TABLE traffic_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  pedestrians INTEGER DEFAULT 0,
  cars INTEGER DEFAULT 0,
  buses INTEGER DEFAULT 0,
  trucks INTEGER DEFAULT 0,
  bikes INTEGER DEFAULT 0,
  animals INTEGER DEFAULT 0,
  crowds INTEGER DEFAULT 0,
  congestion VARCHAR,
  density INTEGER DEFAULT 0,
  co2 DECIMAL(10, 4) DEFAULT 0,
  nox DECIMAL(10, 4) DEFAULT 0,
  pm25 DECIMAL(10, 4) DEFAULT 0,
  CONSTRAINT user_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT timestamp_idx UNIQUE(user_id, timestamp)
);

CREATE INDEX idx_traffic_analysis_user_id ON traffic_analysis(user_id);
CREATE INDEX idx_traffic_analysis_timestamp ON traffic_analysis(timestamp DESC);
```

## Step 4: Enable Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Email/Password is enabled by default
3. (Optional) Enable other providers (Google, GitHub, etc.)

## Step 5: Set Up Row Level Security (RLS)

In the **SQL Editor**, run these queries:

### Enable RLS on tables
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_analysis ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policies for user_profiles
```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);
```

### Create RLS Policies for traffic_analysis
```sql
-- Users can view their own traffic analysis
CREATE POLICY "Users can view own traffic data"
ON traffic_analysis FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own traffic analysis
CREATE POLICY "Users can insert own traffic data"
ON traffic_analysis FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## Step 6: Install Dependencies

```bash
npm install
```

## Step 7: Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` and sign up for a new account!

## Features Enabled

✅ User Authentication (Sign up / Sign in / Sign out)
✅ User Profiles
✅ Real-time Traffic Analysis Saving
✅ Historical Data Storage
✅ User-specific Analytics Dashboard

## Testing

### Create a Test Account
- Email: `test@example.com`
- Password: `testpassword123`

### Verify Data Saving
1. Log in to your account
2. Allow camera access
3. Check Supabase dashboard → traffic_analysis table to see real-time data

## Troubleshooting

### "Database permission denied" Error
- Check that RLS policies are correctly set up
- Verify the user is authenticated before making queries

### "Invalid API key" Error
- Double-check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
- Make sure you're using the **anonymous key**, not the service role key

### Can't Log In
- Check that Email/Password authentication is enabled in Supabase
- Verify user exists in the auth.users table

## Database Schema Overview

### user_profiles
- `id`: User ID (UUID)
- `email`: User email address
- `full_name`: User's full name
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### traffic_analysis
- `id`: Record ID (UUID)
- `user_id`: Reference to the user who created this analysis
- `timestamp`: When the analysis was recorded
- `pedestrians`, `cars`, `buses`, `trucks`, `bikes`, `animals`: Object detection counts
- `crowds`: Number of crowd detections
- `congestion`: Congestion level (Low/Medium/High)
- `density`: Vehicle density
- `co2`, `nox`, `pm25`: Pollution metrics

## Next Steps

- Customize the dashboard to show more analytics
- Add real-time alerts for high pollution
- Export traffic data to CSV/PDF
- Implement admin dashboard for system-wide analytics
