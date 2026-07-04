import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex flex-col justify-center items-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold text-white mb-6">HASKii</h1>
        <p className="text-xl text-purple-100 mb-8">Earn points. Spend wisely. Climb higher.</p>

        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-20">
          <h2 className="text-2xl font-bold text-white mb-6">Welcome</h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <span className="text-3xl">🎯</span>
              <div className="text-left">
                <p className="font-semibold text-white">Earn Daily</p>
                <p className="text-sm text-purple-100">Check in, complete tasks, watch ads</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <span className="text-3xl">💰</span>
              <div className="text-left">
                <p className="font-semibold text-white">Spend Points</p>
                <p className="text-sm text-purple-100">Redeem for airtime, data, gift cards</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <span className="text-3xl">👥</span>
              <div className="text-left">
                <p className="font-semibold text-white">Earn Referrals</p>
                <p className="text-sm text-purple-100">Invite friends, get bonuses</p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => navigate('/signup')}
              className="w-full bg-white text-purple-600 font-bold py-3 rounded-lg hover:bg-opacity-90 transition"
            >
              Sign Up
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full border-2 border-white text-white font-bold py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
