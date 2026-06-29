import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { useConfirm } from '../hooks/useConfirm';
import { NIGERIAN_UNIVERSITIES, DEPARTMENTS_BY_UNIVERSITY } from '../constants/universities';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { alert: showAlert, modal, closeModal } = useConfirm();

  const isProfileComplete = userData?.university && userData?.department && userData?.course;
  const availableDepartments = formData.university ? (DEPARTMENTS_BY_UNIVERSITY[formData.university] || []) : [];

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          setFormData(userDoc.data());
        }
        setUser(auth.currentUser);
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
      await showAlert({
        title: 'Incomplete Profile',
        message: 'Please fill in all required fields: Full Name, University, Department, and Course.',
        type: 'error'
      });
      return;
    }

    setIsSaving(true);
    try {
      if (formData.fullName !== user.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: formData.fullName,
        });
      }

      const profileWasIncomplete = !isProfileComplete;
      const bonusPoints = profileWasIncomplete ? 1000 : 0;

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        fullName: formData.fullName,
        university: formData.university,
        department: formData.department,
        course: formData.course,
        profileComplete: true,
        profileCompletedAt: profileWasIncomplete ? new Date() : userData?.profileCompletedAt,
        points: (userData?.points || 0) + bonusPoints,
      });

      const updatedData = {
        ...formData,
        profileComplete: true,
        points: (userData?.points || 0) + bonusPoints,
      };
      setUserData(updatedData);
      setEditing(false);

      await showAlert({
        title: 'Success',
        message: profileWasIncomplete
          ? `Profile completed! You earned 1,000 bonus points! 🎉`
          : 'Your profile has been updated successfully!',
        type: 'success'
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      await showAlert({
        title: 'Error',
        message: 'Failed to update profile. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
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

          <div className="space-y-6">
            {/* Full Name */}
            <div>
              {editing ? (
                <Input
                  label="Full Name *"
                  type="text"
                  name="fullName"
                  value={formData.fullName || ''}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              ) : (
                <>
                  <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
                  <p className="text-gray-600">{userData?.fullName || user?.displayName}</p>
                </>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Email</label>
              <p className="text-gray-600">{userData?.email || user?.email}</p>
            </div>

            {/* University */}
            <div>
              {editing ? (
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
              ) : (
                <>
                  <label className="block text-gray-700 font-semibold mb-2">University</label>
                  <p className="text-gray-600">
                    {userData?.university
                      ? NIGERIAN_UNIVERSITIES.find(u => u.code === userData.university)?.name || userData.university
                      : 'Not set'}
                  </p>
                </>
              )}
            </div>

            {/* Department */}
            <div>
              {editing ? (
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
              ) : (
                <>
                  <label className="block text-gray-700 font-semibold mb-2">Department</label>
                  <p className="text-gray-600">{userData?.department || 'Not set'}</p>
                </>
              )}
            </div>

            {/* Course */}
            <div>
              {editing ? (
                <Input
                  label="Course/Level *"
                  type="text"
                  name="course"
                  value={formData.course || ''}
                  onChange={handleChange}
                  placeholder="e.g., 300L, 2nd Year"
                />
              ) : (
                <>
                  <label className="block text-gray-700 font-semibold mb-2">Course/Level</label>
                  <p className="text-gray-600">{userData?.course || 'Not set'}</p>
                </>
              )}
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

            {/* Actions */}
            {editing && (
              <div className="flex gap-4 pt-6">
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
            )}
          </div>
        </div>
      </div>
      <Modal {...modal} onClose={closeModal} />
    </div>
  );
}
