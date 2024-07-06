document.addEventListener('DOMContentLoaded', function() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const offlineOptions = document.getElementById('offline-options');
    const addressGroup = document.getElementById('address-group');
    const checkoutForm = document.getElementById('checkout-form');

    // Получение данных корзины из localStorage
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const products = JSON.parse(localStorage.getItem('products')) || {};

    // Отображение товаров в корзине
    function displayCartItems() {
        cartItems.innerHTML = '';
        let total = 0;
        cart.forEach(productId => {
            const product = products[productId];
            const li = document.createElement('li');
            li.textContent = `${product.name} - ${product.price}€`;
            cartItems.appendChild(li);
            total += product.price;
        });
        cartTotal.textContent = `${total}€`;
    }

    displayCartItems();

    // Обработка выбора способа доставки
    document.querySelectorAll('input[name="delivery"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'offline') {
                offlineOptions.style.display = 'block';
            } else {
                offlineOptions.style.display = 'none';
            }
        });
    });

    // Обработка выбора офлайн опции
    document.querySelectorAll('input[name="offline-option"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'local-delivery') {
                addressGroup.style.display = 'block';
            } else {
                addressGroup.style.display = 'none';
            }
        });
    });

    // Обработка отправки формы
    checkoutForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const orderData = {
            items: cart.map(productId => products[productId].name),
            total: cartTotal.textContent,
            deliveryMethod: formData.get('delivery'),
            offlineOption: formData.get('offline-option'),
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address')
        };

        // Здесь будет логика отправки данных в Telegram
        console.log('Order data:', orderData);
        alert('Заказ оформлен успешно!');
        
        // Очистка корзины
        localStorage.removeItem('cart');
        window.location.href = '/index.html'; // Перенаправление на главную страницу
    });
});