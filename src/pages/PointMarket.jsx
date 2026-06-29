import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function PointMarket() {
  const navigate = useNavigate();
  const [sellOrders, setSellOrders] = useState([]);
  const [buyOffers, setBuyOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      // Fetch active sell orders
      const sellQuery = query(
        collection(db, 'point_sell_orders'),
        where('status', '==', 'active'),
        orderBy('askPrice', 'asc')
      );
      const sellSnap = await getDocs(sellQuery);
      setSellOrders(sellSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch active buy offers
      const buyQuery = query(
        collection(db, 'point_buy_offers'),
        where('status', '==', 'active'),
        orderBy('offerPrice', 'desc')
      );
      const buySnap = await getDocs(buyQuery);
      setBuyOffers(buySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      setLoading(false);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setLoading(false);
    }
  };

  const getHighestBid = () => {
    return buyOffers.length > 0 ? buyOffers[0].offerPrice : null;
  };

  const getLowestAsk = () => {
    return sellOrders.length > 0 ? sellOrders[0].askPrice : null;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.toDate?.() || timestamp);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading market...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-primary"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-primary">Point Market</h1>
            </div>
            <button
              onClick={() => navigate('/sell-points')}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Sell Points
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 border-l-4 border-green-500 rounded p-6">
            <p className="text-gray-600 text-sm mb-2">Highest Bid</p>
            <p className="text-3xl font-bold text-green-600">
              {getHighestBid() ? `₦${getHighestBid().toFixed(2)}/pt` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Best offer to sell at</p>
          </div>

          <div className="bg-blue-50 border-l-4 border-primary rounded p-6">
            <p className="text-gray-600 text-sm mb-2">Mid Price</p>
            <p className="text-3xl font-bold text-primary">
              ₦0.45/pt
            </p>
            <p className="text-xs text-gray-500 mt-2">Average market rate</p>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 rounded p-6">
            <p className="text-gray-600 text-sm mb-2">Lowest Ask</p>
            <p className="text-3xl font-bold text-red-600">
              {getLowestAsk() ? `₦${getLowestAsk().toFixed(2)}/pt` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Best offer to buy at</p>
          </div>
        </div>

        {/* Market Info */}
        <div className="bg-blue-50 border-l-4 border-primary rounded-lg p-6 mb-8">
          <h3 className="font-bold text-gray-800 mb-2">How It Works</h3>
          <p className="text-gray-700 text-sm">
            Sell your earned points for cash or buy points from others at better rates than the platform.
            Orders update every 5 seconds. Tap an offer to complete a trade.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-semibold border-b-2 ${
              filter === 'all'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-primary'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilter('sell')}
            className={`px-4 py-2 font-semibold border-b-2 ${
              filter === 'sell'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-primary'
            }`}
          >
            Sell Orders ({sellOrders.length})
          </button>
          <button
            onClick={() => setFilter('buy')}
            className={`px-4 py-2 font-semibold border-b-2 ${
              filter === 'buy'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-primary'
            }`}
          >
            Buy Offers ({buyOffers.length})
          </button>
        </div>

        {/* Buy Offers */}
        {(filter === 'all' || filter === 'buy') && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">💰 Buy Offers</h2>
            {buyOffers.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <p className="text-gray-500">No active buy offers yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {buyOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-white rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                    onClick={() => navigate(`/sell-points?offerId=${offer.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3 mb-2">
                          <p className="text-lg font-bold text-gray-800">{offer.points.toLocaleString()} pts</p>
                          <p className="text-2xl font-bold text-green-600">₦{offer.offerPrice.toFixed(2)}/pt</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {offer.offeredBy === 'admin' ? '🏢 Official HASKE Offer' : `Offered ${formatDate(offer.createdAt)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-800">₦{(offer.points * offer.offerPrice).toLocaleString()}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/sell-points?offerId=${offer.id}`);
                          }}
                          className="text-primary hover:text-blue-600 text-sm font-semibold mt-2 transition"
                        >
                          Sell →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sell Orders */}
        {(filter === 'all' || filter === 'sell') && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">📈 Sell Orders</h2>
            {sellOrders.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <p className="text-gray-500 mb-4">No active sell orders yet</p>
                <button
                  onClick={() => navigate('/sell-points')}
                  className="text-primary hover:text-blue-600 font-semibold"
                >
                  Be the first to list →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sellOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                    onClick={() => navigate(`/point-market?orderId=${order.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3 mb-2">
                          <p className="text-lg font-bold text-gray-800">{order.points.toLocaleString()} pts</p>
                          <p className="text-2xl font-bold text-red-600">₦{order.askPrice.toFixed(2)}/pt</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Listed {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-800">₦{(order.points * order.askPrice).toLocaleString()}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/point-market?orderId=${order.id}`);
                          }}
                          className="text-primary hover:text-blue-600 text-sm font-semibold mt-2 transition"
                        >
                          Buy →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
