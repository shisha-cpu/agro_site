// ========================================
// Страница оформления заказа (Checkout)
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutSubtotal = document.getElementById('checkout-subtotal');
    const checkoutDelivery = document.getElementById('checkout-delivery');
    const checkoutTotal = document.getElementById('checkout-total');
    const orderForm = document.getElementById('order-form');
    const successModal = document.getElementById('success-modal');
    const modalClose = document.getElementById('modal-close');

    // Проверка: если корзина пуста, перенаправляем в каталог
    if (cart.items.length === 0) {
        window.location.href = 'catalog.html';
        return;
    }

    // Рендеринг товаров в сводке заказа
    function renderCheckoutItems() {
        if (!checkoutItems) return;

        checkoutItems.innerHTML = '';

        cart.items.forEach(item => {
            const checkoutItem = document.createElement('div');
            checkoutItem.className = 'checkout-item';
            checkoutItem.innerHTML = `
                <div class="checkout-item__image">${item.emoji}</div>
                <div class="checkout-item__info">
                    <div class="checkout-item__title">${item.name}</div>
                    <div class="checkout-item__quantity">× ${item.quantity} шт.</div>
                </div>
                <div class="checkout-item__price">${formatPrice(item.price * item.quantity)}</div>
            `;

            checkoutItems.appendChild(checkoutItem);
        });

        updateCheckoutTotals();
    }

    // Обновление итогов
    function updateCheckoutTotals() {
        const subtotal = cart.getTotal();
        const delivery = cart.getDelivery();
        const total = cart.getFullTotal();

        if (checkoutSubtotal) checkoutSubtotal.textContent = formatPrice(subtotal);
        if (checkoutDelivery) {
            checkoutDelivery.textContent = delivery === 0 ? 'Бесплатно' : formatPrice(delivery);
        }
        if (checkoutTotal) checkoutTotal.textContent = formatPrice(total);
    }

    // Обработка отправки формы
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Собираем данные формы
            const formData = new FormData(orderForm);
            const orderData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                address: formData.get('address'),
                comment: formData.get('comment'),
                payment: formData.get('payment'),
                agreement: formData.get('agreement')
            };

            // Добавляем данные о заказе
            orderData.items = cart.items;
            orderData.total = cart.getFullTotal();
            orderData.delivery = cart.getDelivery();
            orderData.subtotal = cart.getTotal();
            orderData.date = new Date().toISOString();

            // Сохраняем заказ (в реальном проекте здесь была бы отправка на сервер)
            console.log('Заказ оформлен:', orderData);

            // Очищаем корзину
            cart.clear();

            // Показываем модальное окно успеха
            if (successModal) {
                successModal.classList.add('active');
            }
        });
    }

    // Закрытие модального окна
    if (modalClose && successModal) {
        modalClose.addEventListener('click', () => {
            successModal.classList.remove('active');
        });

        successModal.querySelector('.modal__overlay').addEventListener('click', () => {
            successModal.classList.remove('active');
        });
    }

    // Первоначальный рендеринг
    renderCheckoutItems();
});
