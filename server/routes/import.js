const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

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
  'лиственные': { id: 'лиственные', name: 'Лиственные декоративные', emoji: '🍃' },
  'розы': { id: 'цветы', name: 'Цветы', emoji: '🌺' },
  'рододендроны': { id: 'рододендроны', name: 'Рододендроны', emoji: '🌸' },
  'плодовые': { id: 'плодовые', name: 'Плодовые', emoji: '🍎' },
  'лианы': { id: 'лианы', name: 'Лианы', emoji: '🌿' },
  'многолетники': { id: 'многолетники', name: 'Многолетники', emoji: '🌸' },
  'сопутка': { id: 'иммуностимуляторы', name: 'Сопутствующие товары', emoji: '💊' },
  'Хвойные': { id: 'хвойные', name: 'Хвойные', emoji: '🌲' },
  'Лиственные': { id: 'лиственные', name: 'Лиственные декоративные', emoji: '🍃' },
  'Розы': { id: 'цветы', name: 'Цветы', emoji: '🌺' },
  'Рододендроны': { id: 'рододендроны', name: 'Рододендроны', emoji: '🌸' },
  'Плодовые': { id: 'плодовые', name: 'Плодовые', emoji: '🍎' },
  'Лианы': { id: 'лианы', name: 'Лианы', emoji: '🌿' },
  'Многолетники': { id: 'многолетники', name: 'Многолетники', emoji: '🌸' },
  'Сопутка': { id: 'иммуностимуляторы', name: 'Сопутствующие товары', emoji: '💊' },
  'Тропические': { id: 'тропические', name: 'Тропические растения', emoji: '🌴' },
  'тропические': { id: 'тропические', name: 'Тропические растения', emoji: '🌴' }
};

