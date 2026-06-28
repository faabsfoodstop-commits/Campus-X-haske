# 🚀 Deploy to Vercel - Complete Guide

Step-by-step guide to deploy Haske to Vercel with automatic CI/CD.

---

## Part 1: Prepare Your Project

### Step 1: Ensure Code is Pushed

Make sure all changes are committed and pushed to your branch:

```bash
git status  # Should show "working tree clean"
git log --oneline -3  # Should show your commits
```

If not pushed:

```bash
git add .
git commit -m "Update for Vercel deployment"
git push origin claude/build-and-cost-4jx5ai
```

### Step 2: Verify package.json Build Script

Check that your `package.json` has the build script:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

This should already be in place. ✅

---

## Part 2: Create Vercel Account & Project

### Step 1: Sign Up for Vercel

1. Go to https://vercel.com
2. Click **Sign Up**
3. Choose sign-up method:
   - **Recommended:** GitHub (easiest integration)
   - Or: Email
   - Or: GitLab / Bitbucket

### Step 2: Authorize GitHub (if using GitHub signup)

1. Click **Continue with GitHub**
2. Authorize Vercel to access your GitHub account
3. You may need to install the Vercel app in your GitHub organization

### Step 3: Connect Your Repository

1. After signup, click **Add New** → **Project**
2. Import your Git repository:
   - URL: `https://github.com/your-username/campus-x-haske`
   - (Or paste your repository URL)
3. Click **Continue**

If using GitLab/Bitbucket or local git, see "Alternative: Deploy from Local Git" section below.

---

## Part 3: Configure Environment Variables

### Step 1: Add Environment Variables in Vercel

1. In Vercel dashboard, go to your project
2. Click **Settings** (top menu)
3. Go to **Environment Variables** (left sidebar)
4. Click **Add New**
5. Fill in each variable:

**Variable 1:**
```
Name: VITE_FIREBASE_API_KEY
Value: AIzaSyDxxx...
Environments: Production, Preview, Development
```

**Variable 2:**
```
Name: VITE_FIREBASE_AUTH_DOMAIN
Value: haske-campus.firebaseapp.com
Environments: Production, Preview, Development
```

**Variable 3:**
```
Name: VITE_FIREBASE_PROJECT_ID
Value: haske-campus
Environments: Production, Preview, Development
```

**Variable 4:**
```
Name: VITE_FIREBASE_STORAGE_BUCKET
Value: haske-campus.appspot.com
Environments: Production, Preview, Development
```

**Variable 5:**
```
Name: VITE_FIREBASE_MESSAGING_SENDER_ID
Value: 123456789
Environments: Production, Preview, Development
```

**Variable 6:**
```
Name: VITE_FIREBASE_APP_ID
Value: 1:123456789:web:abc123def456
Environments: Production, Preview, Development
```

### Step 2: Save Environment Variables

Click **Save** after adding each variable.

---

## Part 4: Configure Build Settings

### Step 1: Access Project Settings

1. Click **Settings** (top menu)
2. Go to **Build & Development Settings** (left sidebar)

### Step 2: Set Build Configuration

Verify these settings:

| Setting | Value |
|---------|-------|
| Framework | Vite (auto-detected) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js Version | 18.x or latest |

**If not auto-detected:**

1. Click **Edit**
2. Framework: Select **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Click **Save**

### Step 3: Install Command

Ensure install command is:
```
npm install
```

(Should be default)

---

## Part 5: Deploy Your Project

### Step 1: Trigger Initial Deployment

Option A: **Auto-deploy from GitHub**
1. Go to **Deployments** tab
2. You should see a deployment in progress
3. Wait for build to complete (2-5 minutes)
4. ✅ When status shows "Ready", your app is live!

Option B: **Manual Deployment**
1. Click **Deploy** button in Vercel dashboard
2. Wait for build to complete

### Step 2: Get Your Live URL

Once deployment is complete:

1. Click on the deployment
2. You'll see your live URL: `https://campus-x-haske.vercel.app`
3. Click to visit your app

---

## Part 6: Test Your Deployment

### Step 1: Visit Your App

Open: `https://campus-x-haske.vercel.app` (or your custom URL)

### Step 2: Test Features

1. **Landing Page**
   - Should load with hero image
   - Check responsive design (mobile, tablet, desktop)

2. **Sign Up**
   - Click "Sign Up"
   - Fill in form
   - Should create user in Firebase

3. **Dashboard**
   - After signup, should redirect to dashboard
   - Should show user name
   - Check-in button should work

4. **Wallet**
   - Click "Wallet" in navigation
   - Should show balance
   - Transaction history should display

5. **Profile**
   - Click "Profile"
   - Edit button should work
   - Changes should save to Firebase

### Step 3: Check for Errors

Open browser console (F12):
- Should have no red errors
- May see yellow warnings (ignore)
- Check Network tab for failed requests

---

## Part 7: Configure Custom Domain (Optional)

### Step 1: Buy Domain

