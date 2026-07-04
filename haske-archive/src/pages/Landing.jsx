import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-secondary">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary">HASKE</h1>
            <div className="flex gap-4">
              <Link to="/login" className="text-primary hover:text-secondary">
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-5xl font-bold text-white mb-6">
          The Operating System for Campus Life
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Connect with students, access opportunities, earn rewards, and manage
          your campus experience all in one place.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            to="/signup"
            className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100"
          >
            Get Started
          </Link>
          <a
            href="#features"
            className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition"
          >
            Learn More
          </a>
        </div>

        <div id="features" className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold text-primary mb-2">Earn Rewards</h3>
            <p className="text-gray-600">
              Get points for daily check-ins, referrals, and completing tasks.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold text-primary mb-2">Secure Wallet</h3>
            <p className="text-gray-600">
              Manage your funds safely with our blockchain-backed wallet system.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold text-primary mb-2">Campus Market</h3>
            <p className="text-gray-600">
              Buy, sell, and trade with other students in your campus.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
