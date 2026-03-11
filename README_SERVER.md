# Питомник растений «Хвойный» - Express сервер с MongoDB

## 📋 Описание

Полноценный сервер на Express с MongoDB для интернет-магазина питомника растений.

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Запуск сервера

```bash
# Продакшен режим
npm start

# Режим разработки (с автперезагрузкой)
npm run dev
```

### 3. Импорт данных из data.json

После запуска сервера откройте админ-панель:
- Перейдите на `http://localhost:3000/admin.html`
- Нажмите кнопку **"📥 Импорт из data.json"**

Или используйте команду для импорта:

```bash
npm run seed
```

## 📁 Структура проекта

```
agro_site/
├── server/
│   ├── index.js           # Главный файл сервера
│   ├── config/
│   │   └── db.js          # Подключение к MongoDB
│   ├── models/
│   │   ├── Product.js     # Модель товара
│   │   └── Category.js    # Модель категории
│   ├── routes/
│   │   ├── products.js    # API товаров
│   │   ├── categories.js  # API категорий
│   │   └── import.js      # API импорта файлов
│   └── seed.js            # Скрипт импорта из data.json
├── js/
│   ├── data.js            # Загрузка данных с API
│   ├── main.js            # Основные функции
│   └── catalog.js         # Страница каталога
├── admin.html             # Админ-панель
├── catalog.html           # Каталог товаров
├── data.json              # Исходные данные
└── .env                   # Переменные окружения
```

## 🔌 API Endpoints

### Товары
- `GET /api/products` - Получить все товары
- `GET /api/products/category/:categoryId` - Товары по категории
- `GET /api/products/popular` - Популярные товары

### Категории
- `GET /api/categories` - Получить все категории

### Импорт
- `POST /api/import/import-local` - Импорт из data.json
- `POST /api/import/upload-json` - Загрузка JSON файла
- `POST /api/import/upload-xlsx` - Загрузка XLSX файла
- `DELETE /api/import/data` - Удалить все данные

### Статистика
- `GET /api/stats` - Статистика по товарам и категориям

## 🔐 Переменные окружения (.env)

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/DatabaseName
PORT=3000
```

## 📦 Формат данных

### JSON (data.json)
```json
{
  "products": [
    {
      "id": 1234567890,
      "name": "Название растения",
      "latin": "Название на латыни",
      "condition": "Кондиция",
      "price": 1000,
      "category": "хвойные",
      "emoji": "🌲",
      "popular": true
    }
  ]
}
```

## 🛠️ Технологии

- **Backend:** Node.js, Express
- **База данных:** MongoDB (mongoose)
- **Загрузка файлов:** multer
- **Парсинг XLSX:** xlsx

## 📝 Примечания

- Все данные хранятся в MongoDB Atlas (облачная база)
- При первом запуске обязательно сделайте импорт данных
- Админ-панель доступна по адресу `http://localhost:3000/admin.html`
