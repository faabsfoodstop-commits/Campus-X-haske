import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useConfirm } from '../hooks/useConfirm';
import { IconArrowLeft, IconTrash, IconEdit, IconEye, IconX } from '../components/Icons';

const AD_CATEGORIES = ['Books', 'Electronics', 'Housing', 'Services', 'Tutoring', 'Jobs', 'Other'];
const POSTING_COST = 500; // Points for non-premium users
const PREMIUM_FREE_ADS = 10; // Free ads per month for premium users
const AD_MODERATION_DAYS = 0.5; // 12 hours for new users

export default function UserAdsPosting() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [userAds, setUserAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingAdId, setEditingAdId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    image: '',
    contactPhone: '',
    contactEmail: ''
  });
  const { alert: showAlert, modal, closeModal } = useConfirm();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!userError && userData) {
        setUserData(userData);
      }

      const { data: adsData, error: adsError } = await supabase
        .from('user_ads')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!adsError && adsData) {
        setUserAds(adsData);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const canPostAd = () => {
    if (!userData?.profileComplete) {
      return { allowed: false, reason: 'Complete your profile first' };
    }

    const isPremium = userData?.premiumActive;
    const thisMonth = new Date();
    thisMonth.setDate(1);

    const adsThisMonth = userAds.filter(ad => {
      const adDate = new Date(ad.created_at);
      return adDate >= thisMonth;
    }).length;

    if (isPremium && adsThisMonth >= PREMIUM_FREE_ADS) {
      return { allowed: true, isPremium: true, needsPayment: true };
    }

    if (!isPremium && userData?.points < POSTING_COST) {
      return {
        allowed: false,
        reason: `Need ${POSTING_COST} points to post. You have ${userData?.points || 0}.`
      };
    }

    return { allowed: true, isPremium, needsPayment: false };
  };

  const handlePostAd = async () => {
    if (!formData.title?.trim() || !formData.description?.trim() || !formData.category) {
      await showAlert({
        title: 'Incomplete Form',
        message: 'Please fill in title, description, and category.',
        type: 'error'
      });
      return;
    }

    const permission = canPostAd();
    if (!permission.allowed) {
      await showAlert({
        title: 'Unable to Post',
        message: permission.reason,
        type: 'error'
      });
      return;
    }

    if (permission.needsPayment) {
      await showAlert({
        title: 'Payment Required',
        message: `You've posted ${PREMIUM_FREE_ADS} free ads this month. Additional ads cost ${POSTING_COST} points.`,
        type: 'error'
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const adData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: formData.price ? parseFloat(formData.price) : null,
        image: formData.image,
        contact_phone: formData.contactPhone,
        contact_email: formData.contactEmail,
        user_id: session.user.id,
        university: userData?.university,
        user_name: userData?.name,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      if (editingAdId) {
        await supabase
          .from('user_ads')
          .update(adData)
          .eq('id', editingAdId);
      } else {
        const { error: insertError } = await supabase
          .from('user_ads')
          .insert([adData]);

        if (insertError) throw insertError;

        if (!userData?.premiumActive) {
          await supabase
            .from('users')
            .update({ points: (userData?.points || 0) - POSTING_COST })
            .eq('id', session.user.id);
        }
      }

      await fetchUserData();
      setFormData({
        title: '',
        description: '',
        category: '',
        price: '',
        image: '',
        contactPhone: '',
        contactEmail: ''
      });
      setEditingAdId(null);
      setShowPostForm(false);

      await showAlert({
        title: 'Success',
        message: editingAdId ? 'Ad updated successfully!' : 'Ad posted successfully!',
        type: 'success'
      });
    } catch (err) {
      console.error('Error posting ad:', err);
      await showAlert({
        title: 'Error',
        message: err.message || 'Failed to post ad. Please try again.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAd = async (adId) => {
    try {
      await supabase
        .from('user_ads')
        .delete()
        .eq('id', adId);

      await fetchUserData();
      await showAlert({
        title: 'Deleted',
        message: 'Ad has been removed.',
        type: 'success'
      });
    } catch (err) {
      console.error('Error deleting ad:', err);
      await showAlert({
        title: 'Error',
        message: 'Failed to delete ad.',
        type: 'error'
      });
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  const permission = canPostAd();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/marketplace')}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                <IconArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-primary">My Ads</h1>
            </div>
            {permission.allowed && (
              <Button
                onClick={() => setShowPostForm(!showPostForm)}
                variant={showPostForm ? 'secondary' : 'primary'}
                size="md"
              >
                {showPostForm ? 'Cancel' : '+ Post New Ad'}
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Status Alert */}
        {!userData?.profileComplete && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4 mb-6">
            <p className="text-yellow-700 font-semibold">Complete Your Profile</p>
            <p className="text-sm text-yellow-600 mt-1">You must complete your profile (university, department, course) before posting ads.</p>
            <Button
              onClick={() => navigate('/profile')}
              variant="ghost"
              size="sm"
              className="text-yellow-600 hover:text-yellow-700 mt-2"
            >
              Complete Profile →
            </Button>
          </div>
        )}

        {/* Post Form */}
        {showPostForm && permission.allowed && (
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Post a New Ad</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What are you selling or offering?"
                  maxLength={100}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a category</option>
                  {AD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Price (₦)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your item or service in detail..."
                  maxLength={1000}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000</p>
              </div>

              {!userData?.premiumActive && (
                <div className="bg-blue-50 border-l-4 border-primary rounded p-4">
                  <p className="text-blue-700 font-semibold">Cost: {POSTING_COST} points</p>
                  <p className="text-sm text-blue-600">You have {userData?.points || 0} points available</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={handlePostAd}
                  variant="primary"
                  size="lg"
                  loading={submitting}
                  fullWidth
                >
                  Post Ad
                </Button>
                <Button
                  onClick={() => setShowPostForm(false)}
                  variant="secondary"
                  size="lg"
                  fullWidth
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {userData?.profileComplete && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500 text-sm">Active Ads</p>
              <p className="text-3xl font-bold text-primary">
                {userAds.filter(ad => ad.status === 'approved').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500 text-sm">Pending Moderation</p>
              <p className="text-3xl font-bold text-orange-600">
                {userAds.filter(ad => ad.status === 'pending').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500 text-sm">Total Contacts</p>
              <p className="text-3xl font-bold text-green-600">
                {userAds.reduce((sum, ad) => sum + (ad.contacts || 0), 0)}
              </p>
            </div>
          </div>
        )}

        {/* My Ads */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Your Ads</h2>
          {userAds.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 text-lg mb-4">You haven't posted any ads yet</p>
              {permission.allowed && (
                <Button
                  onClick={() => setShowPostForm(true)}
                  variant="primary"
                  size="lg"
                >
                  Post Your First Ad →
                </Button>
              )}
            </div>
          ) : (
            userAds.map((ad) => (
              <div
                key={ad.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{ad.title}</h3>
                      {ad.status === 'pending' && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-semibold">
                          Pending
                        </span>
                      )}
                      {ad.status === 'approved' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{ad.category}</p>
                    <p className="text-gray-700 line-clamp-2">{ad.description}</p>
                  </div>
                  {ad.price && (
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-primary">₦{ad.price.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 items-center pt-4 border-t">
                  <div className="flex gap-4 flex-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <IconEye className="w-4 h-4" />
                      {ad.views || 0} views
                    </span>
                    <span className="flex items-center gap-1">
                      {ad.contacts || 0} contacts
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setFormData({
                          title: ad.title,
                          description: ad.description,
                          category: ad.category,
                          price: ad.price?.toString() || '',
                          image: ad.image || '',
                          contactPhone: ad.contactPhone || '',
                          contactEmail: ad.contactEmail || ''
                        });
                        setEditingAdId(ad.id);
                        setShowPostForm(true);
                      }}
                      className="p-2 hover:bg-gray-100 rounded transition text-gray-600"
                    >
                      <IconEdit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAd(ad.id)}
                      className="p-2 hover:bg-red-50 rounded transition text-red-600"
                    >
                      <IconTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Modal {...modal} onClose={closeModal} />
    </div>
  );
}
