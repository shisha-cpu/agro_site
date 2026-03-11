const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Получить все товары
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ popular: -1, name: 1 });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить товары по категории
router.get('/category/:categoryId', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.categoryId })
      .sort({ popular: -1, name: 1 });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить популярные товары
router.get('/popular', async (req, res) => {
  try {
    const products = await Product.find({ popular: true }).limit(8);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
