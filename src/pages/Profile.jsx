import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { useConfirm } from '../hooks/useConfirm';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { alert: showAlert, modal, closeModal } = useConfirm();

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (formData.fullName !== user.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: formData.fullName,
        });
      }

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        fullName: formData.fullName,
        university: formData.university,
      });

      setUserData(formData);
      setEditing(false);
      await showAlert({
        title: 'Success',
        message: 'Your profile has been updated successfully!',
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
            <div>
              {editing ? (
                <Input
                  label="Full Name"
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

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Email</label>
              <p className="text-gray-600">{userData?.email || user?.email}</p>
            </div>

            <div>
              {editing ? (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">University</label>
                  <select
                    name="university"
                    value={formData.university || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  >
                    <option value="">Select a university</option>
                    <option value="BUK">Bayero University Kano (BUK)</option>
                    <option value="ABU">Ahmadu Bello University (ABU)</option>
                    <option value="OAU">Obafemi Awolowo University (OAU)</option>
                    <option value="UNILAG">University of Lagos (UNILAG)</option>
                  </select>
                </div>
              ) : (
                <>
                  <label className="block text-gray-700 font-semibold mb-2">University</label>
                  <p className="text-gray-600">{userData?.university}</p>
                </>
              )}
            </div>

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
