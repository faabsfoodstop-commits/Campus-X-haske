# 🔥 Firebase Setup Guide for Haske

Complete step-by-step guide to set up Firebase for the Haske platform.

## 📋 Prerequisites

- Google Account
- Firebase CLI (optional, for advanced features)
- Node.js installed

## Step 1: Create Firebase Project

### 1.1 Go to Firebase Console

1. Open https://console.firebase.google.com
2. Click **"Create a project"** or **"Add project"**
3. Enter project name: `haske-campus` (or your preferred name)
4. Click **Continue**

### 1.2 Configure Project Settings

1. Enable Google Analytics (optional, recommended for tracking)
2. Select analytics location: **Africa** (or your region)
3. Click **Create project**
4. Wait for project to initialize (2-3 minutes)

---

## Step 2: Enable Authentication

### 2.1 Set Up Email/Password Auth

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **Get Started**
3. Click **Email/Password** provider
4. Toggle **Enable** to ON
5. Keep "Email link sign-in" OFF for now
6. Click **Save**

### 2.2 Set Up Anonymous Auth (Optional, for guests)

1. Go to **Authentication** → **Sign-in method**
2. Click **Anonymous**
3. Toggle **Enable** to ON
4. Click **Save**

---

## Step 3: Create Firestore Database

### 3.1 Initialize Firestore

