import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { useConfirm } from '../hooks/useConfirm';
import { IconArrowLeft, IconCheckmark, IconX, IconTrash } from '../components/Icons';

export default function AdminAdModeration() {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [selectedAds, setSelectedAds] = useState(new Set());
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedAdId, setSelectedAdId] = useState(null);
  const { alert: showAlert, modal, closeModal } = useConfirm();

  const REJECTION_REASONS = [
    'Inappropriate content',
    'Spam or duplicate',
    'Invalid contact information',
    'Prohibited items',
    'Poor quality image',
    'Misleading description',
    'Other'
  ];

  useEffect(() => {
    fetchAds();
  }, [filter]);

  const fetchAds = async () => {
    try {
      const adsRef = collection(db, 'user_ads');
      let q;

      if (filter === 'all') {
        q = query(adsRef, orderBy('createdAt', 'desc'));
      } else {
        q = query(
          adsRef,
          where('status', '==', filter),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const adsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setAds(adsData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching ads:', err);
      setLoading(false);
    }
  };

  const handleApprove = async (adId) => {
    try {
      await updateDoc(doc(db, 'user_ads', adId), {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: auth.currentUser?.uid
      });
      await fetchAds();
      await showAlert({
        title: 'Approved',
        message: 'Ad has been approved and is now live.',
        type: 'success'
      });
    } catch (err) {
      console.error('Error approving ad:', err);
      await showAlert({
        title: 'Error',
        message: 'Failed to approve ad.',
        type: 'error'
      });
    }
  };

  const handleReject = async (adId) => {
    if (!rejectionReason) {
      await showAlert({
        title: 'Reason Required',
        message: 'Please select a rejection reason.',
        type: 'error'
      });
      return;
    }

    try {
      await updateDoc(doc(db, 'user_ads', adId), {
        status: 'rejected',
        rejectionReason,
        reviewedAt: new Date(),
        reviewedBy: auth.currentUser?.uid
      });

      setRejectionReason('');
      setSelectedAdId(null);
      await fetchAds();
      await showAlert({
        title: 'Rejected',
        message: 'Ad has been rejected. User will be notified.',
        type: 'success'
      });
    } catch (err) {
      console.error('Error rejecting ad:', err);
      await showAlert({
        title: 'Error',
        message: 'Failed to reject ad.',
        type: 'error'
      });
    }
  };

  const handleDelete = async (adId) => {
    if (!window.confirm('Permanently delete this ad?')) return;

    try {
      await deleteDoc(doc(db, 'user_ads', adId));
      await fetchAds();
      await showAlert({
        title: 'Deleted',
        message: 'Ad has been permanently deleted.',
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

  const handleBulkApprove = async () => {
    if (selectedAds.size === 0) {
      await showAlert({
        title: 'Select Ads',
        message: 'Please select ads to approve.',
        type: 'error'
      });
      return;
    }

    try {
      for (const adId of selectedAds) {
        await updateDoc(doc(db, 'user_ads', adId), {
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: auth.currentUser?.uid
        });
      }
      setSelectedAds(new Set());
      await fetchAds();
      await showAlert({
        title: 'Approved',
        message: `${selectedAds.size} ads approved successfully.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error bulk approving:', err);
    }
  };

  const toggleAdSelection = (adId) => {
    const newSelected = new Set(selectedAds);
    if (newSelected.has(adId)) {
      newSelected.delete(adId);
    } else {
      newSelected.add(adId);
    }
    setSelectedAds(newSelected);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  const pendingCount = ads.filter(ad => ad.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                <IconArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-primary">Ad Moderation</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded p-4">
            <p className="text-yellow-700 text-sm font-semibold">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
          <div className="bg-green-50 border-l-4 border-green-500 rounded p-4">
            <p className="text-green-700 text-sm font-semibold">Approved</p>
            <p className="text-3xl font-bold text-green-600">
              {ads.filter(ad => ad.status === 'approved').length}
            </p>
          </div>
          <div className="bg-red-50 border-l-4 border-red-500 rounded p-4">
            <p className="text-red-700 text-sm font-semibold">Rejected</p>
            <p className="text-3xl font-bold text-red-600">
              {ads.filter(ad => ad.status === 'rejected').length}
            </p>
          </div>
          <div className="bg-blue-50 border-l-4 border-primary rounded p-4">
            <p className="text-primary text-sm font-semibold">Total Reviewed</p>
            <p className="text-3xl font-bold text-primary">
              {ads.filter(ad => ad.reviewedAt).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-800 hover:bg-gray-100 border-2 border-primary'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Bulk Actions */}
        {selectedAds.size > 0 && (
          <div className="bg-blue-50 border-l-4 border-primary rounded-lg p-4 mb-6 flex justify-between items-center">
            <p className="text-primary font-semibold">{selectedAds.size} ads selected</p>
            <div className="flex gap-3">
              <Button
                onClick={handleBulkApprove}
                variant="primary"
                size="sm"
              >
                Bulk Approve
              </Button>
              <Button
                onClick={() => setSelectedAds(new Set())}
                variant="secondary"
                size="sm"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* Ads List */}
        {ads.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">
              {filter === 'pending' ? 'No pending ads to review' : `No ${filter} ads`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
              >
                <div className="flex gap-4">
                  {/* Checkbox */}
                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      checked={selectedAds.has(ad.id)}
                      onChange={() => toggleAdSelection(ad.id)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-800">{ad.title}</h3>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusBadge(ad.status)}`}>
                            {ad.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{ad.category}</p>
                      </div>
                      {ad.price && (
                        <p className="text-2xl font-bold text-primary">₦{ad.price.toLocaleString()}</p>
                      )}
                    </div>

                    <p className="text-gray-700 mb-3 line-clamp-2">{ad.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Posted by</p>
                        <p className="font-semibold text-gray-800">{ad.userName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">University</p>
                        <p className="font-semibold text-gray-800">{ad.university}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Posted</p>
                        <p className="font-semibold text-gray-800">
                          {new Date(ad.createdAt?.toDate?.() || ad.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Contact</p>
                        <p className="font-semibold text-gray-800">{ad.contactPhone || ad.contactEmail || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Rejection Reason Display */}
                    {ad.rejectionReason && (
                      <div className="bg-red-50 border-l-4 border-red-500 rounded p-3 mb-4">
                        <p className="text-sm text-red-600">
                          <strong>Reason:</strong> {ad.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {ad.status === 'pending' && (
                      <div className="space-y-3">
                        {selectedAdId === ad.id && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                              Rejection Reason
                            </label>
                            <select
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="">Select a reason</option>
                              {REJECTION_REASONS.map((reason) => (
                                <option key={reason} value={reason}>
                                  {reason}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleApprove(ad.id)}
                            variant="primary"
                            size="sm"
                          >
                            <IconCheckmark className="w-4 h-4 inline mr-1" />
                            Approve
                          </Button>

                          {selectedAdId === ad.id ? (
                            <>
                              <Button
                                onClick={() => handleReject(ad.id)}
                                variant="danger"
                                size="sm"
                              >
                                <IconX className="w-4 h-4 inline mr-1" />
                                Confirm Reject
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedAdId(null);
                                  setRejectionReason('');
                                }}
                                variant="secondary"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => setSelectedAdId(ad.id)}
                              variant="secondary"
                              size="sm"
                            >
                              <IconX className="w-4 h-4 inline mr-1" />
                              Reject
                            </Button>
                          )}

                          <Button
                            onClick={() => handleDelete(ad.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <IconTrash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal {...modal} onClose={closeModal} />
    </div>
  );
}
