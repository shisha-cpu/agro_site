#!/bin/bash

# Скрипт развёртывания на сервере
# Использование: ./deploy.sh user@server.ru

SERVER=$1
PROJECT_PATH=~/agro_site

if [ -z "$SERVER" ]; then
    echo "Использование: $0 user@server.ru"
    exit 1
fi

echo "🚀 Развёртывание на $SERVER..."

# Копирование файлов
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'data.json' --exclude 'hits.json' --exclude 'orders.json' ./ $SERVER:$PROJECT_PATH

# Установка зависимостей и перезапуск на сервере
ssh $SERVER "cd $PROJECT_PATH && \
    npm install --production && \
    pm2 restart agro-site || pm2 start ecosystem.config.js && \
    pm2 save"

echo "✅ Готово!"
echo "📍 Сайт: https://$SERVER"
