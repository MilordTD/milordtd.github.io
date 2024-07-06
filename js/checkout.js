document.addEventListener('DOMContentLoaded', function() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    // Получение данных корзины из localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const products = JSON.parse(localStorage.getItem('products')) || {};

    console.log('Initial Cart:', cart);
    console.log('Products:', products);

    // Отображение товаров в корзине
    function displayCartItems() {
        cartItems.innerHTML = '';
        let total = 0;
        cart = cart.filter(item => {
            if (item && products[item]) {
                const product = products[item];
                const li = document.createElement('li');
                li.textContent = `${product.name} - ${product.price}€`;
                cartItems.appendChild(li);
                total += product.price;
                return true;
            } else {
                console.warn(`Invalid item or product not found:`, item);
                return false;
            }
        });
        cartTotal.textContent = `${total.toFixed(2)}€`;

        if (cart.length === 0) {
            cartItems.innerHTML = '<li>Your cart is empty</li>';
        }

        // Update localStorage with the filtered cart
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // Инициализация страницы
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
            items: cart.map(item => ({
                name: products[item.id].name,
                quantity: item.quantity,
                price: products[item.id].price
            })),
            total: cartTotal.textContent,
            deliveryMethod: formData.get('delivery'),
            offlineOption: formData.get('offline-option'),
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address')
        };

        // Здесь будет логика отправки данных в Telegram
        console.log('Order data:', orderData);
        alert('Order placed successfully!');
        
        // Очистка корзины
        localStorage.removeItem('cart');
        window.location.href = '/index.html'; // Перенаправление на главную страницу
    });

    // Инициализация страницы
    displayCartItems();

    // Дополнительная функция для обновления общей суммы заказа
    function updateTotalAmount() {
        let total = cart.reduce((sum, item) => {
            const product = products[item.id];
            return sum + (product ? product.price * item.quantity : 0);
        }, 0);
        cartTotal.textContent = `${total.toFixed(2)}€`;
    }

    // Обновление общей суммы при загрузке страницы
    updateTotalAmount();
});