// ========================================
// Страница корзины
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const cartEmpty = document.getElementById('cart-empty');
    const cartContent = document.getElementById('cart-content');
    const cartItemsContainer = document.getElementById('cart-items');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryDelivery = document.getElementById('summary-delivery');
    const summaryTotal = document.getElementById('summary-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!cartItemsContainer) return;

    // Обновление страницы корзины
    window.updateCartPage = function() {
        const items = cart.items;

        if (items.length === 0) {
            cartEmpty.style.display = 'block';
            cartContent.style.display = 'none';
            checkoutBtn.style.pointerEvents = 'none';
            checkoutBtn.style.opacity = '0.5';
        } else {
            cartEmpty.style.display = 'none';
            cartContent.style.display = 'grid';
            checkoutBtn.style.pointerEvents = 'auto';
            checkoutBtn.style.opacity = '1';

            // Рендеринг товаров
            renderCartItems(items);
            updateSummary();
        }
    };

    // Рендеринг товаров в корзине
    function renderCartItems(items) {
        cartItemsContainer.innerHTML = '';

        items.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            
            // Получаем изображение товара или используем эмодзи
            const mainImage = item.images && item.images.length > 0 ? item.images[0] : null;
            const imageHtml = mainImage 
                ? `<img src="${mainImage}" alt="${item.name}" class="cart-item__image" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">`
                : `<div class="cart-item__image" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; background: #f0f7f4; border-radius: 8px; font-size: 2.5rem;">${item.emoji || '🌿'}</div>`;
            
            cartItem.innerHTML = `
                ${imageHtml}
                <div class="cart-item__info">
                    <h3 class="cart-item__title">${item.name}</h3>
                    <div class="cart-item__price">${formatPrice(item.price)}</div>
                </div>
                <div class="cart-item__quantity">
                    <button class="cart-item__btn" data-action="decrease" data-product-id="${item.id}">−</button>
                    <span class="cart-item__count">${item.quantity}</span>
                    <button class="cart-item__btn" data-action="increase" data-product-id="${item.id}">+</button>
                    <button class="cart-item__remove" data-product-id="${item.id}">Удалить</button>
                </div>
            `;

            cartItemsContainer.appendChild(cartItem);
        });

        // Добавляем обработчики событий
        attachCartEventListeners();
    }

    // Обработчики событий для кнопок корзины
    function attachCartEventListeners() {
        // Кнопки +/-
        document.querySelectorAll('.cart-item__btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.productId);
                const action = e.target.dataset.action;
                const item = cart.items.find(i => i.id === productId);

                if (item) {
                    if (action === 'increase') {
                        cart.updateQuantity(productId, item.quantity + 1);
                    } else if (action === 'decrease') {
                        cart.updateQuantity(productId, item.quantity - 1);
                    }
                }
            });
        });

        // Кнопки удаления
        document.querySelectorAll('.cart-item__remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.productId);
                cart.remove(productId);
            });
        });
    }

    // Обновление итогов
    function updateSummary() {
        const subtotal = cart.getTotal();
        const delivery = cart.getDelivery();
        const total = cart.getFullTotal();

        if (summarySubtotal) summarySubtotal.textContent = formatPrice(subtotal);
        if (summaryDelivery) {
            summaryDelivery.textContent = delivery === 0 ? 'Бесплатно' : formatPrice(delivery);
        }
        if (summaryTotal) summaryTotal.textContent = formatPrice(total);
    }

    // Первоначальное обновление
    updateCartPage();
});
