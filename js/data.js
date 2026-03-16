// ========================================
// Данные о товарах питомника «Хвойный»
// Загружаются с сервера (Express + MongoDB) или из data.json (моковые данные)
// ========================================

const API_URL = 'https://greenmagics.ru/api';

// Глобальные переменные
let products = [];
let categories = [];
let serverAvailable = false;

// Загрузка моковых данных из data.json
async function loadMockData() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) {
      throw new Error('Не удалось загрузить data.json');
    }
    const data = await response.json();
    
    products = data.products || [];
    
    // Формируем категории из продуктов
    const categoryMap = new Map();
    products.forEach(product => {
      if (product.category && !categoryMap.has(product.category)) {
        categoryMap.set(product.category, {
          id: product.category,
          name: product.category.charAt(0).toUpperCase() + product.category.slice(1),
          emoji: product.emoji || '🌱'
        });
      }
    });
    
    categories = Array.from(categoryMap.values());
    
    console.log(`📦 Загружены моковые данные. Товаров: ${products.length}, Категорий: ${categories.length}`);
    return true;
  } catch (error) {
    console.error('❌ Ошибка загрузки моковых данных:', error.message);
    return false;
  }
}

// Загрузка данных с сервера
async function loadData() {
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${API_URL}/products`),
      fetch(`${API_URL}/categories`)
    ]);

    if (productsRes.ok && categoriesRes.ok) {
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();

      if (productsData.success && categoriesData.success) {
        products = productsData.data;
        categories = categoriesData.data;
        serverAvailable = true;
        console.log(`✅ Данные загружены с сервера. Товаров: ${products.length}, Категорий: ${categories.length}`);
        return true;
      }
    }
    throw new Error('Сервер недоступен');
  } catch (error) {
    console.error('❌ Ошибка загрузки данных:', error.message);
    console.log('💡 Сервер недоступен. Загружаем моковые данные из data.json...');
    serverAvailable = false;
    await loadMockData();
    return false;
  }
}

// Проверка доступности сервера
function hasServerData() {
  return serverAvailable;
}

// Получение информации о данных
function getDataInfo() {
  return {
    fromServer: serverAvailable,
    productsCount: products.length,
    categoriesCount: categories.length
  };
}

// Доставка
const DELIVERY_COST = 500;
const FREE_DELIVERY_THRESHOLD = 10000;

// Загружаем данные при инициализации
loadData();
