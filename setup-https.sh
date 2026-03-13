#!/bin/bash

# Скрипт настройки HTTPS через Let's Encrypt
# Запускать НА СЕРВЕРЕ

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Использование: $0 domain.ru email@example.com"
    exit 1
fi

echo "🔒 Настройка HTTPS для $DOMAIN..."

# Установка Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

echo "✅ HTTPS настроен!"
echo "📍 Сайт: https://$DOMAIN"
