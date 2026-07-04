# 🚀 HASKii Setup Guide

Complete step-by-step guide to set up and run HASKii locally.

## Prerequisites

- Node.js 16+ 
- npm or yarn
- Git
- Supabase account (free tier works)

## Step 1: Clone Repository

```bash
cd /home/user/Campus-X-haske
git checkout haskii-docs-clean
npm install
```

## Step 2: Create Supabase Project

1. Go to https://supabase.com
2. Sign up (free tier)
3. Create new project
4. Wait for project to initialize (5-10 seconds)
5. Go to project settings → API

Get these credentials:
- **Project URL** (VITE_SUPABASE_URL)
- **Anon Key** (VITE_SUPABASE_ANON_KEY)

## Step 3: Setup Environment

```bash
# Copy template
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

Add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=HASKii
VITE_APP_VERSION=1.0.0
```

## Step 4: Create Database Schema

1. In Supabase dashboard → **SQL Editor** → **New Query**
2. Copy entire content of:
   ```
   supabase/migrations/001_haski_schema.sql
   ```
3. Paste into SQL editor
4. Click **Run** button
5. Wait for completion (should see green checkmark)

**Expected output:**
- 12 tables created
- 19 RLS policies created
- 9 indexes created
- 7 seed missions inserted

## Step 5: Verify Database

In Supabase dashboard → **Table Editor**, you should see:
```
✅ users
✅ transactions
✅ streak_check_ins
✅ daily_missions
✅ missions
✅ video_ads_watched
✅ getting_started_tasks
✅ activity_log
✅ redemptions
✅ referrals
✅ (2 more tables for Phase 7)
```

## Step 6: Start Development Server

```bash
npm run dev
```

You should see:
```
  VITE v5.4.21  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Open http://localhost:5173 in your browser.

## Step 7: Create Test Account

1. Click "Sign Up"
2. Enter:
   - Email: `test@example.com`
   - Password: `password123` (min 6 chars)
   - Full Name: `Test User`
3. Click "Sign Up"
4. Fill profile:
   - University: `University of Lagos`
   - Department: `Computer Science`
   - Course: `200L`
5. Click "Continue to Dashboard"

✅ You're now logged in!

## Step 8: Test Features

See [TESTING.md](./TESTING.md) for complete testing guide.

---

## 🛠️ Troubleshooting

### "Invalid credentials" error
**Problem**: Supabase keys are wrong  
**Solution**:
1. Go to Supabase dashboard
2. Check Project Settings → API
3. Copy correct URL and Anon Key
4. Update .env.local
5. Restart dev server: `npm run dev`

### "Cannot read property 'select' of undefined"
**Problem**: Database tables not created  
**Solution**:
1. Run the SQL migration again (Step 4)
2. Verify all tables exist in Table Editor
3. Restart dev server

### "Cannot connect to localhost:5173"
**Problem**: Dev server not running  
**Solution**:
```bash
npm run dev
```

### "UNIQUE constraint failed"
**Problem**: Trying to duplicate an action (e.g., check-in twice same day)  
**Solution**: ✅ This is working correctly! UNIQUE constraints prevent duplicates

### "RLS policy violation"
**Problem**: Trying to access other user's data  
**Solution**: ✅ This is working correctly! RLS policies enforce data privacy

---

## 📦 Production Build

```bash
npm run build
```

Creates optimized build in `dist/` folder:
- 451KB JavaScript (122KB gzipped)
- 26KB CSS (4.75KB gzipped)
- Zero errors

## 🌐 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
4. Deploy automatically

### Netlify
1. Similar setup to Vercel
2. Set build command: `npm run build`
3. Set publish directory: `dist`

### Self-hosted
1. Run `npm run build`
2. Upload `dist/` folder to web server
3. Configure reverse proxy if needed

---

## 📊 Tech Stack

| Component | Tech |
|-----------|------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| State | Context API |
| Routing | React Router v6 |

---

## ✅ Verification Checklist

- [ ] Node 16+ installed (`node --version`)
- [ ] Repository cloned
- [ ] `npm install` completed
- [ ] `.env.local` created with Supabase keys
- [ ] Database schema created (12 tables)
- [ ] Dev server running (`npm run dev`)
- [ ] Can access http://localhost:5173
- [ ] Can sign up new account
- [ ] Can complete profile
- [ ] Can see dashboard

---

## 🎯 Next Steps

1. Follow [TESTING.md](./TESTING.md) to test all features
2. Read [PRD.md](./PRD.md) to understand the product
3. Check [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for current progress
4. Review code in `/src/pages/` for examples

---

**Need help?** Check the troubleshooting section above or review the relevant documentation file.
