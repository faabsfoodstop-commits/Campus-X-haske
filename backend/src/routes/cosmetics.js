const express = require('express');
const router = express.Router();

// GET /api/cosmetics/shop - Global cosmetics shop
router.get('/shop', async (req, res) => {
  try {
    const { data: cosmetics, error } = await req.supabase
      .from('cosmetics_catalog')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      status: 'success',
      data: cosmetics
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/cosmetics/user - User's owned cosmetics
router.get('/user', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const { data: userCosmetics, error } = await req.supabase
      .from('user_cosmetics')
      .select('cosmetic_id, is_equipped, purchased_at')
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      status: 'success',
      data: userCosmetics
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
