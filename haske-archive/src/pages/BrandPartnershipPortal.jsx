import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { IconArrowLeft, IconTrendingUp, IconCheckmark } from '../components/Icons';

export default function BrandPartnershipPortal() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    fetchUserAndCampaigns();
  }, []);

  const fetchUserAndCampaigns = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!user?.is_admin) { navigate('/dashboard'); return; }

      if (user) {
        setUserData(user);
      }

      const { data: campaignsData, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(campaignsData || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  const totalRevenue = campaigns.reduce((sum, camp) => sum + (camp.revenue || 0), 0);
  const totalParticipants = campaigns.reduce((sum, camp) => sum + (camp.participants || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded transition"
            >
              <IconArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-primary">Brand Partnership Portal</h1>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Revenue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Monthly Revenue</p>
            <p className="text-3xl font-bold text-green-600">₦{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">From {campaigns.length} active campaigns</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Participants</p>
            <p className="text-3xl font-bold text-primary">{totalParticipants.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">Engaged users</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Avg. Campaign ROI</p>
            <p className="text-3xl font-bold text-blue-600">285%</p>
            <p className="text-xs text-gray-500 mt-2">Industry benchmark</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-l-4 border-purple-500 rounded-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Partnership Opportunity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-700 font-semibold mb-3">Expected Monthly Revenue</p>
              <p className="text-4xl font-bold text-green-600">₦200K - ₦500K</p>
              <p className="text-sm text-gray-600 mt-2">Based on user engagement and campaign performance</p>
            </div>
            <div>
              <p className="text-gray-700 font-semibold mb-3">Revenue Share Model</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ 60% Campus X retains</li>
                <li>✓ 40% distributed to participants</li>
                <li>✓ Transparent payment tracking</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Campaigns */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Active Campaigns</h2>

          {campaigns.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 text-lg">No active campaigns at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                  onClick={() => setSelectedCampaign(campaign)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{campaign.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                      </div>
                      <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Participants</p>
                        <p className="text-2xl font-bold text-primary">{campaign.participants || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Engagement</p>
                        <p className="text-2xl font-bold text-blue-600">{campaign.engagement || 0}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Revenue</p>
                        <p className="text-2xl font-bold text-green-600">₦{(campaign.revenue || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Duration</p>
                        <p className="text-2xl font-bold text-gray-800">{campaign.duration || '30'}d</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setSelectedCampaign(campaign)}
                        variant="primary"
                        size="md"
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => {}}
                        variant="secondary"
                        size="md"
                      >
                        Download Report
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Partnership Benefits */}
        <div className="bg-white rounded-lg shadow p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Why Partner With Campus X?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <IconCheckmark className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">High-Engagement Audience</h4>
                <p className="text-sm text-gray-600">500K+ active university students</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <IconTrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Verified ROI Tracking</h4>
                <p className="text-sm text-gray-600">Real-time analytics and performance metrics</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <IconCheckmark className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Transparent Payments</h4>
                <p className="text-sm text-gray-600">40% revenue shared directly with participants</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <IconTrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Growth Potential</h4>
                <p className="text-sm text-gray-600">Expanding to 58 Nigerian universities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Partnership Tier */}
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-l-4 border-primary rounded-lg p-8 mt-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Partnership Tiers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-bold text-gray-800 mb-3">Starter</h4>
              <p className="text-2xl font-bold text-green-600 mb-4">₦50K+</p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Single campaign</li>
                <li>✓ Up to 5K participants</li>
                <li>✓ Basic analytics</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 ring-2 ring-primary">
              <h4 className="font-bold text-gray-800 mb-3">Growth (Popular)</h4>
              <p className="text-2xl font-bold text-green-600 mb-4">₦200K+</p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Multiple campaigns</li>
                <li>✓ Up to 20K participants</li>
                <li>✓ Advanced analytics</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-bold text-gray-800 mb-3">Enterprise</h4>
              <p className="text-2xl font-bold text-green-600 mb-4">₦500K+</p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Unlimited campaigns</li>
                <li>✓ All universities</li>
                <li>✓ Dedicated account manager</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6">
              <h3 className="text-2xl font-bold">{selectedCampaign.name}</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">{selectedCampaign.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-xs text-gray-600 font-semibold">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">₦{(selectedCampaign.revenue || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-xs text-gray-600 font-semibold">Participants</p>
                  <p className="text-2xl font-bold text-primary">{selectedCampaign.participants || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-xs text-gray-600 font-semibold">Engagement Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedCampaign.engagement || 0}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-xs text-gray-600 font-semibold">Duration</p>
                  <p className="text-2xl font-bold text-gray-800">{selectedCampaign.duration || 30} days</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-bold text-gray-800 mb-3">Performance Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Conversion Rate</span>
                    <span className="font-bold text-gray-800">{selectedCampaign.conversionRate || 12}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg. Points Per User</span>
                    <span className="font-bold text-gray-800">₦{selectedCampaign.avgPoints || 500}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">User Acquisition Cost</span>
                    <span className="font-bold text-gray-800">₦{selectedCampaign.uac || 150}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setSelectedCampaign(null)}
                  variant="secondary"
                  fullWidth
                >
                  Close
                </Button>
                <Button
                  onClick={() => {}}
                  variant="primary"
                  fullWidth
                >
                  Download Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
