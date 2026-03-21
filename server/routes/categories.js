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
    const categories = data.categories || [];

    // Собираем категории из продуктов
    const categoriesMap = new Map();
    
    // Сначала добавляем сохранённые категории
    for (const cat of categories) {
      categoriesMap.set(cat.id, { ...cat });
    }
    
    // Затем добавляем категории из продуктов и считаем количество
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

    const categoriesList = Array.from(categoriesMap.values());
    categoriesList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    res.json({ success: true, data: categoriesList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить категорию по ID
router.get('/:id', (req, res) => {
  try {
    const data = req.loadData();
    const products = data.products || [];
    const categories = data.categories || [];

    const categoriesMap = new Map();
    
    // Сначала добавляем сохранённые категории
    for (const cat of categories) {
      categoriesMap.set(cat.id, { ...cat });
    }
    
    // Затем добавляем категории из продуктов и считаем количество
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

// Создать новую категорию
router.post('/', (req, res) => {
  try {
    const data = req.loadData();
    const { id, name, emoji } = req.body;

    if (!id || !name) {
      return res.status(400).json({ success: false, error: 'Необходимо указать id и название категории' });
    }

    // Проверяем, существует ли уже категория с таким id
    const existingCategories = data.categories || [];
    if (existingCategories.some(cat => cat.id === id)) {
      return res.status(400).json({ success: false, error: 'Категория с таким ID уже существует' });
    }

    // Добавляем новую категорию
    const newCategory = {
      id,
      name,
      emoji: emoji || '🌿',
      count: 0
    };

    existingCategories.push(newCategory);
    data.categories = existingCategories;

    if (req.saveData(data)) {
      res.json({ success: true, data: newCategory, message: 'Категория создана' });
    } else {
      res.status(500).json({ success: false, error: 'Ошибка сохранения категории' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Обновить категорию
router.put('/:id', (req, res) => {
  try {
    const data = req.loadData();
    const categoryId = req.params.id;
    const { name, emoji } = req.body;

    const categories = data.categories || [];
    const index = categories.findIndex(cat => cat.id === categoryId);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Категория не найдена' });
    }

    // Обновляем только name и emoji, не меняем id
    if (name) categories[index].name = name;
    if (emoji) categories[index].emoji = emoji;

    data.categories = categories;

    if (req.saveData(data)) {
      res.json({ success: true, data: categories[index], message: 'Категория обновлена' });
    } else {
      res.status(500).json({ success: false, error: 'Ошибка сохранения категории' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Удалить категорию
router.delete('/:id', (req, res) => {
  try {
    const data = req.loadData();
    const categoryId = req.params.id;
    const { action = 'delete' } = req.body; // 'delete' - удалить товары, 'move' - перенести

    const categories = data.categories || [];
    const index = categories.findIndex(cat => cat.id === categoryId);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Категория не найдена' });
    }

    // Проверяем, есть ли товары в этой категории
    let productsInCategory = (data.products || []).filter(p => p.category === categoryId);
    
    if (productsInCategory.length > 0) {
      if (action === 'delete') {
        // Удаляем все товары этой категории
        data.products = (data.products || []).filter(p => p.category !== categoryId);
      } else if (action === 'move') {
        // Переносим товары в другую категорию
        const { targetCategory } = req.body;
        if (!targetCategory) {
          return res.status(400).json({
            success: false,
            error: 'Необходимо указать целевую категорию для переноса товаров'
          });
        }
        // Проверяем, существует ли целевая категория
        const targetExists = categories.some(cat => cat.id === targetCategory);
        if (!targetExists) {
          return res.status(400).json({
            success: false,
            error: 'Целевая категория не найдена'
          });
        }
        // Переносим товары
        data.products = (data.products || []).map(p => {
          if (p.category === categoryId) {
            return { ...p, category: targetCategory };
          }
          return p;
        });
      }
      // Если action !== 'delete' и action !== 'move', товары остаются без категории (будут в "другое")
    }

    // Удаляем категорию
    categories.splice(index, 1);
    data.categories = categories;

    if (req.saveData(data)) {
      res.json({ 
        success: true, 
        message: 'Категория удалена',
        deletedProducts: productsInCategory.length,
        action: action
      });
    } else {
      res.status(500).json({ success: false, error: 'Ошибка сохранения категории' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
