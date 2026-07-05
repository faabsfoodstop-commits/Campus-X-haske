import React, { useState, useEffect } from 'react';
import { gamesClient } from '../api/gamesClient';

export default function CosmeticsShop({ gameId = 'typing' }) {
  const [cosmetics, setCosmetics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCosmetics, setUserCosmetics] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadCosmetics();
    loadUserCosmetics();
  }, [gameId]);

  const loadCosmetics = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await gamesClient.getCosmetics(gameId);
      if (result.status === 'success') {
        setCosmetics(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserCosmetics = async () => {
    try {
      const result = await gamesClient.getCosmetics(gameId);
      if (result.status === 'success') {
        setUserCosmetics(result.data.filter(c => c.owned));
      }
    } catch (err) {
      console.error('Failed to load user cosmetics:', err);
    }
  };

  const handlePurchase = async (cosmeticId) => {
    try {
      const result = await gamesClient.purchaseCosmetic(gameId, cosmeticId);
      if (result.status === 'success') {
        // Update cosmetics list
        setCosmetics(cosmetics.map(c =>
          c.id === cosmeticId ? { ...c, owned: true } : c
        ));
        // Reload user cosmetics
        loadUserCosmetics();
      } else {
        alert('Purchase failed: ' + result.message);
      }
    } catch (err) {
      alert('Purchase error: ' + err.message);
    }
  };

  const categories = ['all', 'avatar', 'theme', 'effect', 'animation'];
  const filteredCosmetics = selectedCategory === 'all'
    ? cosmetics
    : cosmetics.filter(c => c.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">✨ Cosmetics Shop</h1>
          <p className="text-xl text-gray-300">Customize your experience with exclusive cosmetics.</p>
        </div>

        {/* User Cosmetics Count */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 mb-12 text-center">
          <p className="text-gray-100 text-lg">
            You own <span className="font-bold text-2xl text-white">{userCosmetics.length}</span> cosmetics
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-3 mb-12 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-white text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Loading cosmetics...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/20 border border-red-500 rounded p-4 text-red-200 text-center mb-12">
            {error}
          </div>
        )}

        {/* Cosmetics Grid */}
        {!loading && filteredCosmetics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCosmetics.map(cosmetic => (
              <div
                key={cosmetic.id}
                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-500 transition"
              >
                {/* Preview Image */}
                <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 h-40 flex items-center justify-center text-4xl">
                  {cosmetic.icon || '✨'}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{cosmetic.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{cosmetic.description}</p>

                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Price</p>
                      <p className="text-2xl font-bold text-yellow-400">{cosmetic.price} 🪙</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Rarity</p>
                      <p className={`text-lg font-bold ${
                        cosmetic.rarity === 'legendary' ? 'text-yellow-400' :
                        cosmetic.rarity === 'epic' ? 'text-purple-400' :
                        cosmetic.rarity === 'rare' ? 'text-blue-400' :
                        'text-green-400'
                      }`}>
                        {cosmetic.rarity}
                      </p>
                    </div>
                  </div>

                  {/* Purchase Button */}
                  {cosmetic.owned ? (
                    <button
                      disabled
                      className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-bold cursor-not-allowed"
                    >
                      ✓ Owned
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchase(cosmetic.id)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition"
                    >
                      Purchase
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCosmetics.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No cosmetics in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
