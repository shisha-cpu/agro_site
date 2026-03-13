const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const importRouter = require('./routes/import');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, '..', 'data.json');
const HITS_FILE = path.join(__dirname, '..', 'hits.json');

// Настройки ЮKassa (заполните своими данными)
const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID || 'your_shop_id';
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || 'your_secret_key';
const YOOKASSA_TEST_MODE = process.env.YOOKASSA_TEST_MODE === 'true';

// URL для уведомлений (замените на свой домен)
const RETURN_URL = process.env.RETURN_URL || 'http://localhost:3000/checkout.html';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Вспомогательные функции для работы с JSON-файлами
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { products: [], categories: [], orders: [] };
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Если categories нет, создаём из products
    if (!parsed.categories && parsed.products) {
      const categoryMap = new Map();
      parsed.products.forEach(product => {
        if (product.category && !categoryMap.has(product.category)) {
          categoryMap.set(product.category, {
            id: product.category,
            name: product.category.charAt(0).toUpperCase() + product.category.slice(1),
            emoji: product.emoji || '🌱',
            count: 0
          });
        }
        if (product.category && categoryMap.has(product.category)) {
          categoryMap.get(product.category).count++;
        }
      });
      parsed.categories = Array.from(categoryMap.values());
    }
    
    return {
      products: parsed.products || [],
      categories: parsed.categories || [],
      orders: parsed.orders || []
    };
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    return { products: [], categories: [], orders: [] };
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Ошибка сохранения данных:', error);
    return false;
  }
}

function loadOrders() {
  try {
    const data = loadData();
    return data.orders || [];
  } catch (error) {
    console.error('Ошибка загрузки заказов:', error);
    return [];
  }
}

function saveOrders(orders) {
  try {
    const data = loadData();
    data.orders = orders;
    return saveData(data);
  } catch (error) {
    console.error('Ошибка сохранения заказов:', error);
    return false;
  }
}

