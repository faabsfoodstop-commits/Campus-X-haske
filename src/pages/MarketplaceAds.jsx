import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Button from '../components/Button';
import { IconArrowLeft } from '../components/Icons';

export default function MarketplaceAds() {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [filteredAds, setFilteredAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [universities, setUniversities] = useState([]);

  const categories = ['All', 'Books', 'Electronics', 'Housing', 'Services', 'Tutoring', 'Jobs', 'Other'];

  useEffect(() => {
    fetchAdsAndUniversities();
  }, []);

  useEffect(() => {
    filterAds();
  }, [ads, selectedCategory, selectedUniversity]);

  const fetchAdsAndUniversities = async () => {
    try {
      const adsQuery = query(
        collection(db, 'user_ads'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      const adsSnap = await getDocs(adsQuery);
      const adsData = adsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setAds(adsData);

      // Get unique universities
      const uniqueUnis = [...new Set(adsData.map(ad => ad.university))];
      setUniversities(uniqueUnis.sort());

      setLoading(false);
    } catch (err) {
      console.error('Error fetching ads:', err);
      setLoading(false);
    }
  };

  const filterAds = () => {
    let filtered = ads;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ad => ad.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (selectedUniversity !== 'all') {
      filtered = filtered.filter(ad => ad.university === selectedUniversity);
    }

    setFilteredAds(filtered);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading marketplace ads...</div>;
  }

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
              <h1 className="text-2xl font-bold text-primary">Campus Marketplace - Ads</h1>
            </div>
            <Button
              onClick={() => navigate('/my-ads')}
              variant="primary"
              size="md"
            >
              + Post Your Ad
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="font-bold text-gray-800 mb-4">Filter Ads</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-gray-700 font-semibold mb-3">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat.toLowerCase())}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      (selectedCategory === cat.toLowerCase() || (selectedCategory === 'all' && cat === 'All'))
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* University Filter */}
            <div>
              <label className="block text-gray-700 font-semibold mb-3">University</label>
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Universities</option>
                {universities.map((uni) => (
                  <option key={uni} value={uni}>
                    {uni}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 font-semibold">
            Showing {filteredAds.length} ad{filteredAds.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Ads Grid */}
        {filteredAds.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg mb-4">No ads found matching your filters</p>
            <Button
              onClick={() => navigate('/my-ads')}
              variant="primary"
            >
              Post an Ad →
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAds.map((ad) => (
              <div
                key={ad.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
              >
                {/* Ad Header */}
                <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-4">
                  <h3 className="text-lg font-bold mb-1">{ad.title}</h3>
                  <p className="text-sm text-blue-100">{ad.category}</p>
                </div>

                {/* Ad Body */}
                <div className="p-4">
                  <p className="text-gray-700 text-sm mb-3 line-clamp-3">{ad.description}</p>

                  {/* Price */}
                  {ad.price && (
                    <div className="bg-green-50 rounded p-3 mb-3">
                      <p className="text-2xl font-bold text-green-600">₦{ad.price.toLocaleString()}</p>
                    </div>
                  )}

                  {/* University Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block bg-blue-100 text-primary px-2 py-1 rounded text-xs font-semibold">
                      📍 {ad.university}
                    </span>
                    {ad.department && (
                      <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">
                        {ad.department}
                      </span>
                    )}
                  </div>

                  {/* Contact Info */}
                  {(ad.contactPhone || ad.contactEmail) && (
                    <div className="bg-gray-50 rounded p-3 mb-4">
                      {ad.contactPhone && (
                        <p className="text-sm text-gray-700">
                          <strong>Phone:</strong> {ad.contactPhone}
                        </p>
                      )}
                      {ad.contactEmail && (
                        <p className="text-sm text-gray-700">
                          <strong>Email:</strong> {ad.contactEmail}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Posted By */}
                  <p className="text-xs text-gray-500 mb-4">
                    Posted by {ad.userName} on {new Date(ad.createdAt?.toDate?.() || ad.createdAt).toLocaleDateString()}
                  </p>

                  {/* Action Button */}
                  <Button
                    onClick={() => {
                      if (ad.contactPhone) {
                        window.location.href = `tel:${ad.contactPhone}`;
                      } else if (ad.contactEmail) {
                        window.location.href = `mailto:${ad.contactEmail}`;
                      }
                    }}
                    variant="primary"
                    fullWidth
                  >
                    Contact Seller
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
