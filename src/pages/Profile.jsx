import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { supabase } from '../config/supabase';

const UNIVERSITIES = [
  'University of Lagos',
  'University of Ibadan',
  'Ahmadu Bello University',
  'Obafemi Awolowo University',
  'University of Nigeria',
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { addToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (profile) {
      setFullName(profile.full_name || '');
      setUniversity(profile.university || '');
      setDepartment(profile.department || '');
      setCourse(profile.course || '');
    }
  }, [user, profile, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!fullName || !university || !department || !course) {
      addToast('Please fill all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          university,
          department,
          course,
          profile_complete: true,
        })
        .eq('id', user.id);

      if (error) throw error;

      addToast('Profile saved successfully!', 'success');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      addToast(error.message || 'Failed to save profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">Complete Your Profile</h1>
          <p className="text-gray-600 mb-6">Tell us about yourself to get started</p>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">University</label>
              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select University</option>
                {UNIVERSITIES.map(uni => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Computer Science"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course / Level</label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="200L"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white font-bold py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {loading ? 'Saving...' : 'Continue to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