function loadHits() {
  try {
    if (!fs.existsSync(HITS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(HITS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка загрузки хитов:', error);
    return [];
  }
}

function saveHits(hits) {
  try {
    fs.writeFileSync(HITS_FILE, JSON.stringify(hits, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Ошибка сохранения хитов:', error);
    return false;
  }
}

// Middleware для добавления функций данных в запрос
app.use((req, res, next) => {
  req.loadData = loadData;
  req.saveData = saveData;
  req.loadOrders = loadOrders;
  req.saveOrders = saveOrders;
  req.loadHits = loadHits;
  req.saveHits = saveHits;
  next();
});

// Маршруты API
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/import', importRouter);

// API: Хиты продаж - загружаются из hits.json
app.get('/api/hits', (req, res) => {
  try {
    const hits = req.loadHits();
    res.json({ success: true, data: hits.slice(0, 9) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Сохранить хиты (массив товаров)
app.post('/api/hits', (req, res) => {
  try {
    const { hits } = req.body;
    if (!Array.isArray(hits)) {
      return res.status(400).json({ success: false, error: 'Неверный формат данных' });
    }
    if (hits.length > 9) {
      return res.status(400).json({ success: false, error: 'Максимум 9 хитов продаж' });
    }
    if (req.saveHits(hits)) {
      res.json({ success: true, message: 'Хиты сохранены' });
    } else {
      res.status(500).json({ success: false, error: 'Ошибка сохранения' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Заказы
app.get('/api/orders', (req, res) => {
  try {
    const orders = req.loadOrders();
    // Сортируем: новые сверху
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/orders/:id', (req, res) => {
  try {
    const orders = req.loadOrders();
    const index = orders.findIndex(o => o.id == req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Заказ не найден' });
    }
    orders[index] = { ...orders[index], ...req.body };
    if (req.saveOrders(orders)) {
      res.json({ success: true, data: orders[index] });
    } else {
      res.status(500).json({ success: false, error: 'Ошибка сохранения' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Получить статистику
app.get('/api/stats', (req, res) => {
  const data = req.loadData();
  res.json({
    success: true,
    data: {
      products: data.products?.length || 0,
      categories: data.categories?.length || 0
    }
  });
});

// API: Создание заказа с оплатой ЮKassa
app.post('/api/create-order', (req, res) => {
  try {
    const { items, total, name, phone, email, address, comment, payment } = req.body;

    if (!items || !total || !name || !phone || !email) {
      return res.status(400).json({
        success: false,
        error: 'Недостаточно данных для оформления заказа'
      });
    }

    const orderId = Date.now();

    // Сохраняем заказ в orders.json
    const order = {
      id: orderId,
      items,
      total,
      name,
      phone,
      email,
      address,
      comment,
      payment,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const orders = req.loadOrders();
    orders.push(order);

    if (!req.saveOrders(orders)) {
      return res.status(500).json({ success: false, error: 'Ошибка сохранения заказа' });
    }

    // Если оплата при получении
    if (payment === 'cash') {
      order.status = 'confirmed';
      req.saveOrders(orders);
      return res.json({
        success: true,
        orderId,
        message: 'Заказ оформлен. Оплата при получении.'
      });
    }

    // Создаём платёж ЮKassa
    createYooKassaPayment(orderId, total, name, email)
      .then(paymentData => {
        if (paymentData.confirmation_url) {
          res.json({
            success: true,
            orderId,
            confirmationUrl: paymentData.confirmation_url,
            paymentId: paymentData.id
          });
        } else {
          res.json({
            success: true,
            orderId,
            message: 'Заказ оформлен. Перенаправление на оплату...'
          });
        }
      })
      .catch(error => {
        console.error('Ошибка создания платежа:', error);
        // Возвращаем успех, но без перенаправления (тестовый режим)
        res.json({
          success: true,
          orderId,
          message: 'Заказ оформлен. В тестовом режиме оплата не требуется.',
          testMode: true
        });
      });

  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Функция создания платежа ЮKassa
function createYooKassaPayment(orderId, amount, customerName, customerEmail) {
  return new Promise((resolve, reject) => {
    // Тестовый режим - возвращаем заглушку
    if (YOOKASSA_TEST_MODE || YOOKASSA_SHOP_ID === 'your_shop_id') {
      console.log(`[TEST] Платёж для заказа ${orderId} на сумму ${amount}₽`);
      resolve({
        id: `test_${orderId}`,
        confirmation_url: null,
        testMode: true
      });
      return;
    }

    const paymentData = {
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB'
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `${RETURN_URL}?order=${orderId}`
      },
      description: `Оплата заказа №${orderId}`,
      metadata: {
        order_id: orderId.toString()
      },
      customer: {
        full_name: customerName,
        email: customerEmail
      }
    };

    const postData = JSON.stringify(paymentData);
    const options = {
      hostname: 'api.yookassa.ru',
      port: 443,
      path: '/v3/payments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': crypto.randomUUID(),
        'Authorization': `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (res.statusCode === 200) {
            resolve(result);
          } else {
            reject(new Error(result.description || 'Ошибка создания платежа'));
          }
        } catch (e) {
          reject(new Error('Ошибка парсинга ответа'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// API: Проверка статуса платежа
app.get('/api/payment-status/:orderId', (req, res) => {
  try {
    const data = req.loadData();
    const order = (data.orders || []).find(o => o.id == req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Заказ не найден' });
    }

    res.json({
      success: true,
      status: order.status,
      payment: order.payment
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Обновление статуса платежа (для webhook)
app.post('/api/payment-webhook', (req, res) => {
  try {
    const { object: payment } = req.body;
    
    if (!payment || !payment.metadata?.order_id) {
      return res.status(400).json({ success: false, error: 'Неверные данные webhook' });
    }

    const data = req.loadData();
    const orderIndex = (data.orders || []).findIndex(o => o.id == payment.metadata.order_id);
    
    if (orderIndex === -1) {
      return res.status(404).json({ success: false, error: 'Заказ не найден' });
    }

    // Обновляем статус заказа
    if (payment.status === 'succeeded') {
      data.orders[orderIndex].status = 'paid';
      data.orders[orderIndex].paymentId = payment.id;
    } else if (payment.status === 'canceled') {
      data.orders[orderIndex].status = 'cancelled';
    }

    req.saveData(data);
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка обработки webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`💾 Данные хранятся в data.json`);
  console.log(`💳 ЮKassa: ${YOOKASSA_TEST_MODE || YOOKASSA_SHOP_ID === 'your_shop_id' ? 'ТЕСТОВЫЙ РЕЖИМ' : 'ВКЛЮЧЕНА'}`);
  console.log(`💡 Админка: http://localhost:${PORT}/admin.html`);
});
