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
                    <span class="item-type">${product.category}</span>
                    <span class="item-price">€${product.price.toFixed(2)}</span>
                </div>
                <div class="item-quantity">
                    <button class="quantity-btn minus" data-id="${productId}">-</button>
                    <span class="quantity-value">1</span>
                    <button class="quantity-btn plus" data-id="${productId}">+</button>
                </div>
                <button class="remove-item" data-id="${productId}">Remove</button>
            `;
            cartItems.appendChild(itemElement);
            subtotal += product.price;
        }
    });

    subtotalElement.textContent = `€${subtotal.toFixed(2)}`;
    updateTotalCost();
}

function updateCartItem(productId, change) {
    const index = cart.indexOf(productId);
    if (index > -1) {
        if (change === -1 && cart.filter(id => id === productId).length === 1) {
            cart.splice(index, 1);
        } else {
            if (change === 1) {
                cart.push(productId);
            } else {
                cart.splice(index, 1);
            }
        }
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartItems();
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

    cartItems.addEventListener('click', function(e) {
    const productId = e.target.dataset.id;
    if (e.target.classList.contains('minus')) {
        updateCartItem(productId, -1);
    } else if (e.target.classList.contains('plus')) {
        updateCartItem(productId, 1);
    } else if (e.target.classList.contains('remove-item')) {
        cart = cart.filter(id => id !== productId);
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCartItems();
    }
});

    // Добавьте это в конец файла
const mapModal = document.getElementById('map-modal');
const showMapBtn = document.getElementById('show-map');
const closeBtn = document.getElementsByClassName('close')[0];
const googleMap = document.getElementById('google-map');

showMapBtn.onclick = function() {
    mapModal.style.display = 'block';
    // Замените координаты на реальные координаты кафе
    googleMap.src = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12345.67890!2d-8.6108!3d41.1496!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDA4JzU4LjYiTiA4wrAzNic0My4wIlc!5e0!3m2!1sen!2spt!4v1234567890123!5m2!1sen!2spt';
}

closeBtn.onclick = function() {
    mapModal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == mapModal) {
        mapModal.style.display = 'none';
    }
}

});