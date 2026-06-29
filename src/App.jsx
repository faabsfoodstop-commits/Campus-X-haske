import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from './config/firebase';

import Landing from './pages/Landing';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Wallet from './pages/Wallet';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import SpinWheel from './pages/SpinWheel';
import DailyMissions from './pages/DailyMissions';
import Trivia from './pages/Trivia';
import Achievements from './pages/Achievements';
import VideoAds from './pages/VideoAds';
import InstagramFollow from './pages/InstagramFollow';
import Referrals from './pages/Referrals';
import Leaderboards from './pages/Leaderboards';
import Rewards from './pages/Rewards';
import AdminRedemptions from './pages/AdminRedemptions';

function PrivateRoute({ children, user }) {
  return user ? children : <Navigate to="/login" />;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={<PrivateRoute user={user}><Dashboard /></PrivateRoute>}
        />
        <Route
          path="/wallet"
          element={<PrivateRoute user={user}><Wallet /></PrivateRoute>}
        />
        <Route
          path="/profile"
          element={<PrivateRoute user={user}><Profile /></PrivateRoute>}
        />
        <Route
          path="/admin"
          element={<PrivateRoute user={user}><Admin /></PrivateRoute>}
        />
        <Route
          path="/spin-wheel"
          element={<PrivateRoute user={user}><SpinWheel /></PrivateRoute>}
        />
        <Route
          path="/daily-missions"
          element={<PrivateRoute user={user}><DailyMissions /></PrivateRoute>}
        />
        <Route
          path="/trivia"
          element={<PrivateRoute user={user}><Trivia /></PrivateRoute>}
        />
        <Route
          path="/achievements"
          element={<PrivateRoute user={user}><Achievements /></PrivateRoute>}
        />
        <Route
          path="/video-ads"
          element={<PrivateRoute user={user}><VideoAds /></PrivateRoute>}
        />
        <Route
          path="/instagram-follow"
          element={<PrivateRoute user={user}><InstagramFollow /></PrivateRoute>}
        />
        <Route
          path="/referrals"
          element={<PrivateRoute user={user}><Referrals /></PrivateRoute>}
        />
        <Route
          path="/leaderboards"
          element={<PrivateRoute user={user}><Leaderboards /></PrivateRoute>}
        />
        <Route
          path="/rewards"
          element={<PrivateRoute user={user}><Rewards /></PrivateRoute>}
        />
        <Route
          path="/admin/redemptions"
          element={<PrivateRoute user={user}><AdminRedemptions /></PrivateRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
