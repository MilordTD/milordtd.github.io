document.addEventListener('DOMContentLoaded', function() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const offlineOptions = document.getElementById('offline-options');
    const addressGroup = document.getElementById('address-group');
    const checkoutForm = document.getElementById('checkout-form');

    // Получение данных корзины из localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const products = JSON.parse(localStorage.getItem('products')) || {};

    // Отображение товаров в корзине
    function displayCartItems() {
        cartItems.innerHTML = '';
        let total = 0;
        cart.forEach((item, index) => {
            const product = products[item.id];
            if (product) {
                const li = document.createElement('li');
                li.className = 'cart-item';
                li.innerHTML = `
                    <div class="item-details">
                        <span>${product.name} - ${product.price}€</span>
                    </div>
                    <div class="item-quantity">
                        <button class="quantity-btn minus" data-index="${index}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn plus" data-index="${index}">+</button>
                    </div>
                    <button class="remove-item" data-index="${index}">Remove</button>
                `;
                cartItems.appendChild(li);
                total += product.price * item.quantity;
            } else {
                console.warn(`Product with id ${item.id} not found`);
                // Удаляем товар из корзины, если он не найден в products
                cart.splice(index, 1);
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
    }

    // Обработчики событий для кнопок изменения количества и удаления
    cartItems.addEventListener('click', function(e) {
        if (e.target.classList.contains('quantity-btn')) {
            const index = parseInt(e.target.dataset.index);
            if (e.target.classList.contains('minus')) {
                if (cart[index].quantity > 1) {
                    cart[index].quantity--;
                }
            } else if (e.target.classList.contains('plus')) {
                cart[index].quantity++;
            }
            displayCartItems();
        } else if (e.target.classList.contains('remove-item')) {
            const index = parseInt(e.target.dataset.index);
            cart.splice(index, 1);
            displayCartItems();
        }
    });

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
});