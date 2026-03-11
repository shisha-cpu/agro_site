# Питомник растений «Хвойный»

## Запуск сервера

### 1. Установка зависимостей
```bash
npm install
```

### 2. Запуск сервера
```bash
npm start
```

Сервер запустится на `http://localhost:3000`

### 3. Открыть сайт
- Главная: `http://localhost:3000/`
- Каталог: `http://localhost:3000/catalog.html`
- Админка: `http://localhost:3000/admin.html`

## Импорт товаров

1. Откройте `http://localhost:3000/admin.html`
2. Загрузите файл `Price_ХВОЙНЫЙ .xlsx`
3. Данные сохранятся в MongoDB
4. Товары появятся в каталоге

## API

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/products` | Все товары |
| GET | `/api/products/category/:id` | Товары категории |
| GET | `/api/products/popular` | Популярные товары |
| GET | `/api/categories` | Все категории |
| POST | `/api/import/upload` | Загрузить XLSX |
| DELETE | `/api/import/data` | Удалить все данные |

## Технологии

- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas
- **Frontend:** HTML, CSS, JavaScript
