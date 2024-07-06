document.addEventListener('DOMContentLoaded', function() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const offlineOptions = document.getElementById('offline-options');
    const addressGroup = document.getElementById('address-group');
    const checkoutForm = document.getElementById('checkout-form');

    function syncCart() {
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        const storedProducts = JSON.parse(localStorage.getItem('products')) || {};
        
        // Convert cart to object with quantities
        const cart = storedCart.reduce((acc, itemId) => {
            acc[itemId] = (acc[itemId] || 0) + 1;
            return acc;
        }, {});
        
        localStorage.setItem('cart', JSON.stringify(cart));
        
        return { cart, products: storedProducts };
    }

    const { cart, products } = syncCart();

    console.log('Initial Cart:', cart);
    console.log('Products:', products);

    function displayCartItems() {
        cartItems.innerHTML = '';
        let total = 0;
        Object.entries(cart).forEach(([productId, quantity]) => {
            if (products[productId]) {
                const product = products[productId];
                const li = document.createElement('li');
                li.className = 'cart-item';
                li.innerHTML = `
                    <div class="item-details">
                        <span>${product.name} - ${product.price}€</span>
                    </div>
                    <div class="item-quantity">
                        <button class="quantity-btn minus" data-id="${productId}" ${quantity < 2 ? 'style="display:none;"' : ''}>-</button>
                        <span>${quantity}</span>
                        <button class="quantity-btn plus" data-id="${productId}">+</button>
                    </div>
                    <button class="remove-item" data-id="${productId}">Remove</button>
                `;
                cartItems.appendChild(li);
                total += product.price * quantity;
            } else {
                console.warn(`Product not found:`, productId);
            }
        });
        cartTotal.textContent = `${total.toFixed(2)}€`;

        if (Object.keys(cart).length === 0) {
            cartItems.innerHTML = '<li>Your cart is empty</li>';
        }
    }

    function updateTotalAmount() {
        let total = Object.entries(cart).reduce((sum, [id, quantity]) => {
            const product = products[id];
            return sum + (product ? product.price * quantity : 0);
        }, 0);
        cartTotal.textContent = `${total.toFixed(2)}€`;
    }

    displayCartItems();
    updateTotalAmount();

    cartItems.addEventListener('click', function(e) {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('quantity-btn')) {
            if (e.target.classList.contains('plus')) {
                cart[id] = (cart[id] || 0) + 1;
            } else if (e.target.classList.contains('minus') && cart[id] > 1) {
                cart[id]--;
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            displayCartItems();
            updateTotalAmount();
        } else if (e.target.classList.contains('remove-item')) {
            delete cart[id];
            localStorage.setItem('cart', JSON.stringify(cart));
            displayCartItems();
            updateTotalAmount();
        }
    });

    document.querySelectorAll('input[name="delivery"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'offline') {
                offlineOptions.style.display = 'block';
            } else {
                offlineOptions.style.display = 'none';
            }
        });
    });

    document.querySelectorAll('input[name="offline-option"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'local-delivery') {
                addressGroup.style.display = 'block';
            } else {
                addressGroup.style.display = 'none';
            }
        });
    });

    checkoutForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const orderData = {
            items: Object.entries(cart).map(([id, quantity]) => ({
                name: products[id].name,
                quantity: quantity,
                price: products[id].price
            })),
            total: cartTotal.textContent,
            deliveryMethod: formData.get('delivery'),
            offlineOption: formData.get('offline-option'),
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address')
        };

        // Here will be the logic for sending data to Telegram
        console.log('Order data:', orderData);
        alert('Order placed successfully!');
        
        // Clear the cart
        localStorage.removeItem('cart');
        window.location.href = '/index.html'; // Redirect to the main page
    });
});