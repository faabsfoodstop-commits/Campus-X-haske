# 🚀 Haske - Campus Operating System

Haske is a platform connecting students, businesses, and opportunities across African universities. Students can earn rewards, manage wallets, and participate in campus marketplace activities.

## 🎯 MVP Features (Sprint 1-4)

### Sprint 1: Landing & Signup (Week 1-2)
- [x] Public landing page
- [x] User registration/signup flow
- [x] Email verification setup
- [x] Basic profile creation

### Sprint 2: Authentication & Dashboard (Week 3-4)
- [x] User login/logout
- [x] Session management
- [x] Main dashboard
- [x] User profile page

### Sprint 3: Wallet System (Week 5-6)
- [x] Wallet creation per user
- [x] Balance display
- [x] Transaction history
- [x] Basic transaction logging

### Sprint 4: Rewards & Engagement (Week 7-8)
- [x] Daily check-in system
- [x] Points reward logic
- [x] Referral code generation
- [x] Admin dashboard

## 🛠️ Tech Stack

```
Frontend:     React 18 + Vite + Tailwind CSS
Backend:      Firebase (Auth + Firestore)
Hosting:      Vercel (Frontend) + Firebase (Backend)
Database:     Firestore (NoSQL)
Routing:      React Router DOM
```

## 📋 Project Structure

```
campus-x-haske/
├── src/
│   ├── config/
│   │   └── firebase.js           # Firebase configuration
│   ├── pages/
│   │   ├── Landing.jsx           # Public landing page
│   │   ├── SignUp.jsx            # User registration
│   │   ├── Login.jsx             # User login
│   │   ├── Dashboard.jsx         # Main user dashboard
│   │   ├── Wallet.jsx            # Wallet management
│   │   ├── Profile.jsx           # User profile
│   │   └── Admin.jsx             # Admin dashboard
│   ├── App.jsx                   # Main app component & routing
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Tailwind styles
├── index.html                    # HTML entry point
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind CSS config
├── postcss.config.js            # PostCSS config
├── package.json                 # Dependencies
└── .env.example                 # Environment template
```

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
git clone <repo-url>
cd campus-x-haske
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Copy your Firebase config credentials

### 3. Set Environment Variables

Create `.env` file in root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

### 4. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
```

## 📊 Firestore Database Schema

### Users Collection
```javascript
{
  fullName: string,
  email: string,
  university: string,
  wallet: number,        // Naira balance
  points: number,        // Reward points
  referralCode: string,  // Unique referral code
  createdAt: timestamp
}
```

### Transactions Collection
```javascript
{
  userId: string,
  type: "credit" | "debit",
  amount: number,
  description: string,
  timestamp: timestamp
}
```

### CheckIns Collection
```javascript
{
  userId: string,
  date: date,
  pointsEarned: number,
  timestamp: timestamp
}
```

## 🎮 Testing the App

### 1. Create an Account
- Go to http://localhost:3000
- Click "Sign Up"
- Fill in details (use BUK for university)
- Create account

### 2. Daily Check-In
- Click "Check In Now" on dashboard
- Earn 10 points
- Check again next day for streak

### 3. Referral
- Share your referral code with friends
- They sign up using your code
- Both earn bonus points

### 4. Admin Access
- Login with your account
- Navigate to `/admin` to see all users
- View platform statistics

## 💰 Cost Estimates

**MVP Development**: ~$30K
**First Year Operations**: ~$100K (including dev, ops, marketing)
**At Scale (10K users)**: $972-1,755/month operations

See `HASKE_BUILD_AND_COST_GUIDE.md` for detailed breakdown.

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
# Push to GitHub, connect to Vercel
# Auto-deploys on git push
```

### Backend (Firebase)
- Firestore rules configured automatically
- Cloud Functions ready for deployment
- No additional setup needed

## 📱 Features by Sprint

| Sprint | Feature | Status |
|--------|---------|--------|
| 1 | Landing Page | ✅ Done |
| 1 | SignUp Form | ✅ Done |
| 2 | Login System | ✅ Done |
| 2 | Dashboard | ✅ Done |
| 3 | Wallet | ✅ Done |
| 3 | Transactions | ✅ Done |
| 4 | Daily Check-in | ✅ Done |
| 4 | Referral Code | ✅ Done |
| 4 | Admin Portal | ✅ Done |

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -m "Add feature"`
3. Push to branch: `git push origin feature/name`
4. Create Pull Request

## 📝 Environment Variables

See `.env.example` for all required variables.

## 🐛 Troubleshooting

### Firebase connection issues
- Check `.env` file has correct credentials
- Verify Firebase project is active
- Check Firestore is in production mode

### Port 3000 already in use
```bash
npm run dev -- --port 3001
```

### Build errors
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📞 Support

For issues and questions:
- Check the Build & Cost Guide for implementation details
- Review Firebase documentation: https://firebase.google.com/docs
- See Vite docs: https://vitejs.dev

## 📄 License

ISC

---

**Next Steps:**
1. Set up Firebase credentials
2. Configure `.env` file
3. Run `npm run dev` to start development
4. Begin testing and iteration

**Build Progress:**
- ✅ Phase 1: MVP Complete (Sprints 1-4)
- ⏳ Phase 2: Core Features (Sprints 5-6)
- ⏳ Phase 3: Scale & Optimize (Sprints 7+)

**Estimated Completion:** 8 weeks for MVP
