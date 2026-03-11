const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const Category = require('./models/Category');

dotenv.config();

// Маппинг категорий
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

const seedDB = async () => {
  try {
    // Подключаемся к MongoDB
    await connectDB();

    const dataPath = path.join(__dirname, '..', 'data.json');
    
    if (!fs.existsSync(dataPath)) {
      console.error('❌ Файл data.json не найден');
      process.exit(1);
    }

    console.log('📖 Чтение data.json...');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    if (!data.products || !Array.isArray(data.products)) {
      console.error('❌ Неверный формат JSON. Ожидался массив products');
      process.exit(1);
    }

    console.log(`📦 Найдено товаров: ${data.products.length}`);

    // Очищаем старые данные
    console.log('🗑️  Очистка старых данных...');
    await Product.deleteMany({});
    await Category.deleteMany({});

    const categoriesMap = new Map();

    // Обрабатываем продукты и собираем категории
    console.log('📊 Обработка продуктов...');
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
    console.log('💾 Сохранение продуктов в MongoDB...');
    await Product.insertMany(data.products);
    console.log(`✅ Продукты сохранены: ${data.products.length}`);

    // Сохраняем категории
    console.log('💾 Сохранение категорий в MongoDB...');
    await Category.insertMany(Array.from(categoriesMap.values()));
    console.log(`✅ Категории сохранены: ${categoriesMap.size}`);

    console.log('\n🎉 Данные успешно импортированы в MongoDB!');
    console.log('📊 Статистика:');
    console.log(`   - Продуктов: ${data.products.length}`);
    console.log(`   - Категорий: ${categoriesMap.size}`);
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Ошибка при импорте данных:', error.message);
    process.exit(1);
  }
};

seedDB();