// Загрузка JSON файла (data.json)
router.post('/upload-json', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Файл не загружен' });
    }

    const uploadedData = JSON.parse(req.file.buffer.toString('utf-8'));

    if (!uploadedData.products || !Array.isArray(uploadedData.products)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат JSON. Ожидалась структура с массивом products'
      });
    }

    const data = req.loadData();
    
    // Сохраняем продукты из загруженного файла
    data.products = uploadedData.products;
    
    // Собираем категории из продуктов
    const categoriesMap = new Map();
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
    
    data.categories = Array.from(categoriesMap.values());

    if (req.saveData(data)) {
      res.json({
        success: true,
        message: 'JSON файл успешно загружен',
        stats: {
          products: data.products.length,
          categories: data.categories.length,
          importDate: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({ success: false, error: 'Ошибка сохранения данных' });
    }

  } catch (error) {
    console.error('Ошибка обработки JSON файла:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Загрузка XLSX файла
router.post('/upload-xlsx', upload.single('file'), (req, res) => {
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
          id: Date.now() + i,
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

    const data = req.loadData();
    data.products = allProducts;
    data.categories = Array.from(categoriesMap.values());

    if (req.saveData(data)) {
      res.json({
        success: true,
        message: 'XLSX файл успешно загружен',
        stats: {
          products: data.products.length,
          categories: data.categories.length,
          importDate: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({ success: false, error: 'Ошибка сохранения данных' });
    }

  } catch (error) {
    console.error('Ошибка обработки XLSX файла:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Импорт из локального файла data.json (для первоначальной загрузки)
router.post('/import-local', (req, res) => {
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

    // Собираем категории из продуктов
    const categoriesMap = new Map();
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
    
    data.categories = Array.from(categoriesMap.values());

    if (req.saveData(data)) {
      res.json({
        success: true,
        message: 'Данные из data.json успешно обновлены',
        stats: {
          products: data.products.length,
          categories: data.categories.length,
          importDate: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({ success: false, error: 'Ошибка сохранения данных' });
    }

  } catch (error) {
    console.error('Ошибка импорта из data.json:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Удалить все данные
router.delete('/data', (req, res) => {
  try {
    const data = req.loadData();
    data.products = [];
    data.categories = [];
    if (req.saveData(data)) {
      res.json({ success: true, message: 'Данные удалены' });
    } else {
      res.status(500).json({ success: false, error: 'Ошибка сохранения' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Загрузка XLSX файла с хитами продаж
router.post('/upload-hits', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Файл не загружен' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const allHits = [];

    // Берём первый лист или лист с названием "Хиты"
    const sheetName = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('хит') || name.toLowerCase().includes('hit')
    ) || workbook.SheetNames[0];

    if (!sheetName) {
      return res.status(400).json({ success: false, error: 'Файл не содержит листов' });
    }

    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (jsonData.length < 2) {
      return res.status(400).json({ success: false, error: 'Файл пуст' });
    }

    // Парсим строки (формат: Название, Латинское, Кондиция, Цена, Категория)
    for (let i = 1; i < jsonData.length && allHits.length < 9; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      const hit = {
        id: Date.now() + i,
        name: row[0] || 'Без названия',
        latin: row[1] || '',
        condition: row[2] || '',
        price: parseFloat(row[3]) || 0,
        category: row[4] || 'хвойные',
        emoji: '🌲',
        popular: true
      };

      if (hit.name && hit.price > 0) {
        allHits.push(hit);
      }
    }

    // Сохраняем в hits.json
    const hitsPath = path.join(__dirname, '..', '..', 'hits.json');
    fs.writeFileSync(hitsPath, JSON.stringify(allHits, null, 2), 'utf-8');

    res.json({
      success: true,
      message: 'Хиты продаж успешно загружены',
      stats: {
        hits: allHits.length,
        importDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Ошибка загрузки хитов:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Загрузка JSON файла с хитами
router.post('/upload-hits-json', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Файл не загружен' });
    }

    const uploadedData = JSON.parse(req.file.buffer.toString('utf-8'));
    const hitsArray = Array.isArray(uploadedData) ? uploadedData : (uploadedData.hits || []);

    if (!Array.isArray(hitsArray) || hitsArray.length === 0) {
      return res.status(400).json({ success: false, error: 'Неверный формат JSON' });
    }

    if (hitsArray.length > 9) {
      return res.status(400).json({ success: false, error: 'Максимум 9 хитов продаж' });
    }

    // Сохраняем в hits.json
    const hitsPath = path.join(__dirname, '..', '..', 'hits.json');
    fs.writeFileSync(hitsPath, JSON.stringify(hitsArray, null, 2), 'utf-8');

    res.json({
      success: true,
      message: 'Хиты продаж успешно загружены',
      stats: {
        hits: hitsArray.length,
        importDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Ошибка загрузки хитов:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Загрузка XLSX файла в отдельную категорию
router.post('/upload-category-xlsx/:categoryId', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Файл не загружен' });
    }

    const categoryId = req.params.categoryId;
    const data = req.loadData();
    
    // Получаем информацию о категории
    const category = data.categories?.find(c => c.id === categoryId) || 
                     CATEGORY_MAPPING[categoryId] || {
                       id: categoryId,
                       name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
                       emoji: '🌿'
                     };

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const newProducts = [];
    
    // Берём первый лист
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ success: false, error: 'Файл не содержит листов' });
    }

    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (jsonData.length < 2) {
      return res.status(400).json({ success: false, error: 'Файл пуст' });
    }

    // Парсим строки (формат: Название, Латинское, Кондиция, Цена)
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      const product = {
        id: Date.now() + i,
        name: row[0] || 'Без названия',
        latin: row[1] || '',
        condition: row[2] || '',
        price: parseFloat(row[3]) || 0,
        category: categoryId,
        emoji: category.emoji,
        popular: i <= 5
      };

      if (product.name && product.price > 0) {
        newProducts.push(product);
      }
    }

    // Добавляем товары в существующие
    const existingProducts = data.products || [];
    data.products = [...existingProducts, ...newProducts];
    
    // Обновляем количество товаров в категории
    if (!data.categories) data.categories = [];
    const catIndex = data.categories.findIndex(c => c.id === categoryId);
    if (catIndex !== -1) {
      data.categories[catIndex].count = (data.categories[catIndex].count || 0) + newProducts.length;
    } else {
      data.categories.push({
        ...category,
        count: newProducts.length
      });
    }

    if (req.saveData(data)) {
      res.json({
        success: true,
        message: `Загружено ${newProducts.length} товаров в категорию "${category.name}"`,
        stats: {
          products: newProducts.length,
          totalProducts: data.products.length
        }
      });
    } else {
      res.status(500).json({ success: false, error: 'Ошибка сохранения данных' });
    }

  } catch (error) {
    console.error('Ошибка загрузки XLSX в категорию:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Загрузка JSON файла с товарами в отдельную категорию
router.post('/upload-category-json/:categoryId', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Файл не загружен' });
    }

    const categoryId = req.params.categoryId;
    const data = req.loadData();
    
    // Получаем информацию о категории
    const category = data.categories?.find(c => c.id === categoryId) || 
                     CATEGORY_MAPPING[categoryId] || {
                       id: categoryId,
                       name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
                       emoji: '🌿'
                     };

    const uploadedData = JSON.parse(req.file.buffer.toString('utf-8'));
    const productsArray = Array.isArray(uploadedData) ? uploadedData : (uploadedData.products || []);

    if (!Array.isArray(productsArray) || productsArray.length === 0) {
      return res.status(400).json({ success: false, error: 'Неверный формат JSON' });
    }

    // Обновляем категорию у всех товаров
    const newProducts = productsArray.map((p, i) => ({
      ...p,
      id: p.id || Date.now() + i,
      category: categoryId,
      emoji: p.emoji || category.emoji
    }));

    // Добавляем товары в существующие
    const existingProducts = data.products || [];
    data.products = [...existingProducts, ...newProducts];
    
    // Обновляем количество товаров в категории
    if (!data.categories) data.categories = [];
    const catIndex = data.categories.findIndex(c => c.id === categoryId);
    if (catIndex !== -1) {
      data.categories[catIndex].count = (data.categories[catIndex].count || 0) + newProducts.length;
    } else {
      data.categories.push({
        ...category,
        count: newProducts.length
      });
    }

    if (req.saveData(data)) {
      res.json({
        success: true,
        message: `Загружено ${newProducts.length} товаров в категорию "${category.name}"`,
        stats: {
          products: newProducts.length,
          totalProducts: data.products.length
        }
      });
    } else {
      res.status(500).json({ success: false, error: 'Ошибка сохранения данных' });
    }

  } catch (error) {
    console.error('Ошибка загрузки JSON в категорию:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
