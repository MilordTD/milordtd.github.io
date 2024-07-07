document.addEventListener('DOMContentLoaded', function() {
    const cartItems = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('subtotal');
    const shippingCostElement = document.getElementById('shipping-cost');
    const totalCostElement = document.getElementById('total-cost');
    const checkoutForm = document.getElementById('checkout-form');
    const addressGroup = document.getElementById('address-group');

    let cart = [];
    let products = {};

    // Загрузка данных корзины и продуктов из localStorage
    function loadCartData() {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        products = JSON.parse(localStorage.getItem('products')) || {};
    }

    // Отображение товаров в корзине
    function displayCartItems() {
        cartItems.innerHTML = '';
        let subtotal = 0;

        cart.forEach(productId => {
            if (products[productId]) {
                const product = products[productId];
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <img src="/images/pin_${productId}.svg" alt="${product.name}">
                    <div class="item-details">
                        <span class="item-name">${product.name}</span>
                        <span class="item-price">€${product.price.toFixed(2)}</span>
                    </div>
                `;
                cartItems.appendChild(itemElement);
                subtotal += product.price;
            }
        });

        subtotalElement.textContent = `€${subtotal.toFixed(2)}`;
        updateTotalCost();
    }

    // Обновление общей стоимости
    function updateTotalCost() {
        const subtotal = parseFloat(subtotalElement.textContent.slice(1));
        const shippingCost = parseFloat(shippingCostElement.textContent.slice(1));
        const total = subtotal + shippingCost;
        totalCostElement.textContent = `€${total.toFixed(2)}`;
    }

    // Обработка изменения способа доставки
    document.querySelectorAll('input[name="shipping"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'local') {
                shippingCostElement.textContent = '€5.00';
                addressGroup.style.display = 'block';
            } else {
                shippingCostElement.textContent = '€0.00';
                addressGroup.style.display = 'none';
            }
            updateTotalCost();
        });
    });

    // Обработка отправки формы
    checkoutForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const orderData = {
            items: cart.map(productId => ({
                name: products[productId].name,
                price: products[productId].price
            })),
            shipping: formData.get('shipping'),
            email: formData.get('email'),
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            total: totalCostElement.textContent
        };

        // Здесь будет логика отправки данных (например, в Telegram)
        console.log('Order data:', orderData);
        alert('Thank you for your order! We will contact you soon.');
        
        // Очистка корзины
        localStorage.removeItem('cart');
        window.location.href = '/index.html'; // Перенаправление на главную страницу
    });

    // Инициализация страницы
    loadCartData();
    displayCartItems();
});