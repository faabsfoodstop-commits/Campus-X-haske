import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/PrivateRoute';

import Landing from './pages/Landing';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import DailyCheckIn from './pages/DailyCheckIn';
import ActivityLog from './pages/ActivityLog';
import TransactionHistory from './pages/TransactionHistory';
import Wallet from './pages/Wallet';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/daily-check-in" element={<PrivateRoute><DailyCheckIn /></PrivateRoute>} />
            <Route path="/activity-log" element={<PrivateRoute><ActivityLog /></PrivateRoute>} />
            <Route path="/transactions" element={<PrivateRoute><TransactionHistory /></PrivateRoute>} />
            <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
