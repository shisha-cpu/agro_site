const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const Category = require('../models/Category');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/json'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Неверный тип файла. Загрузите XLSX или JSON файл.'));
    }
  }
});

// Маппинг названий листов для XLSX
const CATEGORY_MAPPING = {
  'хвойные': { id: 'хвойные', name: 'Хвойные', emoji: '🌲' },
  'лиственные': { id: 'лиственные', name: 'Лиственные', emoji: '🍃' },
  'розы': { id: 'цветы', name: 'Цветы', emoji: '🌺' },
  'рододендроны': { id: 'рододендроны', name: 'Рододендроны', emoji: '🌸' },
  'плодовые': { id: 'плодовые', name: 'Плодовые', emoji: '🍎' },
  'лианы': { id: 'лианы', name: 'Лианы', emoji: '🌿' },
  'многолетники': { id: 'многолетники', name: 'Многолетники', emoji: '🌸' },
  'сопутка': { id: 'иммуностимуляторы', name: 'Сопутствующие товары', emoji: '💊' },
  'Хвойные': { id: 'хвойные', name: 'Хвойные', emoji: '🌲' },
  'Лиственные': { id: 'лиственные', name: 'Лиственные', emoji: '🍃' },
  'Розы': { id: 'цветы', name: 'Цветы', emoji: '🌺' },
  'Рододендроны': { id: 'рододендроны', name: 'Рододендроны', emoji: '🌸' },
  'Плодовые': { id: 'плодовые', name: 'Плодовые', emoji: '🍎' },
  'Лианы': { id: 'лианы', name: 'Лианы', emoji: '🌿' },
  'Многолетники': { id: 'многолетники', name: 'Многолетники', emoji: '🌸' },
  'Сопутка': { id: 'иммуностимуляторы', name: 'Сопутствующие товары', emoji: '💊' }
};

// Загрузка JSON файла (data.json)
router.post('/upload-json', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Файл не загружен' });
    }

    const data = JSON.parse(req.file.buffer.toString('utf-8'));
    
    if (!data.products || !Array.isArray(data.products)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Неверный формат JSON. Ожидалась структура с массивом products' 
      });
    }

    // Очищаем старые данные
    await Product.deleteMany({});
    await Category.deleteMany({});

    const categoriesMap = new Map();

    // Обрабатываем продукты и собираем категории
    for (const product of data.products) {
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

    // Сохраняем продукты
    if (data.products.length > 0) {
      await Product.insertMany(data.products);
    }

    // Сохраняем категории
    if (categoriesMap.size > 0) {
      await Category.insertMany(Array.from(categoriesMap.values()));
    }

    res.json({
      success: true,
      message: 'JSON файл успешно загружен',
      stats: {
        products: data.products.length,
        categories: categoriesMap.size,
        importDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Ошибка обработки JSON файла:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Загрузка XLSX файла
router.post('/upload-xlsx', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Файл не загружен' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const allProducts = [];
    const categoriesMap = new Map();

    const sheetNames = workbook.SheetNames.filter(name =>
      name.toLowerCase() !== 'условные обозначения'
    );

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonData.length < 2) continue;

      const categoryKey = sheetName;
      const category = CATEGORY_MAPPING[categoryKey] || {
        id: categoryKey.toLowerCase(),
        name: sheetName,
        emoji: '🌿'
      };

      categoriesMap.set(category.id, {
        ...category,
        count: 0
      });

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const product = {
          name: row[0] || 'Без названия',
          latin: row[1] || '',
          condition: row[2] || '',
          price: parseFloat(row[3]) || 0,
          category: category.id,
          emoji: category.emoji,
          popular: i <= 5
        };

        if (product.name && product.price > 0) {
          allProducts.push(product);
          categoriesMap.get(category.id).count++;
        }
      }
    }

    // Очищаем старые данные
    await Product.deleteMany({});
    await Category.deleteMany({});

    // Сохраняем новые данные
    if (allProducts.length > 0) {
      await Product.insertMany(allProducts);
    }

    if (categoriesMap.size > 0) {
      await Category.insertMany(Array.from(categoriesMap.values()));
    }

    res.json({
      success: true,
      message: 'XLSX файл успешно загружен',
      stats: {
        products: allProducts.length,
        categories: categoriesMap.size,
        importDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Ошибка обработки XLSX файла:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Импорт из локального файла data.json (для первоначальной загрузки)
router.post('/import-local', async (req, res) => {
  try {
    const dataPath = path.join(__dirname, '..', '..', 'data.json');
    
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Файл data.json не найден' 
      });
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    if (!data.products || !Array.isArray(data.products)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Неверный формат JSON в data.json' 
      });
    }

    // Очищаем старые данные
    await Product.deleteMany({});
    await Category.deleteMany({});

    const categoriesMap = new Map();

    // Обрабатываем продукты и собираем категории
    for (const product of data.products) {
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

    // Сохраняем продукты
    if (data.products.length > 0) {
      await Product.insertMany(data.products);
    }

    // Сохраняем категории
    if (categoriesMap.size > 0) {
      await Category.insertMany(Array.from(categoriesMap.values()));
    }

    res.json({
      success: true,
      message: 'Данные из data.json успешно импортированы в MongoDB',
      stats: {
        products: data.products.length,
        categories: categoriesMap.size,
        importDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Ошибка импорта из data.json:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Удалить все данные
router.delete('/data', async (req, res) => {
  try {
    await Product.deleteMany({});
    await Category.deleteMany({});
    res.json({ success: true, message: 'Данные удалены' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
