const express = require('express');
const router = express.Router();

// GET /api/cosmetics/shop - Global cosmetics shop
router.get('/shop', async (req, res) => {
  try {
    // MOCK DATA FOR TESTING
    const mockCosmeticsShop = [
      { id: 'theme_neon', name: 'Neon Theme', game_id: 'typing', category: 'theme', price_tokens: 50, image_url: 'https://via.placeholder.com/100?text=Neon' },
      { id: 'theme_dark', name: 'Dark Theme', game_id: 'typing', category: 'theme', price_tokens: 50, image_url: 'https://via.placeholder.com/100?text=Dark' },
      { id: 'theme_ocean', name: 'Ocean Theme', game_id: 'trivia', category: 'theme', price_tokens: 60, image_url: 'https://via.placeholder.com/100?text=Ocean' },
      { id: 'cursor_gold', name: 'Gold Cursor', game_id: 'typing', category: 'cursor', price_tokens: 75, image_url: 'https://via.placeholder.com/100?text=Gold' },
      { id: 'cursor_custom', name: 'Custom Cursor', game_id: 'typing', category: 'cursor', price_tokens: 100, image_url: 'https://via.placeholder.com/100?text=Custom' },
      { id: 'sound_classic', name: 'Classic Sounds', game_id: 'typing', category: 'sound', price_tokens: 25, image_url: 'https://via.placeholder.com/100?text=Classic' },
      { id: 'sound_futuristic', name: 'Futuristic Sounds', game_id: 'typing', category: 'sound', price_tokens: 50, image_url: 'https://via.placeholder.com/100?text=Futuristic' },
      { id: 'badge_master', name: 'Master Badge', game_id: 'trivia', category: 'badge', price_tokens: 100, image_url: 'https://via.placeholder.com/100?text=Master' }
    ];

    res.json({
      status: 'success',
      data: mockCosmeticsShop
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/cosmetics/user - User's owned cosmetics
router.get('/user', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    // MOCK DATA FOR TESTING
    const mockUserCosmetics = [
      { cosmetic_id: 'theme_dark', is_equipped: true, purchased_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
      { cosmetic_id: 'cursor_gold', is_equipped: true, purchased_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
      { cosmetic_id: 'sound_futuristic', is_equipped: false, purchased_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      { cosmetic_id: 'theme_neon', is_equipped: false, purchased_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
    ];

    res.json({
      status: 'success',
      data: mockUserCosmetics
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