Get a domain from:
- Namecheap
- GoDaddy
- Google Domains
- Any registrar

Example: `haske.app` or `campus-haske.com`

### Step 2: Add Domain in Vercel

1. In Vercel dashboard, click **Settings**
2. Go to **Domains** (left sidebar)
3. Click **Add Domain**
4. Enter your domain: `haske.app`
5. Click **Add**

### Step 3: Configure DNS

Vercel will show DNS records to add. Choose one:

**Option A: Using Nameservers (Recommended)**
1. Copy Vercel's nameservers
2. Go to your domain registrar
3. Update nameservers to Vercel's
4. Wait 24-48 hours for propagation

**Option B: Using CNAME**
1. Copy the CNAME record from Vercel
2. Add to your domain registrar's DNS settings
3. Wait a few minutes

### Step 4: Verify Domain

Once DNS propagates:
- Your domain should be active in Vercel
- You can access your app at `https://haske.app`

---

## Part 8: Set Up Automatic Deployments

### Step 1: Verify GitHub Integration

1. Go to **Settings** → **Git Repository**
2. Should show your repository connected
3. Production branch: `main` (or your default)

### Step 2: Configure Branch Deployments

By default:
- Commits to `main` → Production deployment
- Pull requests → Preview deployment
- Other branches → Preview deployment (optional)

### Step 3: Disable/Enable Auto-deployment

To change:
1. Click **Settings** → **Git**
2. Toggle **Deploy** on/off as needed

---

## Part 9: Monitoring & Analytics

### Step 1: View Deployment Logs

1. Click **Deployments** tab
2. Click on any deployment
3. View build logs and errors

### Step 2: Monitor Performance

1. Click **Analytics** tab
2. View:
   - Page load times
   - API usage
   - Errors and crashes
   - Core Web Vitals

### Step 3: Check Real-time Logs

1. Click **Logs** tab
2. See real-time logs from your deployed app
3. Filter by function, path, or status

---

## Part 10: Update Your App

### To Deploy Updates:

1. Make changes locally:
   ```bash
   # Edit files...
   git add .
   git commit -m "Update features"
   git push origin claude/build-and-cost-4jx5ai
   ```

2. If your default branch is `main`:
   ```bash
   git push origin claude/build-and-cost-4jx5ai:main
   ```

3. Vercel auto-deploys within 1-2 minutes

4. View deployment status in Vercel dashboard

---

## Troubleshooting

### Issue: Build Failed - "Missing Environment Variables"

**Solution:**
1. Go to Vercel **Settings** → **Environment Variables**
2. Verify all 6 Firebase variables are added
3. Check spelling (case-sensitive)
4. Redeploy: Click **Deployments** → Click latest → **Redeploy**

### Issue: "Vite build failed"

**Solution:**
1. Check local build works: `npm run build`
2. Fix any TypeScript/syntax errors
3. Push changes
4. Vercel will auto-rebuild

### Issue: Firebase connection fails in production

**Solution:**
1. Check API key in Vercel environment variables
2. Go to Firebase Console
3. **Project Settings** → **Authorized domains**
4. Add your Vercel domain: `yourapp.vercel.app`
5. Also add custom domain if using one
6. Wait 5 minutes for changes
7. Redeploy

### Issue: CORS errors

**Solution:**
1. This is a Firebase security issue
2. Add your domain to Firebase authorized domains
3. Go to Firebase Console
4. **Authentication** → **Settings**
5. **Authorized domains** → Add your Vercel URL
6. Wait 5 minutes
7. Clear browser cache and redeploy

### Issue: Long build times (>5 minutes)

**Solution:**
1. Optimize build in `vite.config.js`
2. Check for large dependencies in `package.json`
3. Consider removing unused packages
4. Vercel has generous free tier (50 builds/month)

---

## Vercel Free Tier Limits

| Feature | Limit |
|---------|-------|
| Deployments | Unlimited |
| Bandwidth | 100GB/month |
| Build runtime | 45 minutes/month |
| Serverless functions | 1000 invocations/day |
| Database | Not included |
| Custom domains | Unlimited |
| HTTPS | Free |

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test all features
3. ⏳ Add custom domain (optional)
4. ⏳ Set up monitoring
5. ⏳ Configure analytics

---

## Useful Vercel Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite on Vercel](https://vercel.com/docs/frameworks/vite)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/concepts/projects/domains/add-a-domain)
- [Analytics](https://vercel.com/docs/analytics)

---

## Quick Deployment Checklist

- [ ] GitHub account created
- [ ] Code pushed to GitHub
- [ ] Firebase project set up
- [ ] Environment variables configured in Vercel
- [ ] Build settings verified
- [ ] Initial deployment completed
- [ ] App tested and working
- [ ] Custom domain added (optional)
- [ ] Monitoring enabled
- [ ] Team invited (optional)

---

**Your App is Live!** 🎉

**Production URL:** `https://campus-x-haske.vercel.app`

Next: Share with users and start gathering feedback!
