const express = require('express');
const router = express.Router();

// Маппинг названий категорий
const CATEGORY_MAPPING = {
  'хвойные': { id: 'хвойные', name: 'Хвойные', emoji: '🌲' },
  'лиственные': { id: 'лиственные', name: 'Лиственные декоративные', emoji: '🍃' },
  'цветы': { id: 'цветы', name: 'Цветы', emoji: '🌺' },
  'рододендроны': { id: 'рододендроны', name: 'Рододендроны', emoji: '🌸' },
  'плодовые': { id: 'плодовые', name: 'Плодовые', emoji: '🍎' },
  'лианы': { id: 'лианы', name: 'Лианы', emoji: '🌿' },
  'многолетники': { id: 'многолетники', name: 'Многолетники', emoji: '🌸' },
  'иммуностимуляторы': { id: 'иммуностимуляторы', name: 'Сопутствующие товары', emoji: '💊' },
  'тропические': { id: 'тропические', name: 'Тропические растения', emoji: '🌴' }
};

// Получить все категории
router.get('/', (req, res) => {
  try {
    const data = req.loadData();
    const products = data.products || [];
    
    // Собираем категории из продуктов
    const categoriesMap = new Map();
    for (const product of products) {
      const categoryId = product.category || 'другое';
      if (!categoriesMap.has(categoryId)) {
        const categoryInfo = CATEGORY_MAPPING[categoryId] || {
          id: categoryId,
          name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
          emoji: '🌿'
        };
        categoriesMap.set(categoryId, { ...categoryInfo, count: 0 });
      }
      categoriesMap.get(categoryId).count++;
    }
    
    const categories = Array.from(categoriesMap.values());
    categories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить категорию по ID
router.get('/:id', (req, res) => {
  try {
    const data = req.loadData();
    const products = data.products || [];
    
    const categoriesMap = new Map();
    for (const product of products) {
      const categoryId = product.category || 'другое';
      if (!categoriesMap.has(categoryId)) {
        const categoryInfo = CATEGORY_MAPPING[categoryId] || {
          id: categoryId,
          name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
          emoji: '🌿'
        };
        categoriesMap.set(categoryId, { ...categoryInfo, count: 0 });
      }
      categoriesMap.get(categoryId).count++;
    }
    
    const category = categoriesMap.get(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Категория не найдена' });
    }
    
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
