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
    const yoomoneyForm = document.getElementById('yoomoney-form');
    const paymentRadios = document.querySelectorAll('input[name="payment"]');

    // Проверка: если корзина пуста, перенаправляем в каталог
    if (cart.items.length === 0) {
        window.location.href = 'catalog.html';
        return;
    }

    // Показ/скрытие формы ЮMoney
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (yoomoneyForm) {
                yoomoneyForm.style.display = radio.value === 'yoomoney' ? 'block' : 'none';
            }
        });
    });

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
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = orderForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Оформление...';

            try {
                // Собираем данные формы
                const formData = new FormData(orderForm);
                const orderData = {
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    address: formData.get('address'),
                    comment: formData.get('comment'),
                    payment: formData.get('payment')
                };

                // Добавляем данные о заказе
                orderData.items = cart.items;
                orderData.total = cart.getFullTotal();
                orderData.delivery = cart.getDelivery();
                orderData.subtotal = cart.getTotal();

                // Отправляем заказ на сервер
                const response = await fetch('/api/create-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || 'Ошибка оформления заказа');
                }

                // Очищаем корзину
                cart.clear();

                // Если есть URL для оплаты - перенаправляем
                if (result.confirmationUrl) {
                    // Сохраняем ID заказа для возврата
                    sessionStorage.setItem('orderId', result.orderId);
                    window.location.href = result.confirmationUrl;
                    return;
                }

                // Показываем модальное окно успеха
                if (successModal) {
                    successModal.classList.add('active');
                    
                    // Обновляем текст для тестового режима
                    if (result.testMode) {
                        const successText = successModal.querySelector('.success-message__text');
                        if (successText) {
                            successText.textContent = 'Спасибо за заказ! Наш менеджер свяжется с вами в ближайшее время. (Тестовый режим - оплата не требуется)';
                        }
                    }
                }

            } catch (error) {
                console.error('Ошибка оформления заказа:', error);
                alert('Ошибка оформления заказа: ' + error.message);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
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

    // Проверка возврата после оплаты
    checkPaymentReturn();

    // Первоначальный рендеринг
    renderCheckoutItems();

    // Проверка статуса платежа после возврата
    async function checkPaymentReturn() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('order') || sessionStorage.getItem('orderId');
        
        if (orderId) {
            try {
                const response = await fetch(`/api/payment-status/${orderId}`);
                const result = await response.json();
                
                if (result.success && result.status === 'paid') {
                    // Показываем успешное сообщение
                    if (successModal) {
                        successModal.classList.add('active');
                        const title = successModal.querySelector('.success-message__title');
                        const text = successModal.querySelector('.success-message__text');
                        if (title) title.textContent = 'Оплата прошла успешно!';
                        if (text) text.textContent = 'Ваш заказ оплачен. Менеджер свяжется с вами для уточнения деталей доставки.';
                    }
                    sessionStorage.removeItem('orderId');
                }
            } catch (error) {
                console.error('Ошибка проверки платежа:', error);
            }
        }
    }
});
