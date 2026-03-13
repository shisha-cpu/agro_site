const express = require('express');
const router = express.Router();

// Получить все товары
router.get('/', (req, res) => {
  try {
    const data = req.loadData();
    const products = data.products || [];
    // Сортировка: сначала популярные, потом по имени
    products.sort((a, b) => {
      if (b.popular && !a.popular) return 1;
      if (!b.popular && a.popular) return -1;
      return (a.name || '').localeCompare(b.name || '');
    });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить товары по категории
router.get('/category/:categoryId', (req, res) => {
  try {
    const data = req.loadData();
    const products = (data.products || []).filter(
      p => p.category === req.params.categoryId
    );
    products.sort((a, b) => {
      if (b.popular && !a.popular) return 1;
      if (!b.popular && a.popular) return -1;
      return (a.name || '').localeCompare(b.name || '');
    });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить популярные товары
router.get('/popular', (req, res) => {
  try {
    const data = req.loadData();
    const products = (data.products || []).filter(p => p.popular).slice(0, 8);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить товар по ID
router.get('/:id', (req, res) => {
  try {
    const data = req.loadData();
    const product = (data.products || []).find(p => p.id == req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Товар не найден' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Обновить товар
router.put('/:id', (req, res) => {
  try {
    const data = req.loadData();
    const index = (data.products || []).findIndex(p => p.id == req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Товар не найден' });
    }
    data.products[index] = { ...data.products[index], ...req.body };
    if (req.saveData(data)) {
      res.json({ success: true, data: data.products[index] });
    } else {
      res.status(500).json({ success: false, error: 'Ошибка сохранения' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Удалить товар
router.delete('/:id', (req, res) => {
  try {
    const data = req.loadData();
    const index = (data.products || []).findIndex(p => p.id == req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Товар не найден' });
    }
    data.products.splice(index, 1);
    if (req.saveData(data)) {
      res.json({ success: true, message: 'Товар удалён' });
    } else {
      res.status(500).json({ success: false, error: 'Ошибка сохранения' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
