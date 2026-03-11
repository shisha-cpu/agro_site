const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const Category = require('./models/Category');
const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const importRouter = require('./routes/import');

// Загружаем переменные окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Подключение к MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Маршруты API
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/import', importRouter);

// API: Получить статистику
app.get('/api/stats', async (req, res) => {
  try {
    const productsCount = await Product.countDocuments();
    const categoriesCount = await Category.countDocuments();
    res.json({
      success: true,
      data: {
        products: productsCount,
        categories: categoriesCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`💾 MongoDB подключена`);
  console.log(`💡 Админка: http://localhost:${PORT}/admin.html`);
});
