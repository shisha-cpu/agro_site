// ========================================
// Страница каталога
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    const productsContainer = document.getElementById('catalog-products');
    const catalogTitle = document.getElementById('catalog-title');
    const sortSelect = document.getElementById('sort-select');
    const catalogNav = document.getElementById('catalog-nav');

    if (!productsContainer) return;

    // Ждём загрузки данных из data.json
    await waitForData();

    let currentCategory = 'all';
    let currentSort = 'default';

    // Получаем категорию из URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlCategory = urlParams.get('category');

    if (urlCategory) {
        currentCategory = urlCategory;
    }

    // Ждём доступности данных
    function waitForData() {
        return new Promise((resolve) => {
            const checkData = () => {
                if (typeof products !== 'undefined' && products.length > 0) {
                    resolve();
                } else {
                    setTimeout(checkData, 100);
                }
            };
            checkData();
        });
    }

    // Рендеринг категорий
    function renderCategories() {
        // Очищаем всё кроме первой ссылки "Все растения"
        const allLink = catalogNav.querySelector('[data-category="all"]');
        catalogNav.innerHTML = '';
        catalogNav.appendChild(allLink);

        // Добавляем категории из данных
        categories.forEach(cat => {
            const link = document.createElement('a');
            link.href = `catalog.html?category=${cat.id}`;
            link.className = 'catalog-nav__link';
            link.dataset.category = cat.id;
            link.innerHTML = `<span>${cat.emoji}</span> ${cat.name}`;
            catalogNav.appendChild(link);
        });

        // Обновляем активную категорию
        updateActiveCategory(currentCategory);
    }

    // Обработчик кликов по категориям
    catalogNav.addEventListener('click', (e) => {
        const link = e.target.closest('.catalog-nav__link');
        if (!link) return;

        e.preventDefault();
        const category = link.dataset.category;
        currentCategory = category;
        updateActiveCategory(category);
        renderProducts();

        // Обновляем URL без перезагрузки
        const newUrl = category === 'all'
            ? 'catalog.html'
            : `catalog.html?category=${category}`;
        history.pushState(null, '', newUrl);
    });

    // Обработчик сортировки
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderProducts();
        });
    }

    // Обновление активной категории в меню
    function updateActiveCategory(category) {
        catalogNav.querySelectorAll('.catalog-nav__link').forEach(link => {
            link.classList.remove('catalog-nav__link--active');
            if (link.dataset.category === category) {
                link.classList.add('catalog-nav__link--active');
            }
        });

        // Обновляем заголовок
        if (catalogTitle) {
            if (category === 'all') {
                catalogTitle.textContent = 'Все растения';
            } else {
                const cat = categories.find(c => c.id === category);
                catalogTitle.textContent = cat ? cat.name : 'Категория';
            }
        }
    }

    // Рендеринг товаров
    function renderProducts() {
        // Фильтрация по категории
        let filteredProducts = currentCategory === 'all'
            ? [...products]
            : products.filter(p => p.category === currentCategory);

        // Сортировка
        switch (currentSort) {
            case 'price-asc':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                // По умолчанию - популярные первыми
                filteredProducts.sort((a, b) => {
                    if (a.popular && !b.popular) return -1;
                    if (!a.popular && b.popular) return 1;
                    return 0;
                });
        }

        // Очистка контейнера
        productsContainer.innerHTML = '';

        // Отображение товаров
        if (filteredProducts.length === 0) {
            productsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 80px 20px; color: var(--color-text-secondary);">
                    <div style="font-size: 5rem; margin-bottom: 24px;">🌱</div>
                    <h3 style="font-size: 1.5rem; margin-bottom: 12px; color: var(--color-text);">В этой категории пока нет товаров</h3>
                    <p style="font-size: 1.1rem;">Попробуйте выбрать другую категорию</p>
                </div>
            `;
            return;
        }

        filteredProducts.forEach(product => {
            // Используем функцию из main.js
            const card = createProductCard(product);
            productsContainer.appendChild(card);
        });
    }

    // Инициализация
    renderCategories();
    renderProducts();
});
