import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { useConfirm } from '../hooks/useConfirm';
import { NIGERIAN_UNIVERSITIES } from '../constants/universities';

export default function SignUp() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    university: NIGERIAN_UNIVERSITIES[0]?.code || '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');
  const { modal, closeModal } = useConfirm();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      const newUserId = authData.user.id;
      const myReferralCode = newUserId.substring(0, 8).toUpperCase();

      // Create user row (trigger may not exist; upsert is safe either way)
      await supabase.from('users').upsert({
        id: newUserId,
        email: formData.email,
        full_name: formData.fullName,
        university: formData.university,
        referral_code: myReferralCode,
        points: 0,
        wallet: 0,
        current_streak: 0,
        weekly_points: 0,
        monthly_points: 0,
        profile_complete: false,
      }, { onConflict: 'id' });

      // If signed up via referral link, create the referral record
      if (refCode) {
        try {
          const { data: referrer } = await supabase
            .from('users')
            .select('id')
            .eq('referral_code', refCode.toUpperCase())
            .maybeSingle();

          if (referrer && referrer.id !== newUserId) {
            await supabase.from('referrals').insert({
              referrer_id: referrer.id,
              referee_id: newUserId,
              referee_name: formData.fullName,
              referee_email: formData.email,
              reward: 500,
              points_awarded: false,
            });
          }
        } catch (refErr) {
          console.warn('Referral creation failed (non-critical):', refErr);
        }
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-primary mb-6">HASKE</h2>

        <h3 className="text-2xl font-bold text-gray-800 mb-6">Create Account</h3>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            placeholder="Your full name"
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="your@email.com"
          />

          <div>
            <label className="block text-gray-700 font-medium mb-2">University</label>
            <select
              name="university"
              value={formData.university}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="">Select a university</option>
              {NIGERIAN_UNIVERSITIES.map((uni) => (
                <option key={uni.code} value={uni.code}>
                  {uni.name} ({uni.code})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Create a password"
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
            error={formData.password !== formData.confirmPassword && formData.confirmPassword ? 'Passwords do not match' : ''}
            state={formData.password !== formData.confirmPassword && formData.confirmPassword ? 'error' : ''}
          />

          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            variant="primary"
            size="md"
            fullWidth
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-blue-600 font-semibold">
            Login
          </Link>
        </p>
      </div>
      <Modal {...modal} onClose={closeModal} />
    </div>
  );
}
