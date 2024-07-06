document.addEventListener('DOMContentLoaded', function() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const offlineOptions = document.getElementById('offline-options');
    const addressGroup = document.getElementById('address-group');
    const checkoutForm = document.getElementById('checkout-form');

    function syncCart() {
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        const storedProducts = JSON.parse(localStorage.getItem('products')) || {};
        
        const cart = storedCart.filter(itemId => storedProducts[itemId]);
        localStorage.setItem('cart', JSON.stringify(cart));
        
        return { cart, products: storedProducts };
    }

    const { cart, products } = syncCart();

    console.log('Initial Cart:', cart);
    console.log('Products:', products);

    // Отображение товаров в корзине
    function displayCartItems() {
        cartItems.innerHTML = '';
        let total = 0;
        cart.forEach(productId => {
            if (products[productId]) {
                const product = products[productId];
                const li = document.createElement('li');
                li.className = 'cart-item';
                li.innerHTML = `
                    <div class="item-details">
                        <span>${product.name} - ${product.price}€</span>
                    </div>
                    <div class="item-quantity">
                        <button class="quantity-btn minus" data-id="${productId}">-</button>
                        <span>1</span>
                        <button class="quantity-btn plus" data-id="${productId}">+</button>
                    </div>
                    <button class="remove-item" data-id="${productId}">Remove</button>
                `;
                cartItems.appendChild(li);
                total += product.price;
            } else {
                console.warn(`Product not found:`, productId);
            }
        });
        cartTotal.textContent = `${total.toFixed(2)}€`;

        if (cart.length === 0) {
            cartItems.innerHTML = '<li>Your cart is empty</li>';
        }
    }

    // Инициализация страницы
    displayCartItems();

    // Обработчики событий для кнопок изменения количества и удаления
    cartItems.addEventListener('click', function(e) {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('quantity-btn')) {
            // Здесь можно добавить логику изменения количества
            // Пока что просто перерисовываем корзину
            displayCartItems();
        } else if (e.target.classList.contains('remove-item')) {
            const index = cart.indexOf(id);
            if (index > -1) {
                cart.splice(index, 1);
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            displayCartItems();
        }
    });


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