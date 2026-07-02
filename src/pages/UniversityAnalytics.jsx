import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { IconArrowLeft, IconTrendingUp, IconUsers } from '../components/Icons';
import { NIGERIAN_UNIVERSITIES } from '../constants/universities';

export default function UniversityAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('users'); // users, ads, engagement, revenue
  const [selectedUni, setSelectedUni] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const allUniversities = NIGERIAN_UNIVERSITIES.map(uni => uni.code);
      const analyticsData = [];

      for (const uniCode of allUniversities) {
        try {
          const { data: users } = await supabase
            .from('users')
            .select('id, profile_complete, points')
            .eq('university', uniCode);

          const { data: ads } = await supabase
            .from('user_ads')
            .select('id, status')
            .eq('university', uniCode);

          const userCount = users?.length || 0;
          const participantCount = users?.filter(u => (u.points || 0) > 0).length || 0;
          const adCount = ads?.length || 0;
          const approvedAds = ads?.filter(a => a.status === 'approved').length || 0;

          const engagementRate = userCount > 0 ? ((participantCount / userCount) * 100).toFixed(1) : 0;
          const revenuePotential = userCount > 100 ? Math.min(50000, 25000 + (userCount * 10)) : 25000;
          const profileCompleteCount = users?.filter(u => u.profile_complete).length || 0;
          const profileCompletionRate = userCount > 0 ? ((profileCompleteCount / userCount) * 100).toFixed(1) : 0;

          if (userCount > 0 || adCount > 0) {
            analyticsData.push({
              code: uniCode,
              name: NIGERIAN_UNIVERSITIES.find(u => u.code === uniCode)?.name || uniCode,
              users: userCount,
              activeUsers: participantCount,
              ads: adCount,
              approvedAds: approvedAds,
              engagementRate: parseFloat(engagementRate),
              profileCompletionRate: parseFloat(profileCompletionRate),
              revenuePotential: revenuePotential,
              pointsEarned: 0
            });
          }
        } catch (err) {
          // University has no data, skip
          continue;
        }
      }

      setAnalytics(analyticsData.sort((a, b) => b.users - a.users));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setLoading(false);
    }
  };

  const getSortedAnalytics = () => {
    const sorted = [...analytics];
    switch (sortBy) {
      case 'users':
        return sorted.sort((a, b) => b.users - a.users);
      case 'ads':
        return sorted.sort((a, b) => b.ads - a.ads);
      case 'engagement':
        return sorted.sort((a, b) => b.engagementRate - a.engagementRate);
      case 'revenue':
        return sorted.sort((a, b) => b.revenuePotential - a.revenuePotential);
      default:
        return sorted;
    }
  };

  const downloadReport = () => {
    const csv = [
      ['University', 'Users', 'Active Users', 'Ads', 'Engagement %', 'Profile Completion %', 'Revenue Potential'],
      ...getSortedAnalytics().map(uni => [
        uni.name,
        uni.users,
        uni.activeUsers,
        uni.ads,
        uni.engagementRate,
        uni.profileCompletionRate,
        `₦${uni.revenuePotential.toLocaleString()}`
      ])
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `university-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading analytics...</div>;
  }

  const totalUsers = analytics.reduce((sum, uni) => sum + uni.users, 0);
  const totalAds = analytics.reduce((sum, uni) => sum + uni.ads, 0);
  const totalRevenuePotential = analytics.reduce((sum, uni) => sum + uni.revenuePotential, 0);
  const activeUniversities = analytics.filter(uni => uni.users > 0).length;

  const sorted = getSortedAnalytics();
  const detailedUni = selectedUni ? analytics.find(u => u.code === selectedUni) : null;

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
              <h1 className="text-2xl font-bold text-primary">University Analytics</h1>
            </div>
            <Button
              onClick={downloadReport}
              variant="primary"
              size="md"
            >
              Download Report
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 border-l-4 border-primary rounded p-6">
            <p className="text-gray-600 text-sm font-semibold mb-1">Active Universities</p>
            <p className="text-3xl font-bold text-primary">{activeUniversities}</p>
            <p className="text-xs text-gray-500 mt-2">With users or ads</p>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-500 rounded p-6">
            <p className="text-gray-600 text-sm font-semibold mb-1">Total Users</p>
            <p className="text-3xl font-bold text-purple-600">{totalUsers.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">Across all universities</p>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 rounded p-6">
            <p className="text-gray-600 text-sm font-semibold mb-1">Total Ads Posted</p>
            <p className="text-3xl font-bold text-green-600">{totalAds.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">Ad marketplace activity</p>
          </div>

          <div className="bg-orange-50 border-l-4 border-orange-500 rounded p-6">
            <p className="text-gray-600 text-sm font-semibold mb-1">Revenue Potential</p>
            <p className="text-3xl font-bold text-orange-600">₦{(totalRevenuePotential / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500 mt-2">From partnerships</p>
          </div>
        </div>

        {/* Filters & Sort */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {['users', 'ads', 'engagement', 'revenue'].map(sort => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                sortBy === sort
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-800 hover:bg-gray-100 border-2 border-primary'
              }`}
            >
              Sort by {sort.charAt(0).toUpperCase() + sort.slice(1)}
            </button>
          ))}
        </div>

        {/* Universities Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6">
            <h3 className="text-2xl font-bold">Universities Performance</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">University</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Users</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Active</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ads</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Engagement</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Profile %</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Revenue Potential</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sorted.map((uni) => (
                  <tr key={uni.code} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">{uni.name}</td>
                    <td className="px-6 py-4 text-gray-600">{uni.users}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-semibold">
                        {uni.activeUsers}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {uni.ads} ({uni.approvedAds} approved)
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${Math.min(uni.engagementRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{uni.engagementRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">
                        {uni.profileCompletionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">
                      ₦{uni.revenuePotential.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedUni(uni.code)}
                        className="text-primary hover:text-blue-600 font-semibold text-sm"
                      >
                        Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Partnership Opportunities */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-l-4 border-purple-500 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Partnership Opportunities</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Tier 1 Universities</h4>
              <p className="text-sm text-gray-700 mb-3">500+ users, 50%+ engagement</p>
              <div className="space-y-1">
                {sorted.filter(u => u.users >= 500).slice(0, 3).map(u => (
                  <p key={u.code} className="text-sm font-semibold text-gray-800">
                    ✓ {u.name}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 mb-2">Growth Universities</h4>
              <p className="text-sm text-gray-700 mb-3">100-499 users, high potential</p>
              <div className="space-y-1">
                {sorted.filter(u => u.users >= 100 && u.users < 500).slice(0, 3).map(u => (
                  <p key={u.code} className="text-sm font-semibold text-gray-800">
                    ✓ {u.name}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 mb-2">Expansion Universities</h4>
              <p className="text-sm text-gray-700 mb-3">New markets, adoption potential</p>
              <div className="space-y-1">
                {sorted.filter(u => u.users < 100 && u.users > 0).slice(0, 3).map(u => (
                  <p key={u.code} className="text-sm font-semibold text-gray-800">
                    ✓ {u.name}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* University Details Modal */}
        {detailedUni && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6">
                <h3 className="text-2xl font-bold">{detailedUni.name}</h3>
                <button
                  onClick={() => setSelectedUni(null)}
                  className="absolute top-4 right-4 text-white hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-primary">{detailedUni.users}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Active Participants</p>
                    <p className="text-3xl font-bold text-green-600">{detailedUni.activeUsers}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Ads Posted</p>
                    <p className="text-3xl font-bold text-blue-600">{detailedUni.ads}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Approved Ads</p>
                    <p className="text-3xl font-bold text-orange-600">{detailedUni.approvedAds}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600 mb-2">Revenue Potential</p>
                  <p className="text-3xl font-bold text-primary">₦{detailedUni.revenuePotential.toLocaleString()}/month</p>
                  <p className="text-xs text-gray-500 mt-2">Estimated from partnership model</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setSelectedUni(null)}
                    variant="secondary"
                    fullWidth
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
