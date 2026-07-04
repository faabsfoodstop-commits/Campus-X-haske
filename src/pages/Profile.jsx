import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import Input from '../components/Input';
import { ToastContext } from '../context/ToastContext';
import { NIGERIAN_UNIVERSITIES, DEPARTMENTS_BY_UNIVERSITY } from '../constants/universities';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);

  const isProfileComplete = userData?.university && userData?.department && userData?.course;
  const availableDepartments = formData.university ? (DEPARTMENTS_BY_UNIVERSITY[formData.university] || []) : [];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) throw error;
        setUser(session.user);
        // Recover name saved at signup in case the initial DB row wasn't written
        const pendingName = sessionStorage.getItem('pendingFullName') || '';
        if (user) {
          const normalizedUser = {
            ...user,
            fullName: user.full_name || pendingName,
            email: user.email || session.user.email
          };
          setUserData(normalizedUser);
          setFormData(normalizedUser);
        } else {
          // New user — no DB row yet; open edit mode and pre-fill the name
          setFormData({ email: session.user.email, fullName: pendingName });
          setEditing(true);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'university') {
        updated.department = '';
        updated.course = '';
      }
      if (name === 'department') {
        updated.course = '';
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!formData.fullName?.trim() || !formData.university || !formData.department || !formData.course) {
      addToast('Please fill in all required fields: Full Name, University, Department, and Course.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const profileWasIncomplete = !isProfileComplete;

      // Determine if bonus should be awarded (check before touching any rows)
      let bonusPoints = 0;
      if (profileWasIncomplete) {
        const { data: existingTask } = await supabase
          .from('getting_started_tasks')
          .select('id, points_awarded')
          .eq('user_id', session.user.id)
          .eq('task_id', 'profile')
          .maybeSingle();
        if (!existingTask?.points_awarded) {
          bonusPoints = 1000;
        }
      }

      // Always fetch fresh user row so we have accurate points/wallet/streak values
      const { data: freshUser } = await supabase
        .from('users')
        .select('points, wallet, current_streak, referral_code')
        .eq('id', session.user.id)
        .maybeSingle();

      const currentPoints = freshUser?.points ?? 0;

      // One upsert: profile fields + points update — atomic, no separate UPDATE step
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: session.user.id,
          email: session.user.email,
          full_name: formData.fullName,
          university: formData.university,
          department: formData.department,
          course: formData.course,
          profile_complete: true,
          points: currentPoints + bonusPoints,
          wallet: freshUser?.wallet ?? 0,
          current_streak: freshUser?.current_streak ?? 0,
          referral_code: freshUser?.referral_code || session.user.id.substring(0, 8).toUpperCase(),
        }, { onConflict: 'id' });
      if (upsertError) throw upsertError;

      // Verify the write actually landed — RLS can silently no-op an update
      const { data: savedRow, error: verifyError } = await supabase
        .from('users')
        .select('full_name, university, department, course, points')
        .eq('id', session.user.id)
        .single();
      if (verifyError) throw verifyError;
      if (savedRow?.full_name !== formData.fullName || savedRow?.university !== formData.university) {
        throw new Error('Profile save did not persist. Please try again or contact support.');
      }

      // Record the bonus task + transaction now that the points are committed
      let bonusAwarded = false;
      if (bonusPoints > 0) {
        try {
          const { error: taskInsertError } = await supabase
            .from('getting_started_tasks')
            .insert({
              user_id: session.user.id,
              task_id: 'profile',
              task_name: 'Complete Your Profile',
              reward_points: 1000,
              completed: true,
              completed_at: new Date().toISOString(),
              points_awarded: true,
            });

          if (!taskInsertError) {
            await supabase.from('transactions').insert({
              user_id: session.user.id,
              type: 'getting_started',
              amount: 1000,
              description: 'Getting Started: Complete Your Profile',
              timestamp: new Date().toISOString(),
            });
            bonusAwarded = true;
          }
        } catch (err) {
          console.error('Error recording profile bonus (non-fatal):', err);
        }
      }

      sessionStorage.removeItem('pendingFullName');

      const updatedData = {
        ...userData,
        full_name: formData.fullName,
        fullName: formData.fullName,
        university: formData.university,
        department: formData.department,
        course: formData.course,
        profile_complete: true,
        points: savedRow?.points ?? currentPoints + bonusPoints,
      };
      setUserData(updatedData);
      setFormData(updatedData);
      setEditing(false);
      setIsSaving(false);
      addToast(
        bonusAwarded
          ? 'Profile completed! You earned 1,000 bonus points!'
          : 'Profile updated successfully!',
        'success'
      );
    } catch (err) {
      console.error('Error updating profile:', err);
      setIsSaving(false);
      addToast(err.message || 'Failed to update profile. Please try again.', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary">HASKE</h1>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-primary"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/wallet')}
                className="text-gray-600 hover:text-primary"
              >
                Wallet
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Status */}
        {isProfileComplete && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
            <p className="text-green-700 font-semibold">✓ Profile Complete</p>
            <p className="text-sm text-green-600">Your profile is fully set up. You can now access all features!</p>
          </div>
        )}

        {!isProfileComplete && !editing && (
          <div className="bg-blue-50 border-l-4 border-primary rounded-lg p-4 mb-6">
            <p className="text-primary font-semibold">Complete Your Profile</p>
            <p className="text-sm text-blue-600">Add university, department, and course details to unlock all features and earn 1,000 bonus points!</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">My Profile</h2>
            {!editing && (
              <Button
                onClick={() => setEditing(true)}
                variant="primary"
                size="md"
              >
                Edit Profile
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-6">
              {/* Full Name */}
              <Input
                label="Full Name *"
                type="text"
                name="fullName"
                value={formData.fullName || ''}
                onChange={handleChange}
                placeholder="Enter your full name"
              />

              {/* Email (read-only in edit) */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email</label>
                <p className="text-gray-600">{userData?.email || user?.email}</p>
              </div>

              {/* University */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">University *</label>
                <select
                  name="university"
                  value={formData.university || ''}
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

              {/* Department */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Department *</label>
                <select
                  name="department"
                  value={formData.department || ''}
                  onChange={handleChange}
                  disabled={!formData.university}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {formData.university ? 'Select a department' : 'Select university first'}
                  </option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course */}
              <Input
                label="Course/Level *"
                type="text"
                name="course"
                value={formData.course || ''}
                onChange={handleChange}
                placeholder="e.g., 300L, 2nd Year"
              />

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t">
                <Button
                  onClick={handleSave}
                  variant="primary"
                  size="md"
                  loading={isSaving}
                >
                  Save Changes
                </Button>
                <Button
                  onClick={() => {
                    setEditing(false);
                    setFormData(userData);
                  }}
                  variant="secondary"
                  size="md"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
                <p className="text-gray-600">{userData?.fullName || userData?.full_name || 'Not set'}</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email</label>
                <p className="text-gray-600">{userData?.email || user?.email}</p>
              </div>

              {/* University */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">University</label>
                <p className="text-gray-600">
                  {userData?.university
                    ? NIGERIAN_UNIVERSITIES.find(u => u.code === userData.university)?.name || userData.university
                    : 'Not set'}
                </p>
              </div>

              {/* Department */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Department</label>
                <p className="text-gray-600">{userData?.department || 'Not set'}</p>
              </div>

              {/* Course */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Course/Level</label>
                <p className="text-gray-600">{userData?.course || 'Not set'}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 pt-6 border-t">
                <div>
                  <p className="text-gray-500 text-sm">Total Points</p>
                  <p className="text-2xl font-bold text-primary">{userData?.points || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Wallet Balance</p>
                  <p className="text-2xl font-bold text-primary">₦{userData?.wallet || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
