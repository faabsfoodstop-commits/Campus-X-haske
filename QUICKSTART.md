# ⚡ Quickstart - Firebase & Vercel Setup

**Total time: ~30 minutes**

Follow these quick steps to get Haske live.

---

## 📝 Checklist

- [ ] Firebase project created (5 min)
- [ ] Firebase configured (10 min)
- [ ] Vercel deployed (10 min)
- [ ] App tested (5 min)

---

## 🔥 Step 1: Firebase Setup (5 min)

### Create Project
1. Go to https://console.firebase.google.com
2. Click **Create Project**
3. Name: `haske-campus`
4. Click **Create**
5. Wait 2 minutes...

### Enable Authentication
1. Click **Authentication** (left sidebar)
2. Click **Get Started**
3. Enable **Email/Password**
4. Toggle ON → **Save**

### Create Firestore
1. Click **Firestore Database** (left sidebar)
2. Click **Create Database**
3. Choose **Production Mode**
4. Location: **Africa (nam5)** (or nearest)
5. Click **Create**
6. Go to **Rules** tab
7. Paste these security rules:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if request.auth.uid != null;
    }
    match /transactions/{id} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    match /checkIns/{id} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    match /{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

8. Click **Publish**

### Get Credentials
1. Click **Project Settings** (gear icon, top-right)
2. Click **Your apps** → Click **Web** (</> icon)
3. Copy the `firebaseConfig` object
4. Create `.env` file in project root with:

```
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

Replace `YOUR_*` with values from Firebase config.

### Test Locally
```bash
npm run dev
```

1. Visit http://localhost:3000
2. Sign up with test email
3. Should see dashboard
4. Check Firebase Console → Authentication → Users (should show your user)

✅ **Firebase Done!**

---

## 🚀 Step 2: Vercel Deployment (10 min)

### Option A: Deploy from GitHub (Recommended)

1. Push your code to GitHub:
   ```bash
   git remote add github https://github.com/YOUR_USERNAME/campus-x-haske
   git push github claude/build-and-cost-4jx5ai:main
   ```

2. Go to https://vercel.com
3. Click **Sign Up** → **GitHub**
4. Authorize Vercel
5. Click **Add New** → **Project**
6. Select `campus-x-haske` repository
7. Click **Import**

### Configure Environment Variables

1. Click **Environment Variables**
2. Add all 6 Firebase variables (same as `.env`)
3. Click **Save**

### Deploy

1. Click **Deploy**
2. Wait 3-5 minutes for build
3. ✅ When it shows "Ready", click your URL!

Your app is now at: `https://campus-x-haske.vercel.app`

### Option B: Deploy without GitHub

Use Vercel CLI:

```bash
npm install -g vercel
vercel login
vercel --prod
```

Follow prompts to deploy.

---

## ✅ Step 3: Test Your Live App (5 min)

Open `https://campus-x-haske.vercel.app`

Test these:

| Feature | Steps | Expected Result |
|---------|-------|-----------------|
| **Sign Up** | Click Sign Up → Fill form → Submit | New user created, redirects to dashboard |
| **Login** | Login with new credentials | Dashboard loads |
| **Check-In** | Click "Check In Now" button | Get 10 points, button becomes disabled |
| **Wallet** | Click "Wallet" in nav | Shows ₦0.00 balance |
| **Profile** | Click "Profile" → Click Edit | Can update info → Save works |
| **Admin** | Navigate to `/admin` | See all users list |

### Debug Issues

If something fails:

1. **Check browser console** (F12 → Console)
   - Look for red errors
   - Copy error message

2. **Check Vercel logs**
   - Go to Vercel dashboard
   - Click **Deployments**
   - Click latest deployment
   - View **Logs** tab

3. **Common fixes**
   - Missing env var → Add to Vercel
   - Firebase CORS → Add domain to Firebase authorized list
   - Build error → Check local `npm run build` works

---

## 🎯 Quick Reference

### Firebase Files to Remember
- Firebase Console: https://console.firebase.google.com
- Firestore Rules: Edit in **Firestore Database** → **Rules**
- Users: View in **Authentication** → **Users**

### Vercel Files to Remember
- Vercel Dashboard: https://vercel.com/dashboard
- Environment Vars: **Settings** → **Environment Variables**
- Deployments: **Deployments** tab
- Custom Domain: **Settings** → **Domains**

### Local Development
```bash
npm run dev           # Start dev server (localhost:3000)
npm run build         # Build for production
npm run preview       # Preview production build locally
```

---

## 🔧 Troubleshooting

### "Firebase not connected"
```
Fix: Check .env file exists with correct credentials
npm run dev
```

### "Vercel build failed"
```
Fix: 
1. npm run build (test locally)
2. Fix any errors
3. git push
4. Vercel auto-redeploys
```

### "CORS error in production"
```
Fix:
1. Go to Firebase Console
2. Authentication → Settings
3. Add your Vercel domain to "Authorized domains"
4. Wait 5 minutes
5. Refresh app
```

### "Users can't sign up"
```
Fix:
1. Check Firestore security rules are published
2. Check Authentication is enabled
3. Check email/password provider is ON
```

---

## 📊 What's Live

✅ Landing page
✅ User authentication
✅ Dashboard with check-ins
✅ Wallet system
✅ User profiles
✅ Admin panel
✅ Firestore database
✅ Firebase auth
✅ Deployed on Vercel

---

## 🚀 Next Features to Build

1. **Marketplace** - Buy/sell items
2. **P2P Transfers** - Send money
3. **Payment Gateway** - Real payments
4. **Referral Rewards** - Bonus points
5. **Mobile App** - React Native
6. **Analytics** - Track metrics
7. **Multi-campus** - Add more schools
8. **Notifications** - Push alerts

---

## 💬 Support

**Firebase Issues?** 
→ See `FIREBASE_SETUP.md`

**Vercel Issues?**
→ See `VERCEL_DEPLOYMENT.md`

**Code Issues?**
→ Check `README.md`

---

## ✨ Congratulations!

Your Haske MVP is now **LIVE** and **PRODUCTION-READY**! 🎉

**Next Steps:**
1. Share your live URL with friends
2. Get feedback from testers
3. Monitor analytics in Vercel
4. Track user growth in Firebase
5. Plan Phase 2 features

---

**Live URL:** `https://campus-x-haske.vercel.app`

**Admin Dashboard:** `https://campus-x-haske.vercel.app/admin`

**Start Building Phase 2!** 🚀
