document.addEventListener('DOMContentLoaded', function() {
    console.log('Retrieving cart from localStorage:', localStorage.getItem('cart'));
    console.log('Retrieving products from localStorage:', localStorage.getItem('products'));
    
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const offlineOptions = document.getElementById('offline-options');
    const addressGroup = document.getElementById('address-group');
    const checkoutForm = document.getElementById('checkout-form');

    // Получение данных корзины из localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const products = JSON.parse(localStorage.getItem('products')) || {};

    console.log('Parsed cart:', cart);
    console.log('Parsed products:', products);

    // Отображение товаров в корзине
    function displayCartItems() {
        cartItems.innerHTML = '';
        let total = 0;
        cart = cart.filter(item => {
            if (item && item.id && products[item.id]) {
                const product = products[item.id];
                const li = document.createElement('li');
                li.className = 'cart-item';
                li.innerHTML = `
                    <div class="item-details">
                        <span>${product.name} - ${product.price}€</span>
                    </div>
                    <div class="item-quantity">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                    <button class="remove-item" data-id="${item.id}">Remove</button>
                `;
                cartItems.appendChild(li);
                total += product.price * item.quantity;
                return true;
            } else {
                console.warn(`Invalid item or product not found:`, item);
                return false;
            }
        });
        cartTotal.textContent = `${total.toFixed(2)}€`;
        updateLocalStorage();

        if (cart.length === 0) {
            cartItems.innerHTML = '<li>Your cart is empty</li>';
        }
    }

    // Обновление localStorage
    function updateLocalStorage() {
        localStorage.setItem('cart', JSON.stringify(cart));
        console.log('Updated Cart:', cart);
    }

    // Обработчики событий для кнопок изменения количества и удаления
    cartItems.addEventListener('click', function(e) {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('quantity-btn')) {
            const item = cart.find(item => item.id === id);
            if (item) {
                if (e.target.classList.contains('minus') && item.quantity > 1) {
                    item.quantity--;
                } else if (e.target.classList.contains('plus')) {
                    item.quantity++;
                }
            }
        } else if (e.target.classList.contains('remove-item')) {
            cart = cart.filter(item => item.id !== id);
        }
        displayCartItems();
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