1. Go to **Firestore Database** (left sidebar)
2. Click **Create database**
3. Choose security rules:
   - Select **Start in production mode** (we'll set rules manually)
4. Choose location: **Africa (nam5)** or closest to your users
5. Click **Create**
6. Wait for initialization (1-2 minutes)

### 3.2 Set Firestore Security Rules

1. In Firestore, go to **Rules** tab
2. Replace the default rules with:

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - authenticated users only
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if request.auth.uid != null;
    }
    
    // Transactions collection
    match /transactions/{transactionId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    
    // CheckIns collection
    match /checkIns/{checkInId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    
    // Admin access (you'll add admin role later)
    match /{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

3. Click **Publish**
4. Confirm the changes

---

## Step 4: Get Firebase Credentials

### 4.1 Access Project Settings

1. Click **Project Settings** (gear icon, top-right)
2. Go to **Service accounts** tab
3. Under "SDK setup and configuration", select **Node.js**
4. Copy the entire config object (or stay in this tab)

### 4.2 Get Web App Credentials

1. Go to **Project Settings** → **General** tab
2. Under "Your apps", click **Add app** → **Web** (</> icon)
3. Register app name: `haske-web`
4. Check **Also set up Firebase Hosting**
5. Click **Register app**
6. Copy the Firebase configuration
7. Click **Next** (skip Firebase Hosting for now)
8. Click **Continue to console**

### 4.3 Copy Your Config

You'll see a configuration object like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxx...",
  authDomain: "haske-campus.firebaseapp.com",
  projectId: "haske-campus",
  storageBucket: "haske-campus.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

---

## Step 5: Configure Environment Variables

### 5.1 Create .env File

In your project root, create or update `.env`:

```bash
VITE_FIREBASE_API_KEY=AIzaSyDxxx...
VITE_FIREBASE_AUTH_DOMAIN=haske-campus.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=haske-campus
VITE_FIREBASE_STORAGE_BUCKET=haske-campus.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

### 5.2 Verify Firebase Connection

Run locally first:

```bash
npm run dev
```

Go to http://localhost:3000 and try:
1. Sign up with a test email
2. Check browser console for any errors
3. Go to Firebase Console → Authentication → Users
4. You should see your test user created

---

## Step 6: Create Firestore Collections

### 6.1 Manual Collection Creation (Recommended)

1. Go to **Firestore Database**
2. Click **Start collection**
3. Collection ID: `users`
4. Click **Next**
5. Add a test document:
   - Document ID: `auto` (auto-generate)
   - Add fields:
     - `fullName` (string): "Test User"
     - `email` (string): "test@example.com"
     - `university` (string): "BUK"
     - `wallet` (number): 0
     - `points` (number): 0
     - `createdAt` (timestamp): current date
6. Click **Save**

### 6.2 Create Other Collections

Repeat the above for:
- `transactions` collection
- `checkIns` collection

(Documents will be created automatically when users sign up)

---

## Step 7: Enable Firebase Hosting (Optional)

If you want Firebase to host your frontend:

### 7.1 Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 7.2 Initialize Firebase

```bash
firebase login
firebase init hosting
```

When prompted:
- Choose your project: `haske-campus`
- Public directory: `dist`
- Configure as single-page app: `Yes`

### 7.3 Deploy

```bash
npm run build
firebase deploy
```

Your app will be at: `https://haske-campus.web.app`

---

## Step 8: Set Up Email Verification (Optional)

For production, add email verification:

1. Go to **Authentication** → **Templates**
2. Email verification template:
   - Subject: "Verify your Haske email"
   - Customize if needed
3. Go to your Firebase settings and add sender email

---

## Step 9: Enable Additional Features (Optional)

### Storage for Profile Pictures
1. Go to **Cloud Storage**
2. Click **Get started**
3. Start in **Production mode**
4. Choose location: **Africa (nam5)**
5. Click **Done**

### Cloud Functions for Backend Logic
1. Go to **Cloud Functions**
2. Click **Create function**
3. Configure as needed for backend tasks

### Realtime Database (if needed)
1. Go to **Realtime Database**
2. Click **Create database**
3. Start in **Locked mode** for security

---

## Step 10: Test Your Setup

### Test Signup Flow

```bash
npm run dev
```

1. Visit http://localhost:3000
2. Click **Sign Up**
3. Enter:
   - Name: "John Doe"
   - Email: "john@example.com"
   - University: "BUK"
   - Password: "Test@123456"
4. Click **Sign Up**

### Verify in Firebase

1. Go to Firebase Console
2. **Authentication** → **Users**: Should show your new user
3. **Firestore** → **users** collection: Should have a new document with your user data

### Test Login

1. Logout or clear cookies
2. Click **Login**
3. Enter same credentials
4. Should see dashboard

---

## Step 11: Create Admin User (Manual)

To access `/admin` page:

1. Go to **Authentication** → **Users**
2. Find your user
3. Click the three dots (...) → **Edit user**
4. Add custom claim (requires Firebase CLI):

```bash
firebase auth:import users.json --hash-algo=scrypt
```

Or use Cloud Functions to set admin claim:

```javascript
// In Firebase Console → Cloud Functions
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.setAdminClaim = functions.https.onCall((data, context) => {
  const uid = data.uid;
  return admin.auth().setCustomUserClaims(uid, { admin: true })
    .then(() => {
      return { message: `Custom claims set for user ${uid}` };
    });
});
```

---

## Troubleshooting

### Issue: "Firebase initialization failed"
**Solution:**
- Check `.env` file has correct credentials
- Make sure all required env vars are set
- Restart dev server: `npm run dev`

### Issue: "Permission denied" when signing up
**Solution:**
- Check Firestore security rules
- Ensure Authentication is enabled
- Verify user is authenticated

### Issue: "CORS error"
**Solution:**
- This is normal during local development
- Add your domain to Firebase settings when deploying
- Go to **Project Settings** → **Authorized domains** → Add your Vercel domain

### Issue: "Invalid API key"
**Solution:**
- Check API key in `.env`
- Make sure it's copied exactly
- Regenerate if needed in Firebase Console

### Issue: Data not appearing in Firestore
**Solution:**
- Check security rules allow writes
- Verify user is authenticated
- Check browser console for errors
- Wait a moment (sometimes takes 1-2 seconds to sync)

---

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Never commit `.env` to GitHub
- [ ] Security rules are set to production mode
- [ ] Anonymous auth is disabled (unless needed)
- [ ] API key restrictions are configured (optional)
- [ ] Firestore backups enabled (in Settings)

---

## Next Steps

1. ✅ Firebase project created
2. ✅ Authentication enabled
3. ✅ Firestore database configured
4. ✅ Environment variables set
5. ⏳ Deploy to Vercel (see `VERCEL_DEPLOYMENT.md`)
6. ⏳ Set up custom domain
7. ⏳ Enable analytics

---

## Useful Firebase Docs

- [Firebase Setup](https://firebase.google.com/docs/build)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Security Rules](https://firebase.google.com/docs/rules)
- [Firebase CLI](https://firebase.google.com/docs/cli)

---

**Firebase Project Ready?** 
Next: See `VERCEL_DEPLOYMENT.md` for deploying your app!
