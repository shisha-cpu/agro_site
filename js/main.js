// ========================================
// Питомник растений «Хвойный» - Основной JS
// ========================================

// --- Управление корзиной ---

class Cart {
    constructor() {
        this.items = this.loadFromStorage();
        this.updateCartCount();
    }

    loadFromStorage() {
        const stored = localStorage.getItem('hvoyny_cart');
        return stored ? JSON.parse(stored) : [];
    }

    saveToStorage() {
        localStorage.setItem('hvoyny_cart', JSON.stringify(this.items));
        this.updateCartCount();
    }

    add(product, quantity = 1) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                ...product,
                quantity
            });
        }
        
        this.saveToStorage();
        this.showNotification(`«${product.name}» добавлен в корзину`);
    }

    remove(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToStorage();
        
        // Если мы на странице корзины, обновляем отображение
        if (typeof updateCartPage === 'function') {
            updateCartPage();
        }
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.remove(productId);
            } else {
                item.quantity = quantity;
                this.saveToStorage();
                
                // Если мы на странице корзины, обновляем отображение
                if (typeof updateCartPage === 'function') {
                    updateCartPage();
                }
            }
        }
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    getDelivery() {
        const total = this.getTotal();
        return total >= FREE_DELIVERY_THRESHOLD || total === 0 ? 0 : DELIVERY_COST;
    }

    getFullTotal() {
        return this.getTotal() + this.getDelivery();
    }

    clear() {
        this.items = [];
        this.saveToStorage();
    }

    updateCartCount() {
        const countElement = document.getElementById('cart-count');
        if (countElement) {
            const count = this.getCount();
            countElement.textContent = count;
            countElement.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    showNotification(message) {
        // Удаляем предыдущие уведомления
        const existingNotification = document.querySelector('.cart-notification');
        if (existingNotification) {
            existingNotification.classList.add('removing');
            setTimeout(() => existingNotification.remove(), 300);
        }

        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <span style="margin-right: 8px;">✅</span>${message}
        `;
        notification.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: var(--color-primary, #1a5f3a);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            z-index: 1000;
            font-weight: 500;
            display: flex;
            align-items: center;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('removing');
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }
}

// Создаём глобальный экземпляр корзины
const cart = new Cart();

// Глобальная функция для добавления в корзину (вызывается из HTML)
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.add(product);
    }
}

// --- Мобильное меню ---

function initMobileNav() {
    const burgerBtn = document.getElementById('burger-btn');
    const mobileNav = document.getElementById('mobile-nav');

    if (burgerBtn && mobileNav) {
        burgerBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
            burgerBtn.classList.toggle('active');
            document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
        });

        // Закрываем меню при клике на ссылку
        mobileNav.querySelectorAll('.mobile-nav__link').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('active');
                burgerBtn.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Закрываем меню при клике вне его
        document.addEventListener('click', (e) => {
            if (mobileNav.classList.contains('active') && 
                !mobileNav.contains(e.target) && 
                !burgerBtn.contains(e.target)) {
                mobileNav.classList.remove('active');
                burgerBtn.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// --- Форматирование цены ---

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

// --- Получение названия категории ---

function getCategoryName(categoryId) {
    if (!categories || !Array.isArray(categories)) return categoryId;
    const category = categories.find(c => c.id === categoryId);
    if (category) return category.name;
    
    // Если категория не найдена, возвращаем название из ID
    return categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
}

// --- Создание карточки товара ---

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    if (product.popular) card.classList.add('product-card--popular');

    const badge = product.popular ? '<span class="product-card__badge">🔥 Популярное</span>' : '';
    
    // Получаем первое изображение или используем заглушку
    const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;
    const imageHtml = mainImage 
        ? `<div class="product-card__image-wrapper"><img src="${mainImage}" alt="${product.name}" class="product-card__image"></div>`
        : `<div class="product-card__image-wrapper" style="display: flex; align-items: center; justify-content: center; background: #f0f7f4;"><span style="font-size: 4rem; color: #4a7c59;">${product.emoji || '🌿'}</span></div>`;

    card.innerHTML = `
        ${badge}
        ${imageHtml}
        <div class="product-card__content">
            <div class="product-card__category">${getCategoryName(product.category)}</div>
            <h3 class="product-card__title">${product.name}</h3>
            ${product.latin ? `<p class="product-card__latin">${product.latin}</p>` : ''}
            ${product.condition ? `<p class="product-card__condition">${product.condition}</p>` : ''}
            <div class="product-card__price">${formatPrice(product.price)}</div>
            <button class="btn btn--primary product-card__btn">
                <span>🛒</span> В корзину
            </button>
        </div>
    `;

    // Добавляем обработчик кнопки
    const btn = card.querySelector('.product-card__btn');
    btn.addEventListener('click', () => {
        cart.add(product);
    });

    return card;
}

// --- Инициализация при загрузке ---

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
});